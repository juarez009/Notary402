# PRD: Notary402

## 1. Resumen

Notary402 es una infraestructura Web3 + full agentic AI para firma legal, notarizacion asistida y attestations verificables entre agentes autonomos. El producto no esta pensado como una app Web2 para humanos, sino como una capa de confianza legal consumida por agentes IA mediante MCP y REST.

El MVP inicia con El Salvador como primera jurisdiccion. Cada agente puede solicitar una firma legal o attestation, pagar por acceso usando L402 a traves de Lightning Labs Aperture con nodos locales en Polar Bitcoin, firmar o registrar pruebas usando wallets reales en Polygon Amoy, y recibir una attestation verificable generada por un agente notarial especializado en legislacion salvadorena.

## 2. Problema

La economia agentic necesita una capa legal y verificable para que agentes autonomos puedan:

- Solicitar servicios legales sin interfaces humanas tradicionales.
- Pagar APIs y servicios de confianza de forma machine-to-machine.
- Firmar solicitudes con wallets reales.
- Probar integridad de documentos, acuerdos, eventos y entregables.
- Escalar a notarios humanos cuando la legislacion lo requiera.
- Operar en jurisdicciones especificas de America Latina.

Hoy la mayoria de soluciones legaltech siguen siendo Web2: formularios, dashboards y flujos manuales para humanos. Notary402 propone una infraestructura nativa para agentes.

## 3. Objetivo Del MVP

Demostrar que un agente IA puede:

1. Invocar un flujo legal mediante MCP o REST.
2. Pagar acceso a una API protegida por L402 usando Aperture y Polar Bitcoin.
3. Firmar una solicitud con una wallet real en Polygon Amoy.
4. Ejecutar analisis legal local con QVAC.
5. Orquestar el flujo con n8n.
6. Usar Zavu para comunicacion, notificaciones y escalamiento humano.
7. Recibir una Legal Signature Attestation verificable.

## 4. No Objetivos Del MVP

- No reemplazar legalmente a un notario humano.
- No emitir instrumentos publicos finales sin validacion humana cuando la ley lo exija.
- No soportar todos los paises de LATAM en la primera version.
- No construir una app Web2 tradicional para usuarios finales.
- No usar pagos simulados como capa principal.
- No integrar todos los frameworks agentic del mercado; solo los priorizados para demo.

## 5. Usuarios Y Actores

### Agentes IA Soportados En MVP

- Claude Code via MCP.
- Codex via MCP.
- OpenCode via MCP o REST.
- OpenClaw via REST/MCP adapter.
- Hermes como agente de legal intent.
- OpenAI como agente cloud opcional.
- QVAC como agente local privado.

### Actores Del Sistema

- `RequestingAgent`: agente que solicita firma o notarizacion.
- `PaymentAgent`: agente que paga L402/Lightning o ejecuta wallet tx.
- `HermesLegalIntentAgent`: convierte texto/acuerdo en legal intent estructurado.
- `ElSalvadorNotaryAgent`: evalua requisitos legales de El Salvador.
- `QVACLocalAgent`: ejecuta analisis privado local.
- `SigningAgent`: firma hash/documento/evento.
- `VerifierAgent`: verifica attestations.
- `HumanNotary`: notario humano cuando hay escalamiento.

## 6. Propuesta De Valor

Notary402 convierte firma legal y notarizacion asistida en una API pagable, verificable y componible por agentes autonomos.

Mensaje central:

> Notary402 is a Web3 + full agentic AI legal trust layer where AI agents use MCP/REST, pay with L402 through Aperture and Polar, sign with real Polygon Amoy wallets, and request jurisdiction-aware legal signatures through specialized Notary Agents, starting with El Salvador.

## 7. Stack Del MVP

### Core

- Backend: Node.js + TypeScript + Fastify.
- MCP Server: TypeScript MCP server.
- API: REST/OpenAPI.
- Storage P0: in-memory/JSON file store para hackathon.
- Storage P1: PostgreSQL audit database expuesto a agentes mediante DataMCP.
- Crypto: Ed25519 y/o EVM signatures.
- Dashboard demo: Vite React o Next.js minimal.

### AI

- QVAC SDK via HTTP server OpenAI-compatible.
- Endpoint local: `http://localhost:11434/v1`.
- Modelo planeado: `QWEN3_600M_INST_Q4` como `notary-llm`.
- Embeddings opcionales: `GTE_LARGE_FP16`.

### Payments Y Wallets

- Lightning Labs Aperture como L402 reverse proxy.
- Polar Bitcoin para red local Bitcoin/Lightning.
- LND nodes dentro de Polar.
- Polygon Amoy testnet para wallets EVM reales.
- `viem` o `ethers` para firmas y verificacion.

