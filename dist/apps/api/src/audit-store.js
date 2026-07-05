import { createClient } from "@supabase/supabase-js";
export function createMemoryAuditStore() {
    const agentProfiles = new Map();
    const legalIntents = new Map();
    const signatureRequests = new Map();
    const walletProofs = new Map();
    const paymentProofs = new Map();
    const legalAnalyses = new Map();
    const attestations = new Map();
    const humanEscalations = new Map();
    const documentRequests = new Map();
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
function supabaseError(table, error) {
    if (!error)
        return new Error(`SUPABASE_${table.toUpperCase()}_UNKNOWN_ERROR`);
    return new Error(`SUPABASE_${table.toUpperCase()}_${error.code || "ERROR"}: ${error.message || "request failed"}`);
}
export function createSupabaseAuditStoreFromClient(client) {
    async function upsert(table, row) {
        const { data, error } = await client.from(table).upsert(row).select().single();
        if (error)
            throw supabaseError(table, error);
        return data;
    }
    async function maybe(table, column, value) {
        const { data, error } = await client.from(table).select("*").eq(column, value).maybeSingle();
        if (error)
            throw supabaseError(table, error);
        return data;
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
            if (error)
                throw supabaseError("attestations", error);
            return data;
        },
        createHumanEscalation: (row) => upsert("human_escalations", row),
        async findHumanEscalationsByRequest(signatureRequestId) {
            const { data, error } = await client.from("human_escalations").select("*").eq("signature_request_id", signatureRequestId).order("created_at", { ascending: true });
            if (error)
                throw supabaseError("human_escalations", error);
            return data;
        },
        createDocumentRequest: (row) => upsert("document_requests", row)
    };
}
export function createSupabaseAuditStore(env = process.env) {
    const client = createClient(env.SUPABASE_URL || "", env.SUPABASE_SERVICE_ROLE_KEY || "", {
        db: { schema: env.SUPABASE_SCHEMA || "public" },
        auth: { persistSession: false, autoRefreshToken: false }
    });
    return createSupabaseAuditStoreFromClient(client);
}
export function createAuditStoreFromEnv(env = process.env) {
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY)
        return createSupabaseAuditStore(env);
    return createMemoryAuditStore();
}
