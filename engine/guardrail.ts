// engine/guardrail.ts — task risk classification and execution decision policy
//
// Policy is persisted to engine/data/guardrail-policy.json and reloaded on
// every scheduler cycle — no restart required for policy changes.
//
// IMMUTABLE CONSTRAINTS (enforced in updateGuardrailPolicy):
//   - blockedTypes cannot be modified (deploy/notify always blocked)
//   - Unknown types are always blocked regardless of policy
//   - allowedTypes and approvalTypes must not overlap with blockedTypes

import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { SCHEDULER_CONFIG } from './config';
import type { SchedulerTask, SchedulerTaskType } from './types';

// ── Policy definition ──────────────────────────────────────────────────────────

export interface GuardrailPolicy {
  /** Types that execute automatically — no approval needed */
  allowedTypes: SchedulerTaskType[];
  /** Types that require explicit approval before execution */
  approvalTypes: SchedulerTaskType[];
  /** Types that are always blocked — IMMUTABLE at runtime */
  blockedTypes: SchedulerTaskType[];
  /** Max attempts before a task is permanently failed */
  maxAttempts: number;
  /**
   * Overnight mode: when true, medium-risk tasks in allowedTypes are escalated
   * to approval_required regardless of their allowedTypes membership.
   */
  overnightMode: boolean;
}

/** Baseline policy — source of truth for defaults and immutable constraints. */
export const GUARDRAIL_POLICY: GuardrailPolicy = {
  allowedTypes:  ['eval', 'data'],
  approvalTypes: ['write', 'repo', 'transform'] as unknown as SchedulerTaskType[],
  blockedTypes:  ['deploy', 'notify'],
  maxAttempts:   3,
  overnightMode: true,
};

/** Types that can NEVER be moved out of blocked — immutable safety lock. */
const IMMUTABLE_BLOCKED: string[] = ['deploy', 'notify'];

// ── Policy persistence ─────────────────────────────────────────────────────────

function ensureDataDir(): void {
  fs.mkdirSync(path.dirname(SCHEDULER_CONFIG.policyFile), { recursive: true });
}

/** Load live policy from disk. Falls back to GUARDRAIL_POLICY if file absent/corrupt. */
export function loadLivePolicy(): GuardrailPolicy {
  try {
    if (fs.existsSync(SCHEDULER_CONFIG.policyFile)) {
      const raw = fs.readFileSync(SCHEDULER_CONFIG.policyFile, 'utf8').trim();
      if (raw) return JSON.parse(raw) as GuardrailPolicy;
    }
  } catch {
    // corrupt — fall through to default
  }
  return { ...GUARDRAIL_POLICY };
}

function saveLivePolicy(policy: GuardrailPolicy): void {
  ensureDataDir();
  fs.writeFileSync(SCHEDULER_CONFIG.policyFile, JSON.stringify(policy, null, 2) + '\n', 'utf8');
}

// ── Policy update ──────────────────────────────────────────────────────────────

export interface PolicyUpdateRequest {
  /** Move these types from approvalTypes → allowedTypes */
  promoteToAllowed?: string[];
  /** Move these types from allowedTypes → approvalTypes */
  demoteToApproval?: string[];
  /** Toggle overnight mode */
  overnightMode?: boolean;
  /** Update maxAttempts (min 1, max 10) */
  maxAttempts?: number;
}

export interface PolicyUpdateResult {
  ok: boolean;
  previous: GuardrailPolicy;
  current: GuardrailPolicy;
  log: string;
  errors: string[];
}

/**
 * Update the live guardrail policy.
 *
 * Safety rules (enforced, cannot be overridden):
 *   1. IMMUTABLE_BLOCKED types (deploy, notify) cannot be promoted under any circumstance.
 *   2. blockedTypes list in the policy file is never modified.
 *   3. A type cannot appear in both allowedTypes and approvalTypes simultaneously.
 *   4. Types not originally known to the policy cannot be added.
 */
