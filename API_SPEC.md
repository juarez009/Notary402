# Documentacion de APIs Notary402

Guia para maquetar frontend contra la API REST de Notary402.

Fuente de verdad: `apps/api/src/app.ts`, `apps/api/src/schemas.ts`, `packages/core/src/types.ts`.

## Convenciones

- Base URL local: `http://localhost:3001`.
- JSON requests con `Content-Type: application/json`.
- Jurisdiccion actual: `SV`.
- Polygon Amoy: `chain_id: 80002`.
- CORS permite `http://localhost:3000` y `http://127.0.0.1:3000`.
- Runtime audit DB: Supabase JS API con `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` en backend.
- DataMCP es solo lectura; Notary402 conserva todas las escrituras.

Error estandar:

```json
{
  "error": "NotFound",
  "message": "Attestation not found",
  "statusCode": 404
}
```

## Flujo Frontend Recomendado

1. Crear intencion legal con `POST /v1/legal-intent`.
2. Crear solicitud de firma con `POST /v1/signature/request`.
3. Pedir firma EIP-191 al wallet y validar con `POST /v1/wallets/verify-signature`.
4. Registrar pago L402 validado por Aperture con `POST /v1/payments/l402/verify`.
5. Opcionalmente validar transaccion Amoy con `POST /v1/payments/amoy/verify`.
6. Ejecutar analisis legal con `POST /v1/signature/validate`.
7. Emitir attestacion con `POST /v1/attestations`.
8. Mostrar/verificar con `GET /v1/attestations/:id` y `POST /v1/verify`.
9. Si requiere humano, escalar con `POST /v1/zavu/escalate`.

## Modelos Clave

```ts
type LegalIntent = {
  legal_intent_id: string;
  agent_id: string;
  jurisdiction: "SV";
  input: string;
  document_type?: string;
  parties: string[];
  obligations: string[];
  risk_flags: string[];
  created_at: string;
};

type SignatureRequest = {
  signature_request_id: string;
  agent_id: string;
  jurisdiction: "SV";
  document_hash: string;
  legal_intent_id?: string;
  requested_signature_level: number;
  request_hash: string;
  status: "awaiting_payment" | "ready_for_analysis" | "issued";
  created_at: string;
};

type VerificationResult = {
  valid: boolean;
  checks: {
    document_hash: boolean;
    agent_wallet: boolean;
    l402_payment: boolean;
    notary_signature: boolean;
  };
};

type LiveStatus = {
  mode: "live";
  supabase: {
    configured: boolean;
    url: string | null;
    schema: string;
  };
  datamcp: {
    configured: boolean;
    mcp_url: string | null;
    permission_preset: string;
  };
  amoy_rpc: {
    configured: boolean;
    chain_id: number;
    url: string | null;
  };
  zavu: {
    configured: boolean;
    endpoint: string | null;
    channel: string;
  };
  aperture: { configured: boolean; base_url: string | null };
  n8n: { configured: boolean; webhook_url: string | null };
};
```

## Endpoints

### `GET /health`

Uso frontend: ping de disponibilidad.

Respuesta `200`:

```json
{ "status": "ok", "service": "notary402-api" }
```

### `GET /openapi.json`

Uso frontend: obtener contrato OpenAPI publicado.

Respuesta `200`: documento OpenAPI 3.0.3.

### `POST /v1/legal-intent`

Uso frontend: registrar intencion legal inicial.

Request:

```json
{
  "agent_id": "hermes-legal-agent",
  "jurisdiction": "SV",
  "input": "Contrato de servicios entre agente comprador y agente vendedor.",
  "document_type": "service_agreement",
  "parties": ["Comprador Agent", "Vendedor Agent"],
  "obligations": ["firmar", "archivar"],
  "risk_flags": ["remote_signature"]
}
```

Respuesta `201`: `LegalIntent`.

### `POST /v1/signature/request`

Uso frontend: crear solicitud de firma.

Request:

```json
{
  "agent_id": "hermes-legal-agent",
  "jurisdiction": "SV",
  "document_hash": "0xabc123",
  "legal_intent_id": "lintent_123",
  "requested_signature_level": 2
}
```

Respuesta `201`: `SignatureRequest`.

Nota frontend: usar `request_hash` para construir `Notary402 request ${request_hash}`.

### `POST /v1/wallets/verify-signature`

Uso frontend: validar control del wallet del agente.

Request:

