export type Jurisdiction = "SV";

export type LegalIntent = {
  legal_intent_id: string;
  agent_id: string;
  jurisdiction: Jurisdiction;
  input: string;
  document_type?: string;
  parties: string[];
  obligations: string[];
  risk_flags: string[];
  created_at: string;
};

export type SignatureRequest = {
  signature_request_id: string;
  agent_id: string;
  jurisdiction: Jurisdiction;
  document_hash: string;
  legal_intent_id?: string;
  requested_signature_level: number;
  request_hash: string;
  status: "awaiting_payment" | "ready_for_analysis" | "issued";
  created_at: string;
};

export type WalletProof = {
  wallet_proof_id: string;
  agent_id: string;
  chain_id: number;
  wallet_address: string;
  message: string;
  signature: string;
  verified: boolean;
  created_at: string;
};

export type PaymentProof = {
  payment_proof_id: string;
  signature_request_id: string;
  provider: "aperture" | "amoy";
  network: "polar" | "polygon-amoy";
  receipt?: string;
  tx_hash?: string;
  status: "verified";
  created_at: string;
};

export type LegalAnalysis = {
  legal_analysis_id: string;
  signature_request_id: string;
  jurisdiction: Jurisdiction;
  risk_score: number;
  requires_human_notary: boolean;
  summary: string;
  checklist: Array<{ label: string; passed: boolean }>;
  risk_flags: string[];
  created_at: string;
};

export type Attestation = {
  attestation_id: string;
  signature_request_id: string;
  document_hash: string;
  request_hash: string;
  agent_wallet: string;
  wallet_proof_id: string;
  payment_proof_id: string;
  amoy_tx_hash?: string;
  status: "issued" | "pending_human_review";
  valid: boolean;
  jurisdiction: Jurisdiction;
  signature_level: number;
  requires_human_notary: boolean;
  l402_payment?: Record<string, unknown>;
  qvac_analysis?: Record<string, unknown>;
  created_at: string;
};

export type HumanEscalation = {
  human_escalation_id: string;
  signature_request_id: string;
  jurisdiction: Jurisdiction;
  reason: string;
  status: string;
  channel: string;
  zavu_message_id?: string;
  provider_mode: "live" | "simulated";
  created_at: string;
};

export type AgentProfile = {
  agent_id: string;
  name?: string;
  wallet_address?: string;
  created_at: string;
};

export type DocumentRequest = {
  document_request_id: string;
  signature_request_id?: string;
  document_hash?: string;
  tipo_documento?: string;
  jurisdiccion?: Jurisdiction;
  comparecientes?: unknown[];
  detalles?: Record<string, unknown>;
  status?: string;
  created_at: string;
};

export type VerificationResult = {
  valid: boolean;
  attestation?: Attestation;
  checks: {
    document_hash: boolean;
    agent_wallet: boolean;
    l402_payment: boolean;
    notary_signature: boolean;
  };
};
