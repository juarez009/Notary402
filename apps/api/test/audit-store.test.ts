import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAuditStoreFromEnv,
  createMemoryAuditStore,
  legacyDocumentRequestRow,
  legacyDocumentSignatureRequestRow,
  normalizeSupabaseServiceRoleKey,
  normalizeSupabaseUrl
} from "../src/audit-store.js";

describe("AuditStore", () => {
  it("uses memory store when Supabase credentials are absent", () => {
    const store = createAuditStoreFromEnv({} as NodeJS.ProcessEnv);
    assert.equal(store.kind, "memory");
  });

  it("uses supabase store when Supabase credentials exist", () => {
    const store = createAuditStoreFromEnv({
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "eyJheader.eyJpayload.signature"
    } as NodeJS.ProcessEnv);
    assert.equal(store.kind, "supabase");
  });

  it("normalizes pasted Supabase service role JWT values", () => {
    assert.equal(normalizeSupabaseServiceRoleKey("  eyJheader.eyJpayload.signature  "), "eyJheader.eyJpayload.signature");
    assert.equal(normalizeSupabaseServiceRoleKey("Bearer eyJheader.eyJpayload.signature"), "eyJheader.eyJpayload.signature");
  });

  it("normalizes Supabase REST URLs to project base URLs", () => {
    assert.equal(normalizeSupabaseUrl("https://project.supabase.co/rest/v1/"), "https://project.supabase.co");
    assert.equal(normalizeSupabaseUrl(" https://project.supabase.co "), "https://project.supabase.co");
  });

  it("maps rich document requests to the legacy Supabase document_requests schema", () => {
    const row = legacyDocumentRequestRow({
      document_request_id: "docreq_1",
      tipo_documento: "COMPRAVENTA",
      jurisdiccion: "SV",
      comparecientes: [{ nombre: "Audit" }],
      detalles: { lote: 1 },
      status: "created",
      created_at: "2026-01-01T00:00:00.000Z"
    });

    assert.equal(row.document_request_id, "docreq_1");
    assert.equal(row.signature_request_id, "docreq_1");
    assert.match(row.document_hash, /^0x[0-9a-f]{64}$/);
    assert.equal(row.created_at, "2026-01-01T00:00:00.000Z");
  });

  it("maps rich document requests to a legacy parent signature_request row", () => {
    const row = legacyDocumentSignatureRequestRow({
      document_request_id: "docreq_1",
      tipo_documento: "COMPRAVENTA",
      created_at: "2026-01-01T00:00:00.000Z"
    });

    assert.equal(row.signature_request_id, "docreq_1");
    assert.equal(row.agent_id, "agent_document_request");
    assert.equal(row.jurisdiction, "SV");
    assert.equal(row.status, "issued");
    assert.match(row.document_hash, /^0x[0-9a-f]{64}$/);
  });

  it("uses supabase store when the Supabase service role key has paste whitespace", () => {
    const store = createAuditStoreFromEnv({
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "  eyJheader.eyJpayload.signature"
    } as NodeJS.ProcessEnv);
    assert.equal(store.kind, "supabase");
  });

  it("uses memory store when Supabase key is not a JWT service role key", () => {
    const store = createAuditStoreFromEnv({
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "sbp_invalid_project_token"
    } as NodeJS.ProcessEnv);
    assert.equal(store.kind, "memory");
  });

  it("stores legal intents and agent profiles in memory", async () => {
    const store = createMemoryAuditStore();
    await store.upsertAgentProfile({ agent_id: "agent_1", name: "Hermes", created_at: "2026-01-01T00:00:00.000Z" });
    await store.createLegalIntent({
      legal_intent_id: "lintent_1",
      agent_id: "agent_1",
      jurisdiction: "SV",
      input: "x",
      parties: [],
      obligations: [],
      risk_flags: [],
      created_at: "2026-01-01T00:00:00.000Z"
    });
    assert.equal((await store.getAgentProfile("agent_1"))?.name, "Hermes");
    assert.equal((await store.getLegalIntent("lintent_1"))?.input, "x");
  });
});
