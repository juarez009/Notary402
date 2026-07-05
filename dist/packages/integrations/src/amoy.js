import { createPublicClient, http } from "viem";
import { polygonAmoy } from "viem/chains";
export async function verifyAmoyTransaction(input, env = process.env) {
    if (!env.AMOY_RPC_URL) {
        const error = new Error("AMOY_RPC_NOT_CONFIGURED");
        error.name = "AMOY_RPC_NOT_CONFIGURED";
        throw error;
    }
    if (input.chain_id !== 80002) {
        return { valid: false, reason: "CHAIN_ID_MISMATCH" };
    }
    const client = createPublicClient({ chain: polygonAmoy, transport: http(env.AMOY_RPC_URL) });
    const chainId = await client.getChainId();
    if (chainId !== 80002)
        return { valid: false, reason: "RPC_CHAIN_ID_MISMATCH" };
    const tx = await client.getTransaction({ hash: input.tx_hash });
    const receipt = await client.getTransactionReceipt({ hash: input.tx_hash });
    const senderOk = tx.from.toLowerCase() === input.expected_sender.toLowerCase();
    const recipientOk = (tx.to || "").toLowerCase() === input.expected_recipient.toLowerCase();
    const success = receipt.status === "success";
    return { valid: senderOk && recipientOk && success, senderOk, recipientOk, success, chain_id: chainId, tx_hash: input.tx_hash };
}
