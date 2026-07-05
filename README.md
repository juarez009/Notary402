# Notary402

Notary402 is an agent-first legal attestation MVP. It exposes a Fastify REST API, a verifier web UI, Supabase-backed audit storage, Aperture/L402 receipt registration, Polygon Amoy wallet/tx verification, DataMCP read-only context, Zavu escalation and n8n workflow artifacts.

## Structure

```text
apps/api          Fastify REST API
apps/web          Vite React verifier
apps/mcp          MCP tool contract placeholder
packages/core     Shared domain types and hashing helpers
packages/integrations  Zavu, Amoy and L402 adapters
scripts           Live config and smoke scripts
docs              Supabase schema, Aperture, n8n and OpenAPI artifacts
```

## Local Commands

```bash
npm.cmd run build
npm.cmd test
npm.cmd run typecheck
npm.cmd run build:web
```

Start API after building:

```bash
npm.cmd run start:api
```

Start web:

```bash
npm.cmd run dev:web
```

## Live Configuration

Runtime audit storage uses Supabase JS API through backend-only credentials:

```env
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_SCHEMA=public
```

The frontend must never receive `SUPABASE_SERVICE_ROLE_KEY`. DataMCP remains read-only for agents; Notary402 keeps all audit writes in the backend.

Apply `docs/postgres-audit-schema.sql` in the Supabase SQL Editor before live smoke tests.

## Main API Docs

Use `API_SPEC.md` for frontend maquetado. The API also serves `GET /openapi.json`.
