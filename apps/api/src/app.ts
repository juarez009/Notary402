import Fastify, { type FastifyServerOptions } from "fastify";
import {
  analyzeLegalSignature,
  createAttestation,
  createLegalIntent,
  createSignatureRequest,
  verifyAttestation,
  verifyWalletSignature,
  type CreateLegalIntentInput,
  type CreateSignatureRequestInput,
  type VerifyWalletSignatureInput,
} from "../../../packages/core/src/index.ts";
import { createAmoyVerifier, type AmoyVerifier, type VerifyAmoyTransactionInput } from "../../../packages/integrations/src/amoy.ts";
import { parseL402PaymentProof, type ParseL402PaymentProofInput } from "../../../packages/integrations/src/l402.ts";
import { createQvacLegalAnalyzer, type LegalAnalyzer } from "../../../packages/integrations/src/qvac.ts";
import { createZavuClientFromEnv, type ZavuClient, type ZavuEscalationInput } from "../../../packages/integrations/src/zavu.ts";
import {
  amoyVerifyBodySchema,
  attestationCreateBodySchema,
  errorResponseSchema,
  l402VerifyBodySchema,
  legalIntentBodySchema,
  signatureRequestBodySchema,
  signatureValidateBodySchema,
  verifyBodySchema,
  walletVerifyBodySchema,
  zavuEscalateBodySchema,
} from "./schemas.ts";
import { createDataMcpFlowPlan, readDataMcpConfig, type DataMcpConfig } from "./datamcp.ts";
import { createAuditStoreFromEnv, type AuditStore } from "./audit-store.ts";
import { notary402OpenApi } from "./openapi.ts";

export interface BuildAppOptions extends FastifyServerOptions {
  datamcp?: DataMcpConfig;
  legalAnalyzer?: LegalAnalyzer;
  zavuClient?: ZavuClient;
  amoyVerifier?: AmoyVerifier;
  auditStore?: AuditStore;
  env?: NodeJS.ProcessEnv;
}

