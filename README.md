# Notary402

Notary402 is an agent-first legal trust layer for El Salvador MVP workflows. It lets autonomous agents create legal intents, request signatures, prove wallet control on Polygon Amoy, register L402 receipts validated by Aperture/Polar, run legal analysis, issue attestations, and escalate to a human notary through Zavu when needed.

## Architecture

```text
Agents / n8n / MCP
  -> Notary402 REST API
  -> Supabase audit tables through backend service role
  -> DataMCP read-only schema/query context
  -> Aperture/Polar L402 payment boundary
  -> Polygon Amoy wallet and tx proof
  -> QVAC/OpenAI-compatible legal analysis
  -> Zavu human notary escalation
  -> Web verifier
```

Supabase is the runtime audit database. The backend writes with `SUPABASE_SERVICE_ROLE_KEY`; the frontend never receives that key. DataMCP remains read-only.

## Install

```bash
npm install
```

## Local Development

```bash
npm run dev:api
npm run dev:web
npm run dev:mcp
```

Default local URLs:

- API: `http://localhost:3001`
- Web verifier: `http://localhost:3000`
- MCP server: stdio-style `apps/mcp/src/index.ts`

## Environment

Copy `.env.example` to `.env.live` and fill live credentials.

Required live database variables:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_SCHEMA=public
```

Optional migration-only variable:

```env
POSTGRES_URL=postgres://...
```

`POSTGRES_URL` is not used by runtime. It is only for `npm run db:migrate` if you want to apply `docs/postgres-audit-schema.sql` automatically. Otherwise apply the SQL in Supabase SQL Editor or Supabase CLI.

See `ENV_SETUP.md` for the full live contract.

## Live Checks

```bash
npm run check:live-config
npm run smoke:supabase
npm run smoke:datamcp
npm run smoke:amoy
npm run smoke:zavu
npm run smoke:aperture
npm run smoke:e2e-live
```

`check:live-config` and `GET /v1/live/status` redact secrets.

## Core API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | API health |
| `GET` | `/v1/live/status` | Redacted live integration status |
| `POST` | `/v1/legal-intent` | Create legal intent |
| `POST` | `/v1/signature/request` | Create signature request |
| `POST` | `/v1/wallets/verify-signature` | Verify EIP-191 wallet proof |
| `POST` | `/v1/payments/l402/verify` | Register Aperture L402 receipt |
| `POST` | `/v1/payments/amoy/verify` | Verify Polygon Amoy tx proof |
| `POST` | `/v1/signature/validate` | Run legal analysis |
| `POST` | `/v1/attestations` | Issue attestation |
| `GET` | `/v1/attestations/:id` | Fetch attestation |
| `POST` | `/v1/verify` | Verify attestation checks |
| `POST` | `/v1/zavu/escalate` | Escalate to human notary |
| `GET` | `/v1/integrations/datamcp` | Show DataMCP read-only plan |
| `GET` | `/openapi.json` | OpenAPI contract |

Frontend-focused API docs are in `API_SPEC.md`.

## Verification

```bash
npm test
npm run typecheck
npm run build:web
```

## Legal Boundary

Notary402 is an MVP workflow for legal trust automation. It does not replace human notaries where local law requires a licensed professional; those cases should escalate through Zavu or another human review channel.
