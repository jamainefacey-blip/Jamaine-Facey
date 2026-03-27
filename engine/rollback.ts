/**
 * rollback.ts
 * Snapshot before mutation. Rollback failed execution state.
 * Restore clean baseline when needed.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExecutionPlan } from './execution-planner';

// ── Types ──────────────────────────────────────────────────────────────────

export interface FileSnapshot {
  file:        string;
  existed:     boolean;
  content:     string;   // original content (empty if file didn't exist)
  snapshotAt:  string;
}

export interface Snapshot {
  snapshotId:  string;
  planId:      string;
  files:       FileSnapshot[];
  createdAt:   string;
}

export type RollbackStatus = 'RESTORED' | 'PARTIAL' | 'FAILED' | 'NONE';

export interface RollbackResult {
  rollbackId:  string;
  planId:      string;
  snapshotId:  string;
  status:      RollbackStatus;
  restored:    string[];
  failed:      string[];
  restoredAt:  string;
}

// ── Constants ──────────────────────────────────────────────────────────────

const ROLLBACK_FILE   = path.join('engine', 'data', 'rollback-result.json');
const SNAPSHOT_DIR    = path.join('engine', 'data', 'snapshots');

// ── Snapshot ───────────────────────────────────────────────────────────────

export function takeSnapshot(plan: ExecutionPlan): Snapshot {
  const files: FileSnapshot[] = [];
  const now   = new Date().toISOString();

  // Snapshot all files referenced in rollback-point steps
  for (const step of plan.steps) {
    if (!step.rollbackPoint) continue;
    for (const file of step.files) {
      if (files.some(f => f.file === file)) continue; // dedupe
      const existed = fs.existsSync(file);
      let content = '';
      try {
        if (existed) content = fs.readFileSync(file, 'utf8');
      } catch { /* unreadable — skip content */ }
      files.push({ file, existed, content, snapshotAt: now });
    }
  }

  const snapshot: Snapshot = {
    snapshotId: `snap-${Date.now()}`,
    planId:     plan.planId,
    files,
    createdAt:  now,
  };

  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(SNAPSHOT_DIR, `${snapshot.snapshotId}.json`),
    JSON.stringify(snapshot, null, 2),
    'utf8',
  );

  return snapshot;
}

// ── Rollback ───────────────────────────────────────────────────────────────

export function rollback(snapshot: Snapshot): RollbackResult {
  const restored: string[] = [];
  const failed:   string[] = [];

  for (const snap of snapshot.files) {
    try {
      if (!snap.existed) {
        // File didn't exist before — delete it if it was created
        if (fs.existsSync(snap.file)) {
          fs.unlinkSync(snap.file);
          restored.push(`deleted: ${snap.file}`);
        }
      } else {
        // Restore original content
        const dir = path.dirname(snap.file);
        if (dir && dir !== '.') fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(snap.file, snap.content, 'utf8');
        restored.push(`restored: ${snap.file}`);
      }
    } catch (err: unknown) {
      failed.push(`${snap.file}: ${String(err)}`);
    }
  }

  const status: RollbackStatus = failed.length === 0 && restored.length > 0 ? 'RESTORED'
    : failed.length > 0 && restored.length > 0 ? 'PARTIAL'
    : failed.length > 0 ? 'FAILED'
    : 'NONE';

  const result: RollbackResult = {
    rollbackId:  `rb-${Date.now()}`,
    planId:      snapshot.planId,
    snapshotId:  snapshot.snapshotId,
    status,
    restored,
    failed,
    restoredAt:  new Date().toISOString(),
  };

  return result;
}

export function persistRollbackResult(result: RollbackResult): string {
  fs.writeFileSync(ROLLBACK_FILE, JSON.stringify(result, null, 2), 'utf8');
  return ROLLBACK_FILE;
}
