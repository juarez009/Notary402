import assert from "node:assert/strict";
import { test } from "node:test";
import { createZavuClient } from "./zavu.ts";

test("createZavuClient returns simulated escalation when no endpoint is configured", async () => {
  const client = createZavuClient({});

  const result = await client.escalate({
    signature_request_id: "sigreq_001",
    jurisdiction: "SV",
    reason: "Human notary required.",
  });

  assert.equal(result.provider_mode, "simulated");
  assert.equal(result.status, "escalated");
  assert.equal(result.channel, "whatsapp");
});

test("createZavuClient posts escalation payload to configured endpoint", async () => {
  let requestedUrl = "";
  let requestedBody: unknown;

  const client = createZavuClient({
    escalateUrl: "https://zavu.example/escalate",
    apiKey: "zavu_secret",
    fetch: async (url, init) => {
      requestedUrl = String(url);
      requestedBody = JSON.parse(String(init?.body));
      assert.equal((init?.headers as Record<string, string>).authorization, "Bearer zavu_secret");
      return new Response(JSON.stringify({
        status: "queued",
        channel: "sms",
        message_id: "msg_123",
      }));
    },
  });

  const result = await client.escalate({
    signature_request_id: "sigreq_001",
    jurisdiction: "SV",
    reason: "Human notary required.",
  });

  assert.equal(requestedUrl, "https://zavu.example/escalate");
  assert.equal((requestedBody as { signature_request_id: string }).signature_request_id, "sigreq_001");
  assert.deepEqual(result, {
    status: "queued",
    channel: "sms",
    zavu_message_id: "msg_123",
    provider_mode: "live",
  });
});
