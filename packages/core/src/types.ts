export type Jurisdiction = "SV";

export type SignatureRequestStatus = "awaiting_payment" | "ready_for_analysis" | "issued";

export interface CreateLegalIntentInput {
  agent_id: string;
  jurisdiction: Jurisdiction;
  input: string;
  document_type?: string;
  parties?: string[];
  obligations?: string[];
  risk_flags?: string[];
}

export interface LegalIntent extends CreateLegalIntentInput {
  legal_intent_id: string;
  parties: string[];
  obligations: string[];
  risk_flags: string[];
  created_at: string;
}

export interface AgentProfile {
  agent_id: string;
  runtime: string;
  amoy_wallet?: `0x${string}`;
  created_at: string;
}

export interface CreateSignatureRequestInput {
  agent_id: string;
  jurisdiction: Jurisdiction;
  document_hash: string;
  legal_intent_id?: string;
  requested_signature_level: number;
}

export interface SignatureRequest extends CreateSignatureRequestInput {
  signature_request_id: string;
  request_hash: string;
  status: SignatureRequestStatus;
  created_at: string;
}

export interface VerifyWalletSignatureInput {
  agent_id: string;
  chain_id: number;
  wallet_address: `0x${string}`;
  message: string;
  signature: `0x${string}`;
}

export interface WalletProof {
  valid: boolean;
  agent_id: string;
  wallet_address: `0x${string}`;
  chain_id: number;
}

export interface PaymentProof {
  payment_proof_id: string;
  signature_request_id: string;
  provider: "aperture" | "amoy";
  network: "polar" | "amoy";
  receipt: string;
  tx_hash?: string;
  valid: boolean;
  created_at: string;
}

export interface LegalAnalysis {
  notary_agent: "ElSalvadorNotaryAgent";
  signature_level: number;
  risk_score: number;
  requires_human_notary: boolean;
  summary: string;
  checklist?: string[];
  risk_flags?: string[];
}

export interface CreateAttestationInput {
  signature_request: SignatureRequest;
  wallet_proof_id: string;
  l402_receipt: string;
  agent_wallet: `0x${string}`;
  legal_analysis: LegalAnalysis;
  amoy_tx_hash?: string;
}

export interface Attestation {
  attestation_id: string;
  signature_request_id: string;
  request_hash: string;
  document_hash: string;
  jurisdiction: Jurisdiction;
  notary_agent: "ElSalvadorNotaryAgent";
  requesting_agent: {
    agent_id: string;
    runtime: string;
    amoy_wallet: `0x${string}`;
  };
  payments: {
    l402: {
      provider: "aperture";
      network: "polar";
      receipt: string;
    };
    amoy?: {
      chain_id: 80002;
      tx_hash: string;
    };
  };
  signature: {
    signature_level: number;
    agent_signature: string;
    signature_scheme: "EIP-191";
  };
  legal_analysis: {
    risk_score: number;
    requires_human_notary: boolean;
    summary: string;
  };
  status: "issued";
  created_at: string;
}

export interface VerificationResult {
  valid: boolean;
  checks: {
    document_hash: boolean;
    agent_wallet: boolean;
    l402_payment: boolean;
    notary_signature: boolean;
  };
}
