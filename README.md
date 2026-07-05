# Notary402 — Protocolo Notarial Agéntico Web3 🇸🇻⚡

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

## 🚀 Comandos de Inicio y Ejecución (Getting Started)

### 1. Instalación de Dependencias
```bash
npm install
```

### 2. Demostración en Vivo del Agente Autónomo (Pitch Hackathon) 🤖⚡
Ejecuta la simulación interactiva 100% máquina a máquina en terminal:
```bash
npm run demo:agent
```
> **¿Qué hace este comando?** Genera una billetera Web3 EVM en tiempo real, registra la intención contractual, genera el borrador notarial salvadoreño (Art. 32), firma mediante EIP-191, liquida 150 mSats vía L402 Lightning, ejecuta la auditoría legal de El Salvador e emite una atestación notarial verificable por QR.

---

### 3. Iniciar Servidores Locales

#### Backend REST API (Puerto 3001)
```bash
npm run dev:api     # Modo desarrollo con auto-reload
# ó
npm run start:api   # Modo producción
```

#### Servidor MCP (Model Context Protocol)
```bash
npm run start:mcp
```

#### Consola Notarial Web (Frontend UI/UX Pro Max)
```bash
python3 -m http.server 8080 --directory frontend-verifier
# ó
npm run dev:web     # Servidor Vite React (Puerto 3000)
```
👉 **Abre la Consola Web en tu navegador:** [http://localhost:8080](http://localhost:8080)

---

## 🧪 Comandos de Pruebas y Validación (Testing Suite)

### 1. Ejecutar Suite Completa de Pruebas Unitarias e Integración (19/19 Tests)
```bash
npm test
```

### 2. Verificación de Tipos TypeScript (0 Errores)
```bash
npm run typecheck
```

### 3. Compilación de Producción
```bash
npm run build        # Compila paquetes backend y scripts a dist/
npm run build:web    # Compila la SPA React
```

---

## 🔬 Pruebas de Humo e Integración en Vivo (Live Smoke Suite)

### Validar Configuración de Entorno (.env.live)
```bash
npm run check:live-config
```

### Aplicar Migración Notarial a Supabase PostgreSQL
```bash
npm run db:migrate
```

### Pruebas Individuales por Componente
```bash
npm run smoke:supabase     # Prueba cliente Supabase DB
npm run smoke:datamcp      # Prueba pasarela DataMCP Read-Only
npm run smoke:amoy         # Prueba billeteras y firmas EVM Polygon Amoy
npm run smoke:aperture     # Prueba gateway L402 Lightning
npm run smoke:zavu         # Prueba canal WhatsApp Zavu
npm run smoke:e2e-live     # Prueba flujo completo End-to-End en vivo
```

---

## 🎚️ Niveles de Firma Legales (Signature Levels 0 - 5)

| Nivel | Nombre | Descripción | Ejecución |
|---|---|---|---|
| **Level 0** | *Hash Attestation* | Prueba técnica de existencia e integridad de archivo (SHA-256). | Autónomo por IA |
| **Level 1** | *Agent Signature* | Firma criptográfica generada por la billetera Web3 del agente (EIP-191). | Autónomo por IA |
| **Level 2** | *Authorized Rep* | Firma del agente bajo delegación explícita de una persona o empresa. | Autónomo por IA |
| **Level 3** | *Jurisdiction E-Signature* | Firma electrónica ajustada a la Ley de Firma Electrónica de El Salvador. | Autónomo por IA |
| **Level 4** | *Human Notary Countersig* | Firma de IA con refrenda y visto bueno obligatorio de Notario Humano Colegiado. | **Escalado a Zavu** |
| **Level 5** | *Public Instrument* | Trámite reservado para protocolo o escritura pública formal en papel. | **Escalado a Zavu** |

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
