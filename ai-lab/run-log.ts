// ─────────────────────────────────────────────
// AI LAB — RUN LOG
// Safeguard 2: Source Manifest
// Safeguard 5: Run Record Persistence
//
// Builds a SHA-256 source manifest for every run.
// Persists the full OrchestratorRun as a JSON record.
//
// Runtime: Node 18+ (uses fs/promises + webcrypto)
// ─────────────────────────────────────────────

import { promises as fs } from "fs";
import type { AssetId, AssetSource, FailureType, OrchestratorRun, RetryStep, SourceManifestEntry, ValidationCheck, ValidationLog } from "./types.ts";

// ── SHA-256 hashing (Web Crypto — Node 18+ safe) ──

async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Source Manifest Builder ───────────────────

export async function buildSourceManifest(
  assetId: AssetId,
  sources: AssetSource[],
): Promise<SourceManifestEntry[]> {
  return Promise.all(
    sources.map(async (s) => ({
      kind: s.kind,
      label: s.label,
      charCount: s.content.length,
      sha256: await sha256(s.content),
    })),
  );
}

// ── Run Record Persistence ────────────────────

/**
 * Persists the full OrchestratorRun to ai-lab/runs/<runId>.json.
 */
export async function persistRunRecord(run: OrchestratorRun): Promise<void> {
  const dir = "ai-lab/runs";
  const filePath = `${dir}/${run.runId}.json`;

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(run, null, 2), "utf8");
    console.log(`[RUN-LOG] Run ${run.runId} persisted → ${filePath}`);
  } catch (err) {
    // Never block a run over a logging failure
    console.warn(`[RUN-LOG] Failed to persist run record: ${err}`);
  }
}

// ── Validation Log Builder ────────────────────

/**
 * Derives a structured ValidationLog from a completed OrchestratorRun.
 */
export function buildValidationLog(taskName: string, run: OrchestratorRun): ValidationLog {
  const validationChecks: ValidationCheck[] = run.jobs.map((job) => ({
    name: `${job.pipelineId} [${job.assetId}]`,
    passed: job.status === "complete",
    detail: job.error ?? (job.status === "complete" ? "ok" : job.status),
  }));

  const errors = run.jobs
    .filter((j) => j.error)
    .map((j) => `[${j.pipelineId}] ${j.error}`);

  const stepsExecuted = run.jobs.map((j) => `${j.pipelineId} → ${j.status}`);

  // Aggregate retry metadata from all jobs
  const allRetrySteps: RetryStep[] = run.jobs.flatMap((j) => j.retries ?? []);
  const retryCount = allRetrySteps.length;
  const recoveryActions: string[] = allRetrySteps
    .filter((r) => r.failureType === "recoverable")
    .map((r) => `Retry ${r.attempt} of ${r.pipelineId}: ${r.error.slice(0, 80)}`);

  // Determine finalFailureType from the last failed job's last retry
  let finalFailureType: FailureType | undefined;
  const lastFailedJob = [...run.jobs].reverse().find((j) => j.status === "failed");
  if (lastFailedJob?.retries?.length) {
    finalFailureType = lastFailedJob.retries[lastFailedJob.retries.length - 1].failureType;
  }

  const allChecksPass = validationChecks.every((c) => c.passed);
  const hasErrors = errors.length > 0;

  const status: ValidationLog["status"] =
    run.status === "complete" && allChecksPass ? "PASS" :
    run.status === "failed" ? "FAIL" :
    "BLOCKED";

  const commitReady = status === "PASS" && !hasErrors;
  const deployReady = commitReady && run.jobs.some((j) => j.status === "complete");

  // Per-stage validation summary and first failed stage
  const validationSummary: Record<string, "pass" | "fail"> = {};
  let failedStage: string | undefined;
  for (const job of run.jobs) {
    const result: "pass" | "fail" = job.status === "complete" ? "pass" : "fail";
    validationSummary[job.pipelineId] = result;
    if (result === "fail" && !failedStage) failedStage = job.pipelineId;
  }

  return {
    taskName,
    timestamp: run.completedAt ?? new Date().toISOString(),
    status,
    stepsExecuted,
    errors,
    fixesApplied: [],
    validationChecks,
    commitReady,
    deployReady,
    runId: run.runId,
    retryCount,
    retrySteps: allRetrySteps,
    recoveryActions,
    finalFailureType,
    failedStage,
    validationSummary,
  };
}

/**
 * Writes a ValidationLog to ai-lab/runs/<timestamp>-<taskName>.json.
 * Never throws — fail-safe write.
 */
export async function writeValidationLog(log: ValidationLog): Promise<string> {
  const dir = "ai-lab/runs";
  const safeTs = log.timestamp.replace(/[:.]/g, "-").replace("Z", "").slice(0, 19);
  const safeName = log.taskName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const filename = `${safeTs}-${safeName}.json`;
  const filePath = `${dir}/${filename}`;

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(log, null, 2), "utf8");
    console.log(`[RUN-LOG] Validation log → ${filePath}`);
  } catch (err) {
    console.warn(`[RUN-LOG] Failed to write validation log: ${err}`);
  }

  return filePath;
}

/**
 * Prints a compact PASS / FAIL / BLOCKED summary to console.
 */
export function printValidationSummary(log: ValidationLog): void {
  const line = (label: string, value: string | boolean) =>
    console.log(`  ${label.padEnd(22)} ${value}`);

  const recoverySucceeded = log.retryCount > 0 && log.status === "PASS";

  console.log("\n─────────────────────────── VALIDATION SUMMARY ───────────────────────────");
  line("Status:", log.status);
  line("Commit Ready:", log.commitReady ? "✓ YES" : "✗ NO");
  line("Deploy Ready:", log.deployReady ? "✓ YES" : "✗ NO");
  line("Total Retries:", String(log.retryCount));
  line("Recovery:", log.retryCount === 0 ? "n/a" : recoverySucceeded ? "✓ succeeded" : "✗ failed");
  if (log.finalFailureType) line("Failure Type:", log.finalFailureType);
  if (log.failedStage) line("Failed Stage:", log.failedStage);

  if (Object.keys(log.validationSummary).length > 0) {
    console.log("\n  Stage Summary:");
    for (const [stage, result] of Object.entries(log.validationSummary)) {
      console.log(`    ${result === "pass" ? "✓" : "✗"} ${stage} — ${result.toUpperCase()}`);
    }
  }

  console.log("\n  Checks:");
  for (const c of log.validationChecks) {
    console.log(`    ${c.passed ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
  }
  if (log.recoveryActions.length > 0) {
    console.log("\n  Recovery Actions:");
    for (const a of log.recoveryActions) console.log(`    ↺ ${a}`);
  }
  if (log.errors.length > 0) {
    console.log("\n  Errors:");
    for (const e of log.errors) console.log(`    • ${e}`);
  }
  console.log("───────────────────────────────────────────────────────────────────────────\n");
}

// ── Run Record Summary ────────────────────────

export function formatSourceManifest(
  manifest: Record<AssetId, SourceManifestEntry[]>,
): string {
  const lines: string[] = ["Source Manifest:"];
  for (const [assetId, entries] of Object.entries(manifest)) {
    lines.push(`  Asset: ${assetId}`);
    for (const e of entries) {
      lines.push(`    [${e.kind}] ${e.label} — ${e.charCount.toLocaleString()} chars — sha256: ${e.sha256.slice(0, 12)}…`);
    }
  }
  return lines.join("\n");
}
