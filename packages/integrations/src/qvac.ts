import { parseLegalAnalysis } from "../../core/src/legal-analysis.ts";
import type { LegalAnalysis, SignatureRequest } from "../../core/src/index.ts";

export interface LegalAnalyzerInput {
  signatureRequest: SignatureRequest;
  legalText?: string;
}

export type LegalAnalyzer = (input: LegalAnalyzerInput) => Promise<LegalAnalysis>;

export interface QvacLegalAnalyzerOptions {
  baseUrl?: string;
  model?: string;
  fetch?: typeof fetch;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

export function createQvacLegalAnalyzer(options: QvacLegalAnalyzerOptions = {}): LegalAnalyzer {
  const baseUrl = trimTrailingSlash(options.baseUrl ?? process.env.QVAC_BASE_URL ?? "http://localhost:11434/v1");
  const model = options.model ?? process.env.QVAC_MODEL ?? "notary-llm";
  const fetchImpl = options.fetch ?? fetch;

  return async ({ signatureRequest, legalText }) => {
    const response = await fetchImpl(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "accept": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: [
              "You are ElSalvadorNotaryAgent.",
              "Return only JSON with signature_level, risk_score, requires_human_notary, summary, checklist, and risk_flags.",
              "You classify legal workflow risk; you do not claim final legal validity.",
            ].join(" "),
          },
          {
            role: "user",
            content: JSON.stringify({
              jurisdiction: signatureRequest.jurisdiction,
              agent_id: signatureRequest.agent_id,
              document_hash: signatureRequest.document_hash,
              request_hash: signatureRequest.request_hash,
              requested_signature_level: signatureRequest.requested_signature_level,
              legal_text: legalText ?? "",
            }),
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      throw new Error(`QVAC request failed with status ${response.status}`);
    }

    const body = await response.json() as ChatCompletionResponse;
    const content = body.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("QVAC response did not include message content.");
    }

    return parseLegalAnalysis(content);
  };
}

function trimTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}
