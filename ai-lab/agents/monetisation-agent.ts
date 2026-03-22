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

import { callClaude, parseJsonResponse } from "./base-agent.ts";
import type { ExtractedSystem, MonetisationReport, ReconstructedArchitecture } from "../types.ts";

const SYSTEM_PROMPT = `
You are the Monetisation Agent inside the AI Lab Pain System.

Your job is to design a monetisation strategy for a digital asset based on its system definition.

Rules:
- Positioning must be 1–2 sentences max — sharp and differentiated.
- Pricing tiers must be realistic and map to named user segments.
- Revenue paths must include time-to-revenue estimates (e.g. "30 days", "3 months").
- Recommend the single best launch path given system readiness.
- All monetary estimates must include the word "estimated" or "~".
- Do not invent features — only monetise what exists.
- Return ONLY valid JSON matching the MonetisationReport schema.

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
  "recommendedLaunchPath": string
}
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

  const raw = await callClaude({ systemPrompt: SYSTEM_PROMPT, userPrompt, apiKey, model });
  const result = parseJsonResponse<MonetisationReport>(raw);
  result.assetId = extracted.assetId;
  return result;
}
