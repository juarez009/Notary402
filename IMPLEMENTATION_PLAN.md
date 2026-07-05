# IMPLEMENTATION PLAN: Notary402 MVP

## Objective

Build a demo-ready MVP where AI agents invoke a legal signature workflow through MCP/REST, pay through L402 using Aperture + Polar, sign requests with real Polygon Amoy wallets, run legal analysis with QVAC, orchestrate the flow with n8n, and use Zavu for communication/escalation.

## Timebox

Target: 20 hours.

## P0 Scope

- Notary402 REST API.
- MCP tool surface.
- n8n workflow trigger.
- QVAC local legal analysis call.
- Aperture-protected endpoint with Polar Lightning payment.
- Polygon Amoy wallet signature verification.
- Attestation JSON issuance.
- Zavu notification or escalation call.
- DataMCP integration plan endpoint and MCP discovery tool.
- Minimal verifier/dashboard.

## P1 Scope

- Amoy transaction proof verification.
- Smart contract `NotaryPaymentRegistry`.
- PostgreSQL audit store exposed through DataMCP read-only MCP link.
- Zavu AI Agent intake flow.
- QR verification.
- OpenAPI spec export.

## P2 Scope

- Multi-country jurisdiction agents.
- Persistent audit dashboard.
- DataMCP custom per-table permissions and activity log review.
- RAG legal corpus.
- Advanced escrow.
- Full SDKs.

## Build Order

### Phase 1: Project Skeleton

Deliverables:

- Monorepo folders.
- Shared TypeScript types.
- `.env.example`.
- Health endpoints.

Suggested structure:

```text
apps/api
apps/mcp
apps/web
packages/core
packages/integrations
docs
```

Include DataMCP configuration in `.env.example`:

```text
DATAMCP_MCP_URL=
DATAMCP_API_KEY=
DATAMCP_PERMISSION_PRESET=read-only
```

### Phase 2: Core Domain

Implement:

- `AgentProfile`
- `LegalIntent`
- `PaymentProof`
- `WalletProof`
- `LegalAnalysis`
- `Attestation`

Future PostgreSQL audit tables for DataMCP:

- `agent_profiles`
- `legal_intents`
- `signature_requests`
- `wallet_proofs`
- `payment_proofs`
- `legal_analyses`
- `attestations`
- `human_escalations`

Rules:

- Attestation is immutable after `issued`.
- Every request has a `requestHash`.
- Every signature binds to `requestHash`.

### Phase 3: REST API

Implement P0 endpoints:

- `POST /v1/legal-intent`
- `POST /v1/signature/request`
- `POST /v1/signature/validate`
- `POST /v1/attestations`
- `GET /v1/attestations/:id`
- `POST /v1/verify`
- `POST /v1/wallets/verify-signature`
- `POST /v1/zavu/escalate`
- `GET /v1/integrations/datamcp`

### Phase 4: MCP Server

Expose:

- `notary402_start_legal_signature_flow`
- `notary402_request_legal_signature`
- `notary402_verify_amoy_wallet`
- `notary402_run_el_salvador_notary_agent`
- `notary402_escalate_to_human_notary`
- `notary402_verify_attestation`
- `notary402_get_datamcp_flow_plan`

### Phase 5: QVAC Integration

Use QVAC HTTP server as OpenAI-compatible provider:

```text
http://localhost:11434/v1/chat/completions
```

The API should call QVAC for:

- Legal classification.
- Risk score.
- Signature level.
- Human escalation decision.

### Phase 6: Aperture + Polar

Set up:

- Polar local Bitcoin/Lightning network.
- Aperture reverse proxy.
- Protect at least one Notary402 endpoint.
- Demonstrate `402 Payment Required`.
- Demonstrate paid retry.

### Phase 7: Polygon Amoy

Implement:

- Agent wallet registration.
- EVM signature verification.
- Optional tx hash verification.

Minimum viable:

- Agent signs `requestHash`.
- Backend verifies address recovery.

Better demo:

- Agent submits Amoy `txHash`.
- Backend verifies recipient, sender, value and chain id.

### Phase 8: n8n Workflow

Create workflow:

```text
MCP/Webhook Trigger
  -> Verify agent payload
  -> Call protected Notary402 endpoint
  -> Verify Amoy wallet
  -> Call QVAC analysis endpoint
  -> Branch risk
  -> Zavu escalation or notification
  -> Issue attestation
  -> Return result
```

### Phase 9: Zavu

### Phase 8.1: DataMCP Audit Context

Implement:

- DataMCP configuration endpoint in Notary402 API.
- MCP tool that returns the DataMCP flow plan.
- PostgreSQL schema draft for audit tables.
- Read-only DataMCP MCP link configured for agent/n8n inspection.

Rules:

- Notary402 API performs writes.
- DataMCP is read-only for agent clients during MVP.
- Do not include `DATAMCP_API_KEY` in attestations, logs or API responses.
- Use custom per-table permissions before exposing legal analysis or human escalation tables outside local demo.

### Phase 9: Zavu

Implement one visible integration:

- Send receipt notification.
- Or escalate human notary review.

### Phase 10: Demo UI

Build only what helps the demo:

- Workflow status.
- Agent wallets.
- L402/Polar payment proof.
- Amoy wallet proof.
- QVAC legal analysis.
- Final attestation verifier.

## Fallback Strategy

If Aperture/Polar takes too long:

- Keep endpoint shape compatible.
- Show QVAC, n8n, Zavu, Amoy wallet signatures.
- Present Aperture config and local setup as near-complete.

If Amoy tx faucet fails:

- Use real wallet signatures as minimum.
- Include pending tx proof slot in attestation.

If QVAC model fails:

- Keep QVAC server health visible.
- Fallback to OpenAI-compatible provider behind same interface.

If DataMCP/PostgreSQL is not ready:

- Keep the in-memory store for Notary402 API.
- Show `GET /v1/integrations/datamcp` and MCP setup instructions.
- Present the PostgreSQL schema and read-only MCP link as the next integration step.
