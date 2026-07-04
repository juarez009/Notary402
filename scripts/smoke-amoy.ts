import { createPublicClient, http } from "viem";
import { polygonAmoy } from "viem/chains";
import { loadEnvFiles, requireEnv, redact } from "./live-env.ts";

const env = loadEnvFiles();
requireEnv(env, ["AMOY_RPC_URL"]);

const client = createPublicClient({
  chain: polygonAmoy,
  transport: http(env.AMOY_RPC_URL),
});
const chainId = await client.getChainId();
if (chainId !== 80002) {
  throw new Error(`Expected Polygon Amoy chain id 80002, got ${chainId}`);
}

let transaction: { hash: string; blockNumber: string | null } | undefined;
if (env.AMOY_SMOKE_TX_HASH) {
  const tx = await client.getTransaction({ hash: env.AMOY_SMOKE_TX_HASH as `0x${string}` });
  transaction = {
    hash: tx.hash,
    blockNumber: tx.blockNumber?.toString() ?? null,
  };
}

console.log(JSON.stringify({
  ok: true,
  rpc_url: redact(env.AMOY_RPC_URL),
  chain_id: chainId,
  transaction,
}, null, 2));
