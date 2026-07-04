import { loadEnvFiles, redact } from "./live-env.ts";

const env = loadEnvFiles();
const required = [
  "POSTGRES_URL",
  "DATAMCP_MCP_URL",
  "DATAMCP_API_KEY",
  "AMOY_RPC_URL",
  "APERTURE_BASE_URL",
  "N8N_WEBHOOK_NOTARY402",
];

const hasZavu = Boolean(env.ZAVU_ESCALATE_URL || env.ZAVU_BASE_URL);
const missing = required.filter((key) => !env[key]);
if (!hasZavu) {
  missing.push("ZAVU_ESCALATE_URL or ZAVU_BASE_URL");
}

if (missing.length > 0) {
  console.error(`Missing live configuration: ${missing.join(", ")}`);
  process.exit(1);
}

const summary = {
  POSTGRES_URL: redact(env.POSTGRES_URL),
  DATAMCP_MCP_URL: redact(env.DATAMCP_MCP_URL),
  DATAMCP_API_KEY: redact(env.DATAMCP_API_KEY),
  AMOY_RPC_URL: redact(env.AMOY_RPC_URL),
  APERTURE_BASE_URL: redact(env.APERTURE_BASE_URL),
  N8N_WEBHOOK_NOTARY402: redact(env.N8N_WEBHOOK_NOTARY402),
  ZAVU_ENDPOINT: redact(env.ZAVU_ESCALATE_URL ?? env.ZAVU_BASE_URL),
};

console.log(JSON.stringify({ ok: true, summary }, null, 2));
