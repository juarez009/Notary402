# Notary402 — Protocolo Notarial Agéntico Web3 🇸🇻

**Notary402** es la capa de confianza legal y verificación notarial criptográfica diseñada para **Agentes de Inteligencia Artificial Autónomos y Protocolos Web3**. 

Permite que agentes de IA compren confianza legal utilizando el protocolo **L402 (Bitcoin Lightning Network)**, demuestren el control de billeteras en **Polygon Amoy (EVM - EIP-191)**, generen borradores de instrumentos notariales según la **Ley de Notariado y Ley de Firma Electrónica de El Salvador**, ejecuten auditorías legales con modelos LLM (**QVAC / Ollama**), emitan atestaciones verificables por QR y escalen a notarios humanos licenciados a través de **Zavu (WhatsApp Business API)** cuando la ley lo exija.

---

## 🏛️ Arquitectura del Sistema

```text
       ┌────────────────────────────────────────────────────────┐
       │     Agentes de IA (Claude / Codex / GPT-4 / n8n / MCP) │
       └───────────────────────────┬────────────────────────────┘
                                   │
       ┌───────────────────────────┼────────────────────────────┐
       │                           │                            │
       ▼                           ▼                            ▼
┌──────────────┐          ┌─────────────────┐          ┌────────────────┐
│   Aperture   │          │  Polygon Amoy   │          │    QVAC LLM    │
│(L402 Gateway)│          │  (Firma EVM)    │          │  (Ollama AI)   │
└──────┬───────┘          └────────┬────────┘          └───────┬────────┘
       │                           │                            │
       └───────────────────────────┼────────────────────────────┘
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │    Notary402 API      │
                       │ (Fastify / OpenAPI)   │
                       └───────────┬───────────┘
                                   │
                (Escritura de Auditoría con Service Role)
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │  Supabase / Postgres  │
                       └───────────┬───────────┘
                                   │
                    (Lectura Read-Only MCP Context)
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │        DataMCP        │
                       └───────────┬───────────┘
                                   │
                                   ▼
                   ┌───────────────────────────────┐
                   │   Consola Notarial Web        │
                   │ (frontend-verifier / 8080)    │
                   └───────────────────────────────┘
```

---

## 🎚️ Niveles de Firma Legales (Signature Levels 0 - 5)

Notary402 clasifica la firmeza jurídica según los límites definidos en `LEGAL_BOUNDARIES.md`:

| Nivel | Nombre | Descripción | Ejecución |
|---|---|---|---|
| **Level 0** | *Hash Attestation* | Prueba técnica de existencia e integridad de archivo (SHA-256). | Autónomo por IA |
| **Level 1** | *Agent Signature* | Firma criptográfica generada por la billetera Web3 del agente (EIP-191). | Autónomo por IA |
| **Level 2** | *Authorized Rep* | Firma del agente bajo delegación explícita de una persona o empresa. | Autónomo por IA |
| **Level 3** | *Jurisdiction E-Signature* | Firma electrónica ajustada a la Ley de Firma Electrónica de El Salvador. | Autónomo por IA |
| **Level 4** | *Human Notary Countersig* | Firma de IA con refrenda y visto bueno obligatorio de Notario Humano Colegiado. | **Escalado a Zavu** |
| **Level 5** | *Public Instrument* | Trámite reservado para protocolo o escritura pública formal en papel. | **Escalado a Zavu** |

---

## 🚀 Inicio Rápido

### 1. Instalación de Dependencias

```bash
npm install
```

### 2. Ejecutar Demo del Agente Autónomo Web3 (Hackathon Live Pitch)

Corre la simulación interactiva máquina a máquina en la terminal:

```bash
npm run demo:agent
```

Este script genera una billetera Web3 EVM en tiempo real, firma un contrato mediante **EIP-191**, liquida aranceles en Satoshis (**L402**), ejecuta la auditoría notarial de El Salvador e emite una atestación criptográfica verificable con QR.

### 3. Desarrollo Local

```bash
npm run dev:api     # Backend Fastify API en http://localhost:3001
npm run dev:mcp     # Servidor MCP (Stdio / Model Context Protocol)
```

