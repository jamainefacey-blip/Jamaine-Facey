// ─────────────────────────────────────────────
// AI LAB — RUNNER
// Convenience wrapper to run a single asset
// through all or selected pipelines.
//
// Runtime: Node 18+ via tsx
//
// Usage:
//   ANTHROPIC_API_KEY=sk-... npx tsx ai-lab/runner/run-asset.ts \
//     --asset vst \
//     --name "Voyage Smart Travels" \
//     --source-file ./vst-docs.txt
// ─────────────────────────────────────────────

import { promises as fs } from "fs";
import { orchestrate, summariseRun } from "../orchestrator.ts";
import { ASSET_REGISTRY, DEFAULT_CONFIG, PIPELINE_SEQUENCE } from "../config.ts";
import type { AssetSource, PipelineId, RawAsset } from "../types.ts";

// ── Parse CLI args ────────────────────────────

const args = process.argv.slice(2);

function getArg(flag: string): string | undefined {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : undefined;
}

function getFlag(flag: string): boolean {
  return args.includes(flag);
}

async function main() {
  const apiKey = process.env["ANTHROPIC_API_KEY"];
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY environment variable required");

  const assetId = getArg("--asset") ?? "unknown";
  const assetName = getArg("--name") ?? ASSET_REGISTRY[assetId] ?? assetId;
  const sourceFile = getArg("--source-file");
  const sourceText = getArg("--source-text");
  const pipelinesArg = getArg("--pipelines");

  const pipelines = pipelinesArg
    ? (pipelinesArg.split(",") as PipelineId[])
    : PIPELINE_SEQUENCE;

  // Build sources
  const sources: AssetSource[] = [];

  if (sourceFile) {
    const content = await fs.readFile(sourceFile, "utf8");
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

  if (getFlag("--json")) {
    console.log("\n--- FULL OUTPUT ---");
    console.log(JSON.stringify(run, null, 2));
  }
}

main().catch((err) => {
  console.error("[RUNNER] Fatal:", err.message);
  process.exit(1);
});
