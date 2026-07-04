import { sha256Hex } from "../../core/src/hash.ts";
import type { PaymentProof } from "../../core/src/index.ts";

export interface ParseL402PaymentProofInput {
  signature_request_id: string;
  receipt: string;
  request_hash?: string;
}

export function parseL402PaymentProof(input: ParseL402PaymentProofInput): PaymentProof {
  const receipt = input.receipt.trim();
  if (!receipt) {
    throw new Error("L402 receipt is required after Aperture validates the payment.");
  }

  return {
    payment_proof_id: `pay_l402_${sha256Hex({
      signature_request_id: input.signature_request_id,
      receipt,
      request_hash: input.request_hash,
    }).slice(2, 14)}`,
    signature_request_id: input.signature_request_id,
    provider: "aperture",
    network: "polar",
    receipt,
    valid: true,
    created_at: new Date(0).toISOString(),
  };
}
