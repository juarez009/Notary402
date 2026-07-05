import assert from "node:assert/strict";
import { test } from "node:test";
import { privateKeyToAccount } from "viem/accounts";
import { buildApp } from "./app.ts";

test("GET /health reports service status", async () => {
  const app = buildApp({ logger: false });
  await app.ready();

  const response = await app.inject({ method: "GET", url: "/health" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().status, "ok");
  await app.close();
});

test("signature request to attestation flow returns a verifiable attestation", async () => {
  const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f094538a95dcf2e87c1e3bdf5d7f4b4626fef330");
  const app = buildApp({ logger: false });
  await app.ready();

  const signatureResponse = await app.inject({
    method: "POST",
    url: "/v1/signature/request",
    payload: {
      agent_id: "codex-agent",
      jurisdiction: "SV",
      document_hash: "0xabc123",
      requested_signature_level: 2,
    },
  });

  assert.equal(signatureResponse.statusCode, 201);
  const signatureRequest = signatureResponse.json();

  const validationResponse = await app.inject({
    method: "POST",
    url: "/v1/signature/validate",
    payload: {
      signature_request_id: signatureRequest.signature_request_id,
      jurisdiction: "SV",
    },
  });

  assert.equal(validationResponse.statusCode, 200);
  assert.equal(validationResponse.json().notary_agent, "ElSalvadorNotaryAgent");
  const message = `Notary402 request ${signatureRequest.request_hash}`;
  const signature = await account.signMessage({ message });
  const walletResponse = await app.inject({
    method: "POST",
    url: "/v1/wallets/verify-signature",
    payload: {
      agent_id: "codex-agent",
      chain_id: 80002,
      wallet_address: account.address,
      message,
      signature,
    },
  });
  const paymentResponse = await app.inject({
    method: "POST",
    url: "/v1/payments/l402/verify",
    payload: {
      signature_request_id: signatureRequest.signature_request_id,
      receipt: "l402_receipt_demo",
      request_hash: signatureRequest.request_hash,
    },
  });

  const attestationResponse = await app.inject({
    method: "POST",
    url: "/v1/attestations",
    payload: {
      signature_request_id: signatureRequest.signature_request_id,
      wallet_proof_id: walletResponse.json().wallet_proof_id,
      payment_proof_id: paymentResponse.json().payment_proof_id,
      agent_wallet: account.address,
    },
  });

  assert.equal(attestationResponse.statusCode, 201);
  const attestation = attestationResponse.json();

  const verifyResponse = await app.inject({
    method: "POST",
    url: "/v1/verify",
    payload: { attestation_id: attestation.attestation_id },
  });

  assert.equal(verifyResponse.statusCode, 200);
  assert.equal(verifyResponse.json().valid, true);
  await app.close();
});

test("GET /v1/integrations/datamcp describes the DataMCP audit integration without exposing secrets", async () => {
  const app = buildApp({
    logger: false,
    datamcp: {
      mcpUrl: "https://api.datamcp.app/api/mcp/conn_demo?key=demo",
      apiKey: "sk_live_secret",
      permissionPreset: "read-only",
    },
  });
  await app.ready();

  const response = await app.inject({ method: "GET", url: "/v1/integrations/datamcp" });

  assert.equal(response.statusCode, 200);
  const body = response.json();
  assert.equal(body.configured, true);
  assert.equal(body.permission_preset, "read-only");
  assert.equal(body.mcp_url, "https://api.datamcp.app/api/mcp/conn_demo?key=demo");
  assert.equal(body.authorization_header, "Bearer ${DATAMCP_API_KEY}");
  assert.ok(body.flow_hooks.includes("attestation_issued"));
  assert.equal(JSON.stringify(body).includes("sk_live_secret"), false);
  await app.close();
});

test("POST /v1/legal-intent creates a legal intent and agent profile", async () => {
  const app = buildApp({ logger: false });
  await app.ready();

  const response = await app.inject({
    method: "POST",
    url: "/v1/legal-intent",
    payload: {
      agent_id: "codex-agent",
      jurisdiction: "SV",
      input: "Authorize a services agreement signature.",
      document_type: "services_agreement",
      parties: ["Notary402", "Client"],
      obligations: ["sign", "archive"],
      risk_flags: ["remote_signature"],
    },
  });

  assert.equal(response.statusCode, 201);
  assert.match(response.json().legal_intent_id, /^lintent_/);
  assert.equal(response.json().agent_id, "codex-agent");
  assert.equal(response.json().jurisdiction, "SV");
  assert.deepEqual(response.json().parties, ["Notary402", "Client"]);
  await app.close();
});

test("GET /v1/live/status reports redacted live configuration and never leaks secrets", async () => {
  const app = buildApp({
    logger: false,
    datamcp: {
      mcpUrl: "https://api.datamcp.app/api/mcp/conn_live?key=secret_key",
      apiKey: "sk_live_secret",
      permissionPreset: "read-only",
    },
    env: {
      SUPABASE_URL: "https://notary402.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service_role_secret",
      SUPABASE_SCHEMA: "public",
      AMOY_RPC_URL: "https://polygon-amoy.example/rpc/secret",
      ZAVU_ESCALATE_URL: "https://zavu.example/escalate",
      APERTURE_BASE_URL: "http://localhost:8080",
    },
  });
  await app.ready();

  const response = await app.inject({ method: "GET", url: "/v1/live/status" });

  assert.equal(response.statusCode, 200);
  const bodyText = response.body;
  const body = response.json();
  assert.equal(body.supabase.configured, true);
  assert.equal(body.supabase.url, "https://notary402.supabase.co/");
  assert.equal(body.supabase.schema, "public");
  assert.equal(body.datamcp.configured, true);
  assert.equal(body.amoy_rpc.configured, true);
  assert.equal(body.aperture.base_url, "http://localhost:8080");
  assert.equal(bodyText.includes("sk_live_secret"), false);
  assert.equal(bodyText.includes("secret_key"), false);
  assert.equal(bodyText.includes("service_role_secret"), false);
  await app.close();
});

test("API allows the web verifier origin through CORS preflight", async () => {
  const app = buildApp({ logger: false });
  await app.ready();

  const response = await app.inject({
    method: "OPTIONS",
    url: "/v1/verify",
    headers: {
      origin: "http://localhost:3000",
      "access-control-request-method": "POST",
    },
  });

  assert.equal(response.statusCode, 204);
  assert.equal(response.headers["access-control-allow-origin"], "http://localhost:3000");
  await app.close();
});

test("GET /openapi.json serves the Notary402 OpenAPI contract", async () => {
  const app = buildApp({ logger: false });
  await app.ready();

  const response = await app.inject({ method: "GET", url: "/openapi.json" });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().openapi, "3.0.3");
  assert.ok(response.json().paths["/v1/legal-intent"]);
  await app.close();
});

