// ─────────────────────────────────────────────
// AI LAB — AGENT OUTPUT VALIDATOR
//
// Runtime validation and sanitisation for agent JSON responses.
// Apply BEFORE any downstream pipeline uses the output.
//
// Usage:
//   import { validateAgentOutput, validateReconstructedArchitecture } from "../agent-validator.ts";
//
// Flow per call:
//   1. callFn()          → raw API text
//   2. sanitiseRaw()     → strip fences / trim noise
//   3. parseJsonResponse → multi-pass JSON extraction
//   4. validateFn()      → field-level schema check
//   5. retry on (3) or (4) failure, up to maxRetries
// ─────────────────────────────────────────────

import { parseJsonResponse } from "./agents/base-agent.ts";

// ── Validation result ─────────────────────────

export interface AgentValidationResult {
  valid: boolean;
  /** Human-readable explanation when invalid */
  reason?: string;
  /** Specific field paths that failed */
  failedFields?: string[];
}

// ── Sanitisation ──────────────────────────────

/**
 * Strips markdown fences and trims outer whitespace.
 * Returns both the cleaned string and the original for logging.
 * Does NOT parse — purely string-level cleanup.
 */
export function sanitiseRaw(raw: string): { cleaned: string; original: string } {
  const original = raw;
  const cleaned = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();
  return { cleaned, original };
}

// ── Schema validators ─────────────────────────

/**
 * Validates a parsed object against the ReconstructedArchitecture schema.
 * Checks every required field and its basic type constraints.
 * Returns field-level failure detail — not just pass/fail.
 */
export function validateReconstructedArchitecture(
  obj: unknown,
): AgentValidationResult {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { valid: false, reason: "response is not a JSON object", failedFields: ["(root)"] };
  }

  const o = obj as Record<string, unknown>;
  const failedFields: string[] = [];

  // Required top-level strings
  for (const field of ["assetId", "systemOverview"] as const) {
    if (typeof o[field] !== "string" || !(o[field] as string).trim()) {
      failedFields.push(field);
    }
  }

  // layers: array; each item needs name (string), role (string), components (array)
  if (!Array.isArray(o.layers)) {
    failedFields.push("layers");
  } else {
    (o.layers as unknown[]).forEach((layer, i) => {
      if (!layer || typeof layer !== "object" || Array.isArray(layer)) {
        failedFields.push(`layers[${i}]`);
        return;
      }
      const l = layer as Record<string, unknown>;
      if (typeof l.name !== "string") failedFields.push(`layers[${i}].name`);
      if (typeof l.role !== "string") failedFields.push(`layers[${i}].role`);
      if (!Array.isArray(l.components)) failedFields.push(`layers[${i}].components`);
    });
  }

  // dataFlows: array; each item needs from, to, payload, trigger (all strings)
  if (!Array.isArray(o.dataFlows)) {
    failedFields.push("dataFlows");
  } else {
    (o.dataFlows as unknown[]).forEach((flow, i) => {
      if (!flow || typeof flow !== "object" || Array.isArray(flow)) {
        failedFields.push(`dataFlows[${i}]`);
        return;
      }
      const f = flow as Record<string, unknown>;
      for (const field of ["from", "to", "payload", "trigger"]) {
        if (typeof f[field] !== "string") failedFields.push(`dataFlows[${i}].${field}`);
      }
    });
  }

  // missingPieces: array (may be empty)
  if (!Array.isArray(o.missingPieces)) failedFields.push("missingPieces");

  // confidence: object with level (enum), score (0–100), ambiguityNotes (array)
  if (!o.confidence || typeof o.confidence !== "object" || Array.isArray(o.confidence)) {
    failedFields.push("confidence");
  } else {
    const c = o.confidence as Record<string, unknown>;
    if (!["high", "medium", "low"].includes(c.level as string)) {
      failedFields.push("confidence.level (must be high|medium|low)");
    }
    if (typeof c.score !== "number" || (c.score as number) < 0 || (c.score as number) > 100) {
      failedFields.push("confidence.score (must be number 0–100)");
    }
    if (!Array.isArray(c.ambiguityNotes)) {
      failedFields.push("confidence.ambiguityNotes");
    }
  }

  if (failedFields.length === 0) return { valid: true };

  return {
    valid: false,
    reason: `schema check failed — ${failedFields.join(", ")}`,
    failedFields,
  };
}

