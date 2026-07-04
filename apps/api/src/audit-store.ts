import type { AgentProfile, Attestation, LegalAnalysis, LegalIntent, PaymentProof, SignatureRequest, WalletProof } from "../../../packages/core/src/index.ts";
import { Pool, type QueryResultRow } from "pg";

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
  if (!env.POSTGRES_URL) {
    return createMemoryAuditStore();
  }
  return createPostgresAuditStore(env.POSTGRES_URL);
}

export function createPostgresAuditStore(connectionString: string): AuditStore {
  const pool = new Pool({ connectionString });

  return {
    async saveAgentProfile(agentProfile) {
      await pool.query(
        `insert into agent_profiles (agent_id, runtime, amoy_wallet, created_at)
         values ($1,$2,$3,$4)
         on conflict (agent_id) do update set runtime = excluded.runtime, amoy_wallet = excluded.amoy_wallet`,
        [agentProfile.agent_id, agentProfile.runtime, agentProfile.amoy_wallet ?? null, agentProfile.created_at],
      );
    },
    async getAgentProfile(agentId) {
      const result = await pool.query<AgentProfileRow>("select * from agent_profiles where agent_id = $1", [agentId]);
      return result.rows[0] ? agentProfileFromRow(result.rows[0]) : undefined;
    },
    async saveLegalIntent(legalIntent) {
      await pool.query(
        `insert into legal_intents (legal_intent_id, agent_id, jurisdiction, input, document_type, parties, obligations, risk_flags, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (legal_intent_id) do update set input = excluded.input`,
        [
          legalIntent.legal_intent_id,
          legalIntent.agent_id,
          legalIntent.jurisdiction,
          legalIntent.input,
          legalIntent.document_type ?? null,
          JSON.stringify(legalIntent.parties),
          JSON.stringify(legalIntent.obligations),
          JSON.stringify(legalIntent.risk_flags),
          legalIntent.created_at,
        ],
      );
    },
    async getLegalIntent(id) {
      const result = await pool.query<LegalIntentRow>("select * from legal_intents where legal_intent_id = $1", [id]);
      return result.rows[0] ? legalIntentFromRow(result.rows[0]) : undefined;
    },
    async saveSignatureRequest(signatureRequest) {
      await pool.query(
        `insert into signature_requests (signature_request_id, agent_id, jurisdiction, document_hash, request_hash, legal_intent_id, requested_signature_level, status, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (signature_request_id) do update set status = excluded.status`,
        [
          signatureRequest.signature_request_id,
          signatureRequest.agent_id,
          signatureRequest.jurisdiction,
          signatureRequest.document_hash,
          signatureRequest.request_hash,
          signatureRequest.legal_intent_id ?? null,
          signatureRequest.requested_signature_level,
          signatureRequest.status,
          signatureRequest.created_at,
        ],
      );
    },
    async getSignatureRequest(id) {
      const result = await pool.query<SignatureRequestRow>("select * from signature_requests where signature_request_id = $1", [id]);
      return result.rows[0] ? signatureRequestFromRow(result.rows[0]) : undefined;
    },
    async saveWalletProof(walletProof) {
      await pool.query(
        `insert into wallet_proofs (wallet_proof_id, signature_request_id, agent_id, chain_id, wallet_address, message, signature, valid, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9)
         on conflict (wallet_proof_id) do update set valid = excluded.valid`,
        [
          walletProof.wallet_proof_id,
          walletProof.signature_request_id ?? null,
          walletProof.agent_id,
          walletProof.chain_id,
          walletProof.wallet_address,
          walletProof.message ?? "",
          walletProof.signature ?? "",
          walletProof.valid,
          walletProof.created_at,
        ],
      );
    },
    async getWalletProof(id) {
      const result = await pool.query<StoredWalletProofRow>("select * from wallet_proofs where wallet_proof_id = $1", [id]);
      return result.rows[0] ? walletProofFromRow(result.rows[0]) : undefined;
    },
    async savePaymentProof(paymentProof) {
      await pool.query(
        `insert into payment_proofs (payment_proof_id, signature_request_id, provider, network, receipt, tx_hash, valid, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (payment_proof_id) do update set valid = excluded.valid`,
        [
          paymentProof.payment_proof_id,
          paymentProof.signature_request_id,
          paymentProof.provider,
          paymentProof.network,
          paymentProof.receipt,
          paymentProof.tx_hash ?? null,
          paymentProof.valid,
          paymentProof.created_at,
        ],
      );
    },
    async getPaymentProof(id) {
      const result = await pool.query<PaymentProofRow>("select * from payment_proofs where payment_proof_id = $1", [id]);
      return result.rows[0] ? paymentProofFromRow(result.rows[0]) : undefined;
    },
    async saveLegalAnalysis(signatureRequestId, legalAnalysis) {
      await pool.query(
        `insert into legal_analyses (legal_analysis_id, signature_request_id, notary_agent, signature_level, risk_score, requires_human_notary, summary, checklist, risk_flags, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         on conflict (legal_analysis_id) do update set risk_score = excluded.risk_score, summary = excluded.summary`,
        [
          `analysis_${signatureRequestId}`,
          signatureRequestId,
          legalAnalysis.notary_agent,
          legalAnalysis.signature_level,
          legalAnalysis.risk_score,
          legalAnalysis.requires_human_notary,
          legalAnalysis.summary,
          JSON.stringify(legalAnalysis.checklist ?? []),
          JSON.stringify(legalAnalysis.risk_flags ?? []),
          new Date().toISOString(),
        ],
      );
    },
    async getLegalAnalysis(signatureRequestId) {
      const result = await pool.query<LegalAnalysisRow>("select * from legal_analyses where signature_request_id = $1 order by created_at desc limit 1", [signatureRequestId]);
      return result.rows[0] ? legalAnalysisFromRow(result.rows[0]) : undefined;
    },
    async saveAttestation(attestation) {
      await pool.query(
        `insert into attestations (attestation_id, signature_request_id, request_hash, document_hash, jurisdiction, notary_agent, requesting_agent, payments, signature, legal_analysis, status, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
         on conflict (attestation_id) do update set status = excluded.status`,
        [
          attestation.attestation_id,
          attestation.signature_request_id,
          attestation.request_hash,
          attestation.document_hash,
          attestation.jurisdiction,
          attestation.notary_agent,
          JSON.stringify(attestation.requesting_agent),
          JSON.stringify(attestation.payments),
          JSON.stringify(attestation.signature),
          JSON.stringify(attestation.legal_analysis),
          attestation.status,
          attestation.created_at,
        ],
      );
    },
    async getAttestation(id) {
      const result = await pool.query<AttestationRow>("select * from attestations where attestation_id = $1", [id]);
      return result.rows[0] ? attestationFromRow(result.rows[0]) : undefined;
    },
    async saveHumanEscalation(record) {
      await pool.query(
        `insert into human_escalations (escalation_id, signature_request_id, jurisdiction, reason, channel, zavu_message_id, status, created_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8)
         on conflict (escalation_id) do update set status = excluded.status`,
        [record.escalation_id, record.signature_request_id, record.jurisdiction, record.reason, record.channel, record.zavu_message_id, record.status, record.created_at],
      );
    },
    async saveDocumentRequest(record) {
      await pool.query(
        `insert into document_requests (document_request_id, tipo_documento, comparecientes, detalles, jurisdiccion, created_at)
         values ($1,$2,$3,$4,$5,$6)
         on conflict (document_request_id) do update set detalles = excluded.detalles`,
        [record.document_request_id, record.tipo_documento, JSON.stringify(record.comparecientes), JSON.stringify(record.detalles), record.jurisdiccion, record.created_at],
      );
    },
    async getDocumentRequest(id) {
      const result = await pool.query<DocumentRequestRow>("select * from document_requests where document_request_id = $1", [id]);
      return result.rows[0] ? documentRequestFromRow(result.rows[0]) : undefined;
    },
    async close() {
      await pool.end();
    },
  };
}

interface AgentProfileRow extends QueryResultRow {
  agent_id: string;
  runtime: string;
  amoy_wallet: `0x${string}` | null;
  created_at: Date | string;
}

interface LegalIntentRow extends QueryResultRow {
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

interface SignatureRequestRow extends QueryResultRow {
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

interface StoredWalletProofRow extends QueryResultRow {
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

interface PaymentProofRow extends QueryResultRow, PaymentProof {}
interface LegalAnalysisRow extends QueryResultRow {
  notary_agent: "ElSalvadorNotaryAgent";
  signature_level: number;
  risk_score: string | number;
  requires_human_notary: boolean;
  summary: string;
  checklist: string[] | string;
  risk_flags: string[] | string;
}
interface AttestationRow extends QueryResultRow {
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

interface DocumentRequestRow extends QueryResultRow {
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
    comparecientes: Array.isArray(row.comparecientes) ? row.comparecientes : (parseJsonArray(row.comparecientes as string) as any[]),
    detalles: typeof row.detalles === "string" ? (JSON.parse(row.detalles) as Record<string, any>) : row.detalles,
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
