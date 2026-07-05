# DEMO SCRIPT: Notary402 Live Real

## One-Liner

Notary402 lets autonomous AI agents buy legal trust with L402, prove identity with Amoy wallets, run jurisdiction-aware analysis, and emit verifiable attestations.

## Pre-Demo Checks

Run before presenting:

```bash
npm run check:live-config
npm run smoke:supabase
npm run smoke:datamcp
npm run smoke:amoy
npm run smoke:zavu
npm run smoke:aperture
npm run smoke:e2e-live
```

Keep the web verifier open at `http://localhost:3000` and the API at `http://localhost:3001`.

## Demo Flow

### 1. Agent Starts

Show an agent calling Notary402 through MCP or the n8n webhook. Explain that the caller is an autonomous agent, not a human web form.

### 2. n8n Orchestrates

Open `docs/n8n/notary402-legal-signature-flow.json` in n8n. Show the connected nodes: legal intent, signature request through Aperture, wallet proof, L402 receipt, legal analysis, Zavu branch and attestation.

### 3. Aperture/Polar L402

Show Aperture protecting `/v1/signature/request` and `/v1/attestations`. Show Polar payment success, then the receipt registered through `POST /v1/payments/l402/verify`.

### 4. Amoy Wallet Proof

Show the agent wallet signing `Notary402 request <request_hash>`. Optional: show `smoke:amoy` validating chain id `80002` or a real `AMOY_SMOKE_TX_HASH`.

### 5. Legal Analysis

Show QVAC/OpenAI-compatible analysis through `POST /v1/signature/validate`. If the analysis requires human notary, show the Zavu escalation branch.

### 6. DataMCP Audit Context

Call `notary402_get_datamcp_flow_plan`, then use the DataMCP MCP link to query `signature_requests`, `payment_proofs`, `legal_analyses` and `attestations`. Emphasize that DataMCP is read-only and Notary402 owns writes through the backend Supabase service role.

### 7. Verifier

Open the verifier, paste the `attestation_id`, and show checks, wallet/payment data, legal analysis, DataMCP status and live integration status.

## Fallback Lines

- If Aperture/Polar is unavailable: the Notary402 boundary is L402-compatible and receipt registration remains the integration point.
- If Amoy faucet is slow: wallet ownership still verifies through EIP-191; tx proof is separately smoke-tested when a funded tx is available.
- If DataMCP is unavailable: Supabase remains the source of audit truth, and `/v1/integrations/datamcp` plus `smoke:datamcp` define the read-only MCP contract.
