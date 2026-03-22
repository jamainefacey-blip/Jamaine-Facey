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
import type { AssetId, AssetSource, OrchestratorRun, SourceManifestEntry } from "./types.ts";

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