// ── Generic validated agent call ──────────────

export interface ValidatedCallOptions<T> {
  /** Calls the Claude API and returns raw text */
  callFn: () => Promise<string>;
  /** Field-level schema validator for the parsed result */
  validateFn: (obj: unknown) => AgentValidationResult;
  /** Short label for log messages — e.g. "architect" */
  label: string;
  /** Max retry attempts on parse or schema failure. Default: 3 */
  maxRetries?: number;
}

export interface ValidatedCallResult<T> {
  output: T;
  /** Total retries consumed (0 = first attempt succeeded) */
  retryCount: number;
  /** Per-attempt failure reasons, for logging */
  retryReasons: string[];
  /** Always true — confirms raw was captured before validation */
  rawPreserved: boolean;
}

/**
 * Calls an agent, validates the response shape, and retries on parse or
 * schema failure. API-level errors (4xx, 5xx, network) propagate immediately
 * and are NOT retried here — the orchestrator retry loop handles those.
 *
 * Retry policy:
 *   - Retry on: JSON parse failure, schema validation failure
 *   - Do NOT retry on: API errors (those are classified by classifyFailure)
 *   - Max retries: opts.maxRetries (default 3)
 */
export async function validateAgentOutput<T>(
  opts: ValidatedCallOptions<T>,
): Promise<ValidatedCallResult<T>> {
  const { callFn, validateFn, label, maxRetries = 3 } = opts;
  const retryReasons: string[] = [];
  let attempt = 0;

  while (attempt <= maxRetries) {
    // API call — propagate immediately on error (not our retry domain)
    const raw = await callFn();

    // Step 1: sanitise
    const { cleaned } = sanitiseRaw(raw);

    // Step 2: parse
    let parsed: T;
    try {
      parsed = parseJsonResponse<T>(cleaned || raw);
    } catch (parseErr) {
      const reason = `attempt ${attempt + 1}: JSON parse failed — ${
        parseErr instanceof Error ? parseErr.message : String(parseErr)
      }`;
      retryReasons.push(reason);
      console.warn(`[VALIDATOR:${label}] ${reason}`);
      if (attempt >= maxRetries) {
        throw new Error(
          `[${label}] Agent output unparseable after ${maxRetries + 1} attempt(s). ` +
          `Reasons: ${retryReasons.join(" | ")}`,
        );
      }
      attempt++;
      continue;
    }

    // Step 3: schema validation
    const check = validateFn(parsed);
    if (!check.valid) {
      const reason = `attempt ${attempt + 1}: ${check.reason}`;
      retryReasons.push(reason);
      console.warn(`[VALIDATOR:${label}] ${reason}`);
      if (attempt >= maxRetries) {
        throw new Error(
          `[${label}] Agent output failed schema validation after ${maxRetries + 1} attempt(s). ` +
          `Last reason: ${check.reason}. Fields: ${check.failedFields?.join(", ")}`,
        );
      }
      attempt++;
      continue;
    }

    // Valid output
    if (attempt > 0) {
      console.log(
        `[VALIDATOR:${label}] Passed on attempt ${attempt + 1}. ` +
        `Retry reasons: ${retryReasons.join(" | ")}`,
      );
    }

    return {
      output: parsed,
      retryCount: attempt,
      retryReasons,
      rawPreserved: true,
    };
  }

  // Should be unreachable — errors are thrown inside the loop
  throw new Error(`[${label}] Unexpected validator exit`);
}
