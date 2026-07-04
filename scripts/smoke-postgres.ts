import { createLegalIntent, createSignatureRequest } from "../packages/core/src/index.ts";
import { createPostgresAuditStore } from "../apps/api/src/audit-store.ts";
import { loadEnvFiles, requireEnv } from "./live-env.ts";

const env = loadEnvFiles();
requireEnv(env, ["POSTGRES_URL"]);

const store = createPostgresAuditStore(env.POSTGRES_URL!);
try {
  const legalIntent = createLegalIntent({
    agent_id: "smoke-agent",
    jurisdiction: "SV",
    input: "Smoke test legal intent.",
    document_type: "smoke",
  });
  const signatureRequest = createSignatureRequest({
    agent_id: "smoke-agent",
    jurisdiction: "SV",
    document_hash: "0xabc123",
    legal_intent_id: legalIntent.legal_intent_id,
    requested_signature_level: 1,
  });

  await store.saveAgentProfile({
    agent_id: "smoke-agent",
    runtime: "smoke",
    created_at: new Date(0).toISOString(),
  });
  await store.saveLegalIntent(legalIntent);
  await store.saveSignatureRequest(signatureRequest);

  const savedIntent = await store.getLegalIntent(legalIntent.legal_intent_id);
  const savedRequest = await store.getSignatureRequest(signatureRequest.signature_request_id);
  if (!savedIntent || !savedRequest) {
    throw new Error("Postgres smoke failed to read back audit records.");
  }

  console.log(JSON.stringify({
    ok: true,
    legal_intent_id: savedIntent.legal_intent_id,
    signature_request_id: savedRequest.signature_request_id,
  }, null, 2));
} finally {
  await store.close();
}
