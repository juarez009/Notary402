import assert from "node:assert/strict";
import net, { type AddressInfo } from "node:net";
import { describe, it } from "node:test";
import { privateKeyToAccount } from "viem/accounts";
import { buildApp } from "../src/app.js";
import { createMemoryAuditStore } from "../src/audit-store.js";

describe("Notary402 API", () => {
  it("creates legal intents", async () => {
    const app = buildApp({ store: createMemoryAuditStore() });
    await app.ready();
    const response = await app.inject({
      method: "POST",
      url: "/v1/legal-intent",
      payload: { agent_id: "agent_1", jurisdiction: "SV", input: "Contrato de servicios", parties: ["A", "B"], obligations: ["firmar"], risk_flags: [] }
    });
    assert.equal(response.statusCode, 201);
    assert.match(response.json().legal_intent_id, /^lintent_/);
    await app.close();
  });

  it("creates agent profiles before writing agent-owned records", async () => {
    const store = createMemoryAuditStore();
    const app = buildApp({ store });
    await app.ready();

    const response = await app.inject({
      method: "POST",
      url: "/v1/legal-intent",
      payload: { agent_id: "agent_fk_guard", jurisdiction: "SV", input: "Contrato con FK" }
    });

    assert.equal(response.statusCode, 201);
    assert.equal((await store.getAgentProfile("agent_fk_guard"))?.agent_id, "agent_fk_guard");
    await app.close();
  });

  it("sets CORS for local web origin", async () => {
    const app = buildApp({ store: createMemoryAuditStore(), env: { WEB_ORIGIN: "http://localhost:3000" } as NodeJS.ProcessEnv });
    await app.ready();
    const response = await app.inject({ method: "GET", url: "/health", headers: { origin: "http://localhost:3000" } });
    assert.equal(response.headers["access-control-allow-origin"], "http://localhost:3000");
    await app.close();
  });

  it("redacts live status secrets", async () => {
    const app = buildApp({
      store: createMemoryAuditStore(),
        env: {
          SUPABASE_URL: "https://project.supabase.co",
          SUPABASE_SERVICE_ROLE_KEY: "eyJheader.eyJsuper-secret.signature",
          DATAMCP_MCP_URL: "https://api.datamcp.app/api/mcp/conn_x?key=secret",
          DATAMCP_API_KEY: "secret"
      } as NodeJS.ProcessEnv
    });
    await app.ready();
    const response = await app.inject({ method: "GET", url: "/v1/live/status" });
    assert.equal(response.statusCode, 200);
    const text = response.body;
    assert.equal(text.includes("super-secret"), false);
    assert.equal(text.includes("key=secret"), false);
    assert.equal(response.json().supabase.configured, true);
    await app.close();
  });

  it("reports Polar LND connected when the gRPC port accepts TCP", async () => {
    const server = net.createServer((socket) => socket.end());
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address() as AddressInfo;

    try {
      const app = buildApp({
        store: createMemoryAuditStore(),
        env: {
          LND_AGENT_GRPC_HOST: `127.0.0.1:${address.port}`,
          LND_AGENT_MACAROON: "macaroon",
          LND_AGENT_TLS_CERT: "cert"
        } as NodeJS.ProcessEnv
      });
      await app.ready();
      const response = await app.inject({ method: "GET", url: "/v1/live/status" });
      assert.equal(response.statusCode, 200);
      assert.equal(response.json().polar_lnd.configured, true);
      assert.equal(response.json().polar_lnd.connected, true);
      await app.close();
    } finally {
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    }
  });

  it("serves OpenAPI", async () => {
    const app = buildApp({ store: createMemoryAuditStore() });
    await app.ready();
    const response = await app.inject({ method: "GET", url: "/openapi.json" });
    assert.equal(response.statusCode, 200);
    assert.equal(response.json().openapi, "3.0.3");
    await app.close();
  });

  it("creates Salvadoran document request (POST /v1/documents/request)", async () => {
    const app = buildApp({ store: createMemoryAuditStore() });
    await app.ready();
    const response = await app.inject({
      method: "POST",
      url: "/v1/documents/request",
      payload: {
        tipo_documento: "COMPRAVENTA",
        jurisdiccion: "SV",
        comparecientes: [{
          nombre_completo: "Ing. Carlos Eduardo Mendoza",
          edad: 38,
          profesion: "Ingeniero",
          domicilio: "San Salvador",
          nacionalidad: "Salvadoreña",
          dui: "04589201-4",
          nit: "0614-120586-101-2"
        }],
        detalles: { notas: "Compraventa inmueble CNR" }
      }
    });
    assert.equal(response.statusCode, 201);
    assert.match(response.json().document_request_id, /^docreq_/);
    await app.close();
  });

  it("runs a minimal attestation flow", async () => {
    const store = createMemoryAuditStore();
    const app = buildApp({ store });
    await app.ready();
    const account = privateKeyToAccount("0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");

    const legalIntent = await app.inject({ method: "POST", url: "/v1/legal-intent", payload: { agent_id: "agent_1", jurisdiction: "SV", input: "Contrato simple" } });
    const signatureRequest = await app.inject({ method: "POST", url: "/v1/signature/request", payload: { agent_id: "agent_1", jurisdiction: "SV", document_hash: "0xabc", legal_intent_id: legalIntent.json().legal_intent_id, requested_signature_level: 2 } });
    const message = `Notary402 request ${signatureRequest.json().request_hash}`;
    const signature = await account.signMessage({ message });
    const walletProof = await app.inject({ method: "POST", url: "/v1/wallets/verify-signature", payload: { agent_id: "agent_1", chain_id: 80002, wallet_address: account.address, message, signature } });
    const paymentProof = await app.inject({ method: "POST", url: "/v1/payments/l402/verify", payload: { signature_request_id: signatureRequest.json().signature_request_id, receipt: "macaroon:preimage", request_hash: signatureRequest.json().request_hash } });
    await app.inject({ method: "POST", url: "/v1/signature/validate", payload: { signature_request_id: signatureRequest.json().signature_request_id, jurisdiction: "SV", legal_text: "Contrato simple" } });
    const attestation = await app.inject({ method: "POST", url: "/v1/attestations", payload: { signature_request_id: signatureRequest.json().signature_request_id, wallet_proof_id: walletProof.json().wallet_proof_id, payment_proof_id: paymentProof.json().payment_proof_id, agent_wallet: account.address } });

    assert.equal(attestation.statusCode, 201);
    const verify = await app.inject({ method: "POST", url: "/v1/verify", payload: { attestation_id: attestation.json().attestation_id } });
    assert.equal(verify.json().valid, true);
    assert.equal(verify.json().checks.l402_payment, true);
    await app.close();
  });
});
