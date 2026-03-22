// ─────────────────────────────────────────────
// PIPELINE D — MONETISATION
//
// Input : ExtractedSystem + ReconstructedArchitecture (optional)
// Output: MonetisationReport
//
// Steps:
//   1. Monetisation Agent → strategy generation
//   2. Sort revenue paths by effort (low first)
//   3. Return MonetisationReport
// ─────────────────────────────────────────────

import { runMonetisationAgent } from "../agents/monetisation-agent.ts";
import type { ExtractedSystem, MonetisationReport, ReconstructedArchitecture, RevenuePath } from "../types.ts";

const EFFORT_ORDER: Record<RevenuePath["effort"], number> = {
  low: 0,
  medium: 1,
  high: 2,
};

export async function runMonetisationPipeline(
  extracted: ExtractedSystem,
  arch: ReconstructedArchitecture | null,
  apiKey: string,
  model: string,
): Promise<MonetisationReport> {
  console.log(`[PIPELINE:monetisation] Starting for asset: ${extracted.assetId}`);

  // Step 1: Monetisation Agent
  const report = await runMonetisationAgent(extracted, arch, apiKey, model);

  // Step 2: Sort by lowest effort first (quick wins first)
  report.revenuePaths.sort((a, b) => EFFORT_ORDER[a.effort] - EFFORT_ORDER[b.effort]);

  console.log(
    `[PIPELINE:monetisation] Complete — ${report.pricingModel.tiers.length} tiers, ` +
    `${report.revenuePaths.length} revenue paths, ` +
    `TAM: ${report.totalAddressableMarket}`,
  );

  return report;
}
