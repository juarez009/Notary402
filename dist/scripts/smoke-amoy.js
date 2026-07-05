import { createPublicClient, http } from "viem";
import { polygonAmoy } from "viem/chains";
import { requireEnv, redact } from "./env.js";
const rpc = requireEnv("AMOY_RPC_URL");
const client = createPublicClient({ chain: polygonAmoy, transport: http(rpc) });
const chainId = await client.getChainId();
if (chainId !== 80002)
    throw new Error(`Expected chain id 80002, got ${chainId}`);
if (process.env.AMOY_SMOKE_TX_HASH) {
    await client.getTransaction({ hash: process.env.AMOY_SMOKE_TX_HASH });
}
console.log(`Amoy smoke ok: ${redact(rpc)}`);
