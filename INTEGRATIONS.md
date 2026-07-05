# INTEGRATIONS: Notary402

## QVAC

Role:

- Local private AI engine.
- OpenAI-compatible API.

Endpoint:

```text
http://localhost:11434/v1/chat/completions
```

Used by:

- `ElSalvadorNotaryAgent`

Minimum call:

```json
{
  "model": "notary-llm",
  "messages": [
    {
      "role": "system",
      "content": "You are ElSalvadorNotaryAgent..."
    },
    {
      "role": "user",
      "content": "Analyze this legal intent..."
    }
  ],
  "response_format": {
    "type": "json_object"
  }
}
```

## Aperture + Polar

Role:

- L402 paid API access.
- Lightning payment through local Polar network.

Protect:

```text
/v1/signature/request
/v1/attestations
/v1/notarize
```

Demo proof:

- HTTP 402 challenge.
- Lightning invoice paid.
- Authorized retry succeeds.

## Polygon Amoy

Role:

- Real agent wallets.
- EVM signatures.
- Optional on-chain tx proof.

Required checks:

- `chainId == 80002`.
- Recovered signer matches registered agent wallet.
- Optional tx sender/recipient/value validation.

## n8n

Role:

- Workflow orchestrator.
- MCP bridge.
- Visual demo surface.

Primary workflow:

```text
notary402-legal-signature-flow
```

Nodes:

- MCP/Webhook Trigger.
- HTTP Request to Notary402.
- HTTP Request to Aperture protected endpoint.
- HTTP Request to QVAC.
- HTTP Request to Zavu.
- IF legal risk.
- Return response.

## Zavu

Role:

- Multichannel notification.
- Human notary escalation.
- Legal intake AI agent.
- Serverless functions/tools.

MVP integration:

- Send notification after attestation.
- Escalate high-risk request to human notary.

## DataMCP

Role:

- Supabase PostgreSQL audit/context MCP gateway.
- Schema-aware read access for agents and n8n.
- Activity logs for SQL queries made through MCP.

Endpoint:

```text
https://api.datamcp.app/api/mcp/conn_xxx?key=xxx
```

Authentication:

```text
Authorization: Bearer ${DATAMCP_API_KEY}
```

Recommended permission:

```text
read-only
```

Use DataMCP for:

- Inspecting `signature_requests`.
- Inspecting `wallet_proofs`.
- Inspecting `payment_proofs`.
- Inspecting `legal_analyses`.
- Inspecting `attestations`.
- Reviewing schema changes before demo.

Do not use DataMCP for:

- Issuing attestations.
- Verifying signatures.
- Mutating legal workflow state during MVP.
- Exposing raw legal analysis or human escalation tables to external agents without custom table permissions.

MCP tools expected from DataMCP:

```text
query
get_schema
get_table_details
get_permissions
get_schema_changes
resync_schema
```

Flow:

```text
Notary402 API writes audit state to Supabase PostgreSQL
DataMCP exposes Supabase PostgreSQL through MCP
n8n/agents query DataMCP read-only after each workflow step
Verifier still calls Notary402 API for final validation
```

## MCP

Role:

- Agent-native interface.

Clients:

- Claude Code.
- Codex.
- OpenCode where supported.

Expose tools through:

- Notary402 MCP server, or
- n8n MCP server.
- DataMCP MCP link for Supabase PostgreSQL audit context.

## OpenClaw / Hermes / OpenCode

Role:

- Real agent callers, not simulated UI actors.

Integration strategy:

- Prefer MCP if available.
- Use REST client/tool if MCP setup is slower.
- Each must submit real payloads to Notary402 or n8n.
