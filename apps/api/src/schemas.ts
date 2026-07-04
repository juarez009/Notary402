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

export const legalIntentBodySchema = {
  type: "object",
  properties: {
    agent_id: { type: "string", minLength: 1 },
    jurisdiction: { type: "string", enum: ["SV"] },
    input: { type: "string", minLength: 1 },
    document_type: { type: "string" },
    parties: { type: "array", items: { type: "string" } },
    obligations: { type: "array", items: { type: "string" } },
    risk_flags: { type: "array", items: { type: "string" } },
  },
  required: ["agent_id", "jurisdiction", "input"],
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
    test: { type: "boolean" },
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

export const generalesDeLeySchema = {
  type: "object",
  properties: {
    nombre_completo: { type: "string", minLength: 5 },
    edad: { type: "integer", minimum: 18 },
    profesion: { type: "string", minLength: 2 },
    domicilio: { type: "string", minLength: 2 },
    nacionalidad: { type: "string", minLength: 2 },
    dui: { type: "string", pattern: "^[0-9]{8}-[0-9]$" },
    nit: { type: "string" },
  },
  required: ["nombre_completo", "edad", "profesion", "domicilio", "nacionalidad", "dui"],
  additionalProperties: false,
} as const;

export const documentRequestBodySchema = {
  type: "object",
  properties: {
    tipo_documento: { type: "string", enum: ["COMPRAVENTA", "PODER_GENERAL", "AUTENTICA"] },
    comparecientes: {
      type: "array",
      items: generalesDeLeySchema,
      minItems: 1,
    },
    detalles: {
      type: "object",
      additionalProperties: true,
    },
    jurisdiccion: { type: "string", enum: ["SV"] },
  },
  required: ["tipo_documento", "comparecientes", "detalles", "jurisdiccion"],
  additionalProperties: false,
} as const;
