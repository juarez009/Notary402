import assert from "node:assert/strict";
import { test } from "node:test";
import { createLegalIntent, createSignatureRequest } from "../../../packages/core/src/index.ts";
import { createAuditStoreFromEnv, createMemoryAuditStore, createSupabaseAuditStoreFromClient } from "./audit-store.ts";

test("MemoryAuditStore persists workflow records needed by DataMCP audit tables", async () => {
  const store = createMemoryAuditStore();
  const legalIntent = createLegalIntent({
    agent_id: "codex-agent",
    jurisdiction: "SV",
    input: "Authorize a services agreement signature.",
  });
  const signatureRequest = createSignatureRequest({
    agent_id: "codex-agent",
    jurisdiction: "SV",
    document_hash: "0xabc123",
    legal_intent_id: legalIntent.legal_intent_id,
    requested_signature_level: 2,
  });

  await store.saveAgentProfile({
    agent_id: "codex-agent",
    runtime: "agentic_mvp",
    created_at: new Date(0).toISOString(),
  });
  await store.saveLegalIntent(legalIntent);
  await store.saveSignatureRequest(signatureRequest);
  await store.savePaymentProof({
    payment_proof_id: "pay_001",
    signature_request_id: signatureRequest.signature_request_id,
    provider: "aperture",
    network: "polar",
    receipt: "l402_receipt",
    valid: true,
    created_at: new Date(0).toISOString(),
  });

  assert.equal((await store.getAgentProfile("codex-agent"))?.runtime, "agentic_mvp");
  assert.equal((await store.getLegalIntent(legalIntent.legal_intent_id))?.input, legalIntent.input);
  assert.equal((await store.getSignatureRequest(signatureRequest.signature_request_id))?.request_hash, signatureRequest.request_hash);
  assert.equal((await store.getPaymentProof("pay_001"))?.valid, true);
});

test("createAuditStoreFromEnv selects Supabase when service configuration is present", async () => {
  const store = createAuditStoreFromEnv({
    SUPABASE_URL: "https://project.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service_role_secret",
  });

  assert.equal(store.kind, "supabase");
  await store.close();
});

test("SupabaseAuditStore persists and reads audit records through Supabase JS operations", async () => {
  const client = createMockSupabaseClient();
  const store = createSupabaseAuditStoreFromClient(client as any);
  const legalIntent = createLegalIntent({
    agent_id: "codex-agent",
    jurisdiction: "SV",
    input: "Authorize a services agreement signature.",
    parties: ["Notary402", "Client"],
  });
  const signatureRequest = createSignatureRequest({
    agent_id: "codex-agent",
    jurisdiction: "SV",
    document_hash: "0xabc123",
    legal_intent_id: legalIntent.legal_intent_id,
    requested_signature_level: 2,
  });

  await store.saveAgentProfile({ agent_id: "codex-agent", runtime: "agentic_mvp", created_at: new Date(0).toISOString() });
  await store.saveLegalIntent(legalIntent);
  await store.saveSignatureRequest(signatureRequest);
  await store.saveWalletProof({
    wallet_proof_id: "walletproof_001",
    signature_request_id: signatureRequest.signature_request_id,
    agent_id: "codex-agent",
    chain_id: 80002,
    wallet_address: "0x0000000000000000000000000000000000000001",
    message: "Notary402 request",
    signature: "0xabc",
    valid: true,
    created_at: new Date(0).toISOString(),
  });
  await store.savePaymentProof({
    payment_proof_id: "pay_001",
    signature_request_id: signatureRequest.signature_request_id,
    provider: "aperture",
    network: "polar",
    receipt: "l402_receipt",
    valid: true,
    created_at: new Date(0).toISOString(),
  });
  await store.saveLegalAnalysis(signatureRequest.signature_request_id, {
    notary_agent: "ElSalvadorNotaryAgent",
    signature_level: 2,
    risk_score: 0.35,
    requires_human_notary: false,
    summary: "Looks valid.",
    checklist: ["Verify signer identity"],
    risk_flags: [],
  });
  await store.saveAttestation({
    attestation_id: "att_001",
    signature_request_id: signatureRequest.signature_request_id,
    request_hash: signatureRequest.request_hash,
    document_hash: signatureRequest.document_hash,
    jurisdiction: "SV",
    notary_agent: "ElSalvadorNotaryAgent",
    requesting_agent: {
      agent_id: "codex-agent",
      runtime: "agentic_mvp",
      amoy_wallet: "0x0000000000000000000000000000000000000001",
    },
    payments: {
      l402: { provider: "aperture", network: "polar", receipt: "l402_receipt" },
    },
    signature: {
      signature_level: 2,
      agent_signature: "0xsig",
      signature_scheme: "EIP-191",
    },
    legal_analysis: {
      risk_score: 0.35,
      requires_human_notary: false,
      summary: "Looks valid.",
    },
    status: "issued",
    created_at: new Date(0).toISOString(),
  });

  assert.equal((await store.getAgentProfile("codex-agent"))?.runtime, "agentic_mvp");
  assert.deepEqual((await store.getLegalIntent(legalIntent.legal_intent_id))?.parties, ["Notary402", "Client"]);
  assert.equal((await store.getSignatureRequest(signatureRequest.signature_request_id))?.request_hash, signatureRequest.request_hash);
  assert.equal((await store.getWalletProof("walletproof_001"))?.valid, true);
  assert.equal((await store.getPaymentProof("pay_001"))?.valid, true);
  assert.equal((await store.getLegalAnalysis(signatureRequest.signature_request_id))?.summary, "Looks valid.");
  assert.equal((await store.getAttestation("att_001"))?.status, "issued");
});

