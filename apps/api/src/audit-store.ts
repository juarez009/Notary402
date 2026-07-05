import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  AgentProfile,
  Attestation,
  DocumentRequest,
  HumanEscalation,
  LegalAnalysis,
  LegalIntent,
  PaymentProof,
  SignatureRequest,
  WalletProof
} from "../../../packages/core/src/types.js";

export type AuditStore = {
  kind: "memory" | "supabase";
  upsertAgentProfile(profile: AgentProfile): Promise<AgentProfile>;
  getAgentProfile(agentId: string): Promise<AgentProfile | null>;
  createLegalIntent(intent: LegalIntent): Promise<LegalIntent>;
  getLegalIntent(id: string): Promise<LegalIntent | null>;
  createSignatureRequest(request: SignatureRequest): Promise<SignatureRequest>;
  getSignatureRequest(id: string): Promise<SignatureRequest | null>;
  createWalletProof(proof: WalletProof): Promise<WalletProof>;
  getWalletProof(id: string): Promise<WalletProof | null>;
  createPaymentProof(proof: PaymentProof): Promise<PaymentProof>;
  getPaymentProof(id: string): Promise<PaymentProof | null>;
  findPaymentProofByRequest(signatureRequestId: string): Promise<PaymentProof | null>;
  createLegalAnalysis(analysis: LegalAnalysis): Promise<LegalAnalysis>;
  getLegalAnalysisByRequest(signatureRequestId: string): Promise<LegalAnalysis | null>;
  createAttestation(attestation: Attestation): Promise<Attestation>;
  getAttestation(id: string): Promise<Attestation | null>;
  listAttestations(): Promise<Attestation[]>;
  createHumanEscalation(escalation: HumanEscalation): Promise<HumanEscalation>;
  createDocumentRequest(request: DocumentRequest): Promise<DocumentRequest>;
};

export function createMemoryAuditStore(): AuditStore {
  const agentProfiles = new Map<string, AgentProfile>();
  const legalIntents = new Map<string, LegalIntent>();
  const signatureRequests = new Map<string, SignatureRequest>();
  const walletProofs = new Map<string, WalletProof>();
  const paymentProofs = new Map<string, PaymentProof>();
  const legalAnalyses = new Map<string, LegalAnalysis>();
  const attestations = new Map<string, Attestation>();
  const humanEscalations = new Map<string, HumanEscalation>();
  const documentRequests = new Map<string, DocumentRequest>();

  return {
    kind: "memory",
    async upsertAgentProfile(profile) { agentProfiles.set(profile.agent_id, profile); return profile; },
    async getAgentProfile(agentId) { return agentProfiles.get(agentId) || null; },
    async createLegalIntent(intent) { legalIntents.set(intent.legal_intent_id, intent); return intent; },
    async getLegalIntent(id) { return legalIntents.get(id) || null; },
    async createSignatureRequest(request) { signatureRequests.set(request.signature_request_id, request); return request; },
    async getSignatureRequest(id) { return signatureRequests.get(id) || null; },
    async createWalletProof(proof) { walletProofs.set(proof.wallet_proof_id, proof); return proof; },
    async getWalletProof(id) { return walletProofs.get(id) || null; },
    async createPaymentProof(proof) { paymentProofs.set(proof.payment_proof_id, proof); return proof; },
    async getPaymentProof(id) { return paymentProofs.get(id) || null; },
    async findPaymentProofByRequest(signatureRequestId) {
      return [...paymentProofs.values()].find((proof) => proof.signature_request_id === signatureRequestId) || null;
    },
    async createLegalAnalysis(analysis) { legalAnalyses.set(analysis.signature_request_id, analysis); return analysis; },
    async getLegalAnalysisByRequest(signatureRequestId) { return legalAnalyses.get(signatureRequestId) || null; },
    async createAttestation(attestation) { attestations.set(attestation.attestation_id, attestation); return attestation; },
    async getAttestation(id) { return attestations.get(id) || null; },
    async listAttestations() { return [...attestations.values()].sort((a, b) => b.created_at.localeCompare(a.created_at)); },
    async createHumanEscalation(escalation) { humanEscalations.set(escalation.human_escalation_id, escalation); return escalation; },
    async createDocumentRequest(request) { documentRequests.set(request.document_request_id, request); return request; }
  };
}

function supabaseError(table: string, error: { message?: string; code?: string } | null) {
  if (!error) return new Error(`SUPABASE_${table.toUpperCase()}_UNKNOWN_ERROR`);
  return new Error(`SUPABASE_${table.toUpperCase()}_${error.code || "ERROR"}: ${error.message || "request failed"}`);
}

export function createSupabaseAuditStoreFromClient(client: SupabaseClient<any, any, any>): AuditStore {
  async function upsert<T extends Record<string, unknown>>(table: string, row: T): Promise<T> {
    const { data, error } = await client.from(table).upsert(row).select().single();
    if (error) throw supabaseError(table, error);
    return data as T;
  }
  async function maybe<T>(table: string, column: string, value: string): Promise<T | null> {
    const { data, error } = await client.from(table).select("*").eq(column, value).maybeSingle();
    if (error) throw supabaseError(table, error);
    return data as T | null;
  }

  return {
    kind: "supabase",
    upsertAgentProfile: (row) => upsert("agent_profiles", row),
    getAgentProfile: (id) => maybe("agent_profiles", "agent_id", id),
    createLegalIntent: (row) => upsert("legal_intents", row),
    getLegalIntent: (id) => maybe("legal_intents", "legal_intent_id", id),
    createSignatureRequest: (row) => upsert("signature_requests", row),
    getSignatureRequest: (id) => maybe("signature_requests", "signature_request_id", id),
    createWalletProof: (row) => upsert("wallet_proofs", row),
    getWalletProof: (id) => maybe("wallet_proofs", "wallet_proof_id", id),
    createPaymentProof: (row) => upsert("payment_proofs", row),
    getPaymentProof: (id) => maybe("payment_proofs", "payment_proof_id", id),
    async findPaymentProofByRequest(signatureRequestId) {
      return maybe("payment_proofs", "signature_request_id", signatureRequestId);
    },
    createLegalAnalysis: (row) => upsert("legal_analyses", row),
    getLegalAnalysisByRequest: (id) => maybe("legal_analyses", "signature_request_id", id),
    createAttestation: (row) => upsert("attestations", row),
    getAttestation: (id) => maybe("attestations", "attestation_id", id),
    async listAttestations() {
      const { data, error } = await client.from("attestations").select("*").order("created_at", { ascending: false }).limit(50);
      if (error) throw supabaseError("attestations", error);
      return data as Attestation[];
    },
    createHumanEscalation: (row) => upsert("human_escalations", row),
    createDocumentRequest: (row) => upsert("document_requests", row)
  };
}

export function createSupabaseAuditStore(env = process.env): AuditStore {
  const client = createClient(env.SUPABASE_URL || "", env.SUPABASE_SERVICE_ROLE_KEY || "", {
    db: { schema: env.SUPABASE_SCHEMA || "public" },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return createSupabaseAuditStoreFromClient(client);
}

export function createAuditStoreFromEnv(env = process.env): AuditStore {
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) return createSupabaseAuditStore(env);
  return createMemoryAuditStore();
}
