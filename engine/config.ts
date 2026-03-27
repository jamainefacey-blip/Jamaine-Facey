// engine/config.ts — central configuration

import path from 'path';

export const ROOT = path.join(__dirname, '..');

export const ENGINE_CONFIG = {
  /** Claude model for execution */
  model: 'claude-opus-4-6' as const,

  /** Max tokens for executor response */
  maxTokens: 8192,

  /** Poll interval in ms when runner watches the queue */
  pollIntervalMs: 3_000,

  /** Max retry attempts per task before marking blocked */
  maxAttempts: 2,

  /** File-based queue store */
  queueFile: path.join(ROOT, 'engine', 'data', 'queue.json'),

  /** Directory for run logs */
  logsDir: path.join(ROOT, 'engine', 'data', 'logs'),

  /** Git branch to commit and push to */
  gitBranch: 'claude/ai-lab-orchestrator-jI7p6',

  /** Vercel project name (set VERCEL_TOKEN + VERCEL_PROJECT_ID in env) */
  vercelProjectId: process.env.VERCEL_PROJECT_ID ?? '',
} as const;

export const SCHEDULER_CONFIG = {
  /** Default scheduler interval in ms (30 seconds) */
  intervalMs: 30_000,

  /** Max attempts before a scheduler task is marked FAILED */
  maxAttempts: 3,

  /** Port for the scheduler HTTP API */
  apiPort: 4446,

  /** Persisted scheduler state file */
  stateFile: path.join(ROOT, 'engine', 'data', 'scheduler-state.json'),

  /** Safe task types the scheduler will execute (all others are blocked) */
  safeTypes: ['eval', 'data'] as const,
} as const;
