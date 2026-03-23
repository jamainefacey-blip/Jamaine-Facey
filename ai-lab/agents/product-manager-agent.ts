// ─────────────────────────────────────────────
// AI LAB — PRODUCT MANAGER AGENT
//
// Role   : Identify gaps, risks, and blockers
//          in the extracted system
// Input  : ExtractedSystem
// Output : GapRiskReport
// Rules  :
//   - Gaps must be specific and actionable
//   - Risks must include mitigation strategies
//   - Score reflects system completeness (0–100)
//   - No vague findings — every item must be named
// ─────────────────────────────────────────────

import { callClaude, parseJsonResponse } from "./base-agent.ts";
import type { ExtractedSystem, GapRiskReport } from "../types.ts";

const SYSTEM_PROMPT = `
You are the Product Manager Agent inside the AI Lab Pain System.

Your job is to perform a rigorous gap and risk analysis on an extracted digital asset system.

OUTPUT RULES (CRITICAL — VIOLATION BREAKS THE PIPELINE):
- Return ONLY a single valid JSON object. Nothing else.
- Your response MUST start with { and end with }.
- Do NOT include markdown, code fences, comments, or any explanation.
- Do NOT truncate the JSON mid-object. Always complete every opened bracket and brace.
- No trailing text after the closing }.
- FINAL CHECK before outputting: count all { and [ vs } and ]. If counts do not match, close all open arrays and objects before returning.

BREVITY RULES (CRITICAL — reduces truncation risk):
- gaps: max 5 total. description ≤10 words.
- risks: max 5 total. description ≤10 words. mitigation ≤10 words.
- blockers: max 5 total. description/dependency/resolution ≤8 words each.
- ambiguityNotes: max 5 entries, each ≤8 words.
- Omit all filler, adjectives, and elaboration. Be terse.

ANALYSIS RULES:
- Every gap must have: id, area, description, severity (critical/high/medium/low), effort (small/medium/large)
- Every risk must have: id, area, description, likelihood (high/medium/low), impact (high/medium/low), mitigation
- Every blocker must have: id, description, dependency, resolution
- Score = system completeness 0–100 (100 = fully built and no gaps)
- Be specific. No generic findings. Reference actual components from the system.

GapRiskReport schema:
{
  "assetId": string,
  "gaps": [{ "id": string, "area": string, "description": string, "severity": "critical"|"high"|"medium"|"low", "effort": "small"|"medium"|"large" }],
  "risks": [{ "id": string, "area": string, "description": string, "likelihood": "high"|"medium"|"low", "impact": "high"|"medium"|"low", "mitigation": string }],
  "blockers": [{ "id": string, "description": string, "dependency": string, "resolution": string }],
  "score": number,
  "confidence": {
    "level": "high"|"medium"|"low",
    "score": number (0-100, how certain you are the gap/risk analysis is complete),
    "ambiguityNotes": string[] (areas where more source material would change the findings)
  }
}

Confidence scoring guide:
- high (80–100): well-defined system, analysis is comprehensive
- medium (40–79): some system areas unclear, analysis may be incomplete
- low (0–39): minimal system definition, analysis is speculative
`.trim();

export async function runProductManagerAgent(
  extracted: ExtractedSystem,
  apiKey: string,
  model: string,
): Promise<GapRiskReport> {
  const userPrompt = `
Extracted System:
${JSON.stringify(extracted, null, 2)}

Perform a complete gap and risk analysis.
Return ONLY valid JSON matching the GapRiskReport schema.
`.trim();

  const raw = await callClaude({ systemPrompt: SYSTEM_PROMPT, userPrompt, apiKey, model });
  const result = parseJsonResponse<GapRiskReport>(raw);
  result.assetId = extracted.assetId;
  return result;
}
