#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE_URL = process.env.NOTARY402_API_BASE_URL ?? "http://localhost:3001";

const server = new McpServer({
  name: "notary402-mcp-server",
  version: "0.1.0",
});

async function postJson<T>(path: string, payload: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const body = await response.json() as T;
  if (!response.ok) {
    throw new Error(`Notary402 API ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "accept": "application/json" },
  });
  const body = await response.json() as T;
  if (!response.ok) {
    throw new Error(`Notary402 API ${response.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

function toolResult(output: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(output, null, 2) }],
    structuredContent: output as Record<string, unknown>,
  };
}

server.registerTool(
  "notary402_get_datamcp_flow_plan",
  {
    title: "Get Notary402 DataMCP Flow Plan",
    description: "Return the recommended DataMCP integration plan for using a PostgreSQL audit database as schema-aware MCP context in the Notary402 workflow.",
    inputSchema: z.object({}).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async () => {
    const response = await fetch(`${API_BASE_URL}/v1/integrations/datamcp`);
    const output = await response.json();
    if (!response.ok) {
      throw new Error(`Notary402 API ${response.status}: ${JSON.stringify(output)}`);
    }
    return toolResult(output);
  },
);

server.registerTool(
  "notary402_start_legal_signature_flow",
  {
    title: "Start Notary402 Legal Signature Flow",
    description: "Create a Notary402 legal signature request for an agent. Returns the request hash and signature request id.",
    inputSchema: z.object({
      agent_id: z.string().min(1).describe("Calling agent identifier, such as codex-agent"),
      jurisdiction: z.literal("SV").describe("Jurisdiction code. MVP supports El Salvador only."),
      document_hash: z.string().regex(/^0x[a-fA-F0-9]+$/).describe("Hex document hash to bind into the request"),
      legal_text: z.string().optional().describe("Optional legal text for later analysis"),
      requested_signature_level: z.number().int().min(0).max(5).default(2),
    }).strict(),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const output = await postJson("/v1/signature/request", {
      agent_id: params.agent_id,
      jurisdiction: params.jurisdiction,
      document_hash: params.document_hash,
      requested_signature_level: params.requested_signature_level,
    });

    return toolResult(output);
  },
);

server.registerTool(
  "notary402_verify_amoy_wallet",
  {
    title: "Verify Notary402 Amoy Wallet",
    description: "Verify that an agent controls a Polygon Amoy wallet by checking an EIP-191 message signature.",
    inputSchema: z.object({
      agent_id: z.string().min(1),
      chain_id: z.literal(80002),
      wallet_address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      message: z.string().min(1),
      signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
    }).strict(),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => toolResult(await postJson("/v1/wallets/verify-signature", params)),
);

server.registerTool(
  "notary402_run_el_salvador_notary_agent",
  {
    title: "Run El Salvador Notary Agent",
    description: "Run jurisdiction-aware Notary402 legal analysis for an existing signature request.",
    inputSchema: z.object({
      signature_request_id: z.string().min(1),
      jurisdiction: z.literal("SV"),
      legal_text: z.string().optional(),
    }).strict(),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => toolResult(await postJson("/v1/signature/validate", params)),
);

server.registerTool(
  "notary402_escalate_to_human_notary",
  {
    title: "Escalate to Human Notary",
    description: "Escalate a Notary402 signature request to the configured Zavu communication channel.",
    inputSchema: z.object({
      signature_request_id: z.string().min(1),
      jurisdiction: z.literal("SV"),
      reason: z.string().min(1),
    }).strict(),
    annotations: {
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => toolResult(await postJson("/v1/zavu/escalate", params)),
);

server.registerTool(
  "notary402_get_attestation_status",
  {
    title: "Get Notary402 Attestation Status",
    description: "Fetch an attestation JSON by id, including wallet, payment, legal analysis and issued status.",
    inputSchema: z.object({
      attestation_id: z.string().min(1),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => toolResult(await getJson(`/v1/attestations/${encodeURIComponent(params.attestation_id)}`)),
);

server.registerTool(
  "notary402_verify_attestation",
  {
    title: "Verify Notary402 Attestation",
    description: "Verify a Notary402 attestation by id and return the boolean checks for document hash, wallet, L402 payment, and Notary402 signature.",
    inputSchema: z.object({
      attestation_id: z.string().min(1).describe("Attestation id returned by /v1/attestations"),
    }).strict(),
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    const output = await postJson("/v1/verify", params);
    return toolResult(output);
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
