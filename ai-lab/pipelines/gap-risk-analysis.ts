// ─────────────────────────────────────────────
// PIPELINE C — GAP & RISK ANALYSIS
//
// Input : ExtractedSystem
// Output: GapRiskReport
//
// Steps:
//   1. Product Manager Agent → full gap/risk analysis
//   2. Sort gaps by severity
//   3. Sort risks by impact × likelihood
//   4. Return GapRiskReport
// ─────────────────────────────────────────────

import { runProductManagerAgent } from "../agents/product-manager-agent.ts";
import type { ExtractedSystem, Gap, GapRiskReport, Risk } from "../types.ts";

const SEVERITY_ORDER: Record<Gap["severity"], number> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

const IMPACT_ORDER: Record<Risk["impact"], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export async function runGapRiskPipeline(
  extracted: ExtractedSystem,
  apiKey: string,
  model: string,
): Promise<GapRiskReport> {
  console.log(`[PIPELINE:gap-risk] Starting for asset: ${extracted.assetId}`);

  // Step 1: PM Agent
  const report = await runProductManagerAgent(extracted, apiKey, model);

  // Step 2: Sort gaps by severity
  report.gaps.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  // Step 3: Sort risks by impact then likelihood
  report.risks.sort((a, b) => {
    const impactDiff = IMPACT_ORDER[a.impact] - IMPACT_ORDER[b.impact];
    return impactDiff !== 0 ? impactDiff : IMPACT_ORDER[a.likelihood] - IMPACT_ORDER[b.likelihood];
  });

  console.log(
    `[PIPELINE:gap-risk] Complete — score: ${report.score}/100, ` +
    `${report.gaps.filter((g) => g.severity === "critical").length} critical gaps, ` +
    `${report.blockers.length} blockers`,
  );

  return report;
}
