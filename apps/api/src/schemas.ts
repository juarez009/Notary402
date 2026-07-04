export const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string" },
    message: { type: "string" },
    statusCode: { type: "integer" },
  },
  required: ["error", "message", "statusCode"],
} as const;

export const signatureRequestBodySchema = {
  type: "object",
  properties: {
    agent_id: { type: "string", minLength: 1 },
    jurisdiction: { type: "string", enum: ["SV"] },
    document_hash: { type: "string", pattern: "^0x[a-fA-F0-9]+$" },
    legal_intent_id: { type: "string" },
    requested_signature_level: { type: "integer", minimum: 0, maximum: 5 },
  },
  required: ["agent_id", "jurisdiction", "document_hash", "requested_signature_level"],
  additionalProperties: false,
} as const;

export const walletVerifyBodySchema = {
  type: "object",
  properties: {
    agent_id: { type: "string", minLength: 1 },
    chain_id: { type: "integer" },
    wallet_address: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
    message: { type: "string", minLength: 1 },
    signature: { type: "string", pattern: "^0x[a-fA-F0-9]+$" },
  },
  required: ["agent_id", "chain_id", "wallet_address", "message", "signature"],
  additionalProperties: false,
} as const;

export const signatureValidateBodySchema = {
  type: "object",
  properties: {
    signature_request_id: { type: "string", minLength: 1 },
    jurisdiction: { type: "string", enum: ["SV"] },
    legal_text: { type: "string" },
  },
  required: ["signature_request_id", "jurisdiction"],
  additionalProperties: false,
} as const;

export const attestationCreateBodySchema = {
  type: "object",
  properties: {
    signature_request_id: { type: "string", minLength: 1 },
    wallet_proof_id: { type: "string", minLength: 1 },
    payment_proof_id: { type: "string", minLength: 1 },
    l402_receipt: { type: "string", minLength: 1 },
    agent_wallet: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
    amoy_tx_hash: { type: "string" },
  },
  required: ["signature_request_id", "wallet_proof_id", "agent_wallet"],
  additionalProperties: false,
} as const;

export const l402VerifyBodySchema = {
  type: "object",
  properties: {
    signature_request_id: { type: "string", minLength: 1 },
    receipt: { type: "string", minLength: 1 },
    request_hash: { type: "string" },
  },
  required: ["signature_request_id", "receipt"],
  additionalProperties: false,
} as const;

export const amoyVerifyBodySchema = {
  type: "object",
  properties: {
    chain_id: { type: "integer" },
    tx_hash: { type: "string", pattern: "^0x[a-fA-F0-9]+$" },
    expected_sender: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
    expected_recipient: { type: "string", pattern: "^0x[a-fA-F0-9]{40}$" },
    request_hash: { type: "string" },
  },
  required: ["chain_id", "tx_hash", "expected_sender", "expected_recipient"],
  additionalProperties: false,
} as const;

export const zavuEscalateBodySchema = {
  type: "object",
  properties: {
    signature_request_id: { type: "string", minLength: 1 },
    jurisdiction: { type: "string", enum: ["SV"] },
    reason: { type: "string", minLength: 1 },
  },
  required: ["signature_request_id", "jurisdiction", "reason"],
  additionalProperties: false,
} as const;

export const verifyBodySchema = {
  type: "object",
  properties: {
    attestation_id: { type: "string", minLength: 1 },
  },
  required: ["attestation_id"],
  additionalProperties: false,
} as const;
