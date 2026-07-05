import { buildApp } from "../apps/api/src/app.js";
for (const key of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
    if (!process.env[key])
        throw new Error(`${key} is required for live e2e smoke`);
}
const app = buildApp();
await app.ready();
const legalIntent = await app.inject({ method: "POST", url: "/v1/legal-intent", payload: { agent_id: "smoke-agent", jurisdiction: "SV", input: "Smoke legal intent" } });
if (legalIntent.statusCode !== 201)
    throw new Error(`legal intent failed ${legalIntent.statusCode}`);
console.log(`E2E live smoke started: ${legalIntent.json().legal_intent_id}`);
await app.close();
