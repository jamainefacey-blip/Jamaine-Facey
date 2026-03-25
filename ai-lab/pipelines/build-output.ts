// ─────────────────────────────────────────────
// PIPELINE E — BUILD OUTPUT
//
// Input : ExtractedSystem + all prior pipeline outputs
// Output: BuildSpec (Claude Code-ready)
//
// Steps:
//   1. Validator Agent → synthesise all outputs into BuildSpec
//   2. Sort modules by priority (p0 first)
//   3. Return BuildSpec
// ─────────────────────────────────────────────

import { runValidatorAgent } from "../agents/validator-agent.ts";
import type {
  BuildModule,
  BuildSpec,
  ExtractedSystem,
  GapRiskReport,
  MonetisationReport,
  PipelineOutput,
  ReconstructedArchitecture,
} from "../types.ts";

const PRIORITY_ORDER: Record<BuildModule["priority"], number> = {
  p0: 0,
  p1: 1,
  p2: 2,
};

export async function runBuildOutputPipeline(
  extracted: ExtractedSystem,
  arch: ReconstructedArchitecture | null,
  gaps: PipelineOutput | null,
  money: PipelineOutput | null,
  apiKey: string,
  model: string,
): Promise<BuildSpec> {
  console.log(`[PIPELINE:build-output] Starting for asset: ${extracted.assetId}`);

  const gapReport = gaps as GapRiskReport | null;
  const moneyReport = money as MonetisationReport | null;

  // Step 1: Validator Agent
  const spec = await runValidatorAgent(extracted, arch, gapReport, moneyReport, apiKey, model);

  // Step 2: Sort modules by priority
  spec.modules.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);

  console.log(
    `[PIPELINE:build-output] Complete — ${spec.modules.length} modules, ` +
    `${spec.filesToCreate.length} files to create, ` +
    `${spec.deployChecklist.length} deploy steps`,
  );

  return spec;
}
