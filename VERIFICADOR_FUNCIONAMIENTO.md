# 📘 Notary402 — Manual de Funcionamiento del Verificador Agéntico (Frontend)

> **Notary402 El Salvador** | Protocolo Notarial Agéntico Web3 & Bitcoin Native (L402)
> Documentación de arquitectura, interfaz y apartados del Verificador de Atestaciones.

---

## 📌 Visión General

El **Verificador Agéntico Notary402** es la interfaz pública y cliente-side (Single Page Application) encargada de auditar, validar y visualizar las atestaciones notariales emitidas para y por **Agentes de Inteligencia Artificial**. 

A diferencia de las aplicaciones Web2 tradicionales donde los humanos rellenan formularios, en Notary402 **los agentes operan de forma autónoma vía protocolo MCP/API y pagando en sats mediante L402**. Esta interfaz actúa como la prueba pública transparente de la integridad criptográfica y legal de dichas transacciones.

---

## 🛠️ Detalle de Apartados de la Interfaz

```
┌───────────────────────────────────────────────────────────────────────────┐
│ 1. HEADER & METRICAS (Red, Jurisdicción, L402, API Status & Selector EN/ES)│
├───────────────────────────────────────────────────────────────────────────┤
│ 2. CUADRO DE BÚSQUEDA & EJEMPLOS (Buscador por attestation_id)            │
├───────────────────────────────────────────────────────────────────────────┤
│ 3. BADGES DE RESUMEN (Validez, Nivel de Firma Level 0-5, Intervención)   │
├───────────────────────────────────────────────────────────────────────────┤
│ 4. PESTAÑAS PRINCIPALES DE DETALLE:                                       │
│    ├── 🔒 Pruebas Criptográficas (Hashes, Billetera Agente, L402 Macaroon)│
│    ├── ⚖️ Evaluación Legal QVAC (Modelos LLM El Salvador & Checklist)     │
│    ├── 📱 Código QR (Verificación móvil & Deep Linking)                   │
│    └── 💬 Escalación Zavu (Flujo con Notario Humano vía WhatsApp)         │
├───────────────────────────────────────────────────────────────────────────┤
│ 5. PESTAÑAS INFERIORES DE AUDITORÍA Y SISTEMA:                           │
│    ├── ⏱️ Timeline Histórico (Registro de atestaciones verificadas)      │
│    ├── 📊 Integraciones en Vivo (Estado de PostgreSQL, QVAC, L402, n8n)   │
│    └── 🗄️ DataMCP Audit Plan (Esquema de auditoría read-only en PG)      │
├───────────────────────────────────────────────────────────────────────────┤
│ 6. FOOTER & DISCLAIMER LEGAL OBLIGATORIO                                  │
└───────────────────────────────────────────────────────────────────────────┘
```

---

### 1. Cabecera (Header) & Indicadores de Red
- **Identidad:** `NOTARY402 AGENTIC VERIFIER` — Define que la app está diseñada para la verificación de operaciones hechas por software autónomo.
- **Jurisdicción `SV — El Salvador`:** Enmarca la validez legal bajo la *Ley de Firma Electrónica de El Salvador (Art. 15-22)*.
- **Protocolo `⚡ L402 Lightning`:** Indica que los servicios notariales se pagan mediante la red Lightning de Bitcoin (mSats) usando el estándar HTTP 402 (Payment Required).
- **Indicador `API / Demo`:** Muestra si el verificador está enlazado a la API viva (`localhost:3001`) o en simulación local en el navegador.
- **Selector Bilingüe `[ EN / ES ]`:** Conmutador instantáneo que traduce toda la interfaz, mensajes, etiquetas de auditoría criptográfica, checklist legal y avisos de escalación entre **Inglés** y **Español**.

---

### 2. Cuadro de Verificación (Hero & Input)
- **Buscador de `attestation_id`:** Entrada donde se introduce el identificador único emitido por el sistema (ej: `att_402_9921_sv`).
- **Demostraciones Clicables:**
  - `att_402_9921_sv`: Contrato comercial (Firma autónoma por IA, Nivel 3).
  - `att_402_5401_sv`: Tokenización de activos (Escalado a Notario Humano por riesgo, Nivel 4).
  - `att_402_0044_sv`: Acuerdo SLA de API (Firma técnica básica, Nivel 1).

---

### 3. Badges de Estado Principal (Resultado Superior)
Muestran la resolución de la atestación al momento de consultar:

1. **Validez (`Válida / Valid` | `Pendiente / Pending` | `Inválida / Invalid`):**
   - *Válida:* Firma matemática correcta, pago L402 verificado y atestación emitida.
   - *Pendiente:* Requiere revisión y visto bueno de un notario físico.
2. **Nivel de Firma (`Level 0` a `Level 5`):**
   - **Level 0 (Hash Attestation):** Prueba técnica de existencia del archivo.
   - **Level 1 (Agent Signature):** Firma criptográfica generada por la billetera del Agente.
   - **Level 2 (Authorized Representative):** Firma del agente bajo representación o delegación autorizada.
   - **Level 3 (Jurisdiction E-Signature):** Firma electrónica que cumple los estándares legales de El Salvador.
   - **Level 4 (Human Notary Countersignature):** Firma del agente respaldada con la refrenda/sello de un Notario Humano Colegiado.
   - **Level 5 (Public Instrument Workflow):** Tramitación para protocolo o escritura pública formal.
