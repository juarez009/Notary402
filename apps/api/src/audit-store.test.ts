import assert from "node:assert/strict";
import { test } from "node:test";
import { createLegalIntent, createSignatureRequest } from "../../../packages/core/src/index.ts";
import { createMemoryAuditStore } from "./audit-store.ts";

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
