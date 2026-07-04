import assert from "node:assert/strict";
import { test } from "node:test";
import { createSignatureRequest } from "../../../packages/core/src/index.ts";
import { createMemoryAuditStore } from "./audit-store.ts";

test("MemoryAuditStore persists workflow records needed by DataMCP audit tables", async () => {
  const store = createMemoryAuditStore();
  const signatureRequest = createSignatureRequest({
    agent_id: "codex-agent",
    jurisdiction: "SV",
    document_hash: "0xabc123",
    requested_signature_level: 2,
  });

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

  assert.equal((await store.getSignatureRequest(signatureRequest.signature_request_id))?.request_hash, signatureRequest.request_hash);
  assert.equal((await store.getPaymentProof("pay_001"))?.valid, true);
});
