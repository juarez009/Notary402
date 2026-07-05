import { escalateToZavu } from "../packages/integrations/src/zavu.js";
if (!process.env.ZAVU_ESCALATE_URL && !process.env.ZAVU_BASE_URL)
    throw new Error("ZAVU_ESCALATE_URL or ZAVU_BASE_URL is required");
const result = await escalateToZavu({ signature_request_id: "sigreq_smoke", jurisdiction: "SV", reason: "Notary402 smoke test", test: true });
console.log(`Zavu smoke ok: ${result.provider_mode} ${result.status}`);
