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
import type { ModelTier, RouterInput, ModelSelection, AvaModelId, AvacoreInput, AvacoreRouteResult, TaskType } from "./types.ts";

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

// ─────────────────────────────────────────────
// AVACORE — MULTI-LLM ROUTER (v2.0.0)
// Extends the Claude-tier router above.
// Does not modify selectTier / routeModel / auditModelRouting.
// Spec: LLM_ROUTER_SPEC.md
// ─────────────────────────────────────────────

// ── Model registry ────────────────────────────

export const AVACORE_REGISTRY: Record<AvaModelId, string> = {
  claude:   "claude-sonnet-4-6",
  gpt4o:    "gpt-4o",
  gemini:   "gemini-1.5-pro",
  grok:     "grok-beta",
  mistral:  "mistral-large-latest",
  hermes3:  "nous-hermes-3",
  mixtral:  "open-mixtral-8x7b",
  qwen:     "qwen2.5-72b-instruct",
  deepseek: "deepseek-chat",
  llama:    "meta-llama/llama-3.3-70b-instruct",
};

// ── Task-type assignments ─────────────────────

interface TaskAssignment {
  primary: AvaModelId;
  fallbackChain: AvaModelId[];
}

export const TASK_TYPE_ASSIGNMENTS: Record<TaskType, TaskAssignment> = {
  "orchestration":   { primary: "claude",   fallbackChain: ["gpt4o", "gemini", "llama"] },
  "agent-routing":   { primary: "hermes3",  fallbackChain: ["claude", "gpt4o", "qwen"] },
  "code-generation": { primary: "deepseek", fallbackChain: ["claude", "gpt4o", "llama"] },
  "reasoning":       { primary: "qwen",     fallbackChain: ["claude", "gpt4o", "hermes3"] },
  "fast-throughput": { primary: "mixtral",  fallbackChain: ["llama", "mistral", "claude"] },
  "long-context":    { primary: "gemini",   fallbackChain: ["claude", "gpt4o", "llama"] },
  "multimodal":      { primary: "gpt4o",    fallbackChain: ["claude", "gemini", "llama"] },
  "realtime":        { primary: "grok",     fallbackChain: ["gpt4o", "claude", "llama"] },
  "multilingual":    { primary: "mistral",  fallbackChain: ["gpt4o", "claude", "llama"] },
  "general":         { primary: "llama",    fallbackChain: ["mistral", "mixtral", "claude"] },
};

// ── Task-type inference ───────────────────────
// Decision rules evaluated in priority order per LLM_ROUTER_SPEC.md §Router Decision Rules.

const AVACORE_CODE_SKILLS = new Set(["asset-reconstruction", "build-output"]);
const AVACORE_AGENT_SKILLS = new Set(["agent-routing", "multi-step"]);
const AVACORE_LONG_CONTEXT_THRESHOLD = 100_000;

function inferTaskType(input: AvacoreInput): TaskType {
  if (input.taskType) return input.taskType;

  const { priority, skill, sourceCharCount = 0, isBatch = false } = input;

  if (priority === "high") {
    if (AVACORE_CODE_SKILLS.has(skill))  return "code-generation";
    if (AVACORE_AGENT_SKILLS.has(skill)) return "agent-routing";
    return "orchestration";
  }

  if (sourceCharCount > AVACORE_LONG_CONTEXT_THRESHOLD) return "long-context";
  if (priority === "low" || isBatch) return "fast-throughput";

  return "orchestration";
}

// ── AVACORE router ────────────────────────────

/**
 * Route a task through the AVACORE 10-model registry.
 *
 * Returns the resolved model for the current attempt. On retries, advances
 * through the fallback chain by one position per attempt. When the chain is
 * exhausted, status is "blocked" and resolvedModel is null.
 *
 * Callers should:
 *   1. Call routeAvacore({ ..., retryAttempt: 0 }) to get the primary model.
 *   2. Attempt the API call with result.resolvedModelId.
 *   3. On failure, call again with retryAttempt incremented and the failure
 *      appended to failureReasons passed back in.
 *   4. Stop when status === "blocked".
 *
 * Logs each routing decision to execution_log.json.
 */
export async function routeAvacore(
  input: AvacoreInput,
  priorFailures: Array<{ model: AvaModelId; error: string }> = [],
): Promise<AvacoreRouteResult> {
  const runId = crypto.randomUUID();
  const resolvedAt = new Date().toISOString();
  const attempt = input.retryAttempt ?? 0;

  const taskType = inferTaskType(input);
  const assignment = TASK_TYPE_ASSIGNMENTS[taskType];
  const fullChain: AvaModelId[] = [assignment.primary, ...assignment.fallbackChain];

  const failureReasons = priorFailures.map((f) => ({
    model: f.model,
    error: f.error,
    at: resolvedAt,
  }));

  let resolvedModel: AvaModelId | null = null;
  const chainTried: AvaModelId[] = [];

  if (attempt < fullChain.length) {
    resolvedModel = fullChain[attempt];
    chainTried.push(resolvedModel);
  }

  const result: AvacoreRouteResult = {
    runId,
    taskType,
    primaryModel: assignment.primary,
    resolvedModel,
    resolvedModelId: resolvedModel ? AVACORE_REGISTRY[resolvedModel] : null,
    chainTried,
    fullChain,
    status: resolvedModel ? "success" : "blocked",
    failureReasons,
    resolvedAt,
    lane: input.lane,
    skill: input.skill,
  };

  await appendToLog("ai-lab/execution_log.json", result);
  return result;
}
