// ─────────────────────────────────────────────
// AI LAB — RUNNER
// Convenience wrapper to run a single asset
// through all or selected pipelines.
//
// Usage (Deno):
//   ANTHROPIC_API_KEY=sk-... deno run --allow-net \
//     ai-lab/runner/run-asset.ts \
//     --asset vst \
//     --name "Voyage Smart Travels" \
//     --source-file ./vst-docs.txt
// ─────────────────────────────────────────────

import { orchestrate, summariseRun } from "../orchestrator.ts";
import { ASSET_REGISTRY, DEFAULT_CONFIG, PIPELINE_SEQUENCE } from "../config.ts";
import type { AssetSource, PipelineId, RawAsset } from "../types.ts";

// ── Parse CLI args ────────────────────────────

function getArg(args: string[], flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function getFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

async function main() {
  const args = Deno.args;

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable required");

  const assetId = getArg(args, "--asset") ?? "unknown";
  const assetName = getArg(args, "--name") ?? ASSET_REGISTRY[assetId] ?? assetId;
  const sourceFile = getArg(args, "--source-file");
  const sourceText = getArg(args, "--source-text");
  const pipelinesArg = getArg(args, "--pipelines");

  const pipelines = pipelinesArg
    ? (pipelinesArg.split(",") as PipelineId[])
    : PIPELINE_SEQUENCE;

  // Build sources
  const sources: AssetSource[] = [];

  if (sourceFile) {
    const content = await Deno.readTextFile(sourceFile);
    sources.push({ kind: "file", label: sourceFile, content });
  }

  if (sourceText) {
    sources.push({ kind: "doc", label: "inline-text", content: sourceText });
  }

  if (sources.length === 0) {
    throw new Error("Provide at least one source via --source-file or --source-text");
  }

  const asset: RawAsset = { id: assetId, name: assetName, sources };

  const run = await orchestrate([asset], pipelines, apiKey, DEFAULT_CONFIG);
  console.log("\n" + summariseRun(run));

  // Dump outputs to stdout as JSON
  if (getFlag(args, "--json")) {
    console.log("\n--- FULL OUTPUT ---");
    console.log(JSON.stringify(run, null, 2));
  }
}

main().catch((err) => {
  console.error("[RUNNER] Fatal:", err.message);
  Deno.exit(1);
});
