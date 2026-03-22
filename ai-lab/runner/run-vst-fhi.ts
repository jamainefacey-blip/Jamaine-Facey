// ─────────────────────────────────────────────
// AI LAB — FIRST RUN: VST + FHI
// Runs both assets through all pipelines in parallel.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... deno run --allow-net --allow-env \
//     ai-lab/runner/run-vst-fhi.ts
//
// Outputs saved to stdout as JSON.
// Add --json flag for full output dump.
// ─────────────────────────────────────────────

import { orchestrate, summariseRun } from "../orchestrator.ts";
import { DEFAULT_CONFIG, PIPELINE_SEQUENCE } from "../config.ts";
import { VST_ASSET } from "../assets/vst-seed.ts";
import { FHI_ASSET } from "../assets/fhi-seed.ts";

async function main() {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable required");

  console.log("[AI LAB] Starting VST + FHI parallel orchestration run...\n");

  const run = await orchestrate(
    [VST_ASSET, FHI_ASSET],
    PIPELINE_SEQUENCE,
    apiKey,
    {
      ...DEFAULT_CONFIG,
      maxConcurrentJobs: 10,  // process both assets in parallel
      allowMultiAsset: true,  // explicit: this runner is intentionally multi-asset
      mode: "analysis",       // analysis only — no write output
    },
  );

  console.log("\n" + summariseRun(run));

  if (Deno.args.includes("--json")) {
    console.log("\n--- FULL OUTPUT ---");
    console.log(JSON.stringify(run, null, 2));
  }
}

main().catch((err) => {
  console.error("[AI LAB] Fatal:", err.message);
  Deno.exit(1);
});