test("POST /v1/signature/validate uses the configured legal analyzer", async () => {
  const app = buildApp({
    logger: false,
    legalAnalyzer: async () => ({
      notary_agent: "ElSalvadorNotaryAgent",
      signature_level: 4,
      risk_score: 0.9,
      requires_human_notary: true,
      summary: "Human notary countersignature required.",
      checklist: ["Escalate to human notary"],
      risk_flags: ["high_risk_score"],
    }),
  });
  await app.ready();

  const signatureResponse = await app.inject({
    method: "POST",
    url: "/v1/signature/request",
    payload: {
      agent_id: "codex-agent",
      jurisdiction: "SV",
      document_hash: "0xabc123",
      requested_signature_level: 2,
    },
  });

  const validationResponse = await app.inject({
    method: "POST",
    url: "/v1/signature/validate",
    payload: {
      signature_request_id: signatureResponse.json().signature_request_id,
      jurisdiction: "SV",
      legal_text: "Compraventa de inmueble.",
    },
  });

  assert.equal(validationResponse.statusCode, 200);
  assert.equal(validationResponse.json().signature_level, 4);
  assert.equal(validationResponse.json().requires_human_notary, true);
  assert.deepEqual(validationResponse.json().risk_flags, ["high_risk_score"]);
  await app.close();
});

