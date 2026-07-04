import type { Attestation, LegalAnalysis, SignatureRequest, WalletProof } from "../../../packages/core/src/index.ts";

export interface NotaryStore {
  signatureRequests: Map<string, SignatureRequest>;
  walletProofs: Map<string, WalletProof>;
  legalAnalyses: Map<string, LegalAnalysis>;
  attestations: Map<string, Attestation>;
}

export function createStore(): NotaryStore {
  return {
    signatureRequests: new Map(),
    walletProofs: new Map(),
    legalAnalyses: new Map(),
    attestations: new Map(),
  };
}
