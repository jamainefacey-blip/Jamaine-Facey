// ─────────────────────────────────────────────
// AI LAB — ORCHESTRATOR
// Controls pipelines, assigns agents, manages
// execution order across all assets.
// ─────────────────────────────────────────────

import type {
  AssetId,
  OrchestratorConfig,
  OrchestratorRun,
  PipelineId,
  PipelineJob,
  PipelineOutput,
  RawAsset,
} from "./types.ts";
import { DEFAULT_CONFIG, PARALLEL_SAFE_PIPELINES, PIPELINE_SEQUENCE } from "./config.ts";
import { runExtractionPipeline } from "./pipelines/asset-extraction.ts";
import { runReconstructionPipeline } from "./pipelines/asset-reconstruction.ts";
import { runGapRiskPipeline } from "./pipelines/gap-risk-analysis.ts";
import { runMonetisationPipeline } from "./pipelines/monetisation.ts";
import { runBuildOutputPipeline } from "./pipelines/build-output.ts";
import type { ExtractedSystem, ReconstructedArchitecture } from "./types.ts";

// ── ID generation (Deno/edge-safe) ───────────

function uid(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

// ── Pipeline dispatcher ───────────────────────

async function dispatchPipeline(
  pipelineId: PipelineId,
  asset: RawAsset,
  previousOutputs: Map<PipelineId, PipelineOutput>,
  apiKey: string,
  model: string,
): Promise<PipelineOutput> {
  switch (pipelineId) {
    case "asset-extraction":
      return runExtractionPipeline(asset, apiKey, model);

    case "asset-reconstruction": {
      const extracted = previousOutputs.get("asset-extraction") as ExtractedSystem;
      if (!extracted) throw new Error("asset-reconstruction requires asset-extraction output");
      return runReconstructionPipeline(extracted, apiKey, model);
    }

    case "gap-risk-analysis": {
      const extracted = previousOutputs.get("asset-extraction") as ExtractedSystem;
      if (!extracted) throw new Error("gap-risk-analysis requires asset-extraction output");
      return runGapRiskPipeline(extracted, apiKey, model);
    }

    case "monetisation": {
      const extracted = previousOutputs.get("asset-extraction") as ExtractedSystem;
      const arch = previousOutputs.get("asset-reconstruction") as ReconstructedArchitecture;
      if (!extracted) throw new Error("monetisation requires asset-extraction output");
      return runMonetisationPipeline(extracted, arch ?? null, apiKey, model);
    }

    case "build-output": {
      const extracted = previousOutputs.get("asset-extraction") as ExtractedSystem;
      const arch = previousOutputs.get("asset-reconstruction") as ReconstructedArchitecture;
      const gaps = previousOutputs.get("gap-risk-analysis");
      const money = previousOutputs.get("monetisation");
      if (!extracted) throw new Error("build-output requires asset-extraction output");
      return runBuildOutputPipeline(extracted, arch ?? null, gaps ?? null, money ?? null, apiKey, model);
    }

    default:
      throw new Error(`Unknown pipeline: ${pipelineId}`);
  }
}

// ── Single asset run ──────────────────────────

export async function runAsset(
  asset: RawAsset,
  pipelines: PipelineId[],
  apiKey: string,
  config: OrchestratorConfig = DEFAULT_CONFIG,
): Promise<PipelineJob[]> {
  const jobs: PipelineJob[] = [];
  const outputs = new Map<PipelineId, PipelineOutput>();

  // Respect PIPELINE_SEQUENCE order even if caller provides unordered list
  const orderedPipelines = PIPELINE_SEQUENCE.filter((p) => pipelines.includes(p));

  // Identify serial vs parallel segments
  // Serial: extraction → reconstruction
  // Parallel: gap-risk + monetisation (both depend on extraction only)
  // Serial: build-output (depends on all)

  for (const pipelineId of orderedPipelines) {
    const job: PipelineJob = {
      jobId: uid(),
      pipelineId,
      assetId: asset.id,
      status: "running",
      startedAt: now(),
    };
    jobs.push(job);

    try {
      const output = await dispatchPipeline(pipelineId, asset, outputs, apiKey, config.claudeModel);
      outputs.set(pipelineId, output);
      job.status = "complete";
      job.completedAt = now();
      job.output = output;
    } catch (err) {
      job.status = "failed";
      job.completedAt = now();
      job.error = err instanceof Error ? err.message : String(err);
      // Non-blocking for parallel-safe pipelines; fatal for serial dependencies
      if (!PARALLEL_SAFE_PIPELINES.includes(pipelineId)) {
        console.error(`[ORCHESTRATOR] Fatal failure in ${pipelineId} for ${asset.id}:`, job.error);
        break;
      }
    }
  }

  return jobs;
}

// ── Multi-asset orchestrated run ──────────────

export async function orchestrate(
  assets: RawAsset[],
  pipelines: PipelineId[] = PIPELINE_SEQUENCE,
  apiKey: string,
  config: OrchestratorConfig = DEFAULT_CONFIG,
): Promise<OrchestratorRun> {
  const runId = uid();
  const startedAt = now();

  console.log(`[ORCHESTRATOR] Run ${runId} started — ${assets.length} asset(s), ${pipelines.length} pipeline(s)`);

  // Batch assets up to maxConcurrentJobs
  const allJobs: PipelineJob[] = [];
  const batches = chunk(assets, config.maxConcurrentJobs);

  for (const batch of batches) {
    const batchResults = await Promise.all(
      batch.map((asset) => runAsset(asset, pipelines, apiKey, config)),
    );
    batchResults.forEach((jobs) => allJobs.push(...jobs));
  }

  const failedJobs = allJobs.filter((j) => j.status === "failed");
  const status = failedJobs.length === 0
    ? "complete"
    : failedJobs.length === allJobs.length
    ? "failed"
    : "partial";

  const run: OrchestratorRun = {
    runId,
    assetIds: assets.map((a) => a.id),
    pipelines,
    jobs: allJobs,
    startedAt,
    completedAt: now(),
    status,
  };

  console.log(`[ORCHESTRATOR] Run ${runId} ${status} — ${allJobs.length} job(s) processed`);
  return run;
}

// ── Helpers ───────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

// ── Job summary reporter ──────────────────────

export function summariseRun(run: OrchestratorRun): string {
  const lines: string[] = [
    `Run ID : ${run.runId}`,
    `Status : ${run.status.toUpperCase()}`,
    `Assets : ${run.assetIds.join(", ")}`,
    `Jobs   : ${run.jobs.length} (${run.jobs.filter((j) => j.status === "complete").length} ok, ${run.jobs.filter((j) => j.status === "failed").length} failed)`,
    `Started: ${run.startedAt}`,
    `Ended  : ${run.completedAt ?? "—"}`,
    "",
    "Pipeline Results:",
  ];

  for (const job of run.jobs) {
    const icon = job.status === "complete" ? "✓" : job.status === "failed" ? "✗" : "…";
    lines.push(`  ${icon} [${job.assetId}] ${job.pipelineId} — ${job.status}${job.error ? ` (${job.error})` : ""}`);
  }

  return lines.join("\n");
}
