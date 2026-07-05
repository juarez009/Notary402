# ENV SETUP: Notary402

## Local Services

```text
Notary402 API: http://localhost:3001
Web UI: http://localhost:3000
QVAC: http://localhost:11434/v1
n8n: http://localhost:5678
Aperture: http://localhost:8080
DataMCP: hosted MCP URL from datamcp.app
Supabase: hosted project URL from supabase.com
```

## Files

- `.env.example` is for local development.
- `.env.live.example` is the live integration contract.
- `.env.live` should stay local and contain real secrets.

## Live Required Variables

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_SCHEMA=public

DATAMCP_MCP_URL=
DATAMCP_API_KEY=
DATAMCP_PERMISSION_PRESET=read-only

AMOY_RPC_URL=
AMOY_CHAIN_ID=80002
AMOY_AGENT_PRIVATE_KEY=

APERTURE_BASE_URL=http://localhost:8080
L402_SMOKE_RECEIPT=

N8N_WEBHOOK_NOTARY402=

ZAVU_ESCALATE_URL=
ZAVU_BASE_URL=
ZAVU_API_KEY=
```

Use either `ZAVU_ESCALATE_URL` or `ZAVU_BASE_URL`.

`POSTGRES_URL` is optional and only used by `npm run db:migrate` when you want the script to apply `docs/postgres-audit-schema.sql` automatically through a Supabase direct or pooler connection string. Runtime writes use Supabase JS API.

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

`check:live-config` and `/v1/live/status` redact secrets, including `SUPABASE_SERVICE_ROLE_KEY`.

## Supabase Requirements

- Create a Supabase project.
- Apply `docs/postgres-audit-schema.sql` in Supabase SQL Editor or with `npm run db:migrate` plus optional `POSTGRES_URL`.
- Store `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only on the backend/server environment.
- Do not expose `SUPABASE_SERVICE_ROLE_KEY` to the frontend.
- RLS can remain enabled; Notary402 writes through the backend using service role credentials.

## DataMCP Requirements

- Connect DataMCP to the same Supabase PostgreSQL database.
- Create a read-only MCP link.
- Configure `DATAMCP_MCP_URL`, `DATAMCP_API_KEY` and `DATAMCP_PERMISSION_PRESET=read-only`.
- Use DataMCP only for schema/query context; Notary402 remains the write path.

## Aperture/Polar Requirements

- Run Notary402 API on `localhost:3001`.
- Run Aperture with `docs/aperture/notary402-aperture.yaml`.
- Use Polar to fund the Lightning payment path.
- Register the validated receipt through `POST /v1/payments/l402/verify`.

## Amoy Requirements

- Use chain id `80002`.
- Keep `AMOY_AGENT_PRIVATE_KEY` only in local `.env.live`.
- Optional `AMOY_SMOKE_TX_HASH` lets `smoke:amoy` verify a specific transaction.
