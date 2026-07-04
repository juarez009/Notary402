import assert from "node:assert/strict";
import { test } from "node:test";
import { parseL402PaymentProof } from "./l402.ts";

test("parseL402PaymentProof records a receipt without validating Aperture itself", () => {
  const proof = parseL402PaymentProof({
    signature_request_id: "sigreq_001",
    receipt: "l402 macaroon:preimage",
    request_hash: "0xabc123",
  });

  assert.equal(proof.provider, "aperture");
  assert.equal(proof.network, "polar");
  assert.equal(proof.valid, true);
  assert.equal(proof.receipt, "l402 macaroon:preimage");
  assert.match(proof.payment_proof_id, /^pay_l402_/);
});

test("parseL402PaymentProof rejects an empty receipt", () => {
  assert.throws(() => parseL402PaymentProof({
    signature_request_id: "sigreq_001",
    receipt: " ",
  }), /L402 receipt is required/);
});
