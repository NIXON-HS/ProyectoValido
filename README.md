# 🛒 TECHSTORE 360 — Aplicaciones Distribuidas

Sistema distribuido completo con React, Flutter, WordPress, Joomla, APIs REST/SOAP, Kafka, Debezium y NGINX.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#-requisitos-previos)
2. [Instalación Paso a Paso](#-instalación-paso-a-paso)
3. [Configurar Variables de Entorno](#-configurar-variables-de-entorno)
4. [Levantar el Sistema](#-levantar-el-sistema)
5. [URLs del Sistema](#-urls-del-sistema)
6. [Verificar que Todo Funciona](#-verificar-que-todo-funciona)
7. [App Móvil Flutter (Opcional)](#-app-móvil-flutter-opcional)
8. [Comandos Útiles del Día a Día](#-comandos-útiles-del-día-a-día)
9. [Estructura del Proyecto](#-estructura-del-proyecto)
10. [Arquitectura del Sistema](#-arquitectura-del-sistema)
11. [Solución de Problemas Comunes](#-solución-de-problemas-comunes)

---

## 🔧 Requisitos Previos

Instala estas herramientas **antes** de clonar el proyecto. Sin ellas, nada funcionará.

| Herramienta | Versión mínima | Descarga | Para qué sirve |
|---|---|---|---|
| **Docker Desktop** | Cualquiera | [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/) | Levanta TODOS los servicios |
| **Git** | Cualquiera | [git-scm.com](https://git-scm.com/) | Clonar el repositorio |
| **Node.js** *(opcional)* | v18+ | [nodejs.org](https://nodejs.org/) | Solo si quieres correr el cliente web fuera de Docker |
| **Flutter SDK** *(opcional)* | v3+ | [flutter.dev](https://docs.flutter.dev/get-started/install) | Solo para la app móvil |

> ⚠️ **Docker Desktop DEBE estar corriendo** antes de ejecutar cualquier comando del proyecto.
> Abre Docker Desktop y espera a que el ícono en la barra de tareas esté en verde ("Engine running").

---

## 🚀 Instalación Paso a Paso

### Paso 1 — Clonar el Repositorio

```powershell
git clone https://github.com/NIXON-HS/ProyectoValido.git
cd ProyectoValido
```

---

### Paso 2 — Configurar Variables de Entorno

El proyecto necesita dos archivos `.env`. Uno en la raíz (para las APIs) y otro en `web-client/` (para React).

#### 2a. `.env` principal (raíz del proyecto)

```powershell
# En PowerShell (Windows):
Copy-Item .env.example .env
```

Luego abre el archivo `.env` con cualquier editor y llena los valores reales:

```env
# ─── SUPABASE (Base de datos principal) ───────────────────────────
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_KEY=TU_ANON_KEY_DE_SUPABASE

# ─── FIREBASE ADMIN (Validar JWT en la API) ───────────────────────
FIREBASE_PROJECT_ID=distribuidas-f7a12
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@distribuidas-f7a12.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nTU_CLAVE_PRIVADA\n-----END PRIVATE KEY-----\n"

# ─── TWILIO (SMS y WhatsApp) ──────────────────────────────────────
TWILIO_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TOKEN=tu_auth_token
TWILIO_PHONE=+1XXXXXXXXXX
TWILIO_TO_TEST=+593XXXXXXXXX

# ─── BREVO EMAIL (Correos transaccionales) ────────────────────────
BREVO_API_KEY=xkeysib-xxxxxxxxxxxxxxxxxxxxxxxxx
BREVO_SENDER_EMAIL=tu-remitente@dominio.com

# ─── ALERTAS DEL ADMINISTRADOR ────────────────────────────────────
ADMIN_PHONE=+593XXXXXXXXX
ADMIN_EMAIL=admin@dominio.com

# ─── SOAP SERVICE (URL interna Docker) ───────────────────────────
SOAP_URL=http://soap-service:8000/wsdl

# ─── MONGODB ATLAS (Réplica parcial) ─────────────────────────────
MONGODB_URI=mongodb+srv://usuario:password@cluster0.xxxx.mongodb.net/techstore_replica

# ─── AIVEN POSTGRESQL (Réplica completa) ─────────────────────────
AIVEN_PG_URI=postgres://usuario:password@hostname:port/defaultdb?sslmode=require
```

> 💡 **Pídele las credenciales reales al líder del equipo.** El archivo `.env` nunca se sube a Git por seguridad.

#### 2b. `.env` del cliente web (React)

El archivo `web-client/.env` **ya está incluido en el repositorio** con los valores de Firebase correctos. No necesitas tocarlo.

```env
REACT_APP_FIREBASE_API_KEY=AIzaSyAzzwFTiJPyJ3ACwGOzR7O4EAfF6U4ZQoU
REACT_APP_FIREBASE_AUTH_DOMAIN=distribuidas-f7a12.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=distribuidas-f7a12
REACT_APP_FIREBASE_STORAGE_BUCKET=distribuidas-f7a12.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=682947339145
REACT_APP_FIREBASE_APP_ID=1:682947339145:web:a9388553bdf351edcf3758
REACT_APP_API_URL=https://nginx-balancer.onrender.com
```

> 🔐 **Nota sobre seguridad:** Estas claves de Firebase para el frontend **no están expuestas ni son secretas**. Por diseño de Google, las API keys del cliente de Firebase son públicas — la seguridad se gestiona mediante las **Firebase Security Rules** en la consola de Firebase, no ocultando las claves.

---

### Paso 3 — Levantar el Sistema

Con Docker Desktop corriendo, ejecuta desde la raíz del proyecto:

```powershell
docker-compose up -d --build
```

**¿Qué hace este comando?**
- `up` → Crea e inicia todos los contenedores
- `-d` → Corre en segundo plano (detached)
- `--build` → Construye las imágenes de la API REST, SOAP y React antes de iniciar

> ⏳ **La primera vez puede tardar 5–10 minutos** mientras descarga las imágenes de Docker (Kafka, MySQL, WordPress, Joomla, etc.). Ten paciencia.

---

## 🌐 URLs del Sistema

Una vez levantado, accede a los servicios desde el navegador:

| Servicio | URL | Descripción |
|---|---|---|
| 🖥️ **Panel React (Web)** | http://localhost:3000 | Cliente web principal |
| ⚖️ **NGINX Balanceador API** | http://localhost:8080 | Balancea entre API 1 y API 2 |
| 🔌 **API REST 1** | http://localhost:3001 | Instancia 1 de la API |
| 🔌 **API REST 2** | http://localhost:3002 | Instancia 2 de la API |
| 🧾 **Servicio SOAP** | http://localhost:8000/wsdl?wsdl | Facturación electrónica (WSDL) |
| 📰 **WordPress 1** | http://localhost:8081 | Portal informativo (Principal) |
| 📰 **WordPress 2** | http://localhost:8082 | Portal informativo (Respaldo) |
| 📰 **Joomla 1** | http://localhost:8085 | Portal informativo (Principal) |
| 📰 **Joomla 2** | http://localhost:8084 | Portal informativo (Respaldo) |
| 🔄 **Portal Failover** | http://localhost/wordpress/ | NGINX simulando Keepalived → WP |
| 🔄 **Portal Failover** | http://localhost/joomla/ | NGINX simulando Keepalived → Joomla |
| 🔗 **Debezium Connect** | http://localhost:8083 | Panel de conectores CDC |

---

## ✅ Verificar que Todo Funciona

### Ver el estado de todos los contenedores

```powershell
docker-compose ps
```

Todos deben aparecer como `running`. Si alguno dice `restarting` o `exited`, revisa la sección de [Solución de Problemas](#-solución-de-problemas-comunes).

### Verificar la API REST

```powershell
# Endpoint de salud de la API 1
curl http://localhost:3001/health

# Endpoint de salud de la API 2
curl http://localhost:3002/health

# A través del balanceador
curl http://localhost:8080/health
```

### Verificar el servicio SOAP

Abre en el navegador:
```
http://localhost:8000/wsdl?wsdl
```
Debes ver el XML del WSDL de facturación.

### Verificar Debezium (CDC)

```powershell
curl http://localhost:8083/connectors
```
Debe responder con `[]` (lista vacía o con conectores).

---

## 📱 App Móvil Flutter

La app móvil está en la carpeta `app_movil/`. Para correrla necesitas **Flutter SDK** instalado y un **dispositivo físico Android o iOS** (o un emulador de Android configurado en Android Studio).

> ⚠️ **La app NO funciona en Chrome (modo web).** Requiere un dispositivo real o emulador móvil porque usa plugins nativos de Firebase (push notifications, etc.).

```powershell
# 1. Entrar a la carpeta
cd app_movil

# 2. Descargar dependencias
flutter pub get

# 3. Ver los dispositivos disponibles (conecta tu celular por USB con depuración activada)
flutter devices

# 4. Correr en el dispositivo detectado
flutter run -d <ID_DEL_DISPOSITIVO>

# Ejemplo si solo hay un dispositivo conectado:
flutter run
```

**¿Cómo activar la depuración USB en Android?**
1. Ir a **Ajustes → Acerca del teléfono**
2. Tocar **Número de compilación** 7 veces
3. Ir a **Ajustes → Opciones de desarrollador → Depuración USB** → Activar
4. Conectar el cable USB y aceptar el permiso en el celular

> La app se conecta a Firebase Auth y a la API desplegada en Render (`https://nginx-balancer.onrender.com`).

---

## 🛠️ Comandos Útiles del Día a Día

```powershell
# ─── INICIAR ────────────────────────────────────────────────────────
# Primera vez o después de cambios en el código
docker-compose up -d --build

# Sin reconstruir imágenes (más rápido si no cambiaste código)
docker-compose up -d

# ─── MONITOREAR ─────────────────────────────────────────────────────
# Ver estado de todos los contenedores
docker-compose ps

# Ver logs en tiempo real de un servicio (Ctrl+C para salir)
docker-compose logs -f api-rest-1
docker-compose logs -f api-rest-2
docker-compose logs -f web-client
docker-compose logs -f soap-service
docker-compose logs -f wordpress-1
docker-compose logs -f joomla-1
docker-compose logs -f debezium
docker-compose logs -f kafka

# ─── REINICIAR ──────────────────────────────────────────────────────
# Reiniciar un servicio específico sin bajar el resto
docker-compose restart api-rest-1
docker-compose restart web-client

# ─── DETENER ────────────────────────────────────────────────────────
# Detener todo (conserva los datos)
docker-compose down

# Detener todo y eliminar TODOS los datos/volúmenes
# ⚠️ CUIDADO: borra el contenido de WordPress, Joomla y bases de datos
docker-compose down -v

# ─── LIMPIAR ────────────────────────────────────────────────────────
# Eliminar imágenes sin usar para liberar espacio en disco
docker image prune -f
```

---

## 📁 Estructura del Proyecto

```
ProyectoValido/
│
├── 📄 docker-compose.yml          ← PUNTO DE ENTRADA PRINCIPAL
├── 📄 .env                        ← Tus credenciales reales (NO subir a Git)
├── 📄 .env.example                ← Plantilla de variables de entorno
│
├── 📂 api-rest/                   ← API REST Node.js/Express
│   ├── server.js                  ← Lógica principal de la API
│   ├── Dockerfile                 ← Imagen Docker de la API
│   └── package.json
│
├── 📂 soap-service/               ← Servicio SOAP de Facturación
│   ├── server.js
│   ├── factura.wsdl               ← Definición del servicio SOAP
│   └── Dockerfile
│
├── 📂 web-client/                 ← React + Tailwind CSS (Panel Admin)
│   ├── src/                       ← Código fuente React
│   ├── public/
│   ├── .env                       ← Variables Firebase para React
│   └── Dockerfile
│
├── 📂 app_movil/                  ← App móvil Flutter
│   ├── lib/                       ← Código Dart
│   └── pubspec.yaml
│
├── 📂 nginx/                      ← Configuraciones NGINX
│   ├── api_balancer.conf          ← Balanceo entre API 1 y API 2
│   └── portal_failover.conf       ← Failover WordPress/Joomla (simula Keepalived)
│
├── 📂 nginx-balancer/             ← Configuración adicional del balanceador
│
├── 📂 db-dumps/                   ← Bases de datos pre-pobladas
│   ├── wordpress-1.sql            ← Datos iniciales WordPress 1
│   ├── wordpress-2.sql            ← Datos iniciales WordPress 2
│   ├── joomla-1.sql               ← Datos iniciales Joomla 1
│   └── joomla-2.sql               ← Datos iniciales Joomla 2
│
├── 📂 wordpress-1-mu/             ← MU-Plugins WordPress 1 (cargados automáticamente)
├── 📂 wordpress-2-mu/             ← MU-Plugins WordPress 2
│
├── 📄 joomla-1-cassiopeia.php     ← Template personalizado Joomla 1 (frontend)
├── 📄 joomla-1-atum.php           ← Template personalizado Joomla 1 (admin)
├── 📄 joomla-2-cassiopeia.php     ← Template personalizado Joomla 2 (frontend)
├── 📄 joomla-2-atum.php           ← Template personalizado Joomla 2 (admin)
│
└── 📄 replicador.js               ← Script de replicación de datos
```

---

## 🏗️ Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────┐
│                     CLIENTES                            │
│         Flutter App  ←→  React Web Panel                │
└────────────────────┬────────────────────────────────────┘
                     │ Firebase Auth (JWT)
                     ▼
         ┌─────────────────────┐
         │  NGINX Balanceador  │ :8080
         │  (Round Robin)      │
         └────────┬────────────┘
           ┌──────┴──────┐
           ▼             ▼
      API REST 1    API REST 2
        :3001          :3002
           └──────┬──────┘
                  │
         ┌────────▼────────┐
         │ Supabase (PostgreSQL) │
         └────────┬────────┘
                  │
         ┌────────▼────────┐
         │  SOAP :8000     │ ← Facturación Electrónica
         └─────────────────┘

 (Replicación CDC en paralelo)
 Supabase ──► Debezium :8083 ──► Kafka :9092
                                     ├──► Aiven PostgreSQL (nube)
                                     └──► MongoDB Atlas (nube)

 (Portales Informativos con Failover)
 NGINX Failover :80
    ├──► /wordpress/  ──► WordPress-1 :8081 (principal)
    │                 ──► WordPress-2 :8082 (backup automático)
    └──► /joomla/     ──► Joomla-1    :8085 (principal)
                      ──► Joomla-2    :8084 (backup automático)
```

---

## 🐛 Solución de Problemas Comunes

### ❌ "Port is already allocated" (Puerto ocupado)

Algún servicio de tu PC está usando el mismo puerto. Soluciones:

```powershell
# Ver qué proceso usa el puerto (ejemplo: 8080)
netstat -ano | findstr :8080

# Matar el proceso por su PID
taskkill /PID <PID> /F
```

O cierra el programa que ocupa ese puerto (otro Docker, XAMPP, servidor local, etc.).

---

### ❌ Los contenedores de WordPress o Joomla aparecen como "restarting"

Las bases de datos tardan en inicializarse. Espera 1-2 minutos y ejecuta:

```powershell
docker-compose ps
```

Si siguen fallando, revisa los logs:

```powershell
docker-compose logs -f db-wp-1
docker-compose logs -f db-joomla-1
```

---

### ❌ "Cannot connect to the Docker daemon"

Docker Desktop no está corriendo. Ábrelo desde el menú de inicio y espera a que diga "Engine running".

---

### ❌ La API devuelve errores 500

Verifica que el archivo `.env` de la raíz esté correctamente configurado con las credenciales de Supabase y Firebase:

```powershell
# Ver los logs de la API en tiempo real
docker-compose logs -f api-rest-1
```

---

### ❌ Quiero reiniciar desde cero (datos limpios)

```powershell
# ⚠️ Esto borra TODOS los datos de WordPress, Joomla y bases de datos
docker-compose down -v
docker-compose up -d --build
```

Los datos de WordPress y Joomla se re-importarán automáticamente desde los archivos `db-dumps/*.sql`.

---

### ❌ El cliente React no carga o da error de Firebase

Verifica el archivo `web-client/.env`. Debe tener las variables `REACT_APP_FIREBASE_*`. Si lo modificas, debes reconstruir el contenedor:

```powershell
docker-compose up -d --build web-client
```

---

## 👥 Equipo

Proyecto de **Aplicaciones Distribuidas** — TECHSTORE 360

> 📖 Para la documentación técnica completa del desarrollo, consulta [`proyecto_techstore_360_guia.md`](./proyecto_techstore_360_guia.md)
