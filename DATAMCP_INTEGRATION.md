# DataMCP Integration: Notary402

DataMCP is the PostgreSQL audit/context MCP layer for Notary402.

## Role

Notary402 remains the write authority for legal workflow state. DataMCP gives agents and n8n a permission-scoped MCP view into the PostgreSQL audit database.

## Flow

```text
Agent -> Notary402 MCP/API -> legal workflow writes
Notary402 API -> PostgreSQL audit tables
DataMCP -> MCP tools over PostgreSQL
Agent/n8n -> get_schema/query audit state
Verifier -> Notary402 API verification
```

## Recommended Permissions

Use `read-only` for MVP demo links.

Move to custom per-table permissions before exposing legal analysis or human escalation records to external agents.

## DataMCP Tools

- `query`
- `get_schema`
- `get_table_details`
- `get_permissions`
- `get_schema_changes`
- `resync_schema`

## Recommended Tables

- `agent_profiles`
- `legal_intents`
- `signature_requests`
- `wallet_proofs`
- `payment_proofs`
- `legal_analyses`
- `attestations`
- `human_escalations`

The initial SQL schema lives at `docs/postgres-audit-schema.sql`.

Notary402 now supports a `POSTGRES_URL`-backed `PostgresAuditStore`. If `POSTGRES_URL` is absent, tests and local development use the in-memory audit store.

## Environment

```env
DATAMCP_MCP_URL=
DATAMCP_API_KEY=
DATAMCP_PERMISSION_PRESET=read-only
```

## Notary402 API Surface

`GET /v1/integrations/datamcp` returns the local integration plan and configuration status. It must never expose the raw DataMCP API key.

## Notary402 MCP Surface

`notary402_get_datamcp_flow_plan` lets agents discover how DataMCP fits into the current Notary402 workflow.
