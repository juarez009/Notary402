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
// Strips URLs down to their origin so upstream errors (RPC providers, webhooks,
// DataMCP) never leak path/query credentials into API responses.
function sanitizeErrorMessage(message) {
    return message.replace(/https?:\/\/[^\s"'<>]+/g, (raw) => {
        try {
            return `${new URL(raw).origin}/***`;
        }
        catch {
            return "***";
        }
    });
}
const requiredString = { type: "string", minLength: 1 };
const stringArray = { type: "array", items: { type: "string" } };
const hexAddress = { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" };
const hexData = { type: "string", pattern: "^0x[0-9a-fA-F]+$" };
const bodySchemas = {
    legalIntent: {
        type: "object",
        required: ["agent_id", "input"],
        properties: {
            agent_id: requiredString,
            jurisdiction: { type: "string", enum: ["SV"] },
            input: requiredString,
            document_type: { type: "string" },
            parties: stringArray,
            obligations: stringArray,
            risk_flags: stringArray
        }
    },
    signatureRequest: {
        type: "object",
        required: ["agent_id", "document_hash"],
        properties: {
            agent_id: requiredString,
            jurisdiction: { type: "string", enum: ["SV"] },
            document_hash: requiredString,
            legal_intent_id: { type: "string" },
            requested_signature_level: { type: "integer", minimum: 1, maximum: 3 }
        }
    },
    walletVerify: {
        type: "object",
        required: ["agent_id", "chain_id", "wallet_address", "message", "signature"],
        properties: {
            agent_id: requiredString,
            chain_id: { type: "integer" },
            wallet_address: hexAddress,
            message: requiredString,
            signature: hexData
        }
    },
    l402Verify: {
        type: "object",
        required: ["signature_request_id", "receipt"],
        properties: {
            signature_request_id: requiredString,
            receipt: requiredString
        }
    },
    amoyVerify: {
        type: "object",
        required: ["chain_id", "tx_hash", "expected_sender", "expected_recipient"],
        properties: {
            chain_id: { type: "integer" },
            tx_hash: { type: "string", pattern: "^0x[0-9a-fA-F]{64}$" },
            expected_sender: hexAddress,
            expected_recipient: hexAddress
        }
    },
    signatureValidate: {
        type: "object",
        required: ["signature_request_id"],
        properties: {
            signature_request_id: requiredString,
            jurisdiction: { type: "string", enum: ["SV"] },
            legal_text: { type: "string" }
        }
    },
    attestationCreate: {
        type: "object",
        required: ["signature_request_id", "wallet_proof_id", "payment_proof_id", "agent_wallet"],
        properties: {
            signature_request_id: requiredString,
            wallet_proof_id: requiredString,
            payment_proof_id: requiredString,
            agent_wallet: hexAddress,
            amoy_tx_hash: { type: "string", pattern: "^0x[0-9a-fA-F]{64}$" }
        }
    },
    verify: {
        type: "object",
        required: ["attestation_id"],
        properties: { attestation_id: requiredString }
    },
    zavuEscalate: {
        type: "object",
        required: ["signature_request_id", "reason"],
        properties: {
            signature_request_id: requiredString,
            reason: requiredString,
            test: { type: "boolean" }
        }
    }
};
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
        if (typedError.validation) {
            return reply.code(400).send({ error: "VALIDATION_ERROR", message: typedError.message, statusCode: 400 });
        }
        const supabaseMatch = /^SUPABASE_(.+)_([^_:]+):/.exec(typedError.message || "");
        if (supabaseMatch) {
            const table = supabaseMatch[1].toLowerCase();
            const code = supabaseMatch[2];
            const missingTable = code === "PGRST205" || code === "42P01";
            return reply.code(502).send({
                error: "AUDIT_STORE_ERROR",
                message: missingTable
                    ? `Supabase table '${table}' is missing. Apply docs/postgres-audit-schema.sql in the Supabase SQL Editor.`
                    : `Supabase request failed for table '${table}' (code ${code}). Check the applied schema and service role permissions.`,
                statusCode: 502
            });
        }
        const zavuMatch = /^ZAVU_ESCALATION_FAILED_(\d+)$/.exec(typedError.message || "");
        if (zavuMatch) {
            return reply.code(502).send({
                error: "ZAVU_ESCALATION_FAILED",
                message: `Zavu escalation endpoint returned HTTP ${zavuMatch[1]}. Check ZAVU_ESCALATE_URL/ZAVU_BASE_URL and ZAVU_API_KEY.`,
                statusCode: 502
            });
        }
        const statusCode = typedError.statusCode || 500;
        reply.code(statusCode).send({
            error: typedError.name || "InternalError",
            message: sanitizeErrorMessage(typedError.message || "Unexpected error"),
            statusCode
        });
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
        n8n: {
            configured: Boolean(env.N8N_WEBHOOK_NOTARY402 || (env.N8N_BASE_URL && env.N8N_API_KEY) || env.N8N_MCP_URL),
            base_url: redactedUrl(env.N8N_BASE_URL),
            mcp_url: redactedUrl(env.N8N_MCP_URL),
            webhook_url: redactedUrl(env.N8N_WEBHOOK_NOTARY402)
        }
    }));
    app.post("/v1/legal-intent", { schema: { body: bodySchemas.legalIntent } }, async (request, reply) => {
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
    app.post("/v1/documents/request", async (request, reply) => {
        const body = (request.body || {});
        const docReq = {
            document_request_id: id("docreq"),
            tipo_documento: String(body.tipo_documento || "COMPRAVENTA"),
            jurisdiccion: "SV",
            comparecientes: Array.isArray(body.comparecientes) ? body.comparecientes : [],
            detalles: typeof body.detalles === "object" && body.detalles ? body.detalles : {},
            status: "created",
            created_at: now()
        };
        reply.code(201);
        return store.createDocumentRequest(docReq);
    });
    app.post("/v1/signature/request", { schema: { body: bodySchemas.signatureRequest } }, async (request, reply) => {
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
    app.post("/v1/wallets/verify-signature", { schema: { body: bodySchemas.walletVerify } }, async (request, reply) => {
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
    app.post("/v1/payments/l402/verify", { schema: { body: bodySchemas.l402Verify } }, async (request, reply) => {
        const body = request.body;
        const parsed = parseL402Receipt(String(body.receipt || ""));
        if (!parsed.valid)
            return reply.code(400).send({ error: "INVALID_L402_RECEIPT", message: "Receipt must include macaroon:preimage", statusCode: 400 });
        const proof = { payment_proof_id: id("pay"), signature_request_id: String(body.signature_request_id), provider: "aperture", network: "polar", receipt: String(body.receipt), status: "verified", created_at: now() };
        reply.code(201);
        return store.createPaymentProof(proof);
    });
    app.post("/v1/payments/amoy/verify", { schema: { body: bodySchemas.amoyVerify } }, async (request, reply) => {
        try {
            return await verifyAmoyTransaction(request.body, env);
        }
        catch (error) {
            if (error.name === "AMOY_RPC_NOT_CONFIGURED")
                return reply.code(503).send({ error: "AMOY_RPC_NOT_CONFIGURED", message: "Set AMOY_RPC_URL", statusCode: 503 });
            throw error;
        }
    });
    app.post("/v1/signature/validate", { schema: { body: bodySchemas.signatureValidate } }, async (request) => {
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
    app.post("/v1/attestations", { schema: { body: bodySchemas.attestationCreate } }, async (request, reply) => {
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
    app.get("/v1/attestations/:id/timeline", async (request, reply) => {
        const params = request.params;
        const attestation = await store.getAttestation(params.id);
        if (!attestation)
            return reply.code(404).send({ error: "NotFound", message: "Attestation not found", statusCode: 404 });
        const signatureRequest = await store.getSignatureRequest(attestation.signature_request_id);
        const legalIntent = signatureRequest?.legal_intent_id ? await store.getLegalIntent(signatureRequest.legal_intent_id) : null;
        const walletProof = await store.getWalletProof(attestation.wallet_proof_id);
        const paymentProof = await store.getPaymentProof(attestation.payment_proof_id);
        const legalAnalysis = await store.getLegalAnalysisByRequest(attestation.signature_request_id);
        const escalations = await store.findHumanEscalationsByRequest(attestation.signature_request_id);
        const events = [
            legalIntent && {
                step: "legal_intent",
                ref_id: legalIntent.legal_intent_id,
                at: legalIntent.created_at,
                summary: legalIntent.document_type ? `Legal intent (${legalIntent.document_type})` : "Legal intent registered",
                data: legalIntent
            },
            signatureRequest && {
                step: "signature_request",
                ref_id: signatureRequest.signature_request_id,
                at: signatureRequest.created_at,
                summary: `Signature request level ${signatureRequest.requested_signature_level}`,
                data: signatureRequest
            },
            walletProof && {
                step: "wallet_proof",
                ref_id: walletProof.wallet_proof_id,
                at: walletProof.created_at,
                summary: `Wallet ${walletProof.wallet_address} verified on chain ${walletProof.chain_id}`,
                data: walletProof
            },
            paymentProof && {
                step: "payment_proof",
                ref_id: paymentProof.payment_proof_id,
                at: paymentProof.created_at,
                summary: `L402 payment ${paymentProof.status} via ${paymentProof.provider}`,
                data: paymentProof
            },
            legalAnalysis && {
                step: "legal_analysis",
                ref_id: legalAnalysis.legal_analysis_id,
                at: legalAnalysis.created_at,
                summary: `Risk score ${legalAnalysis.risk_score}${legalAnalysis.requires_human_notary ? " — requires human notary" : ""}`,
                data: legalAnalysis
            },
            {
                step: "attestation",
                ref_id: attestation.attestation_id,
                at: attestation.created_at,
                summary: `Attestation ${attestation.status}`,
                data: attestation
            },
            ...escalations.map((escalation) => ({
                step: "human_escalation",
                ref_id: escalation.human_escalation_id,
                at: escalation.created_at,
                summary: `Escalated to human notary (${escalation.channel}, ${escalation.provider_mode})`,
                data: escalation
            }))
        ].filter(Boolean);
        events.sort((a, b) => a.at.localeCompare(b.at));
        return {
            attestation_id: attestation.attestation_id,
            status: attestation.status,
            valid: attestation.valid,
            verification_url: `/verify?id=${attestation.attestation_id}`,
            events
        };
    });
    app.post("/v1/verify", { schema: { body: bodySchemas.verify } }, async (request, reply) => {
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
    app.post("/v1/zavu/escalate", { schema: { body: bodySchemas.zavuEscalate } }, async (request) => {
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
