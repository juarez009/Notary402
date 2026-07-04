import { createPublicClient, getAddress, http } from "viem";
import { polygonAmoy } from "viem/chains";

export interface VerifyAmoyTransactionInput {
  chain_id: number;
  tx_hash: `0x${string}`;
  expected_sender: `0x${string}`;
  expected_recipient: `0x${string}`;
  request_hash?: string;
}

export interface AmoyTransactionProof {
  valid: boolean;
  chain_id: number;
  tx_hash: `0x${string}`;
  confirmations: number;
  value: string;
  error?: "AMOY_RPC_NOT_CONFIGURED" | "AMOY_CHAIN_ID_MISMATCH" | "AMOY_TX_NOT_FOUND" | "AMOY_SENDER_MISMATCH" | "AMOY_RECIPIENT_MISMATCH";
}

export interface AmoyVerifier {
  verifyTransaction(input: VerifyAmoyTransactionInput): Promise<AmoyTransactionProof>;
}

export interface AmoyVerifierOptions {
  rpcUrl?: string;
  publicClient?: AmoyPublicClient;
}

export interface AmoyPublicClient {
  chain?: { id: number };
  getTransaction(input: { hash: `0x${string}` }): Promise<{
    from: `0x${string}`;
    to: `0x${string}` | null;
    value: bigint;
    blockNumber: bigint | null;
  } | null>;
  getBlockNumber(): Promise<bigint>;
}

export function createAmoyVerifier(options: AmoyVerifierOptions = {}): AmoyVerifier {
  const rpcUrl = options.rpcUrl ?? process.env.AMOY_RPC_URL ?? "";
  const publicClient = options.publicClient ?? (rpcUrl
    ? createPublicClient({ chain: polygonAmoy, transport: http(rpcUrl) }) as AmoyPublicClient
    : undefined);

  return {
    async verifyTransaction(input) {
      if (!publicClient) {
        return invalid(input, "AMOY_RPC_NOT_CONFIGURED");
      }
      if (input.chain_id !== 80002 || publicClient.chain?.id !== 80002) {
        return invalid(input, "AMOY_CHAIN_ID_MISMATCH");
      }

      const transaction = await publicClient.getTransaction({ hash: input.tx_hash });
      if (!transaction) {
        return invalid(input, "AMOY_TX_NOT_FOUND");
      }

      const expectedSender = getAddress(input.expected_sender);
      const expectedRecipient = getAddress(input.expected_recipient);
      if (getAddress(transaction.from) !== expectedSender) {
        return invalid(input, "AMOY_SENDER_MISMATCH");
      }
      if (!transaction.to || getAddress(transaction.to) !== expectedRecipient) {
        return invalid(input, "AMOY_RECIPIENT_MISMATCH");
      }

      const currentBlock = await publicClient.getBlockNumber();
      const confirmations = transaction.blockNumber
        ? Number(currentBlock - transaction.blockNumber + 1n)
        : 0;

      return {
        valid: true,
        chain_id: input.chain_id,
        tx_hash: input.tx_hash,
        confirmations,
        value: transaction.value.toString(),
      };
    },
  };
}

function invalid(input: VerifyAmoyTransactionInput, error: NonNullable<AmoyTransactionProof["error"]>): AmoyTransactionProof {
  return {
    valid: false,
    chain_id: input.chain_id,
    tx_hash: input.tx_hash,
    confirmations: 0,
    value: "0",
    error,
  };
}
