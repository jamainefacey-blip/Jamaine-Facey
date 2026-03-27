// engine/guardrail.ts — task risk classification and execution decision policy
//
// Guardrail layer sits BEFORE the scheduler executor.
// Every task is classified (low/medium/high) and decided (allowed/approval_required/blocked).
// Unknown types are ALWAYS blocked.

import type { SchedulerTask, SchedulerTaskType } from './types';

// ── Policy definition ─────────────────────────────────────────────────────────
// Edit this object to change guardrail behaviour.

export interface GuardrailPolicy {
  /** Types that execute automatically — no approval needed */
  allowedTypes: SchedulerTaskType[];
  /** Types that require explicit approval before execution */
  approvalTypes: SchedulerTaskType[];
  /** Types that are always blocked, no exceptions */
  blockedTypes: SchedulerTaskType[];
  /** Max attempts before a task is permanently failed */
  maxAttempts: number;
  /**
   * Overnight mode: when true, only 'low' risk tasks are allowed automatically.
   * 'medium' tasks are escalated to approval_required even if in allowedTypes.
   */
  overnightMode: boolean;
}

export const GUARDRAIL_POLICY: GuardrailPolicy = {
  allowedTypes:  ['eval', 'data'],
  approvalTypes: ['write', 'repo', 'transform'] as unknown as SchedulerTaskType[],
  blockedTypes:  ['deploy', 'notify'],
  maxAttempts:   3,
  overnightMode: true,
};

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

// ── Execution decision ────────────────────────────────────────────────────────

export type Decision = 'allowed' | 'approval_required' | 'blocked';

export interface GuardrailDecision {
  risk:       RiskLevel;
  decision:   Decision;
  reason:     string;
}

/**
 * Decide whether a task may execute.
 * Evaluation order (stops at first match):
 *  1. Explicitly blocked type            → blocked
 *  2. Unknown type (not in any list)     → blocked (safety rule: unknown = blocked)
 *  3. Approval-required type             → approval_required
 *  4. Overnight mode + medium risk       → approval_required
 *  5. Explicitly allowed type + low risk → allowed
 *  6. Fallback                           → blocked
 */
export function decide(
  task: SchedulerTask,
  policy: GuardrailPolicy = GUARDRAIL_POLICY,
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

  // 2. Unknown type (not declared in any category)
  if (!allKnownTypes.includes(type)) {
    return { risk: 'high', decision: 'blocked', reason: `Unknown type '${type}' — unknown types are always blocked` };
  }

  // 3. Explicitly approval-required type
  if ((policy.approvalTypes as string[]).includes(type)) {
    return { risk, decision: 'approval_required', reason: `Type '${type}' requires explicit approval` };
  }

  // 4. Overnight mode escalation: medium risk tasks need approval
  if (policy.overnightMode && risk === 'medium') {
    return { risk, decision: 'approval_required', reason: `Overnight mode: medium-risk task '${type}' requires approval` };
  }

  // 5. Allowed
  if ((policy.allowedTypes as string[]).includes(type)) {
    return { risk, decision: 'allowed', reason: `Type '${type}' is allowed by policy` };
  }

  // 6. Fallback safety
  return { risk, decision: 'blocked', reason: `Type '${type}' did not match any allow rule — blocked by default` };
}
