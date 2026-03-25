// ─────────────────────────────────────────────
// PIPELINE A — ASSET EXTRACTION
//
// Input : RawAsset (files, chats, repos, docs)
// Output: ExtractedSystem
//
// Steps:
//   1. Validate sources are present
//   2. Extractor Agent → structured extraction
//   3. Return ExtractedSystem
// ─────────────────────────────────────────────

import { runExtractorAgent } from "../agents/extractor-agent.ts";
import type { ExtractedSystem, RawAsset } from "../types.ts";

export async function runExtractionPipeline(
  asset: RawAsset,
  apiKey: string,
  model: string,
): Promise<ExtractedSystem> {
  console.log(`[PIPELINE:extraction] Starting for asset: ${asset.id}`);

  // Step 1: Validate
  if (!asset.sources || asset.sources.length === 0) {
    throw new Error(`Asset ${asset.id} has no sources — cannot extract`);
  }

  // Step 2: Extract
  const extracted = await runExtractorAgent(asset, apiKey, model);

  console.log(
    `[PIPELINE:extraction] Complete — ${extracted.coreEntities.length} entities, ` +
    `${extracted.flows.length} flows, ${extracted.knownGaps.length} gaps identified`,
  );

  return extracted;
}
