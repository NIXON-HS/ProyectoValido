const { createClient } = require('@supabase/supabase-js');
const { Client } = require('pg');
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

async function startReplicator() {
  console.log("Iniciando Replicador CDC (Supabase Realtime -> Aiven PostgreSQL)...");
  await pgClient.connect();
  console.log("Conectado a Aiven PostgreSQL exitosamente.");

  // Asegurar que las tablas existan en Aiven
  await pgClient.query(`
    CREATE TABLE IF NOT EXISTS productos (
      id UUID PRIMARY KEY,
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
  `);
  console.log("Tablas verificadas en Aiven.");

  // Suscribirse a cambios en Supabase
  supabase
    .channel('schema-db-changes')
    .on('postgres_changes', { event: '*', schema: 'public' }, async (payload) => {
      console.log(`[CDC Evento] ${payload.eventType} en tabla ${payload.table}`);
      
      try {
        if (payload.table === 'productos') {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { id, nombre, descripcion, precio, stock } = payload.new;
            await pgClient.query(
              `INSERT INTO productos (id, nombre, descripcion, precio, stock) 
               VALUES ($1, $2, $3, $4, $5) 
               ON CONFLICT (id) DO UPDATE 
               SET nombre=$2, descripcion=$3, precio=$4, stock=$5`,
              [id, nombre, descripcion, precio, stock]
            );
          } else if (payload.eventType === 'DELETE') {
            await pgClient.query('DELETE FROM productos WHERE id = $1', [payload.old.id]);
          }
        }
        
        if (payload.table === 'usuarios') {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { id, nombre, email, rol } = payload.new;
            await pgClient.query(
              `INSERT INTO usuarios (id, nombre, email, rol) 
               VALUES ($1, $2, $3, $4) 
               ON CONFLICT (id) DO UPDATE 
               SET nombre=$2, email=$3, rol=$4`,
              [id, nombre, email, rol]
            );
          } else if (payload.eventType === 'DELETE') {
            await pgClient.query('DELETE FROM usuarios WHERE id = $1', [payload.old.id]);
          }
        }
        
        if (payload.table === 'compras') {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const { id, usuario_id, producto_id, cantidad, total, estado_factura, fecha } = payload.new;
            await pgClient.query(
              `INSERT INTO compras (id, usuario_id, producto_id, cantidad, total, estado_factura, fecha) 
               VALUES ($1, $2, $3, $4, $5, $6, $7) 
               ON CONFLICT (id) DO UPDATE 
               SET usuario_id=$2, producto_id=$3, cantidad=$4, total=$5, estado_factura=$6, fecha=$7`,
              [id, usuario_id, producto_id, cantidad, total, estado_factura, fecha]
            );
          } else if (payload.eventType === 'DELETE') {
            await pgClient.query('DELETE FROM compras WHERE id = $1', [payload.old.id]);
          }
        }
      } catch (err) {
        console.error("Error replicando a Aiven:", err.message);
      }
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log("Suscrito a Supabase Realtime exitosamente. Esperando cambios...");
      }
    });
}

startReplicator();
