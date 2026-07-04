export type DataMcpPermissionPreset = "read-only" | "read-write" | "full-access" | "custom";

export interface DataMcpConfig {
  mcpUrl?: string;
  apiKey?: string;
  permissionPreset?: DataMcpPermissionPreset;
}

export interface DataMcpFlowPlan {
  configured: boolean;
  role: "postgres_audit_context_mcp";
  mcp_url: string | null;
  authorization_header: "Bearer ${DATAMCP_API_KEY}";
  permission_preset: DataMcpPermissionPreset;
  recommended_tables: string[];
  flow_hooks: string[];
  agent_tools: string[];
  n8n_usage: string[];
  security_notes: string[];
}

export function readDataMcpConfig(env: NodeJS.ProcessEnv = process.env): DataMcpConfig {
  return {
    mcpUrl: env.DATAMCP_MCP_URL,
    apiKey: env.DATAMCP_API_KEY,
    permissionPreset: parsePermissionPreset(env.DATAMCP_PERMISSION_PRESET),
  };
}

export function createDataMcpFlowPlan(config: DataMcpConfig = readDataMcpConfig()): DataMcpFlowPlan {
  const permissionPreset = config.permissionPreset ?? "read-only";

  return {
    configured: Boolean(config.mcpUrl && config.apiKey),
    role: "postgres_audit_context_mcp",
    mcp_url: config.mcpUrl ?? null,
    authorization_header: "Bearer ${DATAMCP_API_KEY}",
    permission_preset: permissionPreset,
    recommended_tables: [
      "agent_profiles",
      "signature_requests",
      "wallet_proofs",
      "payment_proofs",
      "legal_analyses",
      "attestations",
      "human_escalations",
    ],
    flow_hooks: [
      "legal_intent_created",
      "signature_request_created",
      "wallet_verified",
      "l402_payment_verified",
      "legal_analysis_completed",
      "attestation_issued",
      "human_escalation_requested",
    ],
    agent_tools: [
      "get_schema",
      "get_table_details",
      "get_permissions",
      "query",
      "get_schema_changes",
    ],
    n8n_usage: [
      "Add the DataMCP streamable HTTP MCP link as a second MCP server next to Notary402.",
      "Use read-only query access during demos to inspect audit state after each workflow step.",
      "Keep Notary402 API responsible for writes; let DataMCP provide schema-aware reads and activity logs.",
    ],
    security_notes: [
      "Use a read-only MCP link for agent clients by default.",
      "Keep DATAMCP_API_KEY in local environment or MCP client config, never in attestation payloads.",
      "Use custom per-table permissions before exposing legal analyses or human escalation data to external agents.",
    ],
  };
}

function parsePermissionPreset(value: string | undefined): DataMcpPermissionPreset | undefined {
  if (
    value === "read-only" ||
    value === "read-write" ||
    value === "full-access" ||
    value === "custom"
  ) {
    return value;
  }
  return undefined;
}
