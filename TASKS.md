# TASKS: Notary402 MVP

## P0

- [x] Create project skeleton.
- [x] Define shared schemas.
- [x] Implement request hashing.
- [x] Implement `POST /v1/legal-intent`.
- [x] Implement REST API health check.
- [x] Implement `POST /v1/signature/request`.
- [x] Implement `POST /v1/wallets/verify-signature`.
- [x] Implement QVAC client and parser fallback.
- [x] Implement L402 receipt registration.
- [x] Implement Amoy transaction verifier.
- [x] Implement attestation issuance and verification.
- [x] Implement Zavu escalation adapter.
- [x] Implement DataMCP integration plan endpoint.
- [x] Implement Supabase JS API audit store and PostgreSQL-compatible schema.
- [x] Implement Notary402 MCP tools.
- [x] Add n8n workflow export with connected nodes.
- [x] Configure Aperture protected route YAML.
- [x] Build verifier UI.
- [x] Add live status endpoint and CORS for web verifier.
- [x] Add OpenAPI export.
- [x] Add live config, migration and smoke scripts.
- [x] Prepare demo script.

## Live External Validation

- [ ] Fill local `.env.live` with real credentials.
- [ ] Run `npm run check:live-config`.
- [ ] Apply `docs/postgres-audit-schema.sql` in Supabase SQL Editor or run `npm run db:migrate` with optional `POSTGRES_URL`.
- [ ] Run `npm run smoke:supabase`.
- [ ] Run `npm run smoke:datamcp`.
- [ ] Run `npm run smoke:amoy`.
- [ ] Run `npm run smoke:zavu`.
- [ ] Run `npm run smoke:aperture`.
- [ ] Run `npm run smoke:e2e-live`.
- [ ] Import and validate `docs/n8n/notary402-legal-signature-flow.json` in n8n.
- [ ] Run Aperture + Polar with a funded payment path.

## P1

- [ ] Deploy simple Amoy payment registry contract.
- [ ] Add QR code attestation.
- [ ] Add Zavu Function notary escalation if Zavu exposes function runtime.
- [ ] Add dashboard timeline.
- [ ] Add DataMCP custom per-table permission profile.

## P2

- [ ] Add Guatemala jurisdiction agent.
- [ ] Add legal RAG.
- [ ] Add escrow flow.
- [ ] Add TypeScript SDK.
- [ ] Add Python SDK.
- [ ] Add notarization marketplace concept.
