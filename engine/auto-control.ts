/**
 * auto-control.ts
 * Pain Engine — PC-CONTROL-01
 *
 * Auto mode control layer.
 *
 * Modes:
 *   OFF         — no autonomous task generation, scheduler idles
 *   CONTROLLED  — auto mode active, Tier 1 + Tier 2 sources only (default)
 *   FULL_AUTO   — permanently locked; cannot be set without founder unlock key
 *
 * Features:
 *   - per-lane enable/disable
 *   - kill switch (immediate halt)
 *   - backlog lock (freeze backlog — no new items added or promoted)
 */

import * as fs from 'fs';
import * as path from 'path';

// ── Types ──────────────────────────────────────────────────────────────────

export type AutoMode = 'OFF' | 'CONTROLLED' | 'FULL_AUTO';

export type LaneName = 'VST' | 'FHI' | 'AI_LAB' | 'ADMIN' | 'BACKYARD';

export interface LaneControl {
  lane:    LaneName;
  enabled: boolean;
}

export interface AutoControlState {
  mode:          AutoMode;
  fullAutoLocked: true;          // always true — cannot be changed
  killSwitch:    boolean;        // true = immediate halt of all auto tasks
  backlogLock:   boolean;        // true = backlog frozen (no adds, no promotes)
  lanes:         LaneControl[];
  updatedAt:     string;
  updatedBy:     string;
}

export interface ControlUpdateRequest {
  mode?:        Exclude<AutoMode, 'FULL_AUTO'>;  // FULL_AUTO cannot be requested
  killSwitch?:  boolean;
  backlogLock?: boolean;
  lanes?:       Partial<Record<LaneName, boolean>>;
}

export interface ControlUpdateResult {
  previous: AutoControlState;
  current:  AutoControlState;
  changes:  string[];
  rejected: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────

const CONTROL_FILE = path.join('engine', 'data', 'auto-control.json');

const ALL_LANES: LaneName[] = ['VST', 'FHI', 'AI_LAB', 'ADMIN', 'BACKYARD'];

export const DEFAULT_STATE: AutoControlState = {
  mode:           'CONTROLLED',
  fullAutoLocked: true,
  killSwitch:     false,
  backlogLock:    false,
  lanes: ALL_LANES.map(lane => ({ lane, enabled: lane !== 'BACKYARD' })),
  updatedAt:      new Date().toISOString(),
  updatedBy:      'system/init',
};

// ── Persistence ────────────────────────────────────────────────────────────

export function loadControlState(): AutoControlState {
  if (!fs.existsSync(CONTROL_FILE)) {
    return { ...DEFAULT_STATE };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(CONTROL_FILE, 'utf8')) as AutoControlState;
    // fullAutoLocked is always enforced — cannot be unset by file tampering
    raw.fullAutoLocked = true;
    if (raw.mode === 'FULL_AUTO') {
      raw.mode = 'CONTROLLED'; // safety fallback on load
    }
    return raw;
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export function saveControlState(state: AutoControlState): void {
  fs.mkdirSync(path.dirname(CONTROL_FILE), { recursive: true });
  fs.writeFileSync(CONTROL_FILE, JSON.stringify(state, null, 2), 'utf8');
}

// ── Queries ────────────────────────────────────────────────────────────────

export function isAutoEnabled(): boolean {
  const s = loadControlState();
  return s.mode !== 'OFF' && !s.killSwitch;
}

export function isLaneEnabled(lane: LaneName): boolean {
  const s = loadControlState();
  if (s.killSwitch || s.mode === 'OFF') return false;
  return s.lanes.find(l => l.lane === lane)?.enabled ?? false;
}

export function isBacklogLocked(): boolean {
  return loadControlState().backlogLock;
}

export function getMode(): AutoMode {
  return loadControlState().mode;
}

// ── Control update ─────────────────────────────────────────────────────────

export function updateControl(req: ControlUpdateRequest, updatedBy = 'operator'): ControlUpdateResult {
  const previous = loadControlState();
  const current: AutoControlState = JSON.parse(JSON.stringify(previous));
  current.updatedAt = new Date().toISOString();
  current.updatedBy = updatedBy;
  current.fullAutoLocked = true; // always enforced

  const changes: string[]  = [];
  const rejected: string[] = [];

  // Mode change
  if (req.mode !== undefined) {
    if ((req.mode as string) === 'FULL_AUTO') {
      rejected.push('FULL_AUTO mode is locked — founder unlock key required');
    } else {
      current.mode = req.mode;
      changes.push(`mode: ${previous.mode} → ${current.mode}`);
    }
  }

  // Kill switch
  if (req.killSwitch !== undefined) {
    current.killSwitch = req.killSwitch;
    changes.push(`killSwitch: ${previous.killSwitch} → ${current.killSwitch}`);
  }

  // Backlog lock
  if (req.backlogLock !== undefined) {
    current.backlogLock = req.backlogLock;
    changes.push(`backlogLock: ${previous.backlogLock} → ${current.backlogLock}`);
  }

  // Lane enable/disable
  if (req.lanes) {
    for (const [lane, enabled] of Object.entries(req.lanes) as [LaneName, boolean][]) {
      const lc = current.lanes.find(l => l.lane === lane);
      if (lc) {
        const prev = lc.enabled;
        lc.enabled = enabled;
        changes.push(`lane.${lane}: ${prev} → ${enabled}`);
      } else {
        rejected.push(`Unknown lane: ${lane}`);
      }
    }
  }

  saveControlState(current);
  return { previous, current, changes, rejected };
}

// ── Init ───────────────────────────────────────────────────────────────────

export function initControlState(): AutoControlState {
  const initial = { ...DEFAULT_STATE, updatedAt: new Date().toISOString(), updatedBy: 'system/init' };
  saveControlState(initial);
  return initial;
}
