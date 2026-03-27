/**
 * auto-trigger.ts
 * Pain Engine — PC-AUTO-01
 *
 * Controlled auto-build trigger.
 *
 * When scheduler is idle AND mode=CONTROLLED AND killSwitch=false:
 *   1. Check backlogLock — abort if true
 *   2. Select highest-priority item (status=ready_to_build, lane enabled, source Tier 1/2)
 *   3. Run pre-build gate (must PASS — HOLD/REJECT aborts)
 *   4. Generate program via buildProgram()
 *   5. Queue program steps (no direct execution — guardrail applies)
 *   6. Update item status → building
 *   7. Return TriggerResult with full trace
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadControlState, isAutoEnabled, isLaneEnabled, isBacklogLocked } from './auto-control';
import { preGateAudit } from './pre-gate-audit';
import { buildProgram, persistProgram } from './program-builder';
import { addTask, getSchedulerStatus } from './scheduler';
import type { LaneName } from './auto-control';

// ── Types ──────────────────────────────────────────────────────────────────

export type BacklogStatus =
  | 'blueprint'
  | 'ready_to_build'
  | 'building'
  | 'showroom'
  | 'hangar'
  | 'killed';

export type BacklogSource = 'internal' | 'signal' | 'external';

export interface BacklogItem {
  id:               string;
  name:             string;
  lane:             string;
  description:      string;
  monetisationType: string;
  priorityScore:    number;
  complexity:       'low' | 'medium' | 'high';
  status:           BacklogStatus;
  source:           BacklogSource;
  createdAt:        string;
  updatedAt:        string;
}

export interface BacklogStore {
  version:     number;
  createdAt:   string;
  description: string;
  items:       BacklogItem[];
}

export type TriggerOutcome =
  | 'QUEUED'            // program generated and tasks queued
  | 'SKIPPED_IDLE'      // scheduler not idle
  | 'SKIPPED_CONTROL'   // mode=OFF or killSwitch=true
  | 'SKIPPED_LOCK'      // backlogLock=true
  | 'SKIPPED_EMPTY'     // no eligible backlog items
  | 'BLOCKED_PREBUILD'  // pre-build gate returned BLOCKED or NEEDS_WORK
  | 'BLOCKED_LANE';     // selected item's lane is disabled

export interface TriggerResult {
  outcome:           TriggerOutcome;
  triggeredAt:       string;
  controlMode:       string;
  selectedItem:      BacklogItem | null;
  preBuildVerdict:   string | null;
  preBuildFlags:     number;
  generatedProgramId: string | null;
  queuedTaskIds:     string[];
  abortReason:       string | null;
  source:            BacklogSource | null;
}

// ── Tier classification ────────────────────────────────────────────────────
// Tier 1: internal | Tier 2: signal | Tier 3: external (blocked in CONTROLLED)

const ALLOWED_SOURCES: BacklogSource[] = ['internal', 'signal'];

// ── Backlog I/O ────────────────────────────────────────────────────────────

const BACKLOG_FILE = path.join('engine', 'data', 'backlog.json');

export function loadBacklog(): BacklogStore {
  if (!fs.existsSync(BACKLOG_FILE)) {
    return { version: 1, createdAt: new Date().toISOString(), description: 'Empty backlog', items: [] };
  }
  return JSON.parse(fs.readFileSync(BACKLOG_FILE, 'utf8')) as BacklogStore;
}

export function saveBacklog(store: BacklogStore): void {
  fs.writeFileSync(BACKLOG_FILE, JSON.stringify(store, null, 2), 'utf8');
}

export function updateItemStatus(id: string, status: BacklogStatus): void {
  const store = loadBacklog();
  const item  = store.items.find(i => i.id === id);
  if (item) {
    item.status    = status;
    item.updatedAt = new Date().toISOString();
    saveBacklog(store);
  }
}

// ── Item selection ─────────────────────────────────────────────────────────

function selectTopItem(): BacklogItem | null {
  const store = loadBacklog();
  const eligible = store.items
    .filter(i =>
      i.status === 'ready_to_build' &&
      ALLOWED_SOURCES.includes(i.source) &&
      isLaneEnabled(i.lane as LaneName),
    )
    .sort((a, b) => b.priorityScore - a.priorityScore);

  return eligible[0] ?? null;
}

// ── Core trigger ───────────────────────────────────────────────────────────

export function runAutoTrigger(): TriggerResult {
  const triggeredAt = new Date().toISOString();
  const control     = loadControlState();

  const base: Omit<TriggerResult, 'outcome' | 'abortReason'> = {
    triggeredAt,
    controlMode:        control.mode,
    selectedItem:       null,
    preBuildVerdict:    null,
    preBuildFlags:      0,
    generatedProgramId: null,
    queuedTaskIds:      [],
    source:             null,
  };

  // ── Guard: control mode ───────────────────────────────────────────────────
  if (!isAutoEnabled()) {
    return { ...base, outcome: 'SKIPPED_CONTROL', abortReason: `mode=${control.mode}, killSwitch=${control.killSwitch}` };
  }

  // ── Guard: scheduler idle ─────────────────────────────────────────────────
  const schedulerState = getSchedulerStatus();
  const activeTasks = schedulerState.tasks.filter(
    (t: { status: string }) => t.status === 'queued' || t.status === 'running',
  );
  if (activeTasks.length > 0) {
    return { ...base, outcome: 'SKIPPED_IDLE', abortReason: `${activeTasks.length} active task(s) — not idle` };
  }

  // ── Guard: backlog lock ───────────────────────────────────────────────────
  if (isBacklogLocked()) {
    return { ...base, outcome: 'SKIPPED_LOCK', abortReason: 'backlogLock=true — backlog frozen' };
  }

  // ── Select top item ───────────────────────────────────────────────────────
  const item = selectTopItem();
  if (!item) {
    return { ...base, outcome: 'SKIPPED_EMPTY', abortReason: 'No eligible ready_to_build items in backlog' };
  }

  // ── Guard: lane ───────────────────────────────────────────────────────────
  if (!isLaneEnabled(item.lane as LaneName)) {
    return { ...base, outcome: 'BLOCKED_LANE', selectedItem: item, abortReason: `Lane ${item.lane} is disabled` };
  }

  // ── Pre-build gate ────────────────────────────────────────────────────────
  const auditResult = preGateAudit({
    taskId:    item.id,
    lane:      item.lane,
    assetType: item.complexity === 'low' ? 'data' : 'ui',
    buildPass: true,
    content:   item.description,
  });

  const preBuildVerdict = auditResult.verdict;
  const preBuildFlags   = auditResult.flags.length;

  if (preBuildVerdict === 'BLOCKED') {
    return {
      ...base,
      outcome:         'BLOCKED_PREBUILD',
      selectedItem:    item,
      preBuildVerdict,
      preBuildFlags,
      abortReason:     `Pre-build gate BLOCKED: ${auditResult.summary}`,
    };
  }

  if (preBuildVerdict === 'NEEDS_WORK') {
    // NEEDS_WORK → HOLD in backlog — do not proceed
    return {
      ...base,
      outcome:         'BLOCKED_PREBUILD',
      selectedItem:    item,
      preBuildVerdict,
      preBuildFlags,
      abortReason:     `Pre-build gate NEEDS_WORK (HOLD): ${auditResult.summary}`,
    };
  }

  // ── Generate program ───────────────────────────────────────────────────────
  const program = buildProgram({
    instruction: item.description,
    lane:        item.lane as LaneName,
    priority:    item.priorityScore >= 9 ? 'high' : item.priorityScore >= 7 ? 'medium' : 'low',
  });

  const outputDir = path.join('engine', 'data', 'generated-programs');
  persistProgram(program, outputDir);

  // ── Queue program steps (no direct execution) ──────────────────────────────
  const queuedIds: string[] = [];
  for (const step of program.steps) {
    const taskId = `auto-${item.id}-${step.stepId}`;
    addTask(
      step.type as Parameters<typeof addTask>[0],
      { ...step.payload, programId: program.programId, backlogItemId: item.id, source: item.source, step: step.order },
      taskId,
      item.lane as LaneName,
    );
    queuedIds.push(taskId);
  }

  // ── Update backlog item → building ─────────────────────────────────────────
  updateItemStatus(item.id, 'building');

  return {
    outcome:            'QUEUED',
    triggeredAt,
    controlMode:        control.mode,
    selectedItem:       item,
    preBuildVerdict,
    preBuildFlags,
    generatedProgramId: program.programId,
    queuedTaskIds:      queuedIds,
    abortReason:        null,
    source:             item.source,
  };
}
