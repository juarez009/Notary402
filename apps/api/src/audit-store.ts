import type { AgentProfile, Attestation, LegalAnalysis, LegalIntent, PaymentProof, SignatureRequest, WalletProof } from "../../../packages/core/src/index.ts";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface StoredWalletProof extends WalletProof {
  wallet_proof_id: string;
  signature_request_id?: string;
  message?: string;
  signature?: string;
  created_at: string;
}

export interface StoredDocumentRequest {
  document_request_id: string;
  tipo_documento: string;
  comparecientes: any[];
  detalles: Record<string, any>;
  jurisdiccion: "SV";
  created_at: string;
}

export interface HumanEscalationRecord {
  escalation_id: string;
  signature_request_id: string;
  jurisdiction: "SV";
  reason: string;
  channel: string;
  zavu_message_id: string;
  status: string;
  created_at: string;
}

export interface AuditStore {
  kind: "memory" | "supabase";
  saveAgentProfile(agentProfile: AgentProfile): Promise<void>;
  getAgentProfile(agentId: string): Promise<AgentProfile | undefined>;
  saveLegalIntent(legalIntent: LegalIntent): Promise<void>;
  getLegalIntent(id: string): Promise<LegalIntent | undefined>;
  saveSignatureRequest(signatureRequest: SignatureRequest): Promise<void>;
  getSignatureRequest(id: string): Promise<SignatureRequest | undefined>;
  saveWalletProof(walletProof: StoredWalletProof): Promise<void>;
  getWalletProof(id: string): Promise<StoredWalletProof | undefined>;
  savePaymentProof(paymentProof: PaymentProof): Promise<void>;
  getPaymentProof(id: string): Promise<PaymentProof | undefined>;
  saveLegalAnalysis(signatureRequestId: string, legalAnalysis: LegalAnalysis): Promise<void>;
  getLegalAnalysis(signatureRequestId: string): Promise<LegalAnalysis | undefined>;
  saveAttestation(attestation: Attestation): Promise<void>;
  getAttestation(id: string): Promise<Attestation | undefined>;
  saveHumanEscalation(record: HumanEscalationRecord): Promise<void>;
  saveDocumentRequest(record: StoredDocumentRequest): Promise<void>;
  getDocumentRequest(id: string): Promise<StoredDocumentRequest | undefined>;
  close(): Promise<void>;
}

export function createMemoryAuditStore(): AuditStore {
  const agentProfiles = new Map<string, AgentProfile>();
  const legalIntents = new Map<string, LegalIntent>();
  const signatureRequests = new Map<string, SignatureRequest>();
  const walletProofs = new Map<string, StoredWalletProof>();
  const paymentProofs = new Map<string, PaymentProof>();
  const legalAnalyses = new Map<string, LegalAnalysis>();
  const attestations = new Map<string, Attestation>();
  const humanEscalations = new Map<string, HumanEscalationRecord>();
  const documentRequests = new Map<string, StoredDocumentRequest>();

  return {
    kind: "memory",
    async saveAgentProfile(agentProfile) {
      agentProfiles.set(agentProfile.agent_id, agentProfile);
    },
    async getAgentProfile(agentId) {
      return agentProfiles.get(agentId);
    },
    async saveLegalIntent(legalIntent) {
      legalIntents.set(legalIntent.legal_intent_id, legalIntent);
    },
    async getLegalIntent(id) {
      return legalIntents.get(id);
    },
    async saveSignatureRequest(signatureRequest) {
      signatureRequests.set(signatureRequest.signature_request_id, signatureRequest);
    },
    async getSignatureRequest(id) {
      return signatureRequests.get(id);
    },
    async saveWalletProof(walletProof) {
      walletProofs.set(walletProof.wallet_proof_id, walletProof);
    },
    async getWalletProof(id) {
      return walletProofs.get(id);
    },
    async savePaymentProof(paymentProof) {
      paymentProofs.set(paymentProof.payment_proof_id, paymentProof);
    },
    async getPaymentProof(id) {
      return paymentProofs.get(id);
    },
    async saveLegalAnalysis(signatureRequestId, legalAnalysis) {
      legalAnalyses.set(signatureRequestId, legalAnalysis);
    },
    async getLegalAnalysis(signatureRequestId) {
      return legalAnalyses.get(signatureRequestId);
    },
    async saveAttestation(attestation) {
      attestations.set(attestation.attestation_id, attestation);
    },
    async getAttestation(id) {
      return attestations.get(id);
    },
    async saveHumanEscalation(record) {
      humanEscalations.set(record.escalation_id, record);
    },
    async saveDocumentRequest(record) {
      documentRequests.set(record.document_request_id, record);
    },
    async getDocumentRequest(id) {
      return documentRequests.get(id);
    },
    async close() {},
  };
}

