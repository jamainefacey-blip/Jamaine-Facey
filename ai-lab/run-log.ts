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
import type { AssetId, AssetSource, OrchestratorRun, SourceManifestEntry, ValidationCheck, ValidationLog } from "./types.ts";

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

  const allChecksPass = validationChecks.every((c) => c.passed);
  const hasErrors = errors.length > 0;

  const status: ValidationLog["status"] =
    run.status === "complete" && allChecksPass ? "PASS" :
    run.status === "failed" ? "FAIL" :
    "BLOCKED";

  // commitReady: all executed pipelines passed, no errors
  const commitReady = status === "PASS" && !hasErrors;
  // deployReady: commit ready AND at least one pipeline completed
  const deployReady = commitReady && run.jobs.some((j) => j.status === "complete");

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
    console.log(`  ${label.padEnd(20)} ${value}`);

  console.log("\n─────────────────────────── VALIDATION SUMMARY ───────────────────────────");
  line("Status:", log.status);
  line("Commit Ready:", log.commitReady ? "✓ YES" : "✗ NO");
  line("Deploy Ready:", log.deployReady ? "✓ YES" : "✗ NO");
  console.log("\n  Checks:");
  for (const c of log.validationChecks) {
    console.log(`    ${c.passed ? "✓" : "✗"} ${c.name}${c.detail ? ` (${c.detail})` : ""}`);
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
