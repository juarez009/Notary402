# Guía de Despliegue en Producción y Conexión L402 / Polar 🇸🇻⚡

Esta guía explica cómo conectar la **Consola Notarial Web en Netlify** con el backend API y la infraestructura de nodos **Bitcoin Lightning Network (L402 / Polar)**.

---

## 🏗️ Arquitectura de Despliegue en la Nube

```text
  ┌─────────────────────────┐
  │   Frontend en Netlify   │
  │ https://notary402.app   │
  └────────────┬────────────┘
               │
               │ HTTPS (REST API & OpenAPI)
               ▼
  ┌─────────────────────────┐
  │  Backend API (Railway)  │
  │ https://api.notary402.org│
  └────────────┬────────────┘
               │
      ┌────────┴──────────────────────────┐
      │                                   │
      ▼ (L402 Macaroon / Preimage)        ▼ (EVM RPC)
┌───────────────────────────┐   ┌─────────────────────┐
│  Aperture / Lightning     │   │ Polygon Amoy Testnet│
│  (Opción A, B o C)        │   │ https://rpc-amoy... │
└───────────────────────────┘   └─────────────────────┘
```

---

## ⚡ 3 Opciones para Conectar Polar / L402 con Netlify y Backend en la Nube

### 🔹 Opción A: Polar Local expuesto por Cloudflare Tunnel (Ideal para Demo / Pitch Hackathon)

Si ejecutas **Polar** (nodos LND regtest local) y **Aperture** en tu laptop, pero la interfaz corre en **Netlify** y el backend en **Railway / Render**:

1. **Exponer Aperture con Cloudflare Tunnel / ngrok**:
   ```bash
   # Exponer puerto 8080 local de Aperture a la nube
   cloudflared tunnel --url http://localhost:8080
   # ó con ngrok:
   ngrok http 8080
   ```
2. **Configurar el Backend API en la Nube (Railway / Render / VPS)**:
   Configura la variable de entorno en tu panel de Railway/Render:
   ```env
   APERTURE_BASE_URL=https://tu-tunnel.trycloudflare.com
   WEB_ORIGIN=https://notary402.netlify.app
   ```
3. **Flujo de Trabajo**:
   Cuando un agente o usuario solicita una firma desde Netlify ➔ la API en la nube genera la factura L402 ➔ consulta Aperture a través del túnel HTTPS seguro ➔ tu nodo **Polar local** liquida la factura en Satoshis instantáneamente.

---

### 🔹 Opción B: Nodo Lightning Cloud en Producción (Voltage / Alby Hub / VPS)

Para producción continua sin depender de tu máquina local:

1. **Crear un nodo Lightning Cloud**:
   - **Voltage.cloud**: Crea un nodo LND administrado en la nube.
   - **Alby Hub / Mutiny**: Despliega un nodo LND/CLN independiente con IP pública.
2. **Desplegar Aperture L402 Proxy en la Nube (Fly.io / Railway / Docker VPS)**:
   - Conecta Aperture al puerto gRPC/REST de tu nodo Voltage.
   - Apunta `APERTURE_BASE_URL=https://l402.notary402.org`.

---

###  stream Opción C: Modo Simulación Autónomo L402 (Fallback de Emergencia)

Si no hay conexión a internet o Polar está apagado durante la revisión de los jueces:

El protocolo Notary402 integra validación criptográfica sintética nativa mediante `parseL402Receipt`:
- Analiza la estructura de la Macaroon y la Preimage (SHA-256 hash lock).
- Permite que las pruebas E2E e interfaces sigan validando atestaciones de forma 100% autónoma.

---

## 🌐 Configuración en Netlify (Frontend)

1. En el repositorio de GitHub, la carpeta a publicar en Netlify es `frontend-verifier/` (o la salida de `npm run build:web`).
2. En la consola de Netlify (**Site Configuration > Environment Variables**):
   ```env
   VITE_API_BASE_URL=https://api.notary402.org
   ```
3. En el backend Fastify, asegura configurar CORS:
   ```env
   WEB_ORIGIN=https://tu-app.netlify.app
   ```

---

## 🔒 Seguridad en Despliegue Live
- **Secrets**: `SUPABASE_SERVICE_ROLE_KEY` y `AMOY_AGENT_PRIVATE_KEY` deben estar guardadas únicamente en las variables de entorno del backend (Railway/Render), **NUNCA en Netlify**.
- **Redacción de Credenciales**: El endpoint `GET /v1/live/status` oculta y enmascara automáticamente todas las llaves y URLs sensibles.
