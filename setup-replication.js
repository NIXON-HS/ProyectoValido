const fs = require('fs');

// Leer variables de entorno manualmente sin librerías externas
const envFile = fs.readFileSync('.env', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
});

async function setupReplication() {
  console.log("Iniciando configuración de Debezium CDC...");
  
  // 1. Extraer credenciales de la URI de Supabase
  const supaUri = new URL(env.SUPABASE_DB_URI);
  const supaHost = supaUri.hostname;
  const supaPort = supaUri.port || "5432";
  const supaUser = decodeURIComponent(supaUri.username);
  const supaPass = decodeURIComponent(supaUri.password);
  const supaDb = supaUri.pathname.replace('/', '');

  // Connector SOURCE: Supabase (PostgreSQL)
  const sourceConfig = {
    "name": "supabase-source",
    "config": {
      "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
      "database.hostname": supaHost,
      "database.port": supaPort,
      "database.user": supaUser,
      "database.password": supaPass,
      "database.dbname": supaDb,
      "topic.prefix": "techstore",
      "plugin.name": "pgoutput",
      "publication.name": "supabase_debezium",
      "publication.autocreate.mode": "disabled",
      "table.include.list": "public.usuarios,public.productos,public.compras",
      "key.converter": "org.apache.kafka.connect.json.JsonConverter",
      "value.converter": "org.apache.kafka.connect.json.JsonConverter",
      "key.converter.schemas.enable": "false",
      "value.converter.schemas.enable": "false"
    }
  };

  // 2. Connector SINK: Aiven PostgreSQL (Réplica completa)
  const aivenConfig = {
    "name": "aiven-sink",
    "config": {
      "connector.class": "io.confluent.connect.jdbc.JdbcSinkConnector",
      "tasks.max": "1",
      "topics": "techstore.public.usuarios,techstore.public.productos,techstore.public.compras",
      "connection.url": `jdbc:postgresql://${new URL(env.AIVEN_PG_URI).host}/defaultdb?sslmode=require`,
      "connection.user": decodeURIComponent(new URL(env.AIVEN_PG_URI).username),
      "connection.password": decodeURIComponent(new URL(env.AIVEN_PG_URI).password),
      "insert.mode": "upsert",
      "pk.mode": "record_key",
      "pk.fields": "id",
      "auto.create": "false",
      "auto.evolve": "false",
      "key.converter": "org.apache.kafka.connect.json.JsonConverter",
      "value.converter": "org.apache.kafka.connect.json.JsonConverter",
      "key.converter.schemas.enable": "false",
      "value.converter.schemas.enable": "false"
    }
  };

  // 3. Connector SINK: MongoDB Atlas (Réplica parcial)
  const mongoConfig = {
    "name": "mongodb-sink",
    "config": {
      "connector.class": "com.mongodb.kafka.connect.MongoSinkConnector",
      "tasks.max": "1",
      "topics": "techstore.public.compras",
      "connection.uri": env.MONGODB_URI,
      "database": "techstore_replica",
      "collection": "compras",
      "document.id.strategy": "com.mongodb.kafka.connect.sink.processor.id.strategy.PartialValueStrategy",
      "document.id.strategy.partial.value.projection.list": "id",
      "document.id.strategy.partial.value.projection.type": "AllowList",
      "writemodel.strategy": "com.mongodb.kafka.connect.sink.writemodel.strategy.ReplaceOneBusinessKeyStrategy",
      "key.converter": "org.apache.kafka.connect.json.JsonConverter",
      "value.converter": "org.apache.kafka.connect.json.JsonConverter",
      "key.converter.schemas.enable": "false",
      "value.converter.schemas.enable": "false"
    }
  };

  const sendPost = async (url, data) => {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      if (res.status === 409) return { status: 409 };
      const errText = await res.text();
      throw new Error(`Status ${res.status}: ${errText}`);
    }
    return await res.json();
  };

  try {
    const baseUrl = 'http://localhost:8083/connectors';
    
    console.log("-> Configurando Supabase (Source)...");
    const r1 = await sendPost(baseUrl, sourceConfig);
    if(r1 && r1.status === 409) console.log("   Ya existe el conector de Supabase.");

    console.log("-> Configurando Aiven (Sink)...");
    const r2 = await sendPost(baseUrl, aivenConfig);
    if(r2 && r2.status === 409) console.log("   Ya existe el conector de Aiven.");

    console.log("-> Configurando MongoDB (Sink)...");
    const r3 = await sendPost(baseUrl, mongoConfig);
    if(r3 && r3.status === 409) console.log("   Ya existe el conector de MongoDB.");

    console.log("✅ ¡Replicación asíncrona configurada correctamente en Debezium!");
  } catch (error) {
    console.error("❌ Error al configurar conectores:", error.response ? error.response.data : error.message);
  }
}

setupReplication();
