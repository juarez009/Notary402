import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createAuditStoreFromEnv, createMemoryAuditStore } from "../src/audit-store.js";

describe("AuditStore", () => {
  it("uses memory store when Supabase credentials are absent", () => {
    const store = createAuditStoreFromEnv({} as NodeJS.ProcessEnv);
    assert.equal(store.kind, "memory");
  });

  it("uses supabase store when Supabase credentials exist", () => {
    const store = createAuditStoreFromEnv({ SUPABASE_URL: "https://project.supabase.co", SUPABASE_SERVICE_ROLE_KEY: "secret" } as NodeJS.ProcessEnv);
    assert.equal(store.kind, "supabase");
  });

  it("stores legal intents and agent profiles in memory", async () => {
    const store = createMemoryAuditStore();
    await store.upsertAgentProfile({ agent_id: "agent_1", name: "Hermes", created_at: "2026-01-01T00:00:00.000Z" });
    await store.createLegalIntent({ legal_intent_id: "lintent_1", agent_id: "agent_1", jurisdiction: "SV", input: "x", parties: [], obligations: [], risk_flags: [], created_at: "2026-01-01T00:00:00.000Z" });
    assert.equal((await store.getAgentProfile("agent_1"))?.name, "Hermes");
    assert.equal((await store.getLegalIntent("lintent_1"))?.input, "x");
  });
});