export function buildApp(options: BuildAppOptions = {}) {
  const { datamcp, legalAnalyzer, zavuClient, amoyVerifier, auditStore, env, ...fastifyOptions } = options;
  const appEnv = env ?? process.env;
  const app = Fastify({
    logger: true,
    ...fastifyOptions,
  });
  const store = auditStore ?? createAuditStoreFromEnv(appEnv);
  const dataMcpConfig = datamcp ?? readDataMcpConfig(appEnv);
  const analyzeSignature = legalAnalyzer ?? createSafeLegalAnalyzer(createQvacLegalAnalyzer());
  const zavu = zavuClient ?? createZavuClientFromEnv(appEnv);
  const amoy = amoyVerifier ?? createAmoyVerifier({ rpcUrl: appEnv.AMOY_RPC_URL });

  app.addHook("onRequest", async (request, reply) => {
    applyCorsHeaders(request.headers.origin, reply);
    if (request.method === "OPTIONS") {
      reply.code(204).send();
    }
  });

  app.addHook("onClose", async () => {
    await store.close();
  });

  app.setErrorHandler((error, _request, reply) => {
    const fastifyError = error as Error & { statusCode?: number };
    const statusCode = fastifyError.statusCode ?? 500;
    reply.code(statusCode).send({
      error: fastifyError.name,
      message: fastifyError.message,
      statusCode,
    });
  });

  app.get("/health", {
    schema: {
      response: {
        200: {
          type: "object",
          properties: {
            status: { type: "string" },
            service: { type: "string" },
          },
          required: ["status", "service"],
        },
      },
    },
  }, async () => ({
    status: "ok",
    service: "notary402-api",
  }));

  app.get("/v1/integrations/datamcp", async () => createDataMcpFlowPlan(dataMcpConfig));

  app.get("/openapi.json", async () => notary402OpenApi);

  app.get("/v1/live/status", async () => createLiveStatus(appEnv, dataMcpConfig));

  app.post<{ Body: CreateLegalIntentInput }>("/v1/legal-intent", {
    schema: {
      body: legalIntentBodySchema,
      response: { 400: errorResponseSchema },
    },
  }, async (request, reply) => {
    const legalIntent = createLegalIntent(request.body);
    await store.saveAgentProfile({
      agent_id: request.body.agent_id,
      runtime: "agentic_mvp",
      created_at: new Date(0).toISOString(),
    });
    await store.saveLegalIntent(legalIntent);
    reply.code(201);
    return legalIntent;
  });

  app.post<{ Body: CreateSignatureRequestInput }>("/v1/signature/request", {
    schema: {
      body: signatureRequestBodySchema,
      response: { 400: errorResponseSchema },
    },
  }, async (request, reply) => {
    const signatureRequest = createSignatureRequest(request.body);
    await store.saveSignatureRequest(signatureRequest);
    reply.code(201);
    return signatureRequest;
  });

  app.post<{ Body: VerifyWalletSignatureInput }>("/v1/wallets/verify-signature", {
    schema: {
      body: walletVerifyBodySchema,
      response: { 400: errorResponseSchema },
    },
  }, async (request, reply) => {
    const proof = await verifyWalletSignature(request.body);
    const walletProofId = `walletproof_${proof.wallet_address.slice(2, 14).toLowerCase()}`;
    await store.saveWalletProof({
      wallet_proof_id: walletProofId,
      agent_id: proof.agent_id,
      chain_id: proof.chain_id,
      wallet_address: proof.wallet_address,
      valid: proof.valid,
      message: request.body.message,
      signature: request.body.signature,
      created_at: new Date(0).toISOString(),
    });
    reply.code(proof.valid ? 200 : 400);
    return {
      wallet_proof_id: walletProofId,
      ...proof,
    };
  });

  app.post<{ Body: ParseL402PaymentProofInput }>("/v1/payments/l402/verify", {
    schema: {
      body: l402VerifyBodySchema,
      response: { 400: errorResponseSchema, 404: errorResponseSchema },
    },
  }, async (request, reply) => {
    const signatureRequest = await store.getSignatureRequest(request.body.signature_request_id);
    if (!signatureRequest) {
      reply.code(404);
      return { error: "NotFound", message: "Signature request not found", statusCode: 404 };
    }
    const proof = parseL402PaymentProof(request.body);
    await store.savePaymentProof(proof);
    reply.code(201);
    return proof;
  });

  app.post<{ Body: VerifyAmoyTransactionInput }>("/v1/payments/amoy/verify", {
    schema: {
      body: amoyVerifyBodySchema,
      response: { 503: errorResponseSchema },
    },
  }, async (request, reply) => {
    const proof = await amoy.verifyTransaction(request.body);
    if (!proof.valid && proof.error === "AMOY_RPC_NOT_CONFIGURED") {
      reply.code(503);
      return { error: proof.error, message: "AMOY_RPC_URL is required to verify Polygon Amoy transactions.", statusCode: 503 };
    }
    reply.code(proof.valid ? 200 : 400);
    return proof;
  });

  app.post<{ Body: { signature_request_id: string; jurisdiction: "SV"; legal_text?: string } }>("/v1/signature/validate", {
    schema: {
      body: signatureValidateBodySchema,
      response: { 404: errorResponseSchema },
    },
  }, async (request, reply) => {
    const signatureRequest = await store.getSignatureRequest(request.body.signature_request_id);
    if (!signatureRequest) {
      reply.code(404);
      return {
        error: "NotFound",
        message: "Signature request not found",
        statusCode: 404,
      };
    }

    const analysis = await analyzeSignature({
      signatureRequest,
      legalText: request.body.legal_text,
    });
    await store.saveLegalAnalysis(signatureRequest.signature_request_id, analysis);
    return analysis;
  });

  app.post<{
    Body: {
      signature_request_id: string;
      wallet_proof_id: string;
      payment_proof_id?: string;
      l402_receipt?: string;
      agent_wallet: `0x${string}`;
      amoy_tx_hash?: string;
    };
  }>("/v1/attestations", {
    schema: {
      body: attestationCreateBodySchema,
      response: { 404: errorResponseSchema },
    },
  }, async (request, reply) => {
    const signatureRequest = await store.getSignatureRequest(request.body.signature_request_id);
    if (!signatureRequest) {
      reply.code(404);
      return {
        error: "NotFound",
        message: "Signature request not found",
        statusCode: 404,
      };
    }

    const walletProof = await store.getWalletProof(request.body.wallet_proof_id);
    const paymentProof = request.body.payment_proof_id
      ? await store.getPaymentProof(request.body.payment_proof_id)
      : undefined;
    if (!walletProof?.valid) {
      reply.code(400);
      return { error: "MissingWalletProof", message: "A valid wallet proof is required before issuing an attestation.", statusCode: 400 };
    }
    if (!paymentProof?.valid && !request.body.l402_receipt) {
      reply.code(400);
      return { error: "MissingPaymentProof", message: "A valid L402 payment proof is required before issuing an attestation.", statusCode: 400 };
    }

    const legalAnalysis = await store.getLegalAnalysis(signatureRequest.signature_request_id) ?? analyzeLegalSignature();
    const attestation = createAttestation({
      signature_request: signatureRequest,
      wallet_proof_id: request.body.wallet_proof_id,
      l402_receipt: paymentProof?.receipt ?? request.body.l402_receipt ?? "",
      agent_wallet: request.body.agent_wallet,
      legal_analysis: legalAnalysis,
      amoy_tx_hash: request.body.amoy_tx_hash,
    });

    await store.saveAttestation(attestation);
    reply.code(201);
    return {
      ...attestation,
      verification_url: `http://localhost:3000/verify/${attestation.attestation_id}`,
    };
  });

  app.get<{ Params: { id: string } }>("/v1/attestations/:id", async (request, reply) => {
    const attestation = await store.getAttestation(request.params.id);
    if (!attestation) {
      reply.code(404);
      return {
        error: "NotFound",
        message: "Attestation not found",
        statusCode: 404,
      };
    }
    return attestation;
  });

  app.post<{ Body: { attestation_id: string } }>("/v1/verify", {
    schema: {
      body: verifyBodySchema,
      response: { 404: errorResponseSchema },
    },
  }, async (request, reply) => {
    const attestation = await store.getAttestation(request.body.attestation_id);
    if (!attestation) {
      reply.code(404);
      return {
        error: "NotFound",
        message: "Attestation not found",
        statusCode: 404,
      };
    }
    return verifyAttestation(attestation);
  });

  app.post<{ Body: ZavuEscalationInput }>("/v1/zavu/escalate", {
    schema: {
      body: zavuEscalateBodySchema,
      response: { 400: errorResponseSchema },
    },
  }, async (request) => {
    const result = await zavu.escalate(request.body);
    await store.saveHumanEscalation({
      escalation_id: `esc_${request.body.signature_request_id}`,
      signature_request_id: request.body.signature_request_id,
      jurisdiction: request.body.jurisdiction,
      reason: request.body.reason,
      channel: result.channel,
      zavu_message_id: result.zavu_message_id,
      status: result.status,
      created_at: new Date(0).toISOString(),
    });
    return result;
  });

  return app;
}