### Hackathon Tools

- Zavu: comunicacion multicanal, AI agents, functions y human escalation.
- n8n: orquestacion visual, MCP bridge y workflow automation.
- DataMCP: MCP gateway read-only para exponer PostgreSQL audit/context a agentes.

## 8. Arquitectura General

```text
Claude Code / Codex / OpenCode / OpenClaw / Hermes / OpenAI
        |
        | MCP / REST
        v
n8n MCP Server + Workflow Orchestrator
        |
        |-- Zavu: messaging, AI agent, human escalation
        |-- Aperture + Polar: L402 paid API access
        |-- Polygon Amoy: wallet signature, tx proof, registry
        |-- Notary402 API: attestations, verifier, signature package
        |-- QVAC: local ElSalvadorNotaryAgent analysis
        |-- DataMCP: PostgreSQL schema/query context for audit state
        v
Legal Signature Attestation
```

## 9. Doble Riel De Pago Y Confianza

### Riel 1: L402 + Aperture + Polar Bitcoin

Funcion: paid API access machine-to-machine.

Flujo:

```text
Agent -> protected endpoint
Aperture -> HTTP 402 L402 challenge
Agent -> paga invoice Lightning en Polar
Aperture -> valida pago/macaron
Agent -> reintenta request con L402 token
Notary402 -> procesa solicitud
```

Uso en MVP:

- Proteger endpoints criticos: `/v1/signature/request`, `/v1/notarize`, `/v1/attestations`.
- Mostrar que el acceso al servicio depende de pago Lightning real en red local Polar.

### Riel 2: Polygon Amoy

Funcion: identidad Web3, firma, proof y registro.

Flujo:

```text
Agent -> firma requestHash con wallet Amoy
Agent -> envia tx opcional a contrato o treasury
Notary402 -> verifica address, signature y txHash
Attestation -> incluye wallet y proof
```

Uso en MVP:

- Wallet real por agente.
- Firma EVM de `requestHash`.
- Verificacion on-chain de `txHash` cuando aplique.
- Posible contrato simple `NotaryPaymentRegistry` si hay tiempo.

## 10. Rol De QVAC

QVAC es el motor AI local y privado para el `ElSalvadorNotaryAgent`.

Uso:

- Analizar legal intent.
- Clasificar tipo de documento/evento.
- Detectar nivel de firma requerido.
- Generar checklist legal.
- Evaluar si requiere escalamiento humano.
- Producir risk score y razonamiento estructurado.

Configuracion planeada:

```json
{
  "serve": {
    "models": {
      "notary-llm": {
        "model": "QWEN3_600M_INST_Q4",
        "default": true,
        "preload": true,
        "config": {
          "ctx_size": 8192,
          "tools": true
        }
      },
      "notary-embed": {
        "model": "GTE_LARGE_FP16",
        "default": true
      }
    }
  }
}
```

## 11. Rol De Zavu

Zavu se usa como capa de comunicacion, AI messaging y escalamiento humano/legal.

Funciones:

- Enviar notificaciones por WhatsApp, SMS, Telegram, Email o Voice.
- Notificar al notario humano cuando el caso requiere revision.
- Enviar recibos de attestation.
- Recibir mensajes entrantes de humanos o agentes.
- Ejecutar Zavu Functions como tools serverless.
- Mantener un Legal Intake Agent para recopilar datos faltantes.

Flujo:

```text
Notary402 detects human escalation
  -> n8n calls Zavu
  -> Zavu notifies HumanNotary
  -> HumanNotary responds
  -> Zavu webhook updates Notary402 status
```

## 12. Rol De n8n

n8n es el centro operativo visible del MVP.

Funciones:

- Orquestar todo el flujo agentic.
- Exponer MCP server para Claude Code y Codex.
- Crear Webhook/API trigger para agentes REST.
- Conectar Notary402, Aperture, Polygon Amoy, QVAC y Zavu.
- Mostrar el workflow ejecutandose visualmente durante la demo.

Workflow principal: `notary402-legal-signature-flow`.

Pasos:

```text
1. MCP Tool Trigger / Webhook
2. Verify agent capability
3. Request L402 challenge through Aperture
4. Wait for payment
5. Verify Amoy wallet signature / txHash
6. Call QVAC legal analysis
7. Branch by legal risk
8. Escalate via Zavu if needed
9. Issue attestation
10. Notify result
11. Return response to agent
```

## 13. Agent Notarial Por Jurisdiccion

El MVP implementa:

```text
ElSalvadorNotaryAgent
```

Responsabilidades:

- Evaluar documento/evento bajo reglas de El Salvador.
- Identificar tipo de firma requerida.
- Distinguir entre attestation tecnica, firma agentic, firma electronica y escalamiento humano.
- Generar `legal_risk_score`.
- Recomendar `signature_level`.
- Emitir explicacion estructurada.