export function updateGuardrailPolicy(req: PolicyUpdateRequest): PolicyUpdateResult {
  const previous = loadLivePolicy();
  const errors: string[] = [];
  const current: GuardrailPolicy = {
    allowedTypes:  [...previous.allowedTypes] as SchedulerTaskType[],
    approvalTypes: [...previous.approvalTypes] as SchedulerTaskType[],
    blockedTypes:  [...previous.blockedTypes] as SchedulerTaskType[], // immutable
    maxAttempts:   previous.maxAttempts,
    overnightMode: previous.overnightMode,
  };

  // Promote: approvalTypes → allowedTypes
  for (const rawType of req.promoteToAllowed ?? []) {
    const type = rawType as string;

    // Rule 1: immutable blocked types cannot be promoted
    if (IMMUTABLE_BLOCKED.includes(type)) {
      errors.push(`REJECTED: '${type}' is in the immutable blocked list and cannot be promoted`);
      continue;
    }

    // Rule 2: blocked in current policy (shouldn't differ from immutable, but double-check)
    if ((current.blockedTypes as string[]).includes(type)) {
      errors.push(`REJECTED: '${type}' is in blockedTypes — cannot promote`);
      continue;
    }

    // Rule 3: must be in approvalTypes to promote
    if (!(current.approvalTypes as string[]).includes(type)) {
      errors.push(`REJECTED: '${type}' is not in approvalTypes — nothing to promote`);
      continue;
    }

    // Promote
    current.approvalTypes = current.approvalTypes.filter(t => t !== type) as SchedulerTaskType[];
    if (!(current.allowedTypes as string[]).includes(type)) {
      (current.allowedTypes as string[]).push(type);
    }
  }

  // Demote: allowedTypes → approvalTypes
  for (const rawType of req.demoteToApproval ?? []) {
    const type = rawType as string;

    if (IMMUTABLE_BLOCKED.includes(type)) {
      errors.push(`INFO: '${type}' is immutably blocked — demotion ignored (already blocked)`);
      continue;
    }

    if (!(current.allowedTypes as string[]).includes(type)) {
      errors.push(`REJECTED: '${type}' is not in allowedTypes — nothing to demote`);
      continue;
    }

    current.allowedTypes = current.allowedTypes.filter(t => t !== type) as SchedulerTaskType[];
    if (!(current.approvalTypes as string[]).includes(type)) {
      (current.approvalTypes as string[]).push(type as SchedulerTaskType);
    }
  }

  // Overnight mode toggle
  if (typeof req.overnightMode === 'boolean') {
    current.overnightMode = req.overnightMode;
  }

  // maxAttempts guard
  if (req.maxAttempts !== undefined) {
    const v = Math.max(1, Math.min(10, req.maxAttempts));
    current.maxAttempts = v;
  }

  saveLivePolicy(current);

  const logId = randomUUID().slice(0, 8);
  const logEntry = `[${new Date().toISOString()}] policy-update ${logId}: ` +
    `allowedTypes: [${previous.allowedTypes}] → [${current.allowedTypes}], ` +
    `approvalTypes: [${previous.approvalTypes}] → [${current.approvalTypes}], ` +
    `overnightMode: ${previous.overnightMode} → ${current.overnightMode}` +
    (errors.length ? ` | ERRORS: ${errors.join('; ')}` : '');

  // Append to policy change log
  const logFile = path.join(path.dirname(SCHEDULER_CONFIG.policyFile), 'policy-changes.log');
  fs.appendFileSync(logFile, logEntry + '\n', 'utf8');

  return {
    ok: errors.filter(e => !e.startsWith('INFO:')).length === 0,
    previous,
    current,
    log: logEntry,
    errors,
  };
}

/** Reset live policy to baseline defaults. */
export function resetGuardrailPolicy(): GuardrailPolicy {
  const baseline = { ...GUARDRAIL_POLICY };
  saveLivePolicy(baseline);
  return baseline;
}

// ── Risk classification ────────────────────────────────────────────────────────

export type RiskLevel = 'low' | 'medium' | 'high';

const RISK_MAP: Record<string, RiskLevel> = {
  eval:        'low',
  data:        'low',
  write:       'medium',
  repo:        'medium',
  transform:   'medium',
  deploy:      'high',
  notify:      'high',
  destructive: 'high',
};

/** Classify the risk level of a task. Unknown types → high. */
export function classifyRisk(task: SchedulerTask): RiskLevel {
  return RISK_MAP[task.type] ?? 'high';
}

// ── Execution decision ─────────────────────────────────────────────────────────

export type Decision = 'allowed' | 'approval_required' | 'blocked';

export interface GuardrailDecision {
  risk:     RiskLevel;
  decision: Decision;
  reason:   string;
}

/**
 * Decide whether a task may execute against a given policy.
 * Evaluation order (stops at first match):
 *  1. Explicitly blocked type            → blocked
 *  2. Unknown type (not in any list)     → blocked (safety rule: unknown = blocked)
 *  3. Explicitly approval-required type  → approval_required
 *  4. Overnight mode + medium risk       → approval_required
 *  5. Explicitly allowed type            → allowed
 *  6. Fallback                           → blocked
 */
export function decide(
  task: SchedulerTask,
  policy: GuardrailPolicy = loadLivePolicy(),
): GuardrailDecision {
  const risk = classifyRisk(task);
  const type = task.type as string;

  const allKnownTypes = [
    ...policy.allowedTypes,
    ...(policy.approvalTypes as string[]),
    ...policy.blockedTypes,
  ] as string[];

  // 1. Explicitly blocked
  if ((policy.blockedTypes as string[]).includes(type)) {
    return { risk, decision: 'blocked', reason: `Type '${type}' is in blockedTypes policy` };
  }

  // 2. Unknown type
  if (!allKnownTypes.includes(type)) {
    return { risk: 'high', decision: 'blocked', reason: `Unknown type '${type}' — unknown types are always blocked` };
  }

  // 3. Approval-required type
  if ((policy.approvalTypes as string[]).includes(type)) {
    return { risk, decision: 'approval_required', reason: `Type '${type}' requires explicit approval` };
  }

  // 4. Overnight mode escalation
  if (policy.overnightMode && risk === 'medium') {
    return { risk, decision: 'approval_required', reason: `Overnight mode: medium-risk task '${type}' requires approval` };
  }

  // 5. Allowed
  if ((policy.allowedTypes as string[]).includes(type)) {
    return { risk, decision: 'allowed', reason: `Type '${type}' is allowed by policy` };
  }

  // 6. Fallback
  return { risk, decision: 'blocked', reason: `Type '${type}' did not match any allow rule — blocked by default` };
}
