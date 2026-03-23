// ─────────────────────────────────────────────
// AI LAB — VALIDATOR AGENT
//
// Role   : Validate all pipeline outputs and
//          generate Claude Code-ready build specs
// Input  : ExtractedSystem + all prior pipeline outputs
// Output : BuildSpec
// Rules  :
//   - Build specs must be immediately actionable
//   - Every file spec must include a content skeleton
//   - Priorities: p0 = must-have, p1 = should-have, p2 = nice-to-have
//   - No spec item can reference a non-existent system component
//   - Deploy checklist must be sequential and complete
// ─────────────────────────────────────────────

import { callClaude, parseJsonResponse } from "./base-agent.ts";
import type {
  BuildSpec,
  ExtractedSystem,
  GapRiskReport,
  MonetisationReport,
  ReconstructedArchitecture,
} from "../types.ts";

const SYSTEM_PROMPT = `
You are the Validator Agent inside the AI Lab Pain System.

Your job is to synthesise all analysis outputs into a single, actionable Claude Code-ready build specification.

OUTPUT RULES (CRITICAL — VIOLATION BREAKS THE PIPELINE):
- Return ONLY a single valid JSON object. Nothing else.
- Your response MUST start with { and end with }.
- Do NOT include markdown, code fences, comments, or any explanation.
- Do NOT truncate the JSON mid-object. Always complete every opened bracket and brace.
- No trailing text after the closing }.
- FINAL CHECK before outputting: count all { and [ vs } and ]. If counts do not match, close all open arrays and objects before returning.

BREVITY RULES (CRITICAL — reduces truncation risk):
- objective: max 1 sentence, ≤20 words.
- modules: max 5 total. purpose ≤8 words. inputs/outputs: max 3 each.
- filesToCreate: max 5 total. purpose ≤8 words. contentSkeleton ≤10 lines.
- filesToModify: max 5 total. change/reason ≤8 words each.
- dependencies: max 8 entries.
- testPlan: max 5 entries, each ≤10 words.
- deployChecklist: max 8 entries, each ≤10 words.
- ambiguityNotes: max 5 entries, each ≤8 words.
- Omit all filler, adjectives, and elaboration. Be terse.

BUILD RULES:
- BuildSpec must be directly executable by an AI coding agent (Claude Code).
- Every module must have clear inputs and outputs.
- FileSpec contentSkeleton must be real code/config stubs — not pseudocode.
- Priorities: p0 = launch blocker, p1 = important for full product, p2 = enhancement.
- testPlan must be specific test cases, not generic test categories.
- deployChecklist must be ordered steps, not categories.

BuildSpec schema:
{
  "assetId": string,
  "title": string,
  "objective": string,
  "modules": [{ "name": string, "purpose": string, "inputs": string[], "outputs": string[], "priority": "p0"|"p1"|"p2" }],
  "filesToCreate": [{ "path": string, "purpose": string, "contentSkeleton": string }],
  "filesToModify": [{ "path": string, "change": string, "reason": string }],
  "dependencies": string[],
  "testPlan": string[],
  "deployChecklist": string[],
  "confidence": {
    "level": "high"|"medium"|"low",
    "score": number (0-100, how ready-to-execute this spec is),
    "ambiguityNotes": string[] (any spec items that require human clarification before execution)
  }
}

Confidence scoring guide:
- high (80–100): spec is fully executable with no human decisions required
- medium (40–79): spec is mostly executable but some items need clarification
- low (0–39): spec is directional; significant clarification required before coding
`.trim();

export async function runValidatorAgent(
  extracted: ExtractedSystem,
  arch: ReconstructedArchitecture | null,
  gaps: GapRiskReport | null,
  money: MonetisationReport | null,
  apiKey: string,
  model: string,
): Promise<BuildSpec> {
  const userPrompt = `
Extracted System:
${JSON.stringify(extracted, null, 2)}

${arch ? `Architecture:\n${JSON.stringify(arch, null, 2)}\n` : ""}
${gaps ? `Gap & Risk Report:\n${JSON.stringify(gaps, null, 2)}\n` : ""}
${money ? `Monetisation Report:\n${JSON.stringify(money, null, 2)}\n` : ""}

Generate the complete Claude Code-ready build specification.
Return ONLY valid JSON matching the BuildSpec schema.
`.trim();

  const raw = await callClaude({ systemPrompt: SYSTEM_PROMPT, userPrompt, apiKey, model });
  const result = parseJsonResponse<BuildSpec>(raw);
  result.assetId = extracted.assetId;
  return result;
}
