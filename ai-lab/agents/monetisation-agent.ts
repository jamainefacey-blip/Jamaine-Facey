// ─────────────────────────────────────────────
// AI LAB — MONETISATION AGENT
//
// Role   : Generate pricing, positioning, and
//          revenue paths for an asset
// Input  : ExtractedSystem + ReconstructedArchitecture (optional)
// Output : MonetisationReport
// Rules  :
//   - All revenue estimates must be labelled as estimates
//   - Pricing tiers must map to real user segments
//   - Recommend shortest path to first revenue
//   - Do not invent features not present in the system
// ─────────────────────────────────────────────

import { callClaude } from "./base-agent.ts";
import { validateAgentOutput, validateMonetisationOutput } from "../agent-validator.ts";
import type { ExtractedSystem, MonetisationReport, ReconstructedArchitecture } from "../types.ts";

const SYSTEM_PROMPT = `
You are the Monetisation Agent inside the AI Lab Pain System.

Your job is to design a monetisation strategy for a digital asset based on its system definition.

OUTPUT RULES (CRITICAL — VIOLATION BREAKS THE PIPELINE):
- Return ONLY a single valid JSON object. Nothing else.
- Your response MUST start with { and end with }.
- Do NOT include markdown, code fences, comments, or any explanation.
- Do NOT truncate the JSON mid-object. Always complete every opened bracket and brace.
- No trailing text after the closing }.
- FINAL CHECK before outputting: count all { and [ vs } and ]. If counts do not match, close all open arrays and objects before returning.

BREVITY RULES (CRITICAL — reduces truncation risk):
- positioning: max 1 sentence, ≤20 words.
- targetSegments: max 5 entries, each ≤5 words.
- pricingModel.tiers: max 3 tiers. features: max 3 per tier. name/targetUser ≤5 words.
- revenuePaths: max 5 total. mechanism ≤8 words.
- recommendedLaunchPath: max 1 sentence, ≤20 words.
- ambiguityNotes: max 5 entries, each ≤8 words.
- Omit all filler, adjectives, and elaboration. Be terse.

MONETISATION RULES:
- Positioning must be 1 sentence max — sharp and differentiated.
- Pricing tiers must be realistic and map to named user segments.
- Revenue paths must include time-to-revenue estimates (e.g. "30 days", "3 months").
- Recommend the single best launch path given system readiness.
- All monetary estimates must include the word "estimated" or "~".
- Do not invent features — only monetise what exists.

MonetisationReport schema:
{
  "assetId": string,
  "positioning": string,
  "targetSegments": string[],
  "pricingModel": {
    "type": "subscription"|"one-time"|"usage"|"freemium"|"hybrid",
    "tiers": [{ "name": string, "price": string, "features": string[], "targetUser": string }],
    "currency": string
  },
  "revenuePaths": [{ "name": string, "mechanism": string, "estimatedMonthlyRevenue": string, "timeToRevenue": string, "effort": "low"|"medium"|"high" }],
  "totalAddressableMarket": string,
  "recommendedLaunchPath": string,
  "confidence": {
    "level": "high"|"medium"|"low",
    "score": number (0-100, confidence in pricing/revenue estimates),
    "ambiguityNotes": string[] (what market data, competitor info, or system detail is missing that would sharpen estimates)
  }
}

Confidence scoring guide:
- high (80–100): clear product, known market, pricing well-grounded
- medium (40–79): product partially defined, pricing directional
- low (0–39): minimal system detail, pricing highly speculative
`.trim();

export async function runMonetisationAgent(
  extracted: ExtractedSystem,
  arch: ReconstructedArchitecture | null,
  apiKey: string,
  model: string,
): Promise<MonetisationReport> {
  const userPrompt = `
Extracted System:
${JSON.stringify(extracted, null, 2)}

${arch ? `Reconstructed Architecture:\n${JSON.stringify(arch, null, 2)}` : ""}

Design the full monetisation strategy.
Return ONLY valid JSON matching the MonetisationReport schema.
`.trim();

  const { output: result, retryCount, retryReasons } = await validateAgentOutput<MonetisationReport>({
    callFn: () => callClaude({ systemPrompt: SYSTEM_PROMPT, userPrompt, apiKey, model }),
    validateFn: validateMonetisationOutput,
    label: "monetisation",
    maxRetries: 3,
  });

  if (retryCount > 0) {
    console.warn(`[MONETISATION] Passed after ${retryCount} retry(ies). Reasons: ${retryReasons.join(" | ")}`);
  }

  result.assetId = extracted.assetId;
  return result;
}