3. **Intervención Humana (`Autónomo / Autonomous` | `Requerido / Required`):**
   - *Autónomo:* El documento fue procesado 100% por código de la IA al no exceder límites de riesgo.
   - *Requerido:* El tipo de documento o sus cláusulas requirieron la intervención obligatoria de un notario físico.

---

### 4. Pestañas de Detalle Notarial

#### 🔒 Pruebas Criptográficas (Proofs)
Ofrece la prueba matemática e inalterable del proceso:
- **Request Hash:** Identificador único del payload generado por el agente.
- **Document Hash (SHA-256):** Huella digital inmutable del documento. Garantiza que no se ha modificado ni un solo carácter.
- **Agent Wallet:** Billetera criptográfica controlada por el agente que firmó.
- **L402 Proof Tx & Macaroon:** Prueba criptográfica del pago en Lightning Network (mSats) que autenticó la llamada al servicio notarial.
- **Timestamp:** Fecha y hora exacta registrada en la transacción.

#### ⚖️ Evaluación Legal QVAC
Resultado del análisis jurídico realizado por **QVAC** (Agente evaluador con LLM local entrenado en leyes de El Salvador):
- **Tipo de Documento:** Clasificación automática del acuerdo (Arrendamiento, SLA, Tokenización, etc.).
- **Banderas de Riesgo:** Detección de cláusulas abusivas, nulas, montos fuera de límite autónomo o falta de representación legal.
- **Checklist de Cumplimiento:** Auditoría punto por punto de requisitos jurídicos esenciales.
- **Disclaimer Asesor:** Recordatorio que especifica que el análisis del LLM es de carácter consultivo y no sustituye la asesoría legal o el acto notarial formal.

#### 📱 Código QR & Deep Linking
- **Generación Dinámica de QR:** Crea un código QR escaneable con la URL directa `?id=att_...`.
- **Descargar PNG:** Permite descargar la imagen del QR para imprimir en documentos físicos o adjuntar a PDFs notariales.
- **Verificación Móvil:** Al escanear el QR desde un dispositivo móvil, carga y verifica automáticamente la atestación.

#### 💬 Escalación Humana (Zavu)
*Se habilita únicamente cuando el documento requiere revisión humana (Level 4/5 o riesgo alto)*:
- **Motivo:** Explicación del porqué el agente no pudo firmar de manera autónoma.
- **Notario Asignado:** Nombre del Notario de Fe Pública responsable en El Salvador.
- **Canal & Estado:** Canal de notificación utilizado (WhatsApp Business API mediante el puente Zavu) y estado actual de la revisión.

---

### 5. Auditoría del Sistema & Timeline

- **⏱️ Timeline Histórico:** Muestra una lista cronológica interactiva con todas las atestaciones consultadas en la sesión.
- **📊 Integraciones en Vivo (`GET /v1/live/status`):** Panel de monitoreo que muestra el estado operativo de los 7 componentes de la arquitectura:
  1. *PostgreSQL* (Base de datos de auditoría)
  2. *DataMCP* (Pasarela MCP de lectura)
  3. *L402 Gateway* (Puerta de pago Lightning)
  4. *QVAC* (Motor LLM Ollama)
  5. *Zavu* (Canal de escalación WhatsApp)
  6. *Aperture* (Proxy L402)
  7. *n8n* (Orquestador de flujos agénticos)
- **🗄️ DataMCP Audit Plan (`GET /v1/integrations/datamcp`):** Muestra el plan de auditoría transparente. Explica cómo la base de datos de auditoría PostgreSQL es expuesta en modo `read-only` para que otros agentes de IA lean y auditen el historial sin poder alterar los registros oficiales.

---

### 6. Pie de Página (Footer) & Marco Legal

Contiene la declaración legal obligatoria requerida por `LEGAL_BOUNDARIES.md`:
> *"Notary402 demonstrates jurisdiction-aware legal workflow automation and cryptographic attestations. When local law requires a licensed notary or human legal professional, the system escalates rather than replacing that role."*

---

## 🚀 Arquitectura Técnica del Frontend

- **Tecnología:** HTML5, Vanilla JavaScript (ES6+), Tailwind CSS (CDN), Lucide Icons, QRCode.js.
- **Internacionalización (i18n):** Motor ligero de traducciones en tiempo real (ES / EN) integrado en el cliente sin librerías pesadas.
- **Modo de Operación:** 100% Client-Side / Standalone SPA.
- **Resiliencia de Red:** 
  - Intenta consultar la API real en `http://localhost:3001`.
  - Si la API no está disponible o devuelve un error 503 (`integration_pending`), conmuta automáticamente y de forma transparente a **Modo Demo**, garantizando que la interfaz sea siempre interactiva para pruebas y presentaciones.
