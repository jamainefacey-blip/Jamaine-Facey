// ─────────────────────────────────────────────
// AI LAB — RUN LOG
// Safeguard 2: Source Manifest
// Safeguard 5: Run Record Persistence
//
// Builds a SHA-256 source manifest for every run.
// Persists the full OrchestratorRun as a JSON record.
//
// Persistence strategy:
//   - Deno CLI context  → writes to ai-lab/runs/<runId>.json
//   - Edge function     → skips file write (no fs access), returns record
// ─────────────────────────────────────────────

import type { AssetId, AssetSource, OrchestratorRun, SourceManifestEntry } from "./types.ts";

// ── SHA-256 hashing (Web Crypto — Deno + Edge safe) ──

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
 * Silently no-ops in environments without filesystem access (edge functions).
 */
export async function persistRunRecord(run: OrchestratorRun): Promise<void> {
  // Detect Deno fs availability without importing Deno types globally
  const deno = (globalThis as Record<string, unknown>)["Deno"] as
    | { writeTextFile?: (path: string, data: string) => Promise<void>; mkdir?: (path: string, opts: { recursive: boolean }) => Promise<void> }
    | undefined;

  if (!deno?.writeTextFile) {
    // Edge function context — fs not available, skip
    console.log(`[RUN-LOG] Run ${run.runId} — persisting skipped (no fs access)`);
    return;
  }

  const dir = "ai-lab/runs";
  const path = `${dir}/${run.runId}.json`;

  try {
    if (deno.mkdir) {
      await deno.mkdir(dir, { recursive: true });
    }
    await deno.writeTextFile(path, JSON.stringify(run, null, 2));
    console.log(`[RUN-LOG] Run ${run.runId} persisted → ${path}`);
  } catch (err) {
    // Never block a run over a logging failure
    console.warn(`[RUN-LOG] Failed to persist run record: ${err}`);
  }
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
