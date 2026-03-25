// ─────────────────────────────────────────────
// PIPELINE B — ASSET RECONSTRUCTION
//
// Input : ExtractedSystem (partial asset OK)
// Output: ReconstructedArchitecture
//
// Steps:
//   1. Check extraction completeness
//   2. Architect Agent → full architecture + flows
//   3. Flag low-confidence inferences
//   4. Return ReconstructedArchitecture
// ─────────────────────────────────────────────

import { runArchitectAgent } from "../agents/architect-agent.ts";
import type { ExtractedSystem, ReconstructedArchitecture } from "../types.ts";

export async function runReconstructionPipeline(
  extracted: ExtractedSystem,
  apiKey: string,
  model: string,
): Promise<ReconstructedArchitecture> {
  console.log(`[PIPELINE:reconstruction] Starting for asset: ${extracted.assetId}`);

  // Step 1: Assess completeness signal for logging
  const completedFlows = extracted.flows.filter((f) => f.status === "complete").length;
  const totalFlows = extracted.flows.length;
  const gapCount = extracted.knownGaps.length;
  console.log(
    `[PIPELINE:reconstruction] Signal — ${completedFlows}/${totalFlows} complete flows, ${gapCount} known gaps`,
  );

  // Step 2: Architect Agent
  const arch = await runArchitectAgent(extracted, apiKey, model);

  // Step 3: Log confidence
  console.log(
    `[PIPELINE:reconstruction] Complete — ${arch.layers.length} layers, ` +
    `${arch.dataFlows.length} data flows, confidence: ${arch.confidence}`,
  );

  if (arch.confidence.level === "low") {
    console.warn(
      `[PIPELINE:reconstruction] LOW CONFIDENCE for ${extracted.assetId} — ` +
      `consider adding more source material`,
    );
  }

  return arch;
}
