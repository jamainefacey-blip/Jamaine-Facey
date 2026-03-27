// engine/types.ts — shared types for the autonomous execution engine

export type TaskStatus =
  | 'pending'
  | 'in_progress'
  | 'validating'
  | 'deploying'
  | 'complete'
  | 'failed'
  | 'blocked';

export type TaskLane = 'VST' | 'AI_LAB' | 'FHI' | 'ADMIN' | 'BACKYARD';

export interface Task {
  id: string;
  lane: TaskLane;
  description: string;
  /** Files the executor is allowed to touch (globs allowed) */
  scope: string[];
  /** npm script to run for validation, e.g. "build:vst" */
  validateScript?: string;
  /** Whether to commit + push after successful validation */
  deploy: boolean;
  /** ISO timestamp when task was created */
  createdAt: string;
  /** Optional arbitrary metadata */
  meta?: Record<string, unknown>;
}

export interface QueueEntry {
  task: Task;
  status: TaskStatus;
  attempts: number;
  lastError?: string;
  enqueuedAt: string;
  startedAt?: string;
  completedAt?: string;
}

export interface ExecutionResult {
  taskId: string;
  status: 'complete' | 'failed' | 'blocked';
  filesChanged: string[];
  claudeOutput: string;
  validationPassed: boolean;
  validationOutput: string;
  deployed: boolean;
  deployOutput: string;
  error?: string;
  durationMs: number;
}

// ── Scheduler types ──────────────────────────────────────────────────────────

/** Task types the scheduler understands */
export type SchedulerTaskType = 'eval' | 'data' | 'notify' | 'deploy';

/** Safe types the scheduler will process in SAFE MODE */
export const SAFE_TASK_TYPES: SchedulerTaskType[] = ['eval', 'data'];

/** Scheduler-specific task (extends engine task with type + payload + updatedAt) */
export interface SchedulerTask {
  id: string;
  type: SchedulerTaskType;
  payload: Record<string, unknown>;
  status: 'queued' | 'running' | 'done' | 'failed';
  attempts: number;
  createdAt: string;
  updatedAt: string;
  lastError?: string;
  result?: unknown;
}

/** Persisted scheduler state */
export interface SchedulerState {
  status: 'idle' | 'running' | 'error';
  intervalMs: number;
  lastRunAt: string | null;
  lastRunDurationMs: number | null;
  lastError: string | null;
  totalRuns: number;
  tasks: SchedulerTask[];
}

export interface RunLog {
  runId: string;
  taskId: string;
  lane: TaskLane;
  status: TaskStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  filesChanged: string[];
  validationPassed: boolean;
  deployed: boolean;
  error?: string;
  claudeSummary: string;
}
