import { createHash } from "node:crypto";
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
  findHumanEscalationsByRequest(signatureRequestId: string): Promise<HumanEscalation[]>;
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
    async findHumanEscalationsByRequest(signatureRequestId) {
      return [...humanEscalations.values()].filter((escalation) => escalation.signature_request_id === signatureRequestId);
    },
    async createDocumentRequest(request) { documentRequests.set(request.document_request_id, request); return request; }
  };
}

function supabaseError(table: string, error: { message?: string; code?: string } | null) {
  if (!error) return new Error(`SUPABASE_${table.toUpperCase()}_UNKNOWN_ERROR`);
  return new Error(`SUPABASE_${table.toUpperCase()}_${error.code || "ERROR"}: ${error.message || "request failed"}`);
}

function isSchemaCacheColumnError(error: { code?: string } | null) {
  return error?.code === "PGRST204";
}

export function legacyDocumentRequestRow(row: DocumentRequest) {
  const documentHash = documentRequestHash(row);
  return {
    document_request_id: row.document_request_id,
    signature_request_id: row.signature_request_id || row.document_request_id,
    document_hash: documentHash,
    created_at: row.created_at
  };
}

function documentRequestHash(row: DocumentRequest) {
  return row.document_hash || `0x${createHash("sha256").update(JSON.stringify(row)).digest("hex")}`;
}

export function legacyDocumentSignatureRequestRow(row: DocumentRequest): SignatureRequest {
  return {
    signature_request_id: row.signature_request_id || row.document_request_id,
    agent_id: "agent_document_request",
    jurisdiction: "SV",
    document_hash: documentRequestHash(row),
    requested_signature_level: 1,
    request_hash: `0x${createHash("sha256").update(`request:${JSON.stringify(row)}`).digest("hex")}`,
    status: "issued",
    created_at: row.created_at
  };
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
    async findHumanEscalationsByRequest(signatureRequestId) {
      const { data, error } = await client.from("human_escalations").select("*").eq("signature_request_id", signatureRequestId).order("created_at", { ascending: true });
      if (error) throw supabaseError("human_escalations", error);
      return data as HumanEscalation[];
    },
    async createDocumentRequest(row) {
      const { data, error } = await client.from("document_requests").upsert(row).select().single();
      if (!error) return data as DocumentRequest;
      if (!isSchemaCacheColumnError(error)) throw supabaseError("document_requests", error);

      const fallback = legacyDocumentRequestRow(row);
      const fallbackResult = await client.from("document_requests").upsert(fallback).select().single();
      if (fallbackResult.error?.code === "23503") {
        const parent = legacyDocumentSignatureRequestRow(row);
        await upsert("agent_profiles", {
          agent_id: parent.agent_id,
          name: "Document Request Compatibility Agent",
          created_at: row.created_at
        });
        await upsert("signature_requests", parent);
        const retryResult = await client.from("document_requests").upsert(fallback).select().single();
        if (retryResult.error) throw supabaseError("document_requests", retryResult.error);
        return { ...row, ...retryResult.data } as DocumentRequest;
      }
      if (fallbackResult.error) throw supabaseError("document_requests", fallbackResult.error);
      return { ...row, ...fallbackResult.data } as DocumentRequest;
    }
  };
}

export function createSupabaseAuditStore(env = process.env): AuditStore {
  const client = createClient(normalizeSupabaseUrl(env.SUPABASE_URL) || "", normalizeSupabaseServiceRoleKey(env.SUPABASE_SERVICE_ROLE_KEY) || "", {
    db: { schema: env.SUPABASE_SCHEMA || "public" },
    auth: { persistSession: false, autoRefreshToken: false }
  });
  return createSupabaseAuditStoreFromClient(client);
}

export function normalizeSupabaseUrl(raw?: string) {
  const trimmed = (raw || "").trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    url.pathname = url.pathname.replace(/\/rest\/v1\/?$/, "");
    url.search = "";
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return trimmed.replace(/\/rest\/v1\/?$/, "").replace(/\/$/, "");
  }
}

export function normalizeSupabaseServiceRoleKey(key?: string) {
  const trimmed = (key || "").trim();
  return trimmed.replace(/^Bearer\s+/i, "").trim();
}

export function hasSupabaseRuntimeCredentials(env = process.env) {
  const key = normalizeSupabaseServiceRoleKey(env.SUPABASE_SERVICE_ROLE_KEY);
  return Boolean(normalizeSupabaseUrl(env.SUPABASE_URL) && /^eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key));
}

export function createAuditStoreFromEnv(env = process.env): AuditStore {
  if (hasSupabaseRuntimeCredentials(env)) return createSupabaseAuditStore(env);
  return createMemoryAuditStore();
}