test("POST /v1/payments/l402/verify records an Aperture/Polar payment proof", async () => {
  const app = buildApp({ logger: false });
  await app.ready();

  const signatureResponse = await app.inject({
    method: "POST",
    url: "/v1/signature/request",
    payload: {
      agent_id: "codex-agent",
      jurisdiction: "SV",
      document_hash: "0xabc123",
      requested_signature_level: 2,
    },
  });

  const response = await app.inject({
    method: "POST",
    url: "/v1/payments/l402/verify",
    payload: {
      signature_request_id: signatureResponse.json().signature_request_id,
      receipt: "l402 macaroon:preimage",
      request_hash: signatureResponse.json().request_hash,
    },
  });

  assert.equal(response.statusCode, 201);
  assert.equal(response.json().provider, "aperture");
  assert.equal(response.json().network, "polar");
  assert.equal(response.json().valid, true);
  await app.close();
});

test("POST /v1/payments/amoy/verify fails explicitly when RPC is not configured", async () => {
  const app = buildApp({ logger: false, amoyVerifier: undefined });
  await app.ready();

  const response = await app.inject({
    method: "POST",
    url: "/v1/payments/amoy/verify",
    payload: {
      chain_id: 80002,
      tx_hash: "0xabc",
      expected_sender: "0x0000000000000000000000000000000000000001",
      expected_recipient: "0x0000000000000000000000000000000000000002",
    },
  });

  assert.equal(response.statusCode, 503);
  assert.equal(response.json().error, "AMOY_RPC_NOT_CONFIGURED");
  await app.close();
});

test("POST /v1/zavu/escalate uses configured Zavu client", async () => {
  const app = buildApp({
    logger: false,
    zavuClient: {
      escalate: async () => ({
        status: "queued",
        channel: "whatsapp",
        zavu_message_id: "msg_live",
        provider_mode: "live",
      }),
    },
  });
  await app.ready();

  const response = await app.inject({
    method: "POST",
    url: "/v1/zavu/escalate",
    payload: {
      signature_request_id: "sigreq_001",
      jurisdiction: "SV",
      reason: "Requires human notary countersignature.",
    },
  });

  assert.equal(response.statusCode, 200);
  assert.equal(response.json().provider_mode, "live");
  assert.equal(response.json().zavu_message_id, "msg_live");
  await app.close();
});

test("attestation issuance requires stored wallet and payment proofs", async () => {
  const account = privateKeyToAccount("0x59c6995e998f97a5a0044966f094538a95dcf2e87c1e3bdf5d7f4b4626fef330");
  const app = buildApp({ logger: false });
  await app.ready();

  const signatureResponse = await app.inject({
    method: "POST",
    url: "/v1/signature/request",
    payload: {
      agent_id: "codex-agent",
      jurisdiction: "SV",
      document_hash: "0xabc123",
      requested_signature_level: 2,
    },
  });
  const signatureRequest = signatureResponse.json();
  const message = `Notary402 request ${signatureRequest.request_hash}`;
  const signature = await account.signMessage({ message });

  const missingProofResponse = await app.inject({
    method: "POST",
    url: "/v1/attestations",
    payload: {
      signature_request_id: signatureRequest.signature_request_id,
      wallet_proof_id: "walletproof_missing",
      payment_proof_id: "pay_missing",
      agent_wallet: account.address,
    },
  });

  assert.equal(missingProofResponse.statusCode, 400);

  const walletResponse = await app.inject({
    method: "POST",
    url: "/v1/wallets/verify-signature",
    payload: {
      agent_id: "codex-agent",
      chain_id: 80002,
      wallet_address: account.address,
      message,
      signature,
    },
  });
  const paymentResponse = await app.inject({
    method: "POST",
    url: "/v1/payments/l402/verify",
    payload: {
      signature_request_id: signatureRequest.signature_request_id,
      receipt: "l402 macaroon:preimage",
      request_hash: signatureRequest.request_hash,
    },
  });

  const attestationResponse = await app.inject({
    method: "POST",
    url: "/v1/attestations",
    payload: {
      signature_request_id: signatureRequest.signature_request_id,
      wallet_proof_id: walletResponse.json().wallet_proof_id,
      payment_proof_id: paymentResponse.json().payment_proof_id,
      agent_wallet: account.address,
    },
  });

  assert.equal(attestationResponse.statusCode, 201);
  assert.equal(attestationResponse.json().payments.l402.receipt, "l402 macaroon:preimage");
  await app.close();
});