Niveles de firma:

```text
Level 0: Hash Attestation
Level 1: Agent Signature
Level 2: Authorized Representative Signature
Level 3: Jurisdiction-Compliant E-Signature
Level 4: Human Notary Countersignature
Level 5: Public Instrument Workflow
```

## 14. APIs Del MVP

### REST

```text
POST /v1/legal-intent
POST /v1/signature/request
POST /v1/signature/package
POST /v1/signature/validate
POST /v1/signature/execute
POST /v1/attestations
GET  /v1/attestations/:id
POST /v1/verify
POST /v1/payments/amoy/verify
POST /v1/wallets/register
POST /v1/zavu/escalate
```

### MCP Tools

```text
notary402_start_legal_signature_flow
notary402_request_legal_signature
notary402_verify_agent_payment
notary402_verify_amoy_wallet
notary402_run_el_salvador_notary_agent
notary402_escalate_to_human_notary
notary402_get_attestation_status
notary402_verify_attestation
```

## 15. Attestation Schema

```json
{
  "attestation_id": "att_001",
  "request_hash": "0x...",
  "document_hash": "0x...",
  "jurisdiction": "SV",
  "notary_agent": "ElSalvadorNotaryAgent",
  "requesting_agent": {
    "agent_id": "claude-code-agent-001",
    "runtime": "claude_code",
    "amoy_wallet": "0x..."
  },
  "payments": {
    "l402": {
      "provider": "aperture",
      "network": "polar",
      "receipt": "..."
    },
    "amoy": {
      "chain_id": 80002,
      "tx_hash": "0x..."
    }
  },
  "signature": {
    "signature_level": 2,
    "agent_signature": "0x...",
    "signature_scheme": "EIP-191"
  },
  "legal_analysis": {
    "risk_score": 0.22,
    "requires_human_notary": false,
    "summary": "Document is eligible for agentic attestation with representative authorization."
  },
  "status": "issued",
  "created_at": "2026-07-04T00:00:00Z"
}
```

## 16. Demo Script

1. Claude Code o Codex llama una tool MCP expuesta por n8n.
2. n8n inicia `notary402-legal-signature-flow`.
3. Aperture protege endpoint y exige L402.
4. Agent paga invoice Lightning usando Polar.
5. Agent firma `requestHash` con wallet Polygon Amoy.
6. n8n verifica wallet/tx.
7. n8n llama QVAC para ejecutar `ElSalvadorNotaryAgent`.
8. Si no requiere humano, Notary402 emite attestation.
9. Si requiere humano, Zavu envia mensaje al notario.
10. Verifier muestra:
    - L402 proof.
    - Polar payment.
    - Amoy wallet/tx.
    - QVAC legal analysis.
    - Zavu notification status.
    - Legal Signature Attestation.

## 17. Criterios De Exito

El MVP es exitoso si:

- Un agente invoca el flujo por MCP.
- Aperture devuelve y valida un challenge L402 real.
- Polar procesa el pago Lightning local.
- Una wallet real de Polygon Amoy firma la solicitud.
- Notary402 verifica la firma EVM.
- QVAC genera analisis legal estructurado.
- n8n muestra el workflow completo.
- Zavu envia una notificacion o registra escalamiento.
- Se emite una attestation JSON verificable.

## 18. Riesgos

- Integracion Aperture/Polar puede consumir tiempo.
- QVAC puede requerir configuracion de drivers/modelos.
- Zavu puede depender de credenciales/API keys.
- n8n MCP puede requerir URL publica o configuracion HTTPS.
- Amoy faucet puede tener disponibilidad limitada.
- La parte legal debe presentarse como asistencia y workflow, no como sustitucion de notario.

## 19. Mitigaciones

- Mantener REST directo ademas de MCP.
- Tener Amoy firma off-chain como minimo aunque el tx falle.
- Preparar un caso donde no se requiera notario humano.
- Preparar un caso alterno donde Zavu muestra escalamiento.
- Usar QVAC con modelo pequeno primero.
- Mantener el contrato Amoy opcional y usar EOA-to-EOA si no hay tiempo.

## 20. Roadmap Post-MVP

- Agregar Guatemala, Mexico, Colombia y Argentina como jurisdicciones.
- Crear marketplace de notarios humanos.
- Implementar contrato `NotaryPaymentRegistry`.
- Agregar verifiable credentials para agentes.
- Integrar Bitcoin Spark si el SDK/API esta disponible.
- Expandir a escrow agentic buyer/seller/notary.
- Crear SDK TypeScript/Python.
- Agregar RAG legal por pais.
- Agregar dashboard de auditoria.