function createSafeLegalAnalyzer(analyzer: LegalAnalyzer): LegalAnalyzer {
  return async (input) => {
    try {
      return await analyzer(input);
    } catch {
      return analyzeLegalSignature();
    }
  };
}

function applyCorsHeaders(origin: string | undefined, reply: { header(name: string, value: string): unknown }) {
  const allowedOrigins = new Set([
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ]);
  if (origin && allowedOrigins.has(origin)) {
    reply.header("access-control-allow-origin", origin);
    reply.header("vary", "Origin");
  }
  reply.header("access-control-allow-methods", "GET,POST,OPTIONS");
  reply.header("access-control-allow-headers", "content-type,authorization");
  reply.header("access-control-max-age", "86400");
}

function createLiveStatus(env: NodeJS.ProcessEnv, dataMcpConfig: DataMcpConfig) {
  const zavuUrl = env.ZAVU_ESCALATE_URL ?? env.ZAVU_BASE_URL;
  return {
    mode: "live",
    postgres: {
      configured: Boolean(env.POSTGRES_URL),
      url: redactUrl(env.POSTGRES_URL),
    },
    datamcp: {
      configured: Boolean(dataMcpConfig.mcpUrl && dataMcpConfig.apiKey),
      mcp_url: redactUrl(dataMcpConfig.mcpUrl),
      permission_preset: dataMcpConfig.permissionPreset ?? "read-only",
    },
    amoy_rpc: {
      configured: Boolean(env.AMOY_RPC_URL),
      chain_id: Number(env.AMOY_CHAIN_ID ?? 80002),
      url: redactUrl(env.AMOY_RPC_URL),
    },
    zavu: {
      configured: Boolean(zavuUrl),
      endpoint: redactUrl(zavuUrl),
      channel: env.ZAVU_DEFAULT_CHANNEL ?? "whatsapp",
    },
    aperture: {
      configured: Boolean(env.APERTURE_BASE_URL),
      base_url: env.APERTURE_BASE_URL ?? null,
    },
    n8n: {
      configured: Boolean(env.N8N_WEBHOOK_NOTARY402),
      webhook_url: redactUrl(env.N8N_WEBHOOK_NOTARY402),
    },
  };
}

function redactUrl(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    if (url.username || url.password) {
      url.username = "***";
      url.password = "***";
    }
    for (const key of [...url.searchParams.keys()]) {
      url.searchParams.set(key, "***");
    }
    return url.toString();
  } catch {
    return value.length <= 8 ? "***" : `${value.slice(0, 4)}...${value.slice(-4)}`;
  }
}
