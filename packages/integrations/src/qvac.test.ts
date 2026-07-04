import assert from "node:assert/strict";
import { test } from "node:test";
import { createQvacLegalAnalyzer } from "./qvac.ts";
import type { SignatureRequest } from "../../core/src/index.ts";

test("createQvacLegalAnalyzer calls OpenAI-compatible chat completions and parses legal analysis", async () => {
  let requestedUrl = "";
  let requestedBody: unknown;

  const analyzer = createQvacLegalAnalyzer({
    baseUrl: "http://localhost:11434/v1",
    model: "notary-llm",
    fetch: async (url, init) => {
      requestedUrl = String(url);
      requestedBody = JSON.parse(String(init?.body));
      return new Response(JSON.stringify({
        choices: [
          {
            message: {
              content: JSON.stringify({
                signature_level: 3,
                risk_score: 0.42,
                requires_human_notary: false,
                summary: "Jurisdiction-compliant e-signature recommended.",
              }),
            },
          },
        ],
      }));
    },
  });

  const signatureRequest: SignatureRequest = {
    agent_id: "codex-agent",
    jurisdiction: "SV",
    document_hash: "0xabc123",
    requested_signature_level: 2,
    signature_request_id: "sigreq_test",
    request_hash: "0xreq",
    status: "awaiting_payment",
    created_at: new Date(0).toISOString(),
  };

  const analysis = await analyzer({
    signatureRequest,
    legalText: "Contrato de servicios entre dos agentes.",
  });

  assert.equal(requestedUrl, "http://localhost:11434/v1/chat/completions");
  assert.equal((requestedBody as { model: string }).model, "notary-llm");
  assert.equal(analysis.signature_level, 3);
  assert.equal(analysis.risk_score, 0.42);
  assert.equal(analysis.notary_agent, "ElSalvadorNotaryAgent");
});
