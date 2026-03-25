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
//
// Exhaustion tag: errors thrown after max retries include "VALIDATION_EXHAUSTED:"
// so classifyFailure() in orchestrator.ts can mark them non-recoverable — preventing
// the orchestrator from wasting its own retry budget on validation failures.
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

// ── Shared confidence validator ───────────────

/**
 * Validates the ConfidenceScore sub-object shared by all pipeline outputs.
 * Pushes any failures into the provided failedFields array.
 */
function checkConfidence(obj: Record<string, unknown>, failedFields: string[]): void {
  if (!obj.confidence || typeof obj.confidence !== "object" || Array.isArray(obj.confidence)) {
    failedFields.push("confidence");
    return;
  }
  const c = obj.confidence as Record<string, unknown>;
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

/** Returns {valid:false,...} if obj is not a plain object. */
function requireObject(obj: unknown): AgentValidationResult | null {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    return { valid: false, reason: "response is not a JSON object", failedFields: ["(root)"] };
  }
  return null;
}

/** Returns {valid:false,...} if failedFields is non-empty, else {valid:true}. */
function toResult(failedFields: string[]): AgentValidationResult {
  if (failedFields.length === 0) return { valid: true };
  return {
    valid: false,
    reason: `schema check failed — ${failedFields.join(", ")}`,
    failedFields,
  };
}

// ── Schema validators ─────────────────────────

/**
 * Validates a parsed object against the ExtractedSystem schema.
 */
export function validateExtractionOutput(obj: unknown): AgentValidationResult {
  const early = requireObject(obj);
  if (early) return early;

  const o = obj as Record<string, unknown>;
  const ff: string[] = [];

  // Required top-level strings
  for (const f of ["assetId", "name", "purpose", "extractedAt"]) {
    if (typeof o[f] !== "string" || !(o[f] as string).trim()) ff.push(f);
  }

  // coreEntities: array; each needs name, type (enum), description, attributes (array)
  const entityTypes = new Set(["model", "service", "api", "ui", "store", "agent", "other"]);
  if (!Array.isArray(o.coreEntities)) {
    ff.push("coreEntities");
  } else {
    (o.coreEntities as unknown[]).forEach((e, i) => {
      if (!e || typeof e !== "object" || Array.isArray(e)) { ff.push(`coreEntities[${i}]`); return; }
      const en = e as Record<string, unknown>;
      if (typeof en.name !== "string") ff.push(`coreEntities[${i}].name`);
      if (!entityTypes.has(en.type as string)) ff.push(`coreEntities[${i}].type`);
      if (typeof en.description !== "string") ff.push(`coreEntities[${i}].description`);
      if (!Array.isArray(en.attributes)) ff.push(`coreEntities[${i}].attributes`);
    });
  }

  // flows: array; each needs name, steps (array), trigger, output, status (enum)
  const flowStatuses = new Set(["complete", "partial", "missing"]);
  if (!Array.isArray(o.flows)) {
    ff.push("flows");
  } else {
    (o.flows as unknown[]).forEach((fl, i) => {
      if (!fl || typeof fl !== "object" || Array.isArray(fl)) { ff.push(`flows[${i}]`); return; }
      const f = fl as Record<string, unknown>;
      if (typeof f.name !== "string") ff.push(`flows[${i}].name`);
      if (!Array.isArray(f.steps)) ff.push(`flows[${i}].steps`);
      if (typeof f.trigger !== "string") ff.push(`flows[${i}].trigger`);
      if (typeof f.output !== "string") ff.push(`flows[${i}].output`);
      if (!flowStatuses.has(f.status as string)) ff.push(`flows[${i}].status`);
    });
  }

  // integrations: array; each needs name, type (enum), protocol (enum), status (enum)
  const intTypes = new Set(["inbound", "outbound", "bidirectional"]);
  const intProtocols = new Set(["http", "webhook", "queue", "sdk", "other"]);
  const intStatuses = new Set(["live", "planned", "unknown"]);
  if (!Array.isArray(o.integrations)) {
    ff.push("integrations");
  } else {
    (o.integrations as unknown[]).forEach((it, i) => {
      if (!it || typeof it !== "object" || Array.isArray(it)) { ff.push(`integrations[${i}]`); return; }
      const n = it as Record<string, unknown>;
      if (typeof n.name !== "string") ff.push(`integrations[${i}].name`);
      if (!intTypes.has(n.type as string)) ff.push(`integrations[${i}].type`);
      if (!intProtocols.has(n.protocol as string)) ff.push(`integrations[${i}].protocol`);
      if (!intStatuses.has(n.status as string)) ff.push(`integrations[${i}].status`);
    });
  }

  if (!Array.isArray(o.techStack)) ff.push("techStack");
  if (!Array.isArray(o.knownGaps)) ff.push("knownGaps");
  checkConfidence(o, ff);

  return toResult(ff);
}

