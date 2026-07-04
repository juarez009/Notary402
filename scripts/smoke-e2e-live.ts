import { privateKeyToAccount } from "viem/accounts";
import { buildApp } from "../apps/api/src/app.ts";
import { loadEnvFiles, requireEnv } from "./live-env.ts";

const env = loadEnvFiles();
requireEnv(env, ["POSTGRES_URL", "AMOY_AGENT_PRIVATE_KEY", "L402_SMOKE_RECEIPT"]);

const account = privateKeyToAccount(env.AMOY_AGENT_PRIVATE_KEY as `0x${string}`);
const app = buildApp({ logger: false, env });

try {
  await app.ready();

  const legalIntentResponse = await app.inject({
    method: "POST",
    url: "/v1/legal-intent",
    payload: {
      agent_id: "smoke-agent",
      jurisdiction: "SV",
      input: "Live smoke test signature intent.",
      document_type: "smoke",
    },
  });
  assertHttp(legalIntentResponse.statusCode, 201, legalIntentResponse.body);
  const legalIntent = legalIntentResponse.json();

  const signatureResponse = await app.inject({
    method: "POST",
    url: "/v1/signature/request",
    payload: {
      agent_id: "smoke-agent",
      jurisdiction: "SV",
      document_hash: "0xabc123",
      legal_intent_id: legalIntent.legal_intent_id,
      requested_signature_level: 1,
    },
  });
  assertHttp(signatureResponse.statusCode, 201, signatureResponse.body);
  const signatureRequest = signatureResponse.json();

  const message = `Notary402 request ${signatureRequest.request_hash}`;
  const signature = await account.signMessage({ message });
  const walletResponse = await app.inject({
    method: "POST",
    url: "/v1/wallets/verify-signature",
    payload: {
      agent_id: "smoke-agent",
      chain_id: 80002,
      wallet_address: account.address,
      message,
      signature,
    },
  });
  assertHttp(walletResponse.statusCode, 200, walletResponse.body);

  const paymentResponse = await app.inject({
    method: "POST",
    url: "/v1/payments/l402/verify",
    payload: {
      signature_request_id: signatureRequest.signature_request_id,
      receipt: env.L402_SMOKE_RECEIPT,
      request_hash: signatureRequest.request_hash,
    },
  });
  assertHttp(paymentResponse.statusCode, 201, paymentResponse.body);

  const legalAnalysisResponse = await app.inject({
    method: "POST",
    url: "/v1/signature/validate",
    payload: {
      signature_request_id: signatureRequest.signature_request_id,
      jurisdiction: "SV",
      legal_text: "Live smoke test legal text.",
    },
  });
  assertHttp(legalAnalysisResponse.statusCode, 200, legalAnalysisResponse.body);

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
  assertHttp(attestationResponse.statusCode, 201, attestationResponse.body);
  const attestation = attestationResponse.json();

  const verifyResponse = await app.inject({
    method: "POST",
    url: "/v1/verify",
    payload: { attestation_id: attestation.attestation_id },
  });
  assertHttp(verifyResponse.statusCode, 200, verifyResponse.body);
  if (!verifyResponse.json().valid) {
    throw new Error("Live E2E attestation verification returned invalid.");
  }

  console.log(JSON.stringify({
    ok: true,
    legal_intent_id: legalIntent.legal_intent_id,
    signature_request_id: signatureRequest.signature_request_id,
    attestation_id: attestation.attestation_id,
  }, null, 2));
} finally {
  await app.close();
}

function assertHttp(actual: number, expected: number, body: string) {
  if (actual !== expected) {
    throw new Error(`Expected HTTP ${expected}, got ${actual}: ${body}`);
  }
}
