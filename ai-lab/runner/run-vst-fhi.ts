// ─────────────────────────────────────────────
// AI LAB — VST + FHI PARALLEL RUN
// Runs both assets through all pipelines in parallel.
//
// Runtime: Node 18+ via tsx
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... npx tsx ai-lab/runner/run-vst-fhi.ts
//   ANTHROPIC_API_KEY=sk-... npx tsx ai-lab/runner/run-vst-fhi.ts --json
// ─────────────────────────────────────────────

import { orchestrate, summariseRun } from "../orchestrator.ts";
import { DEFAULT_CONFIG, PIPELINE_SEQUENCE } from "../config.ts";
import { VST_ASSET } from "../assets/vst-seed.ts";
import { FHI_ASSET } from "../assets/fhi-seed.ts";

async function main() {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable required");

  console.log("[AI LAB] Starting VST + FHI parallel orchestration run...\n");

  const run = await orchestrate(
    [VST_ASSET, FHI_ASSET],
    PIPELINE_SEQUENCE,
    apiKey,
    {
      ...DEFAULT_CONFIG,
      maxConcurrentJobs: 10,
      allowMultiAsset: true,
      mode: "analysis",
    },
  );

  console.log("\n" + summariseRun(run));

  if (process.argv.includes("--json")) {
    console.log("\n--- FULL OUTPUT ---");
    console.log(JSON.stringify(run, null, 2));
  }
}

main().catch((err) => {
  console.error("[AI LAB] Fatal:", err.message);
  process.exit(1);
});
