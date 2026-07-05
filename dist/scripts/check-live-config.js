import { redact } from "./env.js";
const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "DATAMCP_MCP_URL",
    "DATAMCP_API_KEY",
    "AMOY_RPC_URL",
    "APERTURE_BASE_URL",
    "N8N_WEBHOOK_NOTARY402"
];
const missing = required.filter((key) => !process.env[key]);
if (!process.env.ZAVU_ESCALATE_URL && !process.env.ZAVU_BASE_URL)
    missing.push("ZAVU_ESCALATE_URL or ZAVU_BASE_URL");
if (missing.length) {
    console.error("Missing live configuration:");
    for (const key of missing)
        console.error(`- ${key}`);
    process.exit(1);
}
console.log("Live configuration present:");
console.log(`- SUPABASE_URL=${redact(process.env.SUPABASE_URL)}`);
console.log(`- SUPABASE_SCHEMA=${process.env.SUPABASE_SCHEMA || "public"}`);
console.log(`- DATAMCP_MCP_URL=${redact(process.env.DATAMCP_MCP_URL)}`);
console.log(`- AMOY_RPC_URL=${redact(process.env.AMOY_RPC_URL)}`);
console.log(`- APERTURE_BASE_URL=${redact(process.env.APERTURE_BASE_URL)}`);
console.log(`- N8N_WEBHOOK_NOTARY402=${redact(process.env.N8N_WEBHOOK_NOTARY402)}`);
console.log(`- ZAVU_ENDPOINT=${redact(process.env.ZAVU_ESCALATE_URL || process.env.ZAVU_BASE_URL)}`);
