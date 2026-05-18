# 🛒 TECHSTORE 360 - Aplicaciones Distribuidas

Sistema distribuido completo con React, Flutter, WordPress, Joomla, APIs REST, SOAP, Kafka, Debezium y más.

---

## 🚀 Inicio Rápido (Para todos los integrantes del equipo)

### Requisitos previos
Instala estas herramientas antes de continuar:
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ← **El más importante**
- [Git](https://git-scm.com/)

### Pasos para levantar el sistema

**1. Clonar el repositorio**
```bash
git clone https://github.com/TU_USUARIO/TU_REPO.git
cd TU_REPO
```

**2. Configurar las variables de entorno**

En Windows (PowerShell):
```powershell
Copy-Item .env.example .env
```
En Linux / Mac:
```bash
cp .env.example .env
```

> ⚠️ Abre el archivo `.env` y rellena las credenciales reales (Supabase, Firebase, Twilio, etc.).
> Si solo quieres ver el sistema corriendo localmente sin la nube, puedes dejarlo vacío — el sistema arranca en **modo demo**.

**3. Levantar todo el sistema**
```bash
docker-compose up -d --build
```

Espera 2-3 minutos la primera vez (descarga imágenes). Luego accede a:

---

## 🌐 URLs del Sistema

| Servicio | URL | Descripción |
|---|---|---|
| 🌐 React (Panel Admin) | http://localhost:3000 | Cliente web principal |
| ⚖️ NGINX Balanceador | http://localhost:8080 | Balanceo entre API 1 y API 2 |
| 🔌 API REST 1 | http://localhost:3001 | Render 1 (local) |
| 🔌 API REST 2 | http://localhost:3002 | Render 2 (local) |
| 🧾 Servicio SOAP | http://localhost:8000/wsdl?wsdl | Facturación electrónica |
| 📰 WordPress 1 | http://localhost:8081 | Portal informativo (Principal) |
| 📰 WordPress 2 | http://localhost:8082 | Portal informativo (Respaldo) |
| 📰 Joomla 1 | http://localhost:8083 | Portal informativo (Principal) |
| 📰 Joomla 2 | http://localhost:8084 | Portal informativo (Respaldo) |
| 🔄 Portal Failover | http://localhost | NGINX simulando Keepalived |
| 🔗 Debezium Connect | http://localhost:8083 | Panel de conectores CDC |

---

## 🔧 Comandos Útiles

```bash
# Levantar todo (primera vez o después de cambios en código)
docker-compose up -d --build

# Levantar todo (sin reconstruir imágenes)
docker-compose up -d

# Ver el estado de todos los contenedores
docker-compose ps

# Ver los logs de un servicio específico
docker-compose logs -f api-rest-1
docker-compose logs -f wordpress-1

# Detener todo el sistema
docker-compose down

# Detener TODO y eliminar datos (¡cuidado! borra el contenido de WordPress/Joomla)
docker-compose down -v

# Reiniciar un solo servicio
docker-compose restart api-rest-1
```

---

## 📁 Estructura del Proyecto

```
techstore-360/
├── web-client/          # React + Tailwind CSS (Panel Administrativo)
├── api-rest/            # Node.js Express (APIs para Render 1 y 2)
├── soap-service/        # Node.js SOAP (Facturación Electrónica)
├── nginx/               # Configuraciones de NGINX
│   ├── api_balancer.conf    # Balanceo entre API 1 y API 2
│   └── portal_failover.conf # Failover WP/Joomla
├── docker-compose.yml   # Orquestador principal ← EJECUTA ESTE
├── .env.example         # Plantilla de variables de entorno
├── .env                 # Tus credenciales reales (NO subir a Git)
└── proyecto_techstore_360_guia.md  # Guía paso a paso completa
```

---

## ⚙️ Variables de Entorno

Copia `.env.example` como `.env` y configura:

| Variable | Servicio | Dónde obtenerla |
|---|---|---|
| `SUPABASE_URL` | Supabase | Dashboard → Settings → API |
| `SUPABASE_KEY` | Supabase | Dashboard → Settings → API |
| `FIREBASE_PROJECT_ID` | Firebase | Consola Firebase → Configuración |
| `TWILIO_SID` | Twilio | Console Twilio → Dashboard |
| `TWILIO_TOKEN` | Twilio | Console Twilio → Dashboard |
| `RESEND_API_KEY` | Resend | Dashboard → API Keys |
| `MONGODB_URI` | MongoDB Atlas | Cluster → Connect |
| `AIVEN_PG_URI` | Aiven | Service → Connection Info |

---

## 🏗️ Arquitectura del Sistema

```
Flutter / React
     ↓
Firebase Auth (JWT)
     ↓
NGINX Balanceador :8080
   ├→ API REST 1 :3001
   └→ API REST 2 :3002
        ↓
   Supabase PostgreSQL
        ↓
   SOAP Facturación :8000
        ↓
   Brave Email / Twilio

(En paralelo)
Supabase → Debezium → Kafka → Aiven + MongoDB Atlas

(IaaS Local)
NGINX Failover :80
   ├→ WordPress 1 :8081 + Joomla 1 :8083
   └→ WordPress 2 :8082 + Joomla 2 :8084
```

---

## 📖 Documentación Completa

Consulta el archivo [`proyecto_techstore_360_guia.md`](./proyecto_techstore_360_guia.md) para ver todos los pasos de desarrollo detallados.

---

## 👥 Equipo

Proyecto de Aplicaciones Distribuidas — TECHSTORE 360
