import { loadEnvFiles, redact, requireEnv } from "./live-env.ts";

const env = loadEnvFiles();
requireEnv(env, ["DATAMCP_MCP_URL", "DATAMCP_API_KEY"]);

async function callMcp(method: string, params?: unknown) {
  const response = await fetch(env.DATAMCP_MCP_URL!, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "accept": "application/json, text/event-stream",
      "authorization": `Bearer ${env.DATAMCP_API_KEY}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: method,
      method,
      params,
    }),
  });
  if (!response.ok) {
    throw new Error(`DataMCP ${method} failed with HTTP ${response.status}`);
  }
  return await response.json() as { result?: unknown; error?: unknown };
}

await callMcp("initialize", {
  protocolVersion: "2025-03-26",
  capabilities: {},
  clientInfo: { name: "notary402-smoke", version: "0.1.0" },
});
const tools = await callMcp("tools/list");
const serialized = JSON.stringify(tools);
if (!serialized.includes("get_schema") && !serialized.includes("query")) {
  throw new Error("DataMCP smoke did not find expected schema/query tools.");
}

console.log(JSON.stringify({
  ok: true,
  mcp_url: redact(env.DATAMCP_MCP_URL),
  expected_tools_present: true,
}, null, 2));
