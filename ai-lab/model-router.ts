// ─────────────────────────────────────────────
// AI LAB — MODEL ROUTER
// Routes tasks to the correct model tier based
// on lane, priority, and skill (pipeline).
//
// Tiers:
//   local    → claude-haiku-4-5   (low complexity)
//   external → claude-opus-4-6    (high complexity)
//   fallback → claude-sonnet-4-6  (retry failure)
// ─────────────────────────────────────────────

import { promises as fs } from "fs";
import type { ModelTier, RouterInput, ModelSelection } from "./types.ts";

// ── Model registry ────────────────────────────

export const MODEL_TIERS: Record<ModelTier, string> = {
  local:    "claude-haiku-4-5-20251001",
  external: "claude-opus-4-6",
  fallback: "claude-sonnet-4-6",
};

// ── Complexity map: skill → base complexity ───

const SKILL_COMPLEXITY: Record<string, "low" | "medium" | "high"> = {
  "asset-extraction":    "medium",
  "asset-reconstruction":"high",
  "gap-risk-analysis":   "low",
  "monetisation":        "low",
  "build-output":        "high",
};

// Char count above which a task is bumped to high complexity
const HIGH_COMPLEXITY_CHAR_THRESHOLD = 80_000;

// ── Core router ───────────────────────────────

/**
 * Select the appropriate model tier for a task.
 *
 * Rules (evaluated in order):
 *  1. retryAttempt > 0          → fallback
 *  2. priority === "high"        → external
 *  3. priority === "low"         → local
 *  4. skill is high-complexity   → external
 *  5. sourceCharCount exceeds threshold → external
 *  6. default                    → local
 */
export function selectTier(input: RouterInput): ModelTier {
  const { priority, skill, retryAttempt = 0, sourceCharCount = 0 } = input;

  if (retryAttempt > 0) return "fallback";

  if (priority === "high") return "external";
  if (priority === "low")  return "local";

  const baseComplexity = SKILL_COMPLEXITY[skill] ?? "medium";
  if (baseComplexity === "high") return "external";
  if (sourceCharCount > HIGH_COMPLEXITY_CHAR_THRESHOLD) return "external";

  return "local";
}

/**
 * Route a task to the correct model.
 * Logs selection to execution_log.json.
 */
export async function routeModel(input: RouterInput): Promise<ModelSelection> {
  const tier = selectTier(input);
  const model = MODEL_TIERS[tier];

  const selection: ModelSelection = {
    tier,
    model,
    lane:     input.lane,
    skill:    input.skill,
    priority: input.priority,
    retryAttempt: input.retryAttempt ?? 0,
    resolvedAt: new Date().toISOString(),
    reason: buildReason(input, tier),
  };

  await appendToLog("ai-lab/execution_log.json", selection);
  return selection;
}

/**
 * Write a run-level routing summary to audit_log.json.
 * Called once per run from the orchestrator.
 */
export async function auditModelRouting(entry: {
  runId: string;
  assetId: string;
  selections: ModelSelection[];
  resolvedAt: string;
}): Promise<void> {
  await appendToLog("ai-lab/audit_log.json", entry);
}

// ── Log helpers ───────────────────────────────

async function appendToLog(filePath: string, entry: unknown): Promise<void> {
  try {
    let existing: unknown[] = [];
    try {
      const raw = await fs.readFile(filePath, "utf8");
      existing = JSON.parse(raw) as unknown[];
    } catch {
      // File doesn't exist yet — start fresh
    }
    existing.push(entry);
    await fs.writeFile(filePath, JSON.stringify(existing, null, 2), "utf8");
  } catch (err) {
    // Never block execution over a log write failure
    console.warn(`[MODEL-ROUTER] Failed to append to ${filePath}: ${err}`);
  }
}

function buildReason(input: RouterInput, tier: ModelTier): string {
  if ((input.retryAttempt ?? 0) > 0) return `retry attempt ${input.retryAttempt} → fallback`;
  if (input.priority === "high")      return "priority=high → external";
  if (input.priority === "low")       return "priority=low → local";
  const complexity = SKILL_COMPLEXITY[input.skill] ?? "medium";
  if (complexity === "high")          return `skill=${input.skill} complexity=high → external`;
  if ((input.sourceCharCount ?? 0) > HIGH_COMPLEXITY_CHAR_THRESHOLD)
    return `sourceCharCount=${input.sourceCharCount} > threshold → external`;
  return `skill=${input.skill} complexity=${complexity} → local`;
}
