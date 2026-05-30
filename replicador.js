const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
const { MongoClient } = require('mongodb');
const fs = require('fs');

// Leer .env
const env = {};
fs.readFileSync('.env', 'utf8').split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_KEY);

// Quitar ?sslmode=require para que la config ssl manual funcione correctamente
const pgUri = env.AIVEN_PG_URI.split('?')[0];

const pgClient = new Client({
  connectionString: pgUri,
  ssl: { rejectUnauthorized: false }
});

const mongoClient = new MongoClient(env.MONGODB_URI);

async function startReplicator() {
  console.log("Iniciando Replicador CDC (Supabase Realtime -> Aiven PG & MongoDB)...");
  await pgClient.connect();
  console.log("Conectado a Aiven PostgreSQL exitosamente.");
  
  await mongoClient.connect();
  console.log("Conectado a MongoDB Atlas exitosamente.");
  const mongoDb = mongoClient.db(); // Usa la base de datos por defecto del URI
  const comprasCollection = mongoDb.collection('compras');

  // Asegurar que las tablas existan con el esquema correcto en Aiven (Limpiamos esquemas viejos incompatibles)
  await pgClient.query(`
    DROP TABLE IF EXISTS compras CASCADE;
    DROP TABLE IF EXISTS productos CASCADE;

    CREATE TABLE productos (
      id INTEGER PRIMARY KEY,
      nombre VARCHAR(255),
      descripcion TEXT,
      precio NUMERIC,
      stock INTEGER
    );
    CREATE TABLE IF NOT EXISTS usuarios (
      id VARCHAR(255) PRIMARY KEY,
      nombre VARCHAR(255),
      email VARCHAR(255),
      rol VARCHAR(50)
    );
    CREATE TABLE compras (
      id INTEGER PRIMARY KEY,
      usuario_id VARCHAR(255),
      producto_id INTEGER,
      cantidad INTEGER,
      total NUMERIC,
      fecha TIMESTAMP,
      estado_factura VARCHAR(50)
    );
  `);
  console.log("Tablas verificadas en Aiven.");

  // ── 1. Sincronización Inicial (Bootstrapping / Carga Histórica) ──
  console.log("Iniciando sincronización inicial (Supabase -> Aiven PG & MongoDB)...");
  try {
    // 1.1 Sincronizar usuarios existentes
    const { data: usuarios, error: uErr } = await supabase.from('usuarios').select('*');
    if (uErr) throw uErr;
    console.log(`[Carga Inicial] Sincronizando ${usuarios.length} usuarios...`);
    for (const u of usuarios) {
      await pgClient.query(
        `INSERT INTO usuarios (id, nombre, email, rol) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (id) DO UPDATE SET nombre=$2, email=$3, rol=$4`,
        [u.id, u.nombre, u.email, u.rol]
      );
    }

    // 1.2 Sincronizar productos existentes
    const { data: productos, error: pErr } = await supabase.from('productos').select('*');
    if (pErr) throw pErr;
    console.log(`[Carga Inicial] Sincronizando ${productos.length} productos...`);
    for (const p of productos) {
      await pgClient.query(
        `INSERT INTO productos (id, nombre, descripcion, precio, stock) 
         VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (id) DO UPDATE SET nombre=$2, descripcion=$3, precio=$4, stock=$5`,
        [p.id, p.nombre, p.descripcion, p.precio, p.stock]
      );
    }

    // 1.3 Sincronizar compras existentes
    const { data: compras, error: cErr } = await supabase.from('compras').select('*');
    if (cErr) throw cErr;
    console.log(`[Carga Inicial] Sincronizando ${compras.length} compras a PostgreSQL y MongoDB...`);
    for (const c of compras) {
      // Replicar a Aiven PG
      try {
        await pgClient.query(
          `INSERT INTO compras (id, usuario_id, producto_id, cantidad, total, estado_factura, fecha) 
           VALUES ($1, $2, $3, $4, $5, $6, $7) 
           ON CONFLICT (id) DO UPDATE 
           SET usuario_id=$2, producto_id=$3, cantidad=$4, total=$5, estado_factura=$6, fecha=$7`,
          [c.id, c.usuario_id, c.producto_id, c.cantidad, c.total, c.estado_factura, c.fecha]
        );
      } catch (err) {
        console.error(`[Carga Inicial] Error en compra #${c.id} hacia Aiven PG:`, err.message);
      }

      // Replicar a MongoDB Atlas
      try {
        await comprasCollection.updateOne(
          { _id: c.id },
          { $set: { usuario_id: c.usuario_id, producto_id: c.producto_id, cantidad: c.cantidad, total: c.total, estado_factura: c.estado_factura, fecha: c.fecha } },
          { upsert: true }
        );
      } catch (err) {
        console.error(`[Carga Inicial] Error en compra #${c.id} hacia MongoDB:`, err.message);
      }
    }
    console.log("¡Carga inicial e histórica completada con éxito! ✅");
  } catch (err) {
    console.error("Error crítico durante la sincronización inicial histórica:", err.message);
  }

  // Suscribirse a cambios en Supabase
  supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
      console.log(`[CDC Evento] ${payload.eventType} en tabla ${payload.table}`);
      
      try {
        if (payload.table === 'productos') {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { id, nombre, descripcion, precio, stock } = payload.new;
            try {
              await pgClient.query(
                `INSERT INTO productos (id, nombre, descripcion, precio, stock) 
                 VALUES ($1, $2, $3, $4, $5) 
                 ON CONFLICT (id) DO UPDATE 
                 SET nombre=$2, descripcion=$3, precio=$4, stock=$5`,
                [id, nombre, descripcion, precio, stock]
              );
              console.log(`[Aiven PG] Producto ${id} sincronizado.`);
            } catch (pgErr) {
              console.error("Error replicando producto a Aiven PG:", pgErr.message);
            }
          } else if (payload.eventType === 'DELETE') {
            try {
              await pgClient.query('DELETE FROM productos WHERE id = $1', [payload.old.id]);
              console.log(`[Aiven PG] Producto ${payload.old.id} eliminado.`);
            } catch (pgErr) {
              console.error("Error eliminando producto en Aiven PG:", pgErr.message);
            }
          }
        }
        
        if (payload.table === 'usuarios') {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { id, nombre, email, rol } = payload.new;
            try {
              await pgClient.query(
                `INSERT INTO usuarios (id, nombre, email, rol) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (id) DO UPDATE 
                 SET nombre=$2, email=$3, rol=$4`,
                [id, nombre, email, rol]
              );
              console.log(`[Aiven PG] Usuario ${id} sincronizado.`);
            } catch (pgErr) {
              console.error("Error replicando usuario a Aiven PG:", pgErr.message);
            }
          } else if (payload.eventType === 'DELETE') {
            try {
              await pgClient.query('DELETE FROM usuarios WHERE id = $1', [payload.old.id]);
              console.log(`[Aiven PG] Usuario ${payload.old.id} eliminado.`);
            } catch (pgErr) {
              console.error("Error eliminando usuario en Aiven PG:", pgErr.message);
            }
          }
        }
        
        if (payload.table === 'compras') {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { id, usuario_id, producto_id, cantidad, total, estado_factura, fecha } = payload.new;
            
            // Replicar a Aiven (Completa) - Aislado en su propio try-catch
            try {
              await pgClient.query(
                `INSERT INTO compras (id, usuario_id, producto_id, cantidad, total, estado_factura, fecha) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7) 
                 ON CONFLICT (id) DO UPDATE 
                 SET usuario_id=$2, producto_id=$3, cantidad=$4, total=$5, estado_factura=$6, fecha=$7`,
                [id, usuario_id, producto_id, cantidad, total, estado_factura, fecha]
              );
              console.log(`[Aiven PG] Compra ${id} sincronizada.`);
            } catch (pgErr) {
              console.error("Error replicando compra a Aiven PG:", pgErr.message);
            }

            // Replicar a MongoDB (Parcial/Completa) - Aislado en su propio try-catch
            try {
              await comprasCollection.updateOne(
                { _id: id }, 
                { $set: { usuario_id, producto_id, cantidad, total, estado_factura, fecha } },
                { upsert: true }
              );
              console.log(`[MongoDB] Compra ${id} sincronizada.`);
            } catch (mongoErr) {
              console.error("Error replicando compra a MongoDB:", mongoErr.message);
            }
          } else if (payload.eventType === 'DELETE') {
            try {
              await pgClient.query('DELETE FROM compras WHERE id = $1', [payload.old.id]);
            } catch (pgErr) {
              console.error("Error eliminando compra en Aiven PG:", pgErr.message);
            }
            try {
              await comprasCollection.deleteOne({ _id: payload.old.id });
              console.log(`[MongoDB] Compra ${payload.old.id} eliminada.`);
            } catch (mongoErr) {
              console.error("Error eliminando compra en MongoDB:", mongoErr.message);
            }
          }
        }
      } catch (err) {
        console.error("Error general en el manejador de eventos CDC:", err.message);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log("Suscrito a Supabase Realtime exitosamente. Esperando cambios...");
      }
    });
}

startReplicator();
