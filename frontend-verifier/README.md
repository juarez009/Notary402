# 📘 Notary402 — Manual de Funcionamiento del Verificador y Consola Agéntica

> **Notary402 El Salvador** | Protocolo Notarial Agéntico Web3 & Bitcoin Native (L402)
> Documentación de la Consola Notarial completa y Verificador de Atestaciones (v0.6.0).

---

## 📌 Visión General

La **Consola Notarial Agéntica Notary402** (`frontend-verifier/index.html`) es la interfaz integral client-side encargada de simular, ejecutar y verificar el ciclo de vida notarial completo para **Agentes de Inteligencia Artificial** bajo los 14 endpoints especificados en `API_SPEC.md`.

---

## 🛠️ Módulos de la Consola y Cobertura de Endpoints (`API_SPEC.md`)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ ⚡ NOTARY402 OPERATIONS CONSOLE                                     [ EN | ES ] [ Status ] │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ [ 🔍 1. Verificador ]  [ 📝 2. Intención ]  [ ⚡ 3. Pruebas y Pagos ]  [ 📊 4. Auditoría/Live ]│
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### Módulo 1: Verificador Público (Public Verifier)
Permite auditar atestaciones emitidas e inmutables.
- **`POST /v1/verify`**: Verificación pública de validez y pruebas por `attestation_id`.
- **`GET /v1/attestations/:id`**: Consulta de la estructura JSON de atestación.
- **Visualización:** Badges de validez, nivel de firma (0-5), intervención humana, resumen criptográfico (request/doc hash, wallet, L402 macaroon), checklist QVAC El Salvador, generador de QR descargable y ficha de escalación Zavu.

---

### Módulo 2: Registro e Intención Legal (Intent & Registration)
Simulador para la creación de intenciones y evaluación por IA:
- **`POST /v1/legal-intent`**: Registro de intención notarial y perfil del agente (`agent_id`, `jurisdiction: SV`, `input`, `document_type`, `parties`, `obligations`). Retorna `legal_intent_id`.
- **`POST /v1/signature/request`**: Solicitud formal de firma notarial (`agent_id`, `document_hash`, `legal_intent_id`, `requested_signature_level`). Retorna `signature_request_id`.
- **`POST /v1/signature/validate`**: Análisis jurídico por el modelo QVAC (Ollama/LLM) sobre las leyes de El Salvador (Art. 15-22).

---

### Módulo 3: Pruebas y Pagos (Proofs & Payments)
Validación de seguridad criptográfica y liquidación Lightning:
- **`POST /v1/wallets/verify-signature`**: Verificación de billetera y firma EIP-191 (`chain_id: 80002`). Retorna `wallet_proof_id`.
- **`POST /v1/payments/l402/verify`**: Comprobante de pago Lightning L402 (`macaroon:preimage`). Retorna `payment_proof_id`.
- **`POST /v1/payments/amoy/verify`**: Verificación de transacción Polygon Amoy vía RPC. Incluye captura transparente de error HTTP `503 AMOY_RPC_NOT_CONFIGURED`.
- **`POST /v1/attestations`**: Emisión oficial de la Atestación Notarial tras validar el conjunto de pruebas.

---

### Módulo 4: Auditoría y Live Status (Audit & Live)
Monitoreo de infraestructura y canales de escalación:
- **`GET /v1/live/status`**: Grid interactivo en vivo de los 7 componentes de la arquitectura (*PostgreSQL, DataMCP, L402 Gateway, QVAC, Zavu, Aperture, n8n*).
- **`GET /v1/integrations/datamcp`**: Explorador del esquema de auditoría PostgreSQL en modo `read-only` expuesto vía MCP.
- **`POST /v1/zavu/escalate`**: Simulación de alerta de escalación a Notario Humano mediante WhatsApp Business API (`test: true`).

---

## ⚡ Ejecución E2E Automática (Botonera Demo)

La consola incluye un botón **"Ejecutar Flujo E2E Completo"** en la barra superior que encadena automáticamente la secuencia completa:
1. Registra Intención Legal ➔ 2. Crea Solicitud ➔ 3. Evalúa con QVAC ➔ 4. Valida Billetera EIP-191 ➔ 5. Registra Pago L402 ➔ 6. Emite Atestación ➔ 7. Muestra resultado en el Verificador.

---

## 🎨 Especificaciones UI/UX Pro Max Aplicadas

- **Estilo:** *Accessible & Ethical / Dark Mode Web3* (`#020617` Space Dark).
- **Tipografía:** `Space Grotesk` (Headings) + `Inter` (Body) + `JetBrains Mono` (Data/Code).
- **Iconografía:** Iconos vectoriales de Lucide (cumpliendo la regla *No emojis como iconos*).
- **Internacionalización:** Conmutador bilingüe en tiempo real (`[ EN / ES ]`).
