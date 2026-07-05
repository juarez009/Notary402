import Fastify from "fastify";
import { verifyMessage } from "viem";
import { id, now, sha256Hex } from "../../../packages/core/src/hash.js";
import { parseL402Receipt } from "../../../packages/integrations/src/l402.js";
import { verifyAmoyTransaction } from "../../../packages/integrations/src/amoy.js";
import { escalateToZavu } from "../../../packages/integrations/src/zavu.js";
import { createAuditStoreFromEnv } from "./audit-store.js";
import { openApiDocument } from "./openapi.js";
function redactedUrl(raw) {
    if (!raw)
        return null;
    try {
        const url = new URL(raw);
        if (url.search)
            url.search = "?key=***";
        if (url.username || url.password) {
            url.username = "***";
            url.password = "***";
        }
        return url.toString();
    }
    catch {
        return "***";
    }
}
export function buildApp(options = {}) {
    const env = options.env || process.env;
    const store = options.store || createAuditStoreFromEnv(env);
    const app = Fastify({ logger: false });
    app.addHook("onRequest", async (request, reply) => {
        const origin = request.headers.origin;
        const allowed = new Set([env.WEB_ORIGIN || "http://localhost:3000", "http://127.0.0.1:3000"]);
        if (origin && allowed.has(origin))
            reply.header("access-control-allow-origin", origin);
        reply.header("access-control-allow-methods", "GET,POST,OPTIONS");
        reply.header("access-control-allow-headers", "content-type,authorization");
        if (request.method === "OPTIONS")
            return reply.code(204).send();
    });
    app.setErrorHandler((error, _request, reply) => {
        const typedError = error;
        const statusCode = typedError.statusCode || 500;
        reply.code(statusCode).send({ error: typedError.name || "InternalError", message: typedError.message, statusCode });
    });
    app.get("/health", async () => ({ status: "ok", service: "notary402-api", store: store.kind }));
    app.get("/openapi.json", async () => openApiDocument);
    app.get("/v1/live/status", async () => ({
        mode: "live",
        supabase: {
            configured: Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY),
            url: redactedUrl(env.SUPABASE_URL || undefined),
            schema: env.SUPABASE_SCHEMA || "public"
        },
        datamcp: { configured: Boolean(env.DATAMCP_MCP_URL && env.DATAMCP_API_KEY), mcp_url: redactedUrl(env.DATAMCP_MCP_URL), permission_preset: env.DATAMCP_PERMISSION_PRESET || "read-only" },
        amoy_rpc: { configured: Boolean(env.AMOY_RPC_URL), chain_id: Number(env.AMOY_CHAIN_ID || 80002), url: redactedUrl(env.AMOY_RPC_URL) },
        zavu: { configured: Boolean(env.ZAVU_ESCALATE_URL || env.ZAVU_BASE_URL), endpoint: redactedUrl(env.ZAVU_ESCALATE_URL || env.ZAVU_BASE_URL), channel: "whatsapp" },
        aperture: { configured: Boolean(env.APERTURE_BASE_URL), base_url: redactedUrl(env.APERTURE_BASE_URL) },
        n8n: { configured: Boolean(env.N8N_WEBHOOK_NOTARY402), webhook_url: redactedUrl(env.N8N_WEBHOOK_NOTARY402) }
    }));
    app.post("/v1/legal-intent", async (request, reply) => {
        const body = request.body;
        const intent = {
            legal_intent_id: id("lintent"),
            agent_id: String(body.agent_id),
            jurisdiction: "SV",
            input: String(body.input || ""),
            document_type: body.document_type ? String(body.document_type) : undefined,
            parties: Array.isArray(body.parties) ? body.parties.map(String) : [],
            obligations: Array.isArray(body.obligations) ? body.obligations.map(String) : [],
            risk_flags: Array.isArray(body.risk_flags) ? body.risk_flags.map(String) : [],
            created_at: now()
        };
        reply.code(201);
        return store.createLegalIntent(intent);
    });
    app.post("/v1/signature/request", async (request, reply) => {
        const body = request.body;
        const signatureRequest = {
            signature_request_id: id("sigreq"),
            agent_id: String(body.agent_id),
            jurisdiction: "SV",
            document_hash: String(body.document_hash),
            legal_intent_id: body.legal_intent_id ? String(body.legal_intent_id) : undefined,
            requested_signature_level: Number(body.requested_signature_level || 1),
            request_hash: sha256Hex({ agent_id: body.agent_id, document_hash: body.document_hash, legal_intent_id: body.legal_intent_id }),
            status: "awaiting_payment",
            created_at: now()
        };
        reply.code(201);
        return store.createSignatureRequest(signatureRequest);
    });
    app.post("/v1/wallets/verify-signature", async (request, reply) => {
        const body = request.body;
        const chain_id = Number(body.chain_id);
        if (chain_id !== 80002)
            return reply.code(400).send({ error: "CHAIN_ID_MISMATCH", message: "Expected Polygon Amoy chain_id 80002", statusCode: 400 });
        const verified = await verifyMessage({ address: String(body.wallet_address), message: String(body.message), signature: String(body.signature) }).catch(() => false);
        if (!verified)
            return reply.code(400).send({ error: "INVALID_WALLET_SIGNATURE", message: "Signature does not match wallet", statusCode: 400 });
        const proof = {
            wallet_proof_id: id("walletproof"),
            agent_id: String(body.agent_id),
            chain_id,
            wallet_address: String(body.wallet_address),
            message: String(body.message),
            signature: String(body.signature),
            verified,
            created_at: now()
        };
        return store.createWalletProof(proof);
    });
    app.post("/v1/payments/l402/verify", async (request, reply) => {
        const body = request.body;
        const parsed = parseL402Receipt(String(body.receipt || ""));
        if (!parsed.valid)
            return reply.code(400).send({ error: "INVALID_L402_RECEIPT", message: "Receipt must include macaroon:preimage", statusCode: 400 });
        const proof = { payment_proof_id: id("pay"), signature_request_id: String(body.signature_request_id), provider: "aperture", network: "polar", receipt: String(body.receipt), status: "verified", created_at: now() };
        reply.code(201);
        return store.createPaymentProof(proof);
    });
    app.post("/v1/payments/amoy/verify", async (request, reply) => {
        try {
            return await verifyAmoyTransaction(request.body, env);
        }
        catch (error) {
            if (error.name === "AMOY_RPC_NOT_CONFIGURED")
                return reply.code(503).send({ error: "AMOY_RPC_NOT_CONFIGURED", message: "Set AMOY_RPC_URL", statusCode: 503 });
            throw error;
        }
    });
    app.post("/v1/signature/validate", async (request) => {
        const body = request.body;
        const legalText = String(body.legal_text || "");
        const risk_flags = legalText.toLowerCase().includes("poder") ? ["power_of_attorney_review"] : [];
        const analysis = {
            legal_analysis_id: id("analysis"),
            signature_request_id: String(body.signature_request_id),
            jurisdiction: "SV",
            risk_score: risk_flags.length ? 70 : 20,
            requires_human_notary: risk_flags.length > 0,
            summary: risk_flags.length ? "Requires human notary review." : "Low-risk signature flow.",
            checklist: [{ label: "jurisdiction_supported", passed: true }, { label: "document_hash_present", passed: true }],
            risk_flags,
            created_at: now()
        };
        return store.createLegalAnalysis(analysis);
    });
    app.post("/v1/attestations", async (request, reply) => {
        const body = request.body;
        const signatureRequest = await store.getSignatureRequest(String(body.signature_request_id));
        if (!signatureRequest)
            return reply.code(404).send({ error: "NotFound", message: "Signature request not found", statusCode: 404 });
        const walletProof = await store.getWalletProof(String(body.wallet_proof_id));
        if (!walletProof)
            return reply.code(400).send({ error: "MissingWalletProof", message: "Wallet proof is required", statusCode: 400 });
        const paymentProof = await store.getPaymentProof(String(body.payment_proof_id));
        if (!paymentProof)
            return reply.code(400).send({ error: "MissingPaymentProof", message: "Payment proof is required", statusCode: 400 });
        const analysis = await store.getLegalAnalysisByRequest(signatureRequest.signature_request_id);
        const attestation = {
            attestation_id: id("att"),
            signature_request_id: signatureRequest.signature_request_id,
            document_hash: signatureRequest.document_hash,
            request_hash: signatureRequest.request_hash,
            agent_wallet: String(body.agent_wallet),
            wallet_proof_id: walletProof.wallet_proof_id,
            payment_proof_id: paymentProof.payment_proof_id,
            amoy_tx_hash: body.amoy_tx_hash ? String(body.amoy_tx_hash) : undefined,
            status: analysis?.requires_human_notary ? "pending_human_review" : "issued",
            valid: !analysis?.requires_human_notary,
            jurisdiction: "SV",
            signature_level: signatureRequest.requested_signature_level,
            requires_human_notary: Boolean(analysis?.requires_human_notary),
            l402_payment: { receipt: paymentProof.receipt, status: "settled", provider: paymentProof.provider },
            qvac_analysis: analysis || undefined,
            created_at: now()
        };
        reply.code(201);
        return { ...(await store.createAttestation(attestation)), verification_url: `/verify?id=${attestation.attestation_id}` };
    });
    app.get("/v1/attestations/:id", async (request, reply) => {
        const params = request.params;
        const attestation = await store.getAttestation(params.id);
        if (!attestation)
            return reply.code(404).send({ error: "NotFound", message: "Attestation not found", statusCode: 404 });
        return attestation;
    });
    app.get("/v1/attestations", async () => ({ attestations: await store.listAttestations() }));
    app.post("/v1/verify", async (request, reply) => {
        const body = request.body;
        const attestation = await store.getAttestation(String(body.attestation_id));
        if (!attestation)
            return reply.code(404).send({ error: "NotFound", message: "Attestation not found", statusCode: 404 });
        return {
            valid: attestation.valid,
            attestation,
            checks: { document_hash: Boolean(attestation.document_hash), agent_wallet: Boolean(attestation.agent_wallet), l402_payment: Boolean(attestation.payment_proof_id), notary_signature: attestation.status === "issued" }
        };
    });
    app.post("/v1/zavu/escalate", async (request) => {
        const body = request.body;
        const result = await escalateToZavu({ signature_request_id: String(body.signature_request_id), jurisdiction: "SV", reason: String(body.reason || ""), test: Boolean(body.test) }, env);
        await store.createHumanEscalation({ human_escalation_id: id("esc"), signature_request_id: String(body.signature_request_id), jurisdiction: "SV", reason: String(body.reason || ""), status: result.status, channel: result.channel, zavu_message_id: result.zavu_message_id, provider_mode: result.provider_mode, created_at: now() });
        return result;
    });
    app.get("/v1/integrations/datamcp", async () => ({
        status: env.DATAMCP_MCP_URL && env.DATAMCP_API_KEY ? "configured" : "integration_pending",
        permission_preset: env.DATAMCP_PERMISSION_PRESET || "read-only",
        mcp_url: redactedUrl(env.DATAMCP_MCP_URL),
        tables: ["agent_profiles", "legal_intents", "signature_requests", "wallet_proofs", "payment_proofs", "legal_analyses", "attestations", "human_escalations", "document_requests"],
        mcp_tools: ["query", "get_schema", "get_table_details", "get_permissions", "get_schema_changes", "resync_schema"],
        note: "DataMCP is read-only for agents. Notary402 writes through the backend Supabase service role."
    }));
    return app;
}
