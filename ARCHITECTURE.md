# ARCHITECTURE: Notary402

## System Overview

Notary402 is an agent-first legal trust layer. Agents call MCP or REST tools, pay for access, sign requests, and receive jurisdiction-aware legal attestations.

```text
Agent Clients
  Claude Code | Codex | OpenCode | OpenClaw | Hermes | OpenAI
        |
        | MCP / REST
        v
n8n Workflow Orchestrator
        |
        |-- Aperture + Polar: L402 paid access
        |-- Polygon Amoy: wallet signature and tx proofs
        |-- QVAC: local AI legal analysis
        |-- Zavu: multichannel notification and escalation
        |-- DataMCP: PostgreSQL audit/context MCP gateway
        |-- Notary402 API: core records and attestations
        v
Verifier / Dashboard
```

## Services

### Notary402 API

Responsibilities:

- Request hashing.
- Signature package generation.
- Wallet verification.
- Legal analysis orchestration.
- Attestation issuance.
- Verification endpoints.

### Notary402 MCP Server

Responsibilities:

- Expose Notary402 capabilities to agents.
- Support Claude Code, Codex and other MCP clients.
- Forward workflow requests to n8n or REST API.

### n8n

Responsibilities:

- Visual orchestration.
- MCP bridge.
- Webhook intake.
- Integration flow across Aperture, Amoy, QVAC, Zavu and Notary402.

### Aperture

Responsibilities:

- HTTP 402 gateway.
- L402 authentication and payment enforcement.
- Protect paid API endpoints.

### Polar Bitcoin

Responsibilities:

- Local Bitcoin/Lightning test network.
- LND nodes for agent and service payments.
- Demo-safe Lightning environment.

### Polygon Amoy

Responsibilities:

- Real EVM wallets for agents.
- Wallet signatures.
- Optional payment/proof tx.
- Optional registry contract.

### QVAC

Responsibilities:

- Local OpenAI-compatible AI provider.
- Legal risk analysis.
- Jurisdiction-aware reasoning.

### Zavu

Responsibilities:

- WhatsApp/SMS/Email/Telegram/Voice notifications.
- Human notary escalation.
- Zavu Functions for serverless tools.
- AI messaging agent for legal intake.

### DataMCP

Responsibilities:

- Expose PostgreSQL audit tables to agents through MCP.
- Provide schema-aware read access using `get_schema`, `get_table_details`, `query`, `get_permissions` and `get_schema_changes`.
- Keep agent database permissions scoped, preferably read-only in MVP.
- Provide activity logs for database queries made by agents and tools.

DataMCP is not the source of domain writes. Notary402 API remains responsible for creating requests, validating signatures, issuing attestations and enforcing legal workflow rules.

## Data Flow

```text
1. Agent calls MCP tool.
2. n8n receives workflow trigger.
3. Aperture enforces L402 payment.
4. Agent pays via Polar Lightning.
5. Agent signs requestHash with Amoy wallet.
6. Notary402 verifies wallet proof.
7. QVAC runs ElSalvadorNotaryAgent.
8. n8n branches by risk.
9. Zavu notifies or escalates.
10. Notary402 issues attestation.
11. Notary402 persists audit state to PostgreSQL.
12. DataMCP exposes audit state to agents/n8n through read-only MCP.
13. Verifier validates attestation.
```

## Trust Boundaries

- Aperture proves paid API access.
- Polar proves Lightning payment in local network.
- Amoy proves agent wallet control.
- QVAC produces AI analysis, not legal finality.
- Notary402 signs attestations.
- DataMCP exposes database context under explicit MCP link permissions.
- Human notary escalation handles legally sensitive cases.

## Suggested Ports

```text
Notary402 API:      3001
Notary402 MCP:      3002
Web dashboard:      3000
QVAC OpenAI API:    11434
n8n:                5678
Aperture:           8080
DataMCP:            hosted MCP URL
```
