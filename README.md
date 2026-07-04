# ⚡ Notary402 — Protocolo Notarial Agéntico Web3 & Bitcoin Native (L402)

> **Jurisdicción:** El Salvador 🇸🇻 (Ley de Firma Electrónica, Art. 15-22)  
> **Arquitectura:** Agent-First Legal Trust Layer (L402 + Polygon Amoy + QVAC LLM + Zavu + DataMCP)

---

## 📌 ¿Qué es Notary402?

**Notary402** es una infraestructura notarial impulsada por Inteligencia Artificial y protocolos Web3/Bitcoin diseñada para **Agentes Autónomos (AI Agents)**. Permite a sistemas de IA (como Claude Code, Cursor, Codex, Hermes, OpenClaw, etc.) crear compromisos jurídicos, validar capacidades legales, autenticarse y pagar servicios notariales vía Lightning Network (L402), certificar huellas criptográficas y escalar a notarios humanos colegiados cuando la ley local lo requiere.

---

## 🏗️ Arquitectura del Sistema

```
Agentes de IA (Claude / Cursor / Codex / Hermes / OpenClaw)
       │
       ▼ (MCP Protocol / REST API)
┌─────────────────────────────────────────────────────────────────────────────┐
│                             n8n Orchestrator                                │
└──────┬──────────────────┬─────────────────┬──────────────────┬──────────────┘
       │                  │                 │                  │
       ▼                  ▼                 ▼                  ▼
┌──────────────┐   ┌─────────────┐   ┌────────────┐     ┌──────────────┐
│   Aperture   │   │Polygon Amoy │   │  QVAC LLM  │     │ Zavu Bridge  │
│(L402 Gateway)│   │ (EVM Proof) │   │ (Ollama)   │     │  (WhatsApp)  │
└──────────────┘   └─────────────┘   └────────────┘     └──────────────┘
       │                  │                 │                  │
       └──────────────────┴────────┬────────┴──────────────────┘
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │    Notary402 API      │
                       └───────────┬───────────┘
                                   │
                         (Escritura de Auditoría)
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │  PostgreSQL Audit DB  │
                       └───────────┬───────────┘
                                   │
                         (Lectura Read-Only MCP)
                                   │
                                   ▼
                       ┌───────────────────────┐
                       │        DataMCP        │
                       └───────────┬───────────┘
                                   │
                                   ▼
                  ┌─────────────────────────────────┐
                  │  frontend-verifier/index.html   │
                  │   (Agentic Verifier Portal)     │
                  └─────────────────────────────────┘
```

---

## 🎚️ Niveles de Firma Legales (Signature Levels 0 - 5)

Notary402 clasifica la firmeza jurídica según los límites definidos en `LEGAL_BOUNDARIES.md`:

| Nivel | Nombre | Descripción | Ejecución |
|---|---|---|---|
| **Level 0** | *Hash Attestation* | Prueba técnica de existencia e integridad de archivo (SHA-256). | Autónomo por IA |
| **Level 1** | *Agent Signature* | Firma criptográfica generada por la billetera Web3 del agente. | Autónomo por IA |
| **Level 2** | *Authorized Rep* | Firma del agente bajo poder/delegación explicita de una persona o empresa. | Autónomo por IA |
| **Level 3** | *Jurisdiction E-Signature* | Firma electrónica ajustada a la Ley de Firma Electrónica de El Salvador. | Autónomo por IA |
| **Level 4** | *Human Notary Countersig* | Firma de IA con refrenda y visto bueno obligatorio de Notario Humano Colegiado. | **Escalado a Zavu** |
| **Level 5** | *Public Instrument* | Trámite reservado para protocolo o escritura pública formal. | **Escalado a Zavu** |

---

## 🚀 Guía de Instalación y Despliegue Local

### 1. Requisitos Previos

- **Node.js** (v18 o superior) y `npm`
- **Docker** & Docker Compose (para PostgreSQL, Aperture y n8n)
- **Ollama** con el modelo `llama-3-8b` descargado (Motor QVAC):
  ```bash
  ollama pull llama3:8b
  ```

---

### 2. Configuración de Variables de Entorno

Copia el archivo `.env.example` a `.env.live` y configura tus credenciales:

```bash
cp .env.example .env.live
```

