// ─────────────────────────────────────────────
// AI LAB — ORCHESTRATOR
// Controls pipelines, assigns agents, manages
// execution order across all assets.
//
// Hardened safeguards (v1.1):
//   1. Asset boundary lock  — single-asset default
//   2. Source manifest      — logged per run
//   3. Confidence scoring   — enforced via types
//   4. No-write default     — build-output blocked in analysis mode
//   5. Run record           — persisted after every run
// ─────────────────────────────────────────────

import type {
  FailureType,
  OrchestratorConfig,
  OrchestratorRun,
  PipelineId,
  PipelineJob,
  PipelineOutput,
  RawAsset,
  RetryStep,
} from "./types.ts";
import { DEFAULT_CONFIG, PARALLEL_SAFE_PIPELINES, PIPELINE_SEQUENCE } from "./config.ts";
import { runExtractionPipeline } from "./pipelines/asset-extraction.ts";
import { runReconstructionPipeline } from "./pipelines/asset-reconstruction.ts";
import { runGapRiskPipeline } from "./pipelines/gap-risk-analysis.ts";
import { runMonetisationPipeline } from "./pipelines/monetisation.ts";
import { runBuildOutputPipeline } from "./pipelines/build-output.ts";
import { buildSourceManifest, formatSourceManifest, persistRunRecord } from "./run-log.ts";
import type { ExtractedSystem, ReconstructedArchitecture } from "./types.ts";

const MAX_RETRIES_DEFAULT = 3;

// ── Failure classification ────────────────────

/**
 * Classifies a pipeline error into recoverable / non-recoverable / blocked.
 *
 * recoverable     — transient: network, API 5xx, JSON parse failure
 * non-recoverable — structural: missing deps, unknown pipeline, bad config
 * blocked         — deliberate gate: safeguard, auth failure (401/403)
 */
export function classifyFailure(err: Error): FailureType {
  const msg = err.message;

  // Deliberate blocks — no point retrying
  if (
    msg.includes("Claude API error 401") ||
    msg.includes("Claude API error 403") ||
    msg.includes("ANTHROPIC_API_KEY") ||
    msg.includes("SAFEGUARD")
  ) return "blocked";

  // Structural failures — retrying cannot help
  if (
    msg.includes("requires asset-extraction output") ||
    msg.includes("requires asset-reconstruction output") ||
    msg.includes("Unknown pipeline:") ||
    msg.includes("No assets provided") ||
    msg.includes("allowMultiAsset is false") ||
    // Agent already exhausted its own internal retries — orchestrator retrying again is wasteful
    msg.startsWith("VALIDATION_EXHAUSTED:")
  ) return "non-recoverable";

  // Everything else is treated as recoverable (network, 5xx, JSON truncation, etc.)
  return "recoverable";
}

// ── Retry helpers ─────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

  for (const pipelineId of orderedPipelines) {
    // ── Safeguard 4: No-write default ────────────
    // build-output generates write instructions — blocked in analysis mode
    if (pipelineId === "build-output" && config.mode === "analysis") {
      console.log(
        `[ORCHESTRATOR] SAFEGUARD: build-output blocked for ${asset.id} — mode is "analysis". ` +
        `Set config.mode = "write" to enable.`,
      );
      continue;
    }

    const job: PipelineJob = {
      jobId: uid(),
      pipelineId,
      assetId: asset.id,
      status: "running",
      startedAt: now(),
    };
    jobs.push(job);

    const maxRetries = config.maxRetries ?? MAX_RETRIES_DEFAULT;
    const retries: RetryStep[] = [];
    let attempt = 0;
    let succeeded = false;

    while (attempt <= maxRetries) {
      try {
        const output = await dispatchPipeline(pipelineId, asset, outputs, apiKey, config.claudeModel);
        outputs.set(pipelineId, output);
        job.status = "complete";
        job.completedAt = now();
        job.output = output;
        succeeded = true;
        break;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        const failureType = classifyFailure(error);

        retries.push({
          attempt: attempt + 1,
          pipelineId,
          error: error.message,
          failureType,
          timestamp: now(),
        });

        if (failureType !== "recoverable" || attempt >= maxRetries) {
          // Not retryable or exhausted — record final failure
          job.status = "failed";
          job.completedAt = now();
          job.error = error.message;
          job.retries = retries;

          const label = failureType !== "recoverable"
            ? `${failureType} failure`
            : `max retries (${maxRetries}) exhausted`;
          console.error(
            `[ORCHESTRATOR] ${label} in ${pipelineId} for ${asset.id}: ${error.message}`,
          );
          break;
        }

        // Recoverable — log and wait before retrying
        const delayMs = 1000 * Math.pow(2, attempt); // 1s, 2s, 4s
        console.warn(
          `[RETRY] ${pipelineId} attempt ${attempt + 1}/${maxRetries} failed (recoverable): ${error.message}. Retrying in ${delayMs}ms…`,
        );
        await sleep(delayMs);
        attempt++;
      }
    }

    if (retries.length > 0) {
      job.retries = retries;
    }

    if (!succeeded) {
      // Non-blocking for parallel-safe pipelines; fatal for serial dependencies
      if (!PARALLEL_SAFE_PIPELINES.includes(pipelineId)) {
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
  // ── Safeguard 1: Asset boundary lock ─────────
  if (assets.length > 1 && !config.allowMultiAsset) {
    throw new Error(
      `[ORCHESTRATOR] SAFEGUARD: ${assets.length} assets provided but allowMultiAsset is false. ` +
      `Set config.allowMultiAsset = true to run multiple assets in one call.`,
    );
  }

  if (assets.length === 0) {
    throw new Error("[ORCHESTRATOR] No assets provided.");
  }

  const runId = uid();
  const startedAt = now();

  console.log(
    `[ORCHESTRATOR] Run ${runId} started — ` +
    `${assets.length} asset(s), ${pipelines.length} pipeline(s), mode: ${config.mode}`,
  );

  // ── Safeguard 2: Source manifest ─────────────
  const sourceManifest: OrchestratorRun["sourceManifest"] = {};
  for (const asset of assets) {
    sourceManifest[asset.id] = await buildSourceManifest(asset.id, asset.sources);
  }
  console.log(formatSourceManifest(sourceManifest));

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
    sourceManifest,
    jobs: allJobs,
    startedAt,
    completedAt: now(),
    status,
    mode: config.mode,
  };

  // ── Safeguard 5: Run record ───────────────────
  await persistRunRecord(run);

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
    `Mode   : ${run.mode.toUpperCase()}`,
    `Status : ${run.status.toUpperCase()}`,
    `Assets : ${run.assetIds.join(", ")}`,
    `Jobs   : ${run.jobs.length} (${run.jobs.filter((j) => j.status === "complete").length} ok, ${run.jobs.filter((j) => j.status === "failed").length} failed)`,
    `Started: ${run.startedAt}`,
    `Ended  : ${run.completedAt ?? "—"}`,
    "",
    formatSourceManifest(run.sourceManifest),
    "",
    "Pipeline Results:",
  ];

  for (const job of run.jobs) {
    const icon = job.status === "complete" ? "✓" : job.status === "failed" ? "✗" : "…";
    lines.push(`  ${icon} [${job.assetId}] ${job.pipelineId} — ${job.status}${job.error ? ` (${job.error})` : ""}`);
  }

  return lines.join("\n");
}
