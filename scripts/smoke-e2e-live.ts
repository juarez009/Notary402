import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { buildApp } from "../apps/api/src/app.js";
import { sha256Hex } from "../packages/core/src/hash.js";
import { redact } from "./env.js";

for (const key of ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]) {
  if (!process.env[key]) throw new Error(`${key} is required for live e2e smoke`);
}

function assertStatus(step: string, expected: number, response: { statusCode: number; body: string }) {
  if (response.statusCode !== expected) throw new Error(`${step} failed: expected ${expected}, got ${response.statusCode} ${response.body}`);
}

const app = buildApp();

try {
  await app.ready();

  const liveStatus = await app.inject({ method: "GET", url: "/v1/live/status" });
  assertStatus("live status", 200, liveStatus);
  if (liveStatus.json().supabase?.configured !== true) throw new Error(`live status failed: supabase not configured ${liveStatus.body}`);
  console.log(`[1/9] live status ok: supabase ${redact(process.env.SUPABASE_URL)}`);

  const legalIntent = await app.inject({
    method: "POST",
    url: "/v1/legal-intent",
    payload: { agent_id: "smoke-agent", jurisdiction: "SV", input: "Service agreement between smoke-agent and a Notary402 client, notarized under SV jurisdiction for the e2e live smoke", document_type: "service_agreement" }
  });
  assertStatus("legal intent", 201, legalIntent);
  const legalIntentId = String(legalIntent.json().legal_intent_id);
  console.log(`[2/9] legal intent ok: ${legalIntentId}`);

  const documentText = "Notary402 e2e live smoke service agreement between smoke-agent and its client.";
  const signatureRequest = await app.inject({
    method: "POST",
    url: "/v1/signature/request",
    payload: { agent_id: "smoke-agent", jurisdiction: "SV", document_hash: sha256Hex(documentText), legal_intent_id: legalIntentId, requested_signature_level: 1 }
  });
  assertStatus("signature request", 201, signatureRequest);
  const signatureRequestId = String(signatureRequest.json().signature_request_id);
  const requestHash = String(signatureRequest.json().request_hash);
  console.log(`[3/9] signature request ok: ${signatureRequestId}`);

  const account = privateKeyToAccount(generatePrivateKey());
  const message = `Notary402 request ${requestHash}`;
  const walletProofResponse = await app.inject({
    method: "POST",
    url: "/v1/wallets/verify-signature",
    payload: { agent_id: "smoke-agent", chain_id: 80002, wallet_address: account.address, message, signature: await account.signMessage({ message }) }
  });
  assertStatus("wallet proof", 200, walletProofResponse);
  const walletProofId = String(walletProofResponse.json().wallet_proof_id);
  console.log(`[4/9] wallet proof ok: ${walletProofId} (${account.address})`);

  const receipt = process.env.L402_SMOKE_RECEIPT || "smoke-macaroon:smoke-preimage";
  const paymentProof = await app.inject({ method: "POST", url: "/v1/payments/l402/verify", payload: { signature_request_id: signatureRequestId, receipt } });
  assertStatus("l402 payment", 201, paymentProof);
  const paymentProofId = String(paymentProof.json().payment_proof_id);
  console.log(`[5/9] l402 payment ok: ${paymentProofId} (${process.env.L402_SMOKE_RECEIPT ? "real Aperture receipt" : "simulated receipt"})`);

  const legalAnalysis = await app.inject({
    method: "POST",
    url: "/v1/signature/validate",
    payload: { signature_request_id: signatureRequestId, jurisdiction: "SV", legal_text: "Contrato de servicios simple entre las partes, sin clausulas de riesgo." }
  });
  assertStatus("legal analysis", 200, legalAnalysis);
  const analysis = legalAnalysis.json();
  if (analysis.requires_human_notary !== false) throw new Error(`legal analysis failed: expected low risk, got ${legalAnalysis.body}`);
  console.log(`[6/9] legal analysis ok: ${analysis.legal_analysis_id} (risk_score ${analysis.risk_score})`);

  const attestationResponse = await app.inject({
    method: "POST",
    url: "/v1/attestations",
    payload: { signature_request_id: signatureRequestId, wallet_proof_id: walletProofId, payment_proof_id: paymentProofId, agent_wallet: account.address }
  });
  assertStatus("attestation", 201, attestationResponse);
  const attestation = attestationResponse.json();
  if (attestation.status !== "issued" || attestation.valid !== true) throw new Error(`attestation failed: expected issued/valid, got ${attestationResponse.statusCode} ${attestationResponse.body}`);
  console.log(`[7/9] attestation ok: ${attestation.attestation_id}`);

  const verifyResponse = await app.inject({ method: "POST", url: "/v1/verify", payload: { attestation_id: attestation.attestation_id } });
  assertStatus("verify", 200, verifyResponse);
  const verification = verifyResponse.json();
  const failedChecks = Object.entries(verification.checks as Record<string, boolean>).filter(([, passed]) => !passed).map(([name]) => name);
  if (verification.valid !== true || failedChecks.length) throw new Error(`verify failed: valid=${verification.valid}, failed checks [${failedChecks.join(", ")}] ${verifyResponse.body}`);
  console.log(`[8/9] verify ok: valid=true, checks ${Object.keys(verification.checks).join(", ")}`);

  const timeline = await app.inject({ method: "GET", url: `/v1/attestations/${attestation.attestation_id}/timeline` });
  assertStatus("timeline", 200, timeline);
  const events = timeline.json().events as Array<{ step: string }>;
  if (events.length < 6) throw new Error(`timeline failed: expected >= 6 events, got ${events.length} ${timeline.body}`);
  const steps = new Set(events.map((event) => event.step));
  for (const required of ["legal_intent", "signature_request", "wallet_proof", "payment_proof", "legal_analysis", "attestation"]) {
    if (!steps.has(required)) throw new Error(`timeline failed: missing step ${required} ${timeline.body}`);
  }
  console.log(`[9/9] timeline ok: ${events.length} events (${[...steps].join(", ")})`);

  if (process.env.AMOY_SMOKE_TX_HASH && process.env.AMOY_SMOKE_EXPECTED_SENDER && process.env.AMOY_SMOKE_EXPECTED_RECIPIENT) {
    const amoy = await app.inject({
      method: "POST",
      url: "/v1/payments/amoy/verify",
      payload: { chain_id: 80002, tx_hash: process.env.AMOY_SMOKE_TX_HASH, expected_sender: process.env.AMOY_SMOKE_EXPECTED_SENDER, expected_recipient: process.env.AMOY_SMOKE_EXPECTED_RECIPIENT }
    });
    assertStatus("amoy verify", 200, amoy);
    console.log(`[optional] amoy verify ok: valid=${amoy.json().valid}`);
  } else {
    console.log("[optional] amoy verify skipped (env missing)");
  }

  if (process.env.ZAVU_ESCALATE_URL || process.env.ZAVU_BASE_URL) {
    const zavu = await app.inject({ method: "POST", url: "/v1/zavu/escalate", payload: { signature_request_id: signatureRequestId, reason: "Notary402 e2e live smoke", test: true } });
    assertStatus("zavu escalate", 200, zavu);
    console.log(`[optional] zavu escalate ok: ${zavu.json().provider_mode} ${zavu.json().status}`);
  } else {
    console.log("[optional] zavu escalate skipped (env missing)");
  }

  console.log(`attestation_id: ${attestation.attestation_id}`);
  console.log(`verification_url: ${attestation.verification_url}`);
  console.log("E2E live smoke passed");
} finally {
  await app.close();
}