Para levantar la **Consola de Auditoría Notarial (Frontend UI/UX Pro Max)**:
```bash
python3 -m http.server 8080 --directory frontend-verifier
```
👉 Abre en tu navegador: **http://localhost:8080**

---

## ⚙️ Configuración del Entorno (.env.live)

Copia el archivo de configuración en vivo:

```bash
cp .env.live.example .env.live
```

Variables requeridas para el entorno de producción en vivo:

```env
# Supabase / PostgreSQL Audit Database
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
SUPABASE_SCHEMA=public

# Polygon Amoy (Testnet Chain ID 80002)
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
AMOY_CHAIN_ID=80002
AMOY_AGENT_PRIVATE_KEY=0x_llave_privada_aqui

# L402 / Aperture / Lightning Network
APERTURE_BASE_URL=http://localhost:8080
L402_SMOKE_RECEIPT=macaroon:preimage

# Zavu (Escalación WhatsApp Business)
ZAVU_BASE_URL=https://api.zavu.empress.eco
ZAVU_API_KEY=zavu_sk_...

# DataMCP (Read-Only Context)
DATAMCP_MCP_URL=https://mcp.datamcp.app/v1/link/conn_xxx
DATAMCP_API_KEY=datamcp_live_...
DATAMCP_PERMISSION_PRESET=read-only
```

---

## 🧪 Pruebas e Integraciones en Vivo

```bash
# 1. Validar configuración en vivo y redacción de secretos
npm run check:live-config

# 2. Migrar esquema de base de datos notarial a Supabase
npm run db:migrate

# 3. Correr suite de pruebas unitarias e integración (29 tests)
npm test

# 4. Verificación de tipos TypeScript (0 errores)
npm run typecheck

# 5. Ejecutar suite de humo en vivo E2E
npm run smoke:e2e-live
```

---

## 📡 Endpoints Principales de la API (REST & MCP)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Estado de salud del servicio API. |
| `GET` | `/v1/live/status` | Monitoreo en vivo de las 7 integraciones. |
| `POST` | `/v1/legal-intent` | Registro de intención legal enviado por el agente. |
| `POST` | `/v1/signature/request` | Solicitud de firma (Gated por L402 HTTP 402). |
| `POST` | `/v1/documents/request` | Solicitud de redacción de instrumento notarial (Art. 32 SV). |
| `POST` | `/v1/wallets/verify-signature` | Verificación de firma EIP-191 en Polygon Amoy. |
| `POST` | `/v1/payments/l402/verify` | Registro de comprobante de pago Lightning (macaroon/preimage). |
| `POST` | `/v1/payments/amoy/verify` | Verificación de transacción en Polygon Amoy RPC. |
| `POST` | `/v1/signature/validate` | Evaluación notarial legal con modelo QVAC / Ollama. |
| `POST` | `/v1/attestations` | Emisión de la atestación notarial criptográfica en JSON. |
| `GET` | `/v1/attestations/:id` | Consulta pública de atestación por ID. |
| `POST` | `/v1/verify` | Endpoint de verificación pública utilizado por la Consola Web. |
| `POST` | `/v1/zavu/escalate` | Escalación a notario humano vía WhatsApp Zavu. |
| `GET` | `/v1/integrations/datamcp` | Consulta del plan de auditoría DataMCP `read-only`. |
| `GET` | `/openapi.json` | Contrato OpenAPI oficial Notary402. |

---

## ⚖️ Límite Legal y Responsabilidad (Legal Boundary)

> **Importante:** Notary402 demuestra automatización de flujos de trabajo legales con conciencia de jurisdicción y atestaciones criptográficas. Cuando la ley local requiere un notario autorizado o profesional legal humano, el sistema escala en lugar de reemplazar ese rol. Los análisis generados por el nodo QVAC son de carácter asesor y consultivo de conformidad con la Ley de Notariado y Ley de Firma Electrónica de El Salvador.

---

## 📄 Licencia

MIT License — Desarrollado para la Hackathon Notary402 El Salvador 2026.
