export const openApiDocument = {
    openapi: "3.0.3",
    info: { title: "Notary402 API", version: "0.5.0" },
    servers: [{ url: "http://localhost:3001" }],
    paths: {
        "/health": { get: { responses: { "200": { description: "Health status" } } } },
        "/v1/live/status": { get: { responses: { "200": { description: "Redacted live integration status" } } } },
        "/v1/legal-intent": { post: { responses: { "201": { description: "Legal intent created" } } } },
        "/v1/signature/request": { post: { responses: { "201": { description: "Signature request created" } } } },
        "/v1/wallets/verify-signature": { post: { responses: { "200": { description: "Wallet proof" } } } },
        "/v1/payments/l402/verify": { post: { responses: { "201": { description: "L402 receipt registered" } } } },
        "/v1/payments/amoy/verify": { post: { responses: { "200": { description: "Amoy transaction verified" }, "503": { description: "AMOY_RPC_NOT_CONFIGURED" } } } },
        "/v1/signature/validate": { post: { responses: { "200": { description: "Legal analysis result" } } } },
        "/v1/attestations": { post: { responses: { "201": { description: "Attestation issued" } } } },
        "/v1/attestations/{id}": { get: { responses: { "200": { description: "Attestation" }, "404": { description: "Not found" } } } },
        "/v1/verify": { post: { responses: { "200": { description: "Verification result" } } } },
        "/v1/zavu/escalate": { post: { responses: { "200": { description: "Human escalation" } } } },
        "/v1/integrations/datamcp": { get: { responses: { "200": { description: "DataMCP integration plan" } } } }
    }
};
