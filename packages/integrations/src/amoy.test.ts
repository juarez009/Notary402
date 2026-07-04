import assert from "node:assert/strict";
import { test } from "node:test";
import { createAmoyVerifier } from "./amoy.ts";

test("createAmoyVerifier returns AMOY_RPC_NOT_CONFIGURED when no client or RPC URL exists", async () => {
  const verifier = createAmoyVerifier({ rpcUrl: "" });

  const result = await verifier.verifyTransaction({
    chain_id: 80002,
    tx_hash: "0xabc",
    expected_sender: "0x0000000000000000000000000000000000000001",
    expected_recipient: "0x0000000000000000000000000000000000000002",
  });

  assert.equal(result.valid, false);
  assert.equal(result.error, "AMOY_RPC_NOT_CONFIGURED");
});

test("createAmoyVerifier validates sender, recipient, chain, and confirmations from a viem-like client", async () => {
  const verifier = createAmoyVerifier({
    publicClient: {
      chain: { id: 80002 },
      getTransaction: async () => ({
        from: "0x0000000000000000000000000000000000000001",
        to: "0x0000000000000000000000000000000000000002",
        value: 10000000000000000n,
        blockNumber: 9n,
      }),
      getBlockNumber: async () => 12n,
    },
  });

  const result = await verifier.verifyTransaction({
    chain_id: 80002,
    tx_hash: "0xabc",
    expected_sender: "0x0000000000000000000000000000000000000001",
    expected_recipient: "0x0000000000000000000000000000000000000002",
  });

  assert.equal(result.valid, true);
  assert.equal(result.confirmations, 4);
  assert.equal(result.value, "10000000000000000");
});
