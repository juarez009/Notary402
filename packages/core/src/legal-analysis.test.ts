import assert from "node:assert/strict";
import { test } from "node:test";
import { parseLegalAnalysis } from "./legal-analysis.ts";

test("parseLegalAnalysis extracts ElSalvadorNotaryAgent JSON from fenced model output", () => {
  const analysis = parseLegalAnalysis(`
The structured result is:

\`\`\`json
{
  "signature_level": 4,
  "risk_score": 0.81,
  "requires_human_notary": true,
  "summary": "Real estate transfer requires human notary countersignature.",
  "checklist": ["Verify party identity", "Escalate to licensed notary"],
  "risk_flags": ["real_estate_transfer"]
}
\`\`\`
`);

  assert.equal(analysis.notary_agent, "ElSalvadorNotaryAgent");
  assert.equal(analysis.signature_level, 4);
  assert.equal(analysis.risk_score, 0.81);
  assert.equal(analysis.requires_human_notary, true);
  assert.deepEqual(analysis.checklist, ["Verify party identity", "Escalate to licensed notary"]);
  assert.deepEqual(analysis.risk_flags, ["real_estate_transfer"]);
});

test("parseLegalAnalysis returns a safe fallback when model output is not valid JSON", () => {
  const analysis = parseLegalAnalysis("not json");

  assert.equal(analysis.signature_level, 4);
  assert.equal(analysis.requires_human_notary, true);
  assert.equal(analysis.risk_score, 1);
  assert.match(analysis.summary, /Unable to parse/);
});
