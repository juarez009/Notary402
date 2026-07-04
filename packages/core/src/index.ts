import { getAddress, verifyMessage } from "viem";
import { sha256Hex } from "./hash.ts";
import { fallbackLegalAnalysis } from "./legal-analysis.ts";
import type {
  Attestation,
  CreateAttestationInput,
  CreateLegalIntentInput,
  CreateSignatureRequestInput,
  AgentProfile,
  LegalIntent,
  LegalAnalysis,
  PaymentProof,
  SignatureRequest,
  VerificationResult,
  VerifyWalletSignatureInput,
  WalletProof,
} from "./types.ts";

export type {
  Attestation,
  CreateAttestationInput,
  CreateLegalIntentInput,
  LegalIntent,
  AgentProfile,
  CreateSignatureRequestInput,
  LegalAnalysis,
  PaymentProof,
  SignatureRequest,
  VerificationResult,
  VerifyWalletSignatureInput,
  WalletProof,
} from "./types.ts";

export function createLegalIntent(input: CreateLegalIntentInput): LegalIntent {
  const parties = input.parties ?? [];
  const obligations = input.obligations ?? [];
  const risk_flags = input.risk_flags ?? [];
  const intentHash = sha256Hex({
    agent_id: input.agent_id,
    jurisdiction: input.jurisdiction,
    input: input.input,
    document_type: input.document_type,
    parties,
    obligations,
    risk_flags,
  });

  return {
    ...input,
    parties,
    obligations,
    risk_flags,
    legal_intent_id: `lintent_${intentHash.slice(2, 14)}`,
    created_at: new Date(0).toISOString(),
  };
}

export function createSignatureRequest(input: CreateSignatureRequestInput): SignatureRequest {
  const request_hash = sha256Hex({
    agent_id: input.agent_id,
    jurisdiction: input.jurisdiction,
    document_hash: input.document_hash,
    legal_intent_id: input.legal_intent_id,
    requested_signature_level: input.requested_signature_level,
  });

  return {
    ...input,
    signature_request_id: `sigreq_${request_hash.slice(2, 14)}`,
    request_hash,
    status: "awaiting_payment",
    created_at: new Date(0).toISOString(),
  };
}

export async function verifyWalletSignature(input: VerifyWalletSignatureInput): Promise<WalletProof> {
  if (input.chain_id !== 80002) {
    return {
      valid: false,
      agent_id: input.agent_id,
      wallet_address: getAddress(input.wallet_address),
      chain_id: input.chain_id,
    };
  }

  const wallet_address = getAddress(input.wallet_address);
  const valid = await verifyMessage({
    address: wallet_address,
    message: input.message,
    signature: input.signature,
  });

  return {
    valid,
    agent_id: input.agent_id,
    wallet_address,
    chain_id: input.chain_id,
  };
}

export function analyzeLegalSignature(): LegalAnalysis {
  return fallbackLegalAnalysis("QVAC analysis not configured; human review recommended.");
}

export function createAttestation(input: CreateAttestationInput): Attestation {
  const attestation_id = `att_${sha256Hex({
    request_hash: input.signature_request.request_hash,
    wallet_proof_id: input.wallet_proof_id,
    l402_receipt: input.l402_receipt,
  }).slice(2, 14)}`;

  return {
    attestation_id,
    signature_request_id: input.signature_request.signature_request_id,
    request_hash: input.signature_request.request_hash,
    document_hash: input.signature_request.document_hash,
    jurisdiction: input.signature_request.jurisdiction,
    notary_agent: input.legal_analysis.notary_agent,
    requesting_agent: {
      agent_id: input.signature_request.agent_id,
      runtime: "agentic_mvp",
      amoy_wallet: getAddress(input.agent_wallet),
    },
    payments: {
      l402: {
        provider: "aperture",
        network: "polar",
        receipt: input.l402_receipt,
      },
      ...(input.amoy_tx_hash
        ? {
            amoy: {
              chain_id: 80002,
              tx_hash: input.amoy_tx_hash,
            },
          }
        : {}),
    },
    signature: {
      signature_level: input.legal_analysis.signature_level,
      agent_signature: sha256Hex({ attestation_id, request_hash: input.signature_request.request_hash }),
      signature_scheme: "EIP-191",
    },
    legal_analysis: {
      risk_score: input.legal_analysis.risk_score,
      requires_human_notary: input.legal_analysis.requires_human_notary,
      summary: input.legal_analysis.summary,
    },
    status: "issued",
    created_at: new Date(0).toISOString(),
  };
}

export function verifyAttestation(attestation: Attestation): VerificationResult {
  const checks = {
    document_hash: attestation.document_hash.startsWith("0x"),
    agent_wallet: attestation.requesting_agent.amoy_wallet.startsWith("0x"),
    l402_payment: attestation.payments.l402.receipt.length > 0,
    notary_signature: attestation.signature.agent_signature.startsWith("0x"),
  };

  return {
    valid: Object.values(checks).every(Boolean),
    checks,
  };
}
