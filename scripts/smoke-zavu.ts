import { createZavuClientFromEnv } from "../packages/integrations/src/zavu.ts";
import { loadEnvFiles, requireEnv, redact } from "./live-env.ts";

const env = loadEnvFiles();
if (!env.ZAVU_ESCALATE_URL && !env.ZAVU_BASE_URL) {
  requireEnv(env, ["ZAVU_ESCALATE_URL"]);
}

const client = createZavuClientFromEnv(env);
const result = await client.escalate({
  signature_request_id: "sigreq_smoke_live",
  jurisdiction: "SV",
  reason: "SMOKE_TEST: verify Notary402 live Zavu escalation path.",
  test: true,
});

if (result.provider_mode !== "live") {
  throw new Error("Zavu smoke requires a live endpoint; simulated mode is not accepted.");
}

console.log(JSON.stringify({
  ok: true,
  endpoint: redact(env.ZAVU_ESCALATE_URL ?? env.ZAVU_BASE_URL),
  status: result.status,
  channel: result.channel,
  zavu_message_id: result.zavu_message_id,
}, null, 2));
