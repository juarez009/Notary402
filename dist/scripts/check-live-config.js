import { redact } from "./env.js";
const coreRequired = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "APERTURE_BASE_URL",
    "LND_AGENT_GRPC_HOST",
    "LND_AGENT_MACAROON",
    "LND_AGENT_TLS_CERT"
];
const missing = coreRequired.filter((key) => !process.env[key]);
if (missing.length) {
    console.error("Missing core live configuration:");
    for (const key of missing)
        console.error(`- ${key}`);
    process.exit(1);
}
const integrations = {
    datamcp: Boolean(process.env.DATAMCP_MCP_URL && process.env.DATAMCP_API_KEY),
    amoy_rpc: Boolean(process.env.AMOY_RPC_URL),
    zavu: Boolean(process.env.ZAVU_ESCALATE_URL || process.env.ZAVU_BASE_URL),
    n8n: Boolean(process.env.N8N_WEBHOOK_NOTARY402 || (process.env.N8N_BASE_URL && process.env.N8N_API_KEY) || process.env.N8N_MCP_URL)
};
console.log("Core live configuration present:");
console.log(`- SUPABASE_URL=${redact(process.env.SUPABASE_URL)}`);
console.log(`- SUPABASE_SCHEMA=${process.env.SUPABASE_SCHEMA || "public"}`);
console.log(`- APERTURE_BASE_URL=${redact(process.env.APERTURE_BASE_URL)}`);
console.log(`- POLAR_NETWORK_NAME=${process.env.POLAR_NETWORK_NAME || "unknown"}`);
console.log(`- LND_AGENT_GRPC_HOST=${redact(process.env.LND_AGENT_GRPC_HOST)}`);
console.log(`- LND_AGENT_MACAROON=${redact(process.env.LND_AGENT_MACAROON)}`);
console.log(`- LND_AGENT_TLS_CERT=${redact(process.env.LND_AGENT_TLS_CERT)}`);
console.log("Optional integration status:");
console.log(`- DATAMCP=${integrations.datamcp ? "configured" : "pending"} ${redact(process.env.DATAMCP_MCP_URL) || ""}`);
console.log(`- AMOY_RPC=${integrations.amoy_rpc ? "configured" : "pending"} ${redact(process.env.AMOY_RPC_URL) || ""}`);
console.log(`- N8N=${integrations.n8n ? "configured" : "pending"} ${redact(process.env.N8N_WEBHOOK_NOTARY402 || process.env.N8N_BASE_URL || process.env.N8N_MCP_URL) || ""}`);
console.log(`- ZAVU=${integrations.zavu ? "configured" : "pending"} ${redact(process.env.ZAVU_ESCALATE_URL || process.env.ZAVU_BASE_URL) || ""}`);