/**
 * Validates a parsed object against the GapRiskReport schema.
 */
export function validateGapRiskOutput(obj: unknown): AgentValidationResult {
  const early = requireObject(obj);
  if (early) return early;

  const o = obj as Record<string, unknown>;
  const ff: string[] = [];

  if (typeof o.assetId !== "string" || !(o.assetId as string).trim()) ff.push("assetId");

  // score: number 0–100
  if (typeof o.score !== "number" || (o.score as number) < 0 || (o.score as number) > 100) {
    ff.push("score (must be number 0–100)");
  }

  // gaps: array; each needs id, area, description, severity (enum), effort (enum)
  const severities = new Set(["critical", "high", "medium", "low"]);
  const efforts = new Set(["small", "medium", "large"]);
  if (!Array.isArray(o.gaps)) {
    ff.push("gaps");
  } else {
    (o.gaps as unknown[]).forEach((g, i) => {
      if (!g || typeof g !== "object" || Array.isArray(g)) { ff.push(`gaps[${i}]`); return; }
      const gap = g as Record<string, unknown>;
      for (const f of ["id", "area", "description"]) {
        if (typeof gap[f] !== "string") ff.push(`gaps[${i}].${f}`);
      }
      if (!severities.has(gap.severity as string)) ff.push(`gaps[${i}].severity`);
      if (!efforts.has(gap.effort as string)) ff.push(`gaps[${i}].effort`);
    });
  }

  // risks: array; each needs id, area, description, likelihood (enum), impact (enum), mitigation
  const likelihoods = new Set(["high", "medium", "low"]);
  const impacts = new Set(["high", "medium", "low"]);
  if (!Array.isArray(o.risks)) {
    ff.push("risks");
  } else {
    (o.risks as unknown[]).forEach((r, i) => {
      if (!r || typeof r !== "object" || Array.isArray(r)) { ff.push(`risks[${i}]`); return; }
      const risk = r as Record<string, unknown>;
      for (const f of ["id", "area", "description", "mitigation"]) {
        if (typeof risk[f] !== "string") ff.push(`risks[${i}].${f}`);
      }
      if (!likelihoods.has(risk.likelihood as string)) ff.push(`risks[${i}].likelihood`);
      if (!impacts.has(risk.impact as string)) ff.push(`risks[${i}].impact`);
    });
  }

  // blockers: array; each needs id, description, dependency, resolution
  if (!Array.isArray(o.blockers)) {
    ff.push("blockers");
  } else {
    (o.blockers as unknown[]).forEach((b, i) => {
      if (!b || typeof b !== "object" || Array.isArray(b)) { ff.push(`blockers[${i}]`); return; }
      const bl = b as Record<string, unknown>;
      for (const f of ["id", "description", "dependency", "resolution"]) {
        if (typeof bl[f] !== "string") ff.push(`blockers[${i}].${f}`);
      }
    });
  }

  checkConfidence(o, ff);
  return toResult(ff);
}

/**
 * Validates a parsed object against the MonetisationReport schema.
 */
