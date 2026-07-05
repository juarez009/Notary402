import { requireEnv, redact } from "./env.js";

const url = requireEnv("DATAMCP_MCP_URL");
const key = requireEnv("DATAMCP_API_KEY");
const response = await fetch(url, { headers: { authorization: `Bearer ${key}` } });
if (!response.ok) throw new Error(`DataMCP smoke failed with HTTP ${response.status}`);
console.log(`DataMCP smoke reachable: ${redact(url)}`);
