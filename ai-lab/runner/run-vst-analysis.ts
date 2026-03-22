// ─────────────────────────────────────────────
// AI LAB — VST ANALYSIS RUNNER
// Runs VST through all pipelines in analysis mode.
// build-output is blocked by safeguard in analysis mode.
//
// Runtime: Node 18+ via tsx
//
// Required env vars:
//   ANTHROPIC_API_KEY  — Anthropic API key (required)
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... npx tsx ai-lab/runner/run-vst-analysis.ts
//   ANTHROPIC_API_KEY=sk-... npx tsx ai-lab/runner/run-vst-analysis.ts --json
// ─────────────────────────────────────────────

import { orchestrate, summariseRun } from "../orchestrator.ts";
import { DEFAULT_CONFIG, PIPELINE_SEQUENCE } from "../config.ts";
import { VST_ASSET as VST_SEED } from "../assets/vst-seed.ts";
import type { RawAsset } from "../types.ts";

// vst-seed.ts exports sources only — wrap with required id + name
const VST_ASSET: RawAsset = {
  id: "vst",
  name: "Voyage Smart Travels",
  ...VST_SEED,
};

async function main() {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) {
    console.error("[VST] ANTHROPIC_API_KEY is not set.");
    console.error("      Export it before running:");
    console.error("      export ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  console.log("[AI LAB] Starting VST analysis run...");
  console.log(`[AI LAB] Sources: ${VST_ASSET.sources.length}`);
  console.log(`[AI LAB] Mode   : analysis (build-output blocked)`);
  console.log(`[AI LAB] Model  : ${DEFAULT_CONFIG.claudeModel}\n`);

  const run = await orchestrate(
    [VST_ASSET],
    PIPELINE_SEQUENCE,
    apiKey,
    {
      ...DEFAULT_CONFIG,
      mode: "analysis",
      allowMultiAsset: false,
    },
  );

  console.log("\n" + summariseRun(run));

  if (process.argv.includes("--json")) {
    console.log("\n--- FULL JSON OUTPUT ---");
    console.log(JSON.stringify(run, null, 2));
  }
}

main().catch((err) => {
  console.error("[VST] Fatal:", err.message);
  process.exit(1);
});
