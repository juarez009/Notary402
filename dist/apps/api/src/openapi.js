const requiredString = { type: "string", minLength: 1 };
const stringArray = { type: "array", items: { type: "string" } };
const hexAddress = { type: "string", pattern: "^0x[0-9a-fA-F]{40}$" };
const hexData = { type: "string", pattern: "^0x[0-9a-fA-F]+$" };
const txHash = { type: "string", pattern: "^0x[0-9a-fA-F]{64}$" };
const jurisdiction = { type: "string", enum: ["SV"] };
const nullableString = { type: "string", nullable: true };
const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const jsonBody = (schema) => ({ required: true, content: { "application/json": { schema } } });
const jsonResponse = (description, schema) => ({ description, content: { "application/json": { schema } } });
const errorResponse = (description) => jsonResponse(description, ref("ErrorResponse"));
const idParam = { name: "id", in: "path", required: true, schema: { type: "string" } };
export const openApiDocument = {
    openapi: "3.0.3",
    info: { title: "Notary402 API", version: "0.5.0" },
    servers: [{ url: "http://localhost:3001" }],
    components: {
        schemas: {
            ErrorResponse: {
                type: "object",
                required: ["error", "message", "statusCode"],
                properties: {
                    error: { type: "string" },
                    message: { type: "string" },
                    statusCode: { type: "integer" }
                }
            },
            LegalIntent: {
                type: "object",
                required: ["legal_intent_id", "agent_id", "jurisdiction", "input", "parties", "obligations", "risk_flags", "created_at"],
                properties: {
                    legal_intent_id: { type: "string" },
                    agent_id: { type: "string" },
                    jurisdiction,
                    input: { type: "string" },
                    document_type: { type: "string" },
                    parties: stringArray,
                    obligations: stringArray,
                    risk_flags: stringArray,
                    created_at: { type: "string" }
                }
            },
            SignatureRequest: {
                type: "object",
                required: ["signature_request_id", "agent_id", "jurisdiction", "document_hash", "requested_signature_level", "request_hash", "status", "created_at"],
                properties: {
                    signature_request_id: { type: "string" },
                    agent_id: { type: "string" },
                    jurisdiction,
                    document_hash: { type: "string" },
                    legal_intent_id: { type: "string" },
                    requested_signature_level: { type: "integer", minimum: 1, maximum: 3 },
                    request_hash: { type: "string" },
                    status: { type: "string", enum: ["awaiting_payment", "ready_for_analysis", "issued"] },
                    created_at: { type: "string" }
                }
            },
            WalletProof: {
                type: "object",
                required: ["wallet_proof_id", "agent_id", "chain_id", "wallet_address", "message", "signature", "verified", "created_at"],
                properties: {
                    wallet_proof_id: { type: "string" },
                    agent_id: { type: "string" },
                    chain_id: { type: "integer" },
                    wallet_address: hexAddress,
                    message: { type: "string" },
                    signature: hexData,
                    verified: { type: "boolean" },
                    created_at: { type: "string" }
                }
            },
            PaymentProof: {
                type: "object",
                required: ["payment_proof_id", "signature_request_id", "provider", "network", "status", "created_at"],
                properties: {
                    payment_proof_id: { type: "string" },
                    signature_request_id: { type: "string" },
                    provider: { type: "string", enum: ["aperture", "amoy"] },
                    network: { type: "string", enum: ["polar", "polygon-amoy"] },
                    receipt: { type: "string" },
                    tx_hash: { type: "string" },
                    status: { type: "string", enum: ["verified"] },
                    created_at: { type: "string" }
                }
            },
            LegalAnalysis: {
                type: "object",
                required: ["legal_analysis_id", "signature_request_id", "jurisdiction", "risk_score", "requires_human_notary", "summary", "checklist", "risk_flags", "created_at"],
                properties: {
                    legal_analysis_id: { type: "string" },
                    signature_request_id: { type: "string" },
                    jurisdiction,
                    risk_score: { type: "number" },
                    requires_human_notary: { type: "boolean" },
                    summary: { type: "string" },
                    checklist: {
                        type: "array",
                        items: {
                            type: "object",
                            required: ["label", "passed"],
                            properties: { label: { type: "string" }, passed: { type: "boolean" } }
                        }
                    },
                    risk_flags: stringArray,
                    created_at: { type: "string" }
                }
            },
            Attestation: {
                type: "object",
                required: ["attestation_id", "signature_request_id", "document_hash", "request_hash", "agent_wallet", "wallet_proof_id", "payment_proof_id", "status", "valid", "jurisdiction", "signature_level", "requires_human_notary", "created_at"],
                properties: {
                    attestation_id: { type: "string" },
                    signature_request_id: { type: "string" },
                    document_hash: { type: "string" },
                    request_hash: { type: "string" },
                    agent_wallet: hexAddress,
                    wallet_proof_id: { type: "string" },
                    payment_proof_id: { type: "string" },
                    amoy_tx_hash: txHash,
                    status: { type: "string", enum: ["issued", "pending_human_review"] },
                    valid: { type: "boolean" },
                    jurisdiction,
                    signature_level: { type: "integer" },
                    requires_human_notary: { type: "boolean" },
                    l402_payment: { type: "object", additionalProperties: true },
                    qvac_analysis: { type: "object", additionalProperties: true },
                    created_at: { type: "string" }
                }
            },
            VerificationResult: {
                type: "object",
                required: ["valid", "checks"],
                properties: {
                    valid: { type: "boolean" },
                    attestation: ref("Attestation"),
                    checks: {
                        type: "object",
                        required: ["document_hash", "agent_wallet", "l402_payment", "notary_signature"],
                        properties: {
                            document_hash: { type: "boolean" },
                            agent_wallet: { type: "boolean" },
                            l402_payment: { type: "boolean" },
                            notary_signature: { type: "boolean" }
                        }
                    }
                }
            },
            TimelineEvent: {
                type: "object",
                required: ["step", "ref_id", "at", "summary", "data"],
                properties: {
                    step: { type: "string", enum: ["legal_intent", "signature_request", "wallet_proof", "payment_proof", "legal_analysis", "attestation", "human_escalation"] },
                    ref_id: { type: "string" },
                    at: { type: "string" },
                    summary: { type: "string" },
                    data: { type: "object", additionalProperties: true }
                }
            },
            Timeline: {
                type: "object",
                required: ["attestation_id", "status", "valid", "verification_url", "events"],
                properties: {
                    attestation_id: { type: "string" },
                    status: { type: "string", enum: ["issued", "pending_human_review"] },
                    valid: { type: "boolean" },
                    verification_url: { type: "string" },
                    events: { type: "array", items: ref("TimelineEvent") }
                }
            },
            HumanEscalationResult: {
                type: "object",
                required: ["status", "channel", "provider_mode"],
                properties: {
                    status: { type: "string" },
                    channel: { type: "string" },
                    zavu_message_id: { type: "string" },
                    provider_mode: { type: "string", enum: ["live", "simulated"] }
                }
            },
            LiveStatus: {
                type: "object",
                required: ["mode", "supabase", "datamcp", "amoy_rpc", "zavu", "aperture", "n8n"],
                properties: {
                    mode: { type: "string", enum: ["live"] },
                    supabase: {
                        type: "object",
                        required: ["configured", "url", "schema"],
                        properties: { configured: { type: "boolean" }, url: nullableString, schema: { type: "string" } }
                    },
                    datamcp: {
                        type: "object",
                        required: ["configured", "mcp_url", "permission_preset"],
                        properties: { configured: { type: "boolean" }, mcp_url: nullableString, permission_preset: { type: "string" } }
                    },
                    amoy_rpc: {
                        type: "object",
                        required: ["configured", "chain_id", "url"],
                        properties: { configured: { type: "boolean" }, chain_id: { type: "integer" }, url: nullableString }
                    },
                    zavu: {
                        type: "object",
                        required: ["configured", "endpoint", "channel"],
                        properties: { configured: { type: "boolean" }, endpoint: nullableString, channel: { type: "string" } }
                    },
                    aperture: {
                        type: "object",
                        required: ["configured", "base_url"],
                        properties: { configured: { type: "boolean" }, base_url: nullableString }
                    },
                    n8n: {
                        type: "object",
                        required: ["configured", "webhook_url"],
                        properties: { configured: { type: "boolean" }, webhook_url: nullableString }
                    }
                }
            },
            DataMcpPlan: {
                type: "object",
                required: ["status", "permission_preset", "mcp_url", "tables", "mcp_tools", "note"],
                properties: {
                    status: { type: "string", enum: ["configured", "integration_pending"] },
                    permission_preset: { type: "string" },
                    mcp_url: nullableString,
                    tables: stringArray,
                    mcp_tools: stringArray,
                    note: { type: "string" }
                }
            }
        }
    },
    paths: {
        "/health": {
            get: {
                summary: "Health status",
                responses: {
                    "200": jsonResponse("Service health", {
                        type: "object",
                        required: ["status", "service", "store"],
                        properties: { status: { type: "string" }, service: { type: "string" }, store: { type: "string" } }
                    })
                }
            }
        },
        "/openapi.json": {
            get: {
                summary: "OpenAPI document",
                responses: { "200": jsonResponse("This OpenAPI 3.0.3 document", { type: "object", additionalProperties: true }) }
            }
        },
        "/v1/live/status": {
            get: {
                summary: "Redacted live integration status",
                responses: { "200": jsonResponse("Redacted live integration status", ref("LiveStatus")) }
            }
        },
        "/v1/legal-intent": {
            post: {
                summary: "Register a legal intent",
                requestBody: jsonBody({
                    type: "object",
                    required: ["agent_id", "input"],
                    properties: {
                        agent_id: requiredString,
                        jurisdiction,
                        input: requiredString,
                        document_type: { type: "string" },
                        parties: stringArray,
                        obligations: stringArray,
                        risk_flags: stringArray
                    }
                }),
                responses: {
                    "201": jsonResponse("Legal intent created", ref("LegalIntent")),
                    "400": errorResponse("Invalid body (error code VALIDATION_ERROR)"),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/signature/request": {
            post: {
                summary: "Create a signature request",
                requestBody: jsonBody({
                    type: "object",
                    required: ["agent_id", "document_hash"],
                    properties: {
                        agent_id: requiredString,
                        jurisdiction,
                        document_hash: requiredString,
                        legal_intent_id: { type: "string" },
                        requested_signature_level: { type: "integer", minimum: 1, maximum: 3 }
                    }
                }),
                responses: {
                    "201": jsonResponse("Signature request created with request_hash and status awaiting_payment", ref("SignatureRequest")),
                    "400": errorResponse("Invalid body (error code VALIDATION_ERROR)"),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/wallets/verify-signature": {
            post: {
                summary: "Verify an agent wallet signature on Polygon Amoy",
                requestBody: jsonBody({
                    type: "object",
                    required: ["agent_id", "chain_id", "wallet_address", "message", "signature"],
                    properties: {
                        agent_id: requiredString,
                        chain_id: { type: "integer" },
                        wallet_address: hexAddress,
                        message: requiredString,
                        signature: hexData
                    }
                }),
                responses: {
                    "200": jsonResponse("Wallet proof", ref("WalletProof")),
                    "400": errorResponse("Invalid body, wrong chain or bad signature (error codes VALIDATION_ERROR, CHAIN_ID_MISMATCH, INVALID_WALLET_SIGNATURE)"),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/payments/l402/verify": {
            post: {
                summary: "Register an L402 payment receipt",
                requestBody: jsonBody({
                    type: "object",
                    required: ["signature_request_id", "receipt"],
                    properties: {
                        signature_request_id: requiredString,
                        receipt: requiredString
                    }
                }),
                responses: {
                    "201": jsonResponse("L402 receipt registered as payment proof", ref("PaymentProof")),
                    "400": errorResponse("Invalid body or receipt not in macaroon:preimage format (error codes VALIDATION_ERROR, INVALID_L402_RECEIPT)"),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/payments/amoy/verify": {
            post: {
                summary: "Verify a Polygon Amoy transaction",
                requestBody: jsonBody({
                    type: "object",
                    required: ["chain_id", "tx_hash", "expected_sender", "expected_recipient"],
                    properties: {
                        chain_id: { type: "integer" },
                        tx_hash: txHash,
                        expected_sender: hexAddress,
                        expected_recipient: hexAddress
                    }
                }),
                responses: {
                    "200": jsonResponse("Amoy transaction verification result", {
                        type: "object",
                        required: ["valid"],
                        properties: {
                            valid: { type: "boolean" },
                            reason: { type: "string", enum: ["CHAIN_ID_MISMATCH", "RPC_CHAIN_ID_MISMATCH"] },
                            senderOk: { type: "boolean" },
                            recipientOk: { type: "boolean" },
                            success: { type: "boolean" },
                            chain_id: { type: "integer" },
                            tx_hash: txHash
                        }
                    }),
                    "400": errorResponse("Invalid body (error code VALIDATION_ERROR)"),
                    "503": errorResponse("Amoy RPC not configured, set AMOY_RPC_URL (error code AMOY_RPC_NOT_CONFIGURED)")
                }
            }
        },
        "/v1/signature/validate": {
            post: {
                summary: "Run legal analysis for a signature request",
                requestBody: jsonBody({
                    type: "object",
                    required: ["signature_request_id"],
                    properties: {
                        signature_request_id: requiredString,
                        jurisdiction,
                        legal_text: { type: "string" }
                    }
                }),
                responses: {
                    "200": jsonResponse("Legal analysis result; legal_text containing 'poder' sets requires_human_notary", ref("LegalAnalysis")),
                    "400": errorResponse("Invalid body (error code VALIDATION_ERROR)"),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/attestations": {
            post: {
                summary: "Issue an attestation",
                requestBody: jsonBody({
                    type: "object",
                    required: ["signature_request_id", "wallet_proof_id", "payment_proof_id", "agent_wallet"],
                    properties: {
                        signature_request_id: requiredString,
                        wallet_proof_id: requiredString,
                        payment_proof_id: requiredString,
                        agent_wallet: hexAddress,
                        amoy_tx_hash: txHash
                    }
                }),
                responses: {
                    "201": jsonResponse("Attestation issued, includes verification_url", {
                        allOf: [
                            ref("Attestation"),
                            { type: "object", required: ["verification_url"], properties: { verification_url: { type: "string" } } }
                        ]
                    }),
                    "400": errorResponse("Invalid body or missing proofs (error codes VALIDATION_ERROR, MissingWalletProof, MissingPaymentProof)"),
                    "404": errorResponse("Signature request not found (error code NotFound)"),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            },
            get: {
                summary: "List attestations",
                responses: {
                    "200": jsonResponse("All attestations", {
                        type: "object",
                        required: ["attestations"],
                        properties: { attestations: { type: "array", items: ref("Attestation") } }
                    }),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/attestations/{id}": {
            get: {
                summary: "Get an attestation",
                parameters: [idParam],
                responses: {
                    "200": jsonResponse("Attestation", ref("Attestation")),
                    "404": errorResponse("Attestation not found (error code NotFound)"),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/attestations/{id}/timeline": {
            get: {
                summary: "Get the audit timeline of an attestation",
                parameters: [idParam],
                responses: {
                    "200": jsonResponse("Chronological events: legal_intent, signature_request, wallet_proof, payment_proof, legal_analysis, attestation, human_escalation", ref("Timeline")),
                    "404": errorResponse("Attestation not found (error code NotFound)"),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/verify": {
            post: {
                summary: "Verify an attestation",
                requestBody: jsonBody({
                    type: "object",
                    required: ["attestation_id"],
                    properties: { attestation_id: requiredString }
                }),
                responses: {
                    "200": jsonResponse("Verification result with per-check breakdown", ref("VerificationResult")),
                    "400": errorResponse("Invalid body (error code VALIDATION_ERROR)"),
                    "404": errorResponse("Attestation not found (error code NotFound)"),
                    "502": errorResponse("Supabase audit store failure (error code AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/zavu/escalate": {
            post: {
                summary: "Escalate a signature request to a human notary via Zavu",
                requestBody: jsonBody({
                    type: "object",
                    required: ["signature_request_id", "reason"],
                    properties: {
                        signature_request_id: requiredString,
                        reason: requiredString,
                        test: { type: "boolean" }
                    }
                }),
                responses: {
                    "200": jsonResponse("Human escalation result (provider_mode live or simulated)", ref("HumanEscalationResult")),
                    "400": errorResponse("Invalid body (error code VALIDATION_ERROR)"),
                    "502": errorResponse("Zavu endpoint or audit store failure (error codes ZAVU_ESCALATION_FAILED, AUDIT_STORE_ERROR)")
                }
            }
        },
        "/v1/integrations/datamcp": {
            get: {
                summary: "Read-only DataMCP integration plan",
                responses: { "200": jsonResponse("DataMCP integration plan", ref("DataMcpPlan")) }
            }
        }
    }
};
