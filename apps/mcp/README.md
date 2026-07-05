# Notary402 MCP

Servidor MCP por stdio que expone el flujo de notarización de Notary402 como tools para agentes AI. Cada tool llama a la REST API (`apps/api`), que sigue siendo la fuente de verdad.

## Tools

- `notary402_start_legal_signature_flow` — registra el LegalIntent y devuelve `next_steps` con el plan completo del flujo.
- `notary402_request_legal_signature` — crea la SignatureRequest (`awaiting_payment`).
- `notary402_verify_amoy_wallet` — verifica la firma de la wallet en Polygon Amoy (chain_id 80002).
- `notary402_run_el_salvador_notary_agent` — análisis legal SV (`requires_human_notary`, `risk_flags`).
- `notary402_escalate_to_human_notary` — escala a notario humano vía Zavu/WhatsApp.
- `notary402_get_attestation_status` — consulta la attestation y, opcionalmente, su timeline.
- `notary402_verify_attestation` — verifica la attestation y sus checks.
- `notary402_get_datamcp_flow_plan` — plan read-only de DataMCP.

Los pasos que no tienen tool dedicada (pago L402 `POST /v1/payments/l402/verify` y emisión `POST /v1/attestations`) se hacen directo contra la API; `next_steps` los documenta.

## Compilar y correr

```bash
npm run build       # compila a dist/ (tsc -p tsconfig.json)
npm run start:api   # API en http://localhost:3001 (requisito)
npm run start:mcp   # node dist/apps/mcp/src/server.js (stdio)
```

El server no escribe en stdout (rompería el protocolo MCP); los diagnósticos salen por stderr.

## Configuración

- `NOTARY402_API_URL` — base URL de la REST API. Default: `http://localhost:3001`.

## Configurar en un cliente MCP

Con Claude Code:

```bash
claude mcp add notary402 -e NOTARY402_API_URL=http://localhost:3001 -- node /ruta/al/repo/dist/apps/mcp/src/server.js
```

Con `claude_desktop_config.json` (Claude Desktop):

```json
{
  "mcpServers": {
    "notary402": {
      "command": "node",
      "args": ["/ruta/al/repo/dist/apps/mcp/src/server.js"],
      "env": { "NOTARY402_API_URL": "http://localhost:3001" }
    }
  }
}
```

Recuerda correr `npm run build` antes para que exista `dist/apps/mcp/src/server.js`, y tener la API levantada (`npm run start:api`).