Variables clave en `.env.live`:
```env
# API & Servidores
PORT=3001
API_BASE_URL=http://localhost:3001

# PostgreSQL & DataMCP
POSTGRES_URL=postgresql://user:password@localhost:5432/notary402
DATAMCP_MCP_URL=https://api.datamcp.app/api/mcp/conn_xxxx
DATAMCP_PERMISSION_PRESET=read-only

# Polygon Amoy (Testnet Chain ID 80002)
AMOY_RPC_URL=https://rpc-amoy.polygon.technology
AMOY_CHAIN_ID=80002
AMOY_AGENT_PRIVATE_KEY=0x...

# L402 / Aperture / Lightning
APERTURE_BASE_URL=http://localhost:8080
L402_SMOKE_RECEIPT=macaroon:preimage

# QVAC (Ollama Local)
QVAC_BASE_URL=http://localhost:11434/v1

# Zavu (Escalación WhatsApp)
ZAVU_BASE_URL=https://api.zavu.empress.eco
ZAVU_API_KEY=zavu_sk_...

# n8n
N8N_WEBHOOK_NOTARY402=http://localhost:5678/webhook/notary402
```

---

### 3. Instalación de Dependencias

```bash
npm install
```

---

### 4. Inicializar Base de Datos de Auditoría

Aplica el esquema de migración de auditoría de PostgreSQL:

```bash
npm run db:migrate
```

---

### 5. Verificar Conexiones e Integraciones en Vivo

Ejecuta el script de verificación para validar que los 7 servicios estén listos:

```bash
npm run check:live-config
```

Pruebas individuales disponibles:
```bash
npm run smoke:postgres    # Test base de datos PostgreSQL
npm run smoke:datamcp     # Test pasarela DataMCP
npm run smoke:amoy        # Test billeteras y firmas EVM
npm run smoke:aperture    # Test gateway L402 Lightning
npm run smoke:qvac        # Test evaluador LLM local
npm run smoke:zavu        # Test canal WhatsApp Zavu
npm run smoke:e2e-live    # Test de flujo end-to-end completo
```

---

### 6. Levantar el Backend (API & MCP Server)

Ejecuta el servidor REST API en puerto `3001` y el servidor MCP en puerto `3002`:

```bash
npm run dev
```

---

### 7. Levantar el Verificador Frontend (UI)

El frontend se encuentra en la carpeta `/frontend-verifier/` como una SPA independiente (HTML/JS/Tailwind con i18n Español/Inglés).

Puedes servirlo utilizando Python:
```bash
python3 -m http.server 8080 --directory frontend-verifier
```

Abre en tu navegador:
👉 **http://localhost:8080**

---

## 📡 Endpoints Principales de la API (REST & MCP)

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/health` | Estado de salud básico del servidor. |
| `GET` | `/v1/live/status` | Estado en vivo de los 7 componentes integrados. |
| `POST` | `/v1/legal-intent` | Registro de intención legal enviado por el agente. |
| `POST` | `/v1/signature/request` | Solicitud de firma (Gated por L402 HTTP 402). |
| `POST` | `/v1/wallets/verify-signature` | Verificación de firma EIP-191 en Polygon Amoy. |
| `POST` | `/v1/payments/l402/verify` | Registro de comprobante de pago Lightning (macaroon/preimage). |
| `POST` | `/v1/signature/validate` | Ejecución de evaluación legal QVAC con Ollama. |
| `POST` | `/v1/attestations` | Emisión de la atestación final en formato JSON. |
| `POST` | `/v1/verify` | Endpoint público de verificación utilizado por el Frontend. |
| `POST` | `/v1/zavu/escalate` | Escalación a notario humano vía WhatsApp Zavu. |
| `GET` | `/v1/integrations/datamcp` | Consulta del plan de auditoría DataMCP `read-only`. |

---

## ⚖️ Legal Boundary & Disclaimer

> **Importante:** Notary402 demuestra automatización de flujos de trabajo legales con conciencia de jurisdicción y atestaciones criptográficas. Cuando la ley local requiere un notario autorizado o profesional legal humano, el sistema escala en lugar de reemplazar ese rol. Los análisis generados por el modelo QVAC son de carácter asesor y consultivo.

---

## 📄 Licencia

MIT License — Desarrollado para la Hackathon Notary402 El Salvador 2026.
