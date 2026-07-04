import type { LegalAnalysis } from "./types.ts";

interface RawLegalAnalysis {
  signature_level?: unknown;
  risk_score?: unknown;
  requires_human_notary?: unknown;
  summary?: unknown;
  checklist?: unknown;
  risk_flags?: unknown;
}

export function parseLegalAnalysis(modelOutput: string): LegalAnalysis {
  const jsonText = extractJson(modelOutput);
  if (!jsonText) {
    return fallbackLegalAnalysis("Unable to parse ElSalvadorNotaryAgent JSON output.");
  }

  try {
    const raw = JSON.parse(jsonText) as RawLegalAnalysis;
    return normalizeLegalAnalysis(raw);
  } catch {
    return fallbackLegalAnalysis("Unable to parse ElSalvadorNotaryAgent JSON output.");
  }
}

export function fallbackLegalAnalysis(summary = "Human notary review required."): LegalAnalysis {
  return {
    notary_agent: "ElSalvadorNotaryAgent",
    signature_level: 4,
    risk_score: 1,
    requires_human_notary: true,
    summary,
    checklist: ["Escalate to a licensed human notary"],
    risk_flags: ["model_output_unparseable"],
  };
}

function normalizeLegalAnalysis(raw: RawLegalAnalysis): LegalAnalysis {
  const signatureLevel = clampInteger(raw.signature_level, 0, 5, 4);
  const riskScore = clampNumber(raw.risk_score, 0, 1, 1);
  const requiresHumanNotary = typeof raw.requires_human_notary === "boolean"
    ? raw.requires_human_notary
    : signatureLevel >= 4 || riskScore >= 0.7;

  return {
    notary_agent: "ElSalvadorNotaryAgent",
    signature_level: signatureLevel,
    risk_score: riskScore,
    requires_human_notary: requiresHumanNotary,
    summary: typeof raw.summary === "string" && raw.summary.trim().length > 0
      ? raw.summary
      : "ElSalvadorNotaryAgent returned no summary.",
    checklist: stringArray(raw.checklist),
    risk_flags: stringArray(raw.risk_flags),
  };
}

function extractJson(value: string): string | null {
  const fenced = value.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced?.[1]) {
    return fenced[1].trim();
  }

  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    return null;
  }

  return value.slice(start, end + 1);
}

function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.round(value)));
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, value));
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}