export function createAuditStoreFromEnv(env: NodeJS.ProcessEnv = process.env): AuditStore {
  if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
    return createSupabaseAuditStore({
      url: env.SUPABASE_URL,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      schema: env.SUPABASE_SCHEMA,
    });
  }
  return createMemoryAuditStore();
}

export interface SupabaseAuditStoreOptions {
  url: string;
  serviceRoleKey: string;
  schema?: string;
}

export type SupabaseAuditClient = Pick<SupabaseClient, "from" | "schema">;

export function createSupabaseAuditStore(options: SupabaseAuditStoreOptions): AuditStore {
  const baseClient = createClient(options.url, options.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const client = options.schema && options.schema !== "public" ? baseClient.schema(options.schema) : baseClient;
  return createSupabaseAuditStoreFromClient(client as SupabaseAuditClient);
}

export function createSupabaseAuditStoreFromClient(client: SupabaseAuditClient): AuditStore {
  return {
    kind: "supabase",
    async saveAgentProfile(agentProfile) {
      await upsertSupabase(client, "agent_profiles", agentProfile, "agent_id");
    },
    async getAgentProfile(agentId) {
      const row = await maybeSingleSupabase<AgentProfileRow>(client, "agent_profiles", "agent_id", agentId);
      return row ? agentProfileFromRow(row) : undefined;
    },
    async saveLegalIntent(legalIntent) {
      await upsertSupabase(client, "legal_intents", legalIntent, "legal_intent_id");
    },
    async getLegalIntent(id) {
      const row = await maybeSingleSupabase<LegalIntentRow>(client, "legal_intents", "legal_intent_id", id);
      return row ? legalIntentFromRow(row) : undefined;
    },
    async saveSignatureRequest(signatureRequest) {
      await upsertSupabase(client, "signature_requests", signatureRequest, "signature_request_id");
    },
    async getSignatureRequest(id) {
      const row = await maybeSingleSupabase<SignatureRequestRow>(client, "signature_requests", "signature_request_id", id);
      return row ? signatureRequestFromRow(row) : undefined;
    },
    async saveWalletProof(walletProof) {
      await upsertSupabase(client, "wallet_proofs", walletProof, "wallet_proof_id");
    },
    async getWalletProof(id) {
      const row = await maybeSingleSupabase<StoredWalletProofRow>(client, "wallet_proofs", "wallet_proof_id", id);
      return row ? walletProofFromRow(row) : undefined;
    },
    async savePaymentProof(paymentProof) {
      await upsertSupabase(client, "payment_proofs", paymentProof, "payment_proof_id");
    },
    async getPaymentProof(id) {
      const row = await maybeSingleSupabase<PaymentProofRow>(client, "payment_proofs", "payment_proof_id", id);
      return row ? paymentProofFromRow(row) : undefined;
    },
    async saveLegalAnalysis(signatureRequestId, legalAnalysis) {
      await upsertSupabase(client, "legal_analyses", {
        legal_analysis_id: `analysis_${signatureRequestId}`,
        signature_request_id: signatureRequestId,
        notary_agent: legalAnalysis.notary_agent,
        signature_level: legalAnalysis.signature_level,
        risk_score: legalAnalysis.risk_score,
        requires_human_notary: legalAnalysis.requires_human_notary,
        summary: legalAnalysis.summary,
        checklist: legalAnalysis.checklist ?? [],
        risk_flags: legalAnalysis.risk_flags ?? [],
        created_at: new Date().toISOString(),
      }, "legal_analysis_id");
    },
    async getLegalAnalysis(signatureRequestId) {
      const row = await latestSupabase<LegalAnalysisRow>(client, "legal_analyses", "signature_request_id", signatureRequestId, "created_at");
      return row ? legalAnalysisFromRow(row) : undefined;
    },
    async saveAttestation(attestation) {
      await upsertSupabase(client, "attestations", attestation, "attestation_id");
    },
    async getAttestation(id) {
      const row = await maybeSingleSupabase<AttestationRow>(client, "attestations", "attestation_id", id);
      return row ? attestationFromRow(row) : undefined;
    },
    async saveHumanEscalation(record) {
      await upsertSupabase(client, "human_escalations", record, "escalation_id");
    },
    async saveDocumentRequest(record) {
      await upsertSupabase(client, "document_requests", record, "document_request_id");
    },
    async getDocumentRequest(id) {
      const row = await maybeSingleSupabase<DocumentRequestRow>(client, "document_requests", "document_request_id", id);
      return row ? documentRequestFromRow(row) : undefined;
    },
    async close() {},
  };
}

async function upsertSupabase(client: SupabaseAuditClient, table: string, row: object, onConflict: string) {
  const result = await client.from(table).upsert(row, { onConflict });
  if (result.error) {
    throw supabaseAuditError(`${table} upsert`, result.error);
  }
}

async function maybeSingleSupabase<T>(client: SupabaseAuditClient, table: string, column: string, value: string): Promise<T | undefined> {
  const result = await client.from(table).select("*").eq(column, value).maybeSingle();
  if (result.error) {
    throw supabaseAuditError(`${table} select`, result.error);
  }
  return (result.data ?? undefined) as T | undefined;
}

async function latestSupabase<T>(client: SupabaseAuditClient, table: string, column: string, value: string, orderColumn: string): Promise<T | undefined> {
  const result = await client.from(table).select("*").eq(column, value).order(orderColumn, { ascending: false }).limit(1).maybeSingle();
  if (result.error) {
    throw supabaseAuditError(`${table} select`, result.error);
  }
  return (result.data ?? undefined) as T | undefined;
}

function supabaseAuditError(operation: string, error: { code?: string }) {
  const wrapped = new Error(`Supabase audit operation failed: ${operation}`);
  wrapped.name = "SupabaseAuditError";
  if (error.code) {
    (wrapped as Error & { code?: string }).code = error.code;
  }
  return wrapped;
}

interface AgentProfileRow {
  agent_id: string;
  runtime: string;
  amoy_wallet: `0x${string}` | null;
  created_at: Date | string;
}

interface LegalIntentRow {
  legal_intent_id: string;
  agent_id: string;
  jurisdiction: "SV";
  input: string;
  document_type: string | null;
  parties: string[] | string;
  obligations: string[] | string;
  risk_flags: string[] | string;
  created_at: Date | string;
}

interface SignatureRequestRow {
  signature_request_id: string;
  agent_id: string;
  jurisdiction: "SV";
  document_hash: string;
  request_hash: string;
  legal_intent_id: string | null;
  requested_signature_level: number;
  status: SignatureRequest["status"];
  created_at: Date | string;
}

interface StoredWalletProofRow {
  wallet_proof_id: string;
  signature_request_id: string | null;
  agent_id: string;
  chain_id: number;
  wallet_address: `0x${string}`;
  message: string;
  signature: string;
  valid: boolean;
  created_at: Date | string;
}

interface PaymentProofRow extends PaymentProof {}

interface LegalAnalysisRow {
  notary_agent: "ElSalvadorNotaryAgent";
  signature_level: number;
  risk_score: string | number;
  requires_human_notary: boolean;
  summary: string;
  checklist: string[] | string;
  risk_flags: string[] | string;
}

interface AttestationRow {
  attestation_id: string;
  signature_request_id: string;
  request_hash: string;
  document_hash: string;
  jurisdiction: "SV";
  notary_agent: "ElSalvadorNotaryAgent";
  requesting_agent: Attestation["requesting_agent"];
  payments: Attestation["payments"];
  signature: Attestation["signature"];
  legal_analysis: Attestation["legal_analysis"];
  status: "issued";
  created_at: Date | string;
}

interface DocumentRequestRow {
  document_request_id: string;
  tipo_documento: string;
  comparecientes: any[] | string;
  detalles: Record<string, any> | string;
  jurisdiccion: "SV";
  created_at: Date | string;
}

function signatureRequestFromRow(row: SignatureRequestRow): SignatureRequest {
  return {
    signature_request_id: row.signature_request_id,
    agent_id: row.agent_id,
    jurisdiction: row.jurisdiction,
    document_hash: row.document_hash,
    request_hash: row.request_hash,
    legal_intent_id: row.legal_intent_id ?? undefined,
    requested_signature_level: row.requested_signature_level,
    status: row.status,
    created_at: dateString(row.created_at),
  };
}

function agentProfileFromRow(row: AgentProfileRow): AgentProfile {
  return {
    agent_id: row.agent_id,
    runtime: row.runtime,
    amoy_wallet: row.amoy_wallet ?? undefined,
    created_at: dateString(row.created_at),
  };
}

function legalIntentFromRow(row: LegalIntentRow): LegalIntent {
  return {
    legal_intent_id: row.legal_intent_id,
    agent_id: row.agent_id,
    jurisdiction: row.jurisdiction,
    input: row.input,
    document_type: row.document_type ?? undefined,
    parties: parseJsonArray(row.parties),
    obligations: parseJsonArray(row.obligations),
    risk_flags: parseJsonArray(row.risk_flags),
    created_at: dateString(row.created_at),
  };
}

function walletProofFromRow(row: StoredWalletProofRow): StoredWalletProof {
  return {
    wallet_proof_id: row.wallet_proof_id,
    signature_request_id: row.signature_request_id ?? undefined,
    agent_id: row.agent_id,
    chain_id: row.chain_id,
    wallet_address: row.wallet_address,
    message: row.message,
    signature: row.signature,
    valid: row.valid,
    created_at: dateString(row.created_at),
  };
}

function paymentProofFromRow(row: PaymentProofRow): PaymentProof {
  return {
    payment_proof_id: row.payment_proof_id,
    signature_request_id: row.signature_request_id,
    provider: row.provider,
    network: row.network,
    receipt: row.receipt,
    tx_hash: row.tx_hash,
    valid: row.valid,
    created_at: dateString(row.created_at),
  };
}

function legalAnalysisFromRow(row: LegalAnalysisRow): LegalAnalysis {
  return {
    notary_agent: row.notary_agent,
    signature_level: row.signature_level,
    risk_score: Number(row.risk_score),
    requires_human_notary: row.requires_human_notary,
    summary: row.summary,
    checklist: parseJsonArray(row.checklist),
    risk_flags: parseJsonArray(row.risk_flags),
  };
}

function attestationFromRow(row: AttestationRow): Attestation {
  return {
    attestation_id: row.attestation_id,
    signature_request_id: row.signature_request_id,
    request_hash: row.request_hash,
    document_hash: row.document_hash,
    jurisdiction: row.jurisdiction,
    notary_agent: row.notary_agent,
    requesting_agent: row.requesting_agent,
    payments: row.payments,
    signature: row.signature,
    legal_analysis: row.legal_analysis,
    status: row.status,
    created_at: dateString(row.created_at),
  };
}

function documentRequestFromRow(row: DocumentRequestRow): StoredDocumentRequest {
  return {
    document_request_id: row.document_request_id,
    tipo_documento: row.tipo_documento,
    comparecientes: Array.isArray(row.comparecientes) ? row.comparecientes : (parseJsonArray(row.comparecientes) as any[]),
    detalles: typeof row.detalles === "string" ? JSON.parse(row.detalles) as Record<string, any> : row.detalles,
    jurisdiccion: row.jurisdiccion,
    created_at: dateString(row.created_at),
  };
}

function dateString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : value;
}

function parseJsonArray(value: string[] | string): string[] {
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}
