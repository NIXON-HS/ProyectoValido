# Guía Paso a Paso: TECHSTORE 360 - Aplicaciones Distribuidas

Esta guía detalla absolutamente todos los pasos necesarios para implementar la arquitectura distribuida del proyecto **TECHSTORE 360** cumpliendo con todos los requerimientos establecidos.

## Índice
1. [Fase 1: Configuración de Servicios SaaS y DBaaS](#fase-1-configuración-de-servicios-saas-y-dbaas)
2. [Fase 2: Backend - APIs REST (Render)](#fase-2-backend---apis-rest-render)
3. [Fase 3: Backend - Servicio SOAP de Facturación](#fase-3-backend---servicio-soap-de-facturación)
4. [Fase 4: Replicación de Datos (Debezium + Kafka)](#fase-4-replicación-de-datos-debezium--kafka)
5. [Fase 5: Clientes Web y Móvil (React y Flutter)](#fase-5-clientes-web-y-móvil-react-y-flutter)
6. [Fase 6: Servidores Locales - WordPress, Joomla y Failover](#fase-6-servidores-locales---wordpress-joomla-y-failover)
7. [Fase 7: Balanceo de Carga para las APIs (NGINX)](#fase-7-balanceo-de-carga-para-las-apis-nginx)
8. [Fase 8: Pruebas y Evidencias](#fase-8-pruebas-y-evidencias)

---

## Fase 1: Configuración de Servicios SaaS y DBaaS

En esta fase se preparan todas las bases de datos en la nube y los servicios de terceros.

### 1.1 Base de Datos Principal (Supabase PostgreSQL)
1. Crea una cuenta en [Supabase](https://supabase.com).
2. Crea un nuevo proyecto llamado `techstore-360`.
3. Ve al editor SQL y crea las tablas principales:
   ```sql
   CREATE TABLE usuarios (
       id UUID PRIMARY KEY, -- Mapeado con el UID de Firebase
       nombre VARCHAR(100),
       email VARCHAR(100) UNIQUE,
       rol VARCHAR(50) DEFAULT 'cliente'
   );

   CREATE TABLE productos (
       id SERIAL PRIMARY KEY,
       nombre VARCHAR(150),
       descripcion TEXT,
       precio DECIMAL(10, 2),
       stock INT
   );

   CREATE TABLE compras (
       id SERIAL PRIMARY KEY,
       usuario_id UUID REFERENCES usuarios(id),
       producto_id INT REFERENCES productos(id),
       cantidad INT,
       total DECIMAL(10, 2),
       fecha TIMESTAMP DEFAULT NOW(),
       estado_factura VARCHAR(50) DEFAULT 'PENDIENTE'
   );
   ```
4. Copia las credenciales de conexión de la base de datos (URI de PostgreSQL) para usarlas en tu API.
5. **Importante:** Habilita la replicación lógica en Supabase para permitir que Debezium escuche los cambios (`wal_level = logical`).

### 1.2 Base de Datos de Réplica Completa (Aiven PostgreSQL)
1. Crea una cuenta en [Aiven](https://aiven.io).
2. Crea un servicio PostgreSQL (puedes usar el plan gratuito/trial).
3. Conéctate a la base de datos de Aiven y ejecuta el mismo script SQL del paso 1.1 para crear las tablas vacías.
4. Guarda las credenciales de conexión.

### 1.3 Base de Datos de Réplica Parcial (MongoDB Atlas)
1. Crea una cuenta en [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Despliega un cluster gratuito (M0).
3. Crea una base de datos llamada `techstore_replica` y una colección llamada `compras`.
4. Obtén el string de conexión (URI) y asegúrate de permitir acceso desde cualquier IP (`0.0.0.0/0`) en "Network Access".

### 1.4 Autenticación (Firebase Auth)
1. Ve a la [Consola de Firebase](https://console.firebase.google.com).
2. Crea un proyecto nuevo `techstore-360-auth`.
3. Ve a **Authentication > Get Started** y habilita los proveedores **Correo electrónico/Contraseña** y **Google Sign-In**.
4. Ve a **Configuración del proyecto > Cuentas de servicio** y genera una nueva clave privada. Descarga el archivo JSON (como el que tienes actualmente: `distribuidas-f7a12-firebase-adminsdk...json`). Lo usarás en tu API REST para validar tokens.
5. Ve a **Configuración del proyecto > General** y registra una aplicación web (React - Panel Administrativo) y una aplicación móvil (Flutter) para obtener las claves públicas (`firebaseConfig`) de los clientes.

### 1.5 Notificaciones (Twilio y Brave Email)
1. **Twilio:**
   - Crea una cuenta y obtén un número de teléfono de prueba.
   - Guarda tu `Account SID` y `Auth Token`.
2. **Brave Email (o SendGrid/Resend):**
   - Crea una cuenta y genera una API Key para enviar correos transaccionales (facturas).

---

## Fase 2: Backend - APIs REST (Render)

Desarrollaremos la API que manejará la lógica central. Se recomienda usar **Node.js (Express)** o **Python (FastAPI)**.

### 2.1 Desarrollo de la API
1. Crea un proyecto Node.js y conecta a Supabase.
2. **Middleware de Autenticación:** Utiliza `firebase-admin` con tu archivo JSON para validar el token JWT enviado desde React/Flutter.
   ```javascript
   // Ejemplo de middleware
   const admin = require('firebase-admin');
   admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
   // Validar Authorization: Bearer <token>
   ```
3. **Endpoints a crear:**
   - `GET /productos` y `POST /productos`
   - `GET /usuarios` y `POST /usuarios` (al registrarse en Firebase, guardar info extra aquí)
   - `POST /compras` (Recibe la compra, la guarda en Supabase, llama al servicio SOAP para facturar, y envía email/SMS).
   - `GET /compras/:usuarioId`

### 2.2 Despliegue en Render
1. Sube tu código de la API a un repositorio en GitHub.
2. Ve a [Render](https://render.com) y crea un **Web Service**.
3. Conecta tu repositorio y configura las variables de entorno (`SUPABASE_URL`, `FIREBASE_JSON`, etc.).
4. Llama a este servicio **Render 1**.
5. Repite el proceso para crear un segundo **Web Service** idéntico, llamado **Render 2**.

---

## Fase 3: Backend - Servicio SOAP de Facturación

Este debe ser un servicio independiente que simule la facturación.

1. Crea un nuevo proyecto (ej. Node.js usando la librería `soap` o Java/Python).
2. Define un archivo WSDL (`factura.wsdl`) con las operaciones:
   - `ValidarFactura(xmlFactura)`
   - `GenerarFacturaXML(idCompra)`
   - `ConsultarComprobante(idCompra)`
3. Implementa la lógica. Ejemplo de respuesta esperada:
   ```xml
   <RespuestaFactura>
      <Estado>VALIDADA</Estado>
      <Mensaje>Factura generada correctamente</Mensaje>
      <ClaveAcceso>FAC-2026-00001</ClaveAcceso>
   </RespuestaFactura>
   ```
4. Despliega este servicio SOAP en Render (como un servicio separado) o localmente.

---

## Fase 4: Replicación de Datos (Debezium + Kafka)

Para replicar de Supabase a Aiven y MongoDB Atlas. Esta fase pertenece al **Flujo de Replicación (En Paralelo/Asincrónico)**. Debezium actúa como Captura de Cambios (CDC) detectando los eventos de `INSERT`, `UPDATE` y `DELETE` en la base de datos principal, y Kafka transporta estos eventos a las réplicas.

### 4.1 Configuración de Infraestructura
Lo más fácil es usar Docker localmente para levantar Kafka y Debezium, o usar un servicio gestionado como Confluent Cloud.
Si usas Docker (crea un `docker-compose.yml`):
- Imagen de **Zookeeper**
- Imagen de **Kafka**
- Imagen de **Debezium Connect**

### 4.2 Configurar el Source Connector (Supabase)
Envía un POST a Debezium Connect para que escuche tu base de Supabase:
```json
{
  "name": "supabase-connector",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "<SUPABASE_HOST>",
    "database.port": "5432",
    "database.user": "<SUPABASE_USER>",
    "database.password": "<SUPABASE_PASSWORD>",
    "database.dbname": "<SUPABASE_DB>",
    "database.server.name": "techstore_db",
    "plugin.name": "pgoutput"
  }
}
```

### 4.3 Configurar los Sink Connectors
1. **Para Aiven PostgreSQL (Réplica Completa):**
   Usa `JDBC Sink Connector` apuntando a las credenciales de Aiven. Suscríbete a los tópicos `techstore_db.public.usuarios`, `techstore_db.public.productos`, y `techstore_db.public.compras`.
2. **Para MongoDB Atlas (Réplica Parcial):**
   Usa `MongoDB Sink Connector` apuntando a tu URI de Atlas. Suscríbete **únicamente** al tópico `techstore_db.public.compras`.

---

## Fase 5: Clientes Web y Móvil (React y Flutter)

Estas aplicaciones inician el **Flujo Principal Sincrónico**.

### 5.1 Cliente Web (React - Panel Administrativo)
1. Inicializa: `npx create-react-app web-client` (o Vite).
2. Instala **Tailwind CSS**: `npm install -D tailwindcss postcss autoprefixer` y ejecuta `npx tailwindcss init -p`.
3. Configura las rutas en `tailwind.config.js` y agrega las directivas `@tailwind` en tu `index.css`.
4. Instala Firebase: `npm install firebase`.
5. Integra las credenciales de Firebase Config.
6. Desarrolla las pantallas (usando clases de Tailwind para un diseño rápido y moderno):
   - **Login / Registro**: Usando `signInWithEmailAndPassword` de Firebase. Obtén el token JWT (`user.getIdToken()`).
   - **Productos**: `GET` al balanceador de NGINX que apunta a Render.
   - **Compras**: Carrito de compras y `POST` para confirmar compra (enviar JWT en headers).
   - **Gestión**: CRUD básico.

### 5.2 Cliente Móvil (Flutter - Aplicación Móvil)
1. Inicializa: `flutter create app_movil`.
2. Añade paquetes: `firebase_core`, `firebase_auth`, `http`.
3. Desarrolla pantallas similares a React:
   - Login / Registro.
   - Listado de productos.
   - Realizar compra.
   - Historial de compras.
4. Asegúrate de adjuntar el Bearer Token en todas las peticiones a la API.

---

## Fase 6: Servidores Locales - WordPress, Joomla y Failover

Simularemos un entorno IaaS local (pueden ser máquinas virtuales en VirtualBox/VMware o contenedores Docker).

### 6.1 Preparar Servidor 1 (Principal)
1. Instala Apache/Nginx, PHP y MySQL.
2. Instala **WordPress** (ruta ej: `/wordpress`).
3. Instala **Joomla** (ruta ej: `/joomla`).
4. Configura contenido: Noticias, catálogo informativo, enlaces a la App React.

### 6.2 Preparar Servidor 2 (Respaldo)
1. Instala exactamente el mismo stack y haz una copia de los archivos y la base de datos del Servidor 1 hacia el Servidor 2.

### 6.3 Configurar Failover Local (Keepalived + Nginx)
1. Asigna una IP Virtual (VIP) que será compartida entre el Servidor 1 y Servidor 2.
2. En ambos servidores, instala Keepalived: `sudo apt install keepalived`.
3. Configura `keepalived.conf` en el **Servidor 1** como `MASTER` y en el **Servidor 2** como `BACKUP`.
4. Cuando el Servidor 1 caiga, la IP Virtual pasará automáticamente al Servidor 2 y los usuarios no perderán acceso a los portales.

---

## Fase 7: Balanceo de Carga para las APIs (NGINX)

Debes colocar un servidor NGINX frente a tus dos APIs de Render. Este NGINX puede estar alojado localmente o en un VPS económico.

1. Instala NGINX.
2. Edita la configuración `/etc/nginx/nginx.conf`:
   ```nginx
   http {
       upstream api_backend {
           server url-render-1.onrender.com:443;
           server url-render-2.onrender.com:443 backup; # Failover automático
       }

       server {
           listen 80;
           server_name api.tu-dominio-o-ip.com;

           location / {
               proxy_pass https://api_backend;
               proxy_set_header Host $host;
           }
       }
   }
   ```
3. En React y Flutter, configurarás la URL de este NGINX como tu **URL base** de la API, no las URLs directas de Render. Nginx se encargará de enrutar a Render 1 o Render 2.

---

## Fase 8: Pruebas y Evidencias

Antes de grabar el video y entregar, realiza las siguientes pruebas para asegurar que cumples con los "Entregables":

1. **Prueba de Firebase:** Inicia sesión en React y verifica que el token se envía en el header y la API lo acepta.
2. **Prueba de Flujo de Compra:**
   - Compra desde Flutter.
   - Verifica que se inserte en **Supabase**.
   - Revisa la consola para ver que el backend consumió el **Servicio SOAP** y devolvió el XML de factura.
   - Verifica que llegue un SMS (Twilio) o correo (Brave Email) notificando la compra.
3. **Prueba de Replicación:**
   - Revisa **Aiven** y comprueba que la compra, el usuario y el producto se han copiado.
   - Revisa **MongoDB Atlas** y comprueba que SOLO la compra se ha copiado.
4. **Pruebas de Failover:**
   - **Render:** Apaga/Suspende manualmente "Render 1" y haz una petición desde React. NGINX debe redirigir a "Render 2" y responder sin error.
   - **Local:** Apaga la red del Servidor 1. La IP virtual debe pasar al Servidor 2 y WordPress/Joomla deben seguir en línea.

---

## Fase 9: Despliegue Automatizado con Docker

Para facilitar la ejecución de todo este ecosistema localmente y cumplir con la entrega de código fuente que se pueda probar fácilmente, todo el sistema ha sido **dockerizado** en un único archivo `docker-compose.yml`.

### ¿Qué incluye el entorno Docker?
El comando `docker-compose up -d --build` levantará simultáneamente:
- **Zookeeper & Kafka** (Enrutamiento de eventos)
- **Debezium Connect** (Conector CDC para PostgreSQL)
- **Servidores Web IaaS**: WordPress 1 y 2, Joomla 1 y 2 (con sus respectivas DBs MySQL)
- **APIs REST PaaS**: Instancias 1 y 2 del backend (Node.js)
- **Balanceador de Carga NGINX**: Balancea entre API 1 y API 2 (Puerto 8080)
- **Failover Local NGINX**: Simula Keepalived redirigiendo a WP/Joomla (Puerto 80)
- **Servicio SOAP**: Simulador de Facturación (Puerto 8000)
- **Web Client**: Frontend de React (Puerto 3000)

De esta forma, puedes probar la arquitectura completa sin necesidad de instalar dependencias manualmente.

---

## Estructura Recomendada del Proyecto (Repositorio)

```text
techstore-360/
├── web-client/          # Código React dockerizado (Frontend)
├── mobile-app/          # Código Flutter (Frontend Móvil - probar en emulador/dispositivo)
├── api-rest/            # Código Node.js dockerizado (APIs para Render 1 y 2)
├── soap-service/        # Código del simulador SOAP dockerizado
├── nginx/               # Configuraciones del Balanceador y Failover
├── docker-compose.yml   # Orquestador principal de toda la infraestructura
└── proyecto_techstore_360_guia.md # Esta guía
```

---

## Identificación de Modelos de Servicio (Para el Informe)
Según los diagramas arquitectónicos, debes incluir en tu informe los siguientes modelos:
- **IaaS (Infrastructure as a Service):** Servidores locales para WordPress, Joomla y Nginx (Keepalived).
- **PaaS (Platform as a Service):** Render (donde publicas tus APIs REST 1 y 2).
- **SaaS (Software as a Service):** Firebase Auth, Twilio y Brave Email.
- **DBaaS (Database as a Service):** Supabase PostgreSQL, Aiven PostgreSQL y MongoDB Atlas.

¡Siguiendo estos pasos y apoyándote en el entorno Docker, cubrirás el 100% de la rúbrica y la arquitectura propuesta!