```json
{
  "agent_id": "hermes-legal-agent",
  "chain_id": 80002,
  "wallet_address": "0x0000000000000000000000000000000000000001",
  "message": "Notary402 request 0x123",
  "signature": "0xabcdef"
}
```

Respuesta `200` si valida; `400` si firma/red no coincide.

### `POST /v1/payments/l402/verify`

Uso frontend: registrar recibo L402 ya validado por Aperture.

Request:

```json
{
  "signature_request_id": "sigreq_123",
  "receipt": "l402 macaroon:preimage",
  "request_hash": "0x123"
}
```

Respuesta `201`: payment proof con `provider: "aperture"` y `network: "polar"`.

### `POST /v1/payments/amoy/verify`

Uso frontend: validar transaccion Polygon Amoy.

Request:

```json
{
  "chain_id": 80002,
  "tx_hash": "0xabc123",
  "expected_sender": "0x0000000000000000000000000000000000000001",
  "expected_recipient": "0x0000000000000000000000000000000000000002"
}
```

Respuesta `200` si valida, `400` si no coincide, `503` con `AMOY_RPC_NOT_CONFIGURED` si falta `AMOY_RPC_URL`.

### `POST /v1/signature/validate`

Uso frontend: ejecutar analisis legal.

Request:

```json
{
  "signature_request_id": "sigreq_123",
  "jurisdiction": "SV",
  "legal_text": "Texto legal del documento."
}
```

Respuesta `200`: analisis con `risk_score`, `requires_human_notary`, `summary`, `checklist`, `risk_flags`.

### `POST /v1/attestations`

Uso frontend: emitir attestacion final.

Request:

```json
{
  "signature_request_id": "sigreq_123",
  "wallet_proof_id": "walletproof_000000000000",
  "payment_proof_id": "pay_l402_123",
  "agent_wallet": "0x0000000000000000000000000000000000000001",
  "amoy_tx_hash": "0xabc123"
}
```

Respuesta `201`: attestation emitida mas `verification_url`.

Errores de negocio: `MissingWalletProof`, `MissingPaymentProof`, `NotFound`.

### `GET /v1/attestations/:id`

Uso frontend: cargar detalle de attestacion.

Respuesta `200`: attestation.

Error `404`: no existe.

### `POST /v1/verify`

Uso frontend: verificar checks basicos de attestacion.

Request:

```json
{ "attestation_id": "att_123" }
```

Respuesta `200`: `VerificationResult`.

### `POST /v1/zavu/escalate`

Uso frontend: escalar a notario humano.

Request:

```json
{
  "signature_request_id": "sigreq_123",
  "jurisdiction": "SV",
  "reason": "La firma remota requiere revision humana.",
  "test": true
}
```

Respuesta `200`: `{ status, channel, zavu_message_id, provider_mode }`.

### `GET /v1/integrations/datamcp`

Uso frontend/admin: mostrar plan DataMCP sin secretos.

Respuesta `200`: configuracion MCP read-only, tablas recomendadas, hooks y tools.

### `GET /v1/live/status`

Uso frontend/admin: panel de integraciones live con secretos redactados.

Respuesta `200`:

```json
{
  "mode": "live",
  "supabase": {
    "configured": true,
    "url": "https://notary402.supabase.co/",
    "schema": "public"
  },
  "datamcp": {
    "configured": true,
    "mcp_url": "https://api.datamcp.app/api/mcp/conn_live?key=***",
    "permission_preset": "read-only"
  },
  "amoy_rpc": {
    "configured": true,
    "chain_id": 80002,
    "url": "https://polygon-amoy.example/rpc/secret"
  },
  "zavu": {
    "configured": true,
    "endpoint": "https://zavu.example/escalate",
    "channel": "whatsapp"
  },
  "aperture": {
    "configured": true,
    "base_url": "http://localhost:8080"
  },
  "n8n": {
    "configured": false,
    "webhook_url": null
  }
}
```

## Componentes Frontend

- Status chip: `GET /health`, `GET /v1/live/status`.
- Wizard legal: `POST /v1/legal-intent`, `POST /v1/signature/request`.
- Wallet step: `POST /v1/wallets/verify-signature`.
- Payment step: `POST /v1/payments/l402/verify`, opcional `POST /v1/payments/amoy/verify`.
- Risk review: `POST /v1/signature/validate`, opcional `POST /v1/zavu/escalate`.
- Attestation result: `POST /v1/attestations`, `GET /v1/attestations/:id`, `POST /v1/verify`.
- Developer/admin panel: `GET /openapi.json`, `GET /v1/integrations/datamcp`, `GET /v1/live/status`.
