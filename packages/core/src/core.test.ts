import assert from "node:assert/strict";
import { test } from "node:test";
import { privateKeyToAccount } from "viem/accounts";
import {
  createAttestation,
  createSignatureRequest,
  verifyAttestation,
  verifyWalletSignature,
} from "./index.ts";

test("createSignatureRequest binds agent, jurisdiction, document hash, and requested level into a stable request hash", () => {
  const input = {
    agent_id: "codex-agent",
    jurisdiction: "SV",
    document_hash: "0xabc123",
    legal_intent_id: "li_001",
    requested_signature_level: 2,
  } as const;

  const first = createSignatureRequest(input);
  const second = createSignatureRequest(input);

  assert.equal(first.status, "awaiting_payment");
  assert.equal(first.request_hash, second.request_hash);
  assert.match(first.request_hash, /^0x[a-f0-9]{64}$/);
});

test("verifyWalletSignature accepts an EIP-191 signature from the matching Amoy wallet", async () => {
  const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f094538a95dcf2e87c1e3bdf5d7f4b4626fef330");
  const message = "Notary402 request 0xabc123";
  const signature = await account.signMessage({ message });

  const result = await verifyWalletSignature({
    agent_id: "codex-agent",
    chain_id: 80002,
    wallet_address: account.address,
    message,
    signature,
  });

  assert.equal(result.valid, true);
  assert.equal(result.wallet_address, account.address);
  assert.equal(result.chain_id, 80002);
});

test("createAttestation issues an immutable JSON attestation that verifyAttestation can validate", () => {
  const request = createSignatureRequest({
    agent_id: "codex-agent",
    jurisdiction: "SV",
    document_hash: "0xabc123",
    requested_signature_level: 2,
  });

  const attestation = createAttestation({
    signature_request: request,
    wallet_proof_id: "walletproof_001",
    l402_receipt: "l402_receipt_demo",
    agent_wallet: "0x0000000000000000000000000000000000000001",
    legal_analysis: {
      notary_agent: "ElSalvadorNotaryAgent",
      signature_level: 2,
      risk_score: 0.22,
      requires_human_notary: false,
      summary: "Eligible for agentic attestation.",
    },
  });

  assert.equal(attestation.status, "issued");
  assert.equal(attestation.signature_request_id, request.signature_request_id);
  assert.deepEqual(verifyAttestation(attestation).checks, {
    document_hash: true,
    agent_wallet: true,
    l402_payment: true,
    notary_signature: true,
  });
});