test("SupabaseAuditStore wraps Supabase errors without leaking service credentials", async () => {
  const client = createMockSupabaseClient({ failWrites: true });
  const store = createSupabaseAuditStoreFromClient(client as any);

  await assert.rejects(
    () => store.saveAgentProfile({ agent_id: "codex-agent", runtime: "agentic_mvp", created_at: new Date(0).toISOString() }),
    /Supabase audit operation failed: agent_profiles upsert/,
  );
});

function createMockSupabaseClient(options: { failWrites?: boolean } = {}) {
  const tables = new Map<string, Map<string, any>>();
  const primaryKeys: Record<string, string> = {
    agent_profiles: "agent_id",
    legal_intents: "legal_intent_id",
    signature_requests: "signature_request_id",
    wallet_proofs: "wallet_proof_id",
    payment_proofs: "payment_proof_id",
    legal_analyses: "legal_analysis_id",
    attestations: "attestation_id",
    human_escalations: "escalation_id",
    document_requests: "document_request_id",
  };

  return {
    schema: () => createMockSupabaseClient(options),
    from(tableName: string) {
      const table = tables.get(tableName) ?? new Map<string, any>();
      tables.set(tableName, table);
      return {
        async upsert(row: any) {
          if (options.failWrites) {
            return { error: { message: "service_role_secret leaked by provider" } };
          }
          table.set(row[primaryKeys[tableName]], row);
          return { error: null };
        },
        select() {
          const state = { column: "", value: "", orderColumn: "", ascending: false, limitValue: 0 };
          const builder = {
            eq(column: string, value: string) {
              state.column = column;
              state.value = value;
              return builder;
            },
            order(column: string, opts: { ascending: boolean }) {
              state.orderColumn = column;
              state.ascending = opts.ascending;
              return builder;
            },
            limit(value: number) {
              state.limitValue = value;
              return builder;
            },
            async maybeSingle() {
              let rows = [...table.values()].filter((row) => row[state.column] === state.value);
              if (state.orderColumn) {
                rows = rows.sort((a, b) => String(a[state.orderColumn]).localeCompare(String(b[state.orderColumn])));
                if (!state.ascending) rows.reverse();
              }
              return { data: rows[0] ?? null, error: null };
            },
          };
          return builder;
        },
      };
    },
  };
}