export function validateMonetisationOutput(obj: unknown): AgentValidationResult {
  const early = requireObject(obj);
  if (early) return early;

  const o = obj as Record<string, unknown>;
  const ff: string[] = [];

  for (const f of ["assetId", "positioning", "totalAddressableMarket", "recommendedLaunchPath"]) {
    if (typeof o[f] !== "string" || !(o[f] as string).trim()) ff.push(f);
  }
  if (!Array.isArray(o.targetSegments)) ff.push("targetSegments");

  // pricingModel: object with type (enum), tiers (array), currency (string)
  const pricingTypes = new Set(["subscription", "one-time", "usage", "freemium", "hybrid"]);
  if (!o.pricingModel || typeof o.pricingModel !== "object" || Array.isArray(o.pricingModel)) {
    ff.push("pricingModel");
  } else {
    const pm = o.pricingModel as Record<string, unknown>;
    if (!pricingTypes.has(pm.type as string)) ff.push("pricingModel.type");
    if (typeof pm.currency !== "string") ff.push("pricingModel.currency");
    if (!Array.isArray(pm.tiers)) {
      ff.push("pricingModel.tiers");
    } else {
      (pm.tiers as unknown[]).forEach((t, i) => {
        if (!t || typeof t !== "object" || Array.isArray(t)) { ff.push(`pricingModel.tiers[${i}]`); return; }
        const tier = t as Record<string, unknown>;
        for (const f of ["name", "price", "targetUser"]) {
          if (typeof tier[f] !== "string") ff.push(`pricingModel.tiers[${i}].${f}`);
        }
        if (!Array.isArray(tier.features)) ff.push(`pricingModel.tiers[${i}].features`);
      });
    }
  }

  // revenuePaths: array; each needs name, mechanism, estimatedMonthlyRevenue, timeToRevenue, effort (enum)
  const effortLevels = new Set(["low", "medium", "high"]);
  if (!Array.isArray(o.revenuePaths)) {
    ff.push("revenuePaths");
  } else {
    (o.revenuePaths as unknown[]).forEach((rp, i) => {
      if (!rp || typeof rp !== "object" || Array.isArray(rp)) { ff.push(`revenuePaths[${i}]`); return; }
      const r = rp as Record<string, unknown>;
      for (const f of ["name", "mechanism", "estimatedMonthlyRevenue", "timeToRevenue"]) {
        if (typeof r[f] !== "string") ff.push(`revenuePaths[${i}].${f}`);
      }
      if (!effortLevels.has(r.effort as string)) ff.push(`revenuePaths[${i}].effort`);
    });
  }

  checkConfidence(o, ff);
  return toResult(ff);
}

/**
 * Validates a parsed object against the ReconstructedArchitecture schema.
 * Checks every required field and its basic type constraints.
 * Returns field-level failure detail — not just pass/fail.
 */
export function validateReconstructedArchitecture(
  obj: unknown,
): AgentValidationResult {
  const early = requireObject(obj);
  if (early) return early;

  const o = obj as Record<string, unknown>;
  const ff: string[] = [];

  // Required top-level strings
  for (const field of ["assetId", "systemOverview"] as const) {
    if (typeof o[field] !== "string" || !(o[field] as string).trim()) ff.push(field);
  }

  // layers: array; each item needs name (string), role (string), components (array)
  if (!Array.isArray(o.layers)) {
    ff.push("layers");
  } else {
    (o.layers as unknown[]).forEach((layer, i) => {
      if (!layer || typeof layer !== "object" || Array.isArray(layer)) {
        ff.push(`layers[${i}]`);
        return;
      }
      const l = layer as Record<string, unknown>;
      if (typeof l.name !== "string") ff.push(`layers[${i}].name`);
      if (typeof l.role !== "string") ff.push(`layers[${i}].role`);
      if (!Array.isArray(l.components)) ff.push(`layers[${i}].components`);
    });
  }

  // dataFlows: array; each item needs from, to, payload, trigger (all strings)
  if (!Array.isArray(o.dataFlows)) {
    ff.push("dataFlows");
  } else {
    (o.dataFlows as unknown[]).forEach((flow, i) => {
      if (!flow || typeof flow !== "object" || Array.isArray(flow)) {
        ff.push(`dataFlows[${i}]`);
        return;
      }
      const f = flow as Record<string, unknown>;
      for (const field of ["from", "to", "payload", "trigger"]) {
        if (typeof f[field] !== "string") ff.push(`dataFlows[${i}].${field}`);
      }
    });
  }

  // missingPieces: array (may be empty)
  if (!Array.isArray(o.missingPieces)) ff.push("missingPieces");

  checkConfidence(o, ff);
  return toResult(ff);
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
 *
 * Errors thrown on exhaustion are prefixed "VALIDATION_EXHAUSTED:" so that
 * classifyFailure() in orchestrator.ts maps them to "non-recoverable", preventing
 * the orchestrator from re-running its own retry budget on validation failures.
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
          `VALIDATION_EXHAUSTED: [${label}] Agent output unparseable after ${maxRetries + 1} attempt(s). ` +
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
          `VALIDATION_EXHAUSTED: [${label}] Agent output failed schema validation after ${maxRetries + 1} attempt(s). ` +
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
  throw new Error(`VALIDATION_EXHAUSTED: [${label}] Unexpected validator exit`);
}
