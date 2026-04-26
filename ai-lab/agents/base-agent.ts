// ─────────────────────────────────────────────
// AI LAB — BASE AGENT
// Shared Claude API call logic for all agents.
// ─────────────────────────────────────────────

import { PROMPT_LIMITS } from "../config.ts";

export interface ClaudeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentCallOptions {
  systemPrompt: string;
  userPrompt: string;
  apiKey: string;
  model: string;
  maxTokens?: number;
}

/**
 * Single-turn Claude API call. Returns raw text response.
 * Uses fetch() — compatible with Deno (Netlify Edge) and Node.js 18+.
 */
export async function callClaude(opts: AgentCallOptions): Promise<string> {
  const { systemPrompt, userPrompt, apiKey, model, maxTokens = PROMPT_LIMITS.maxOutputTokens } = opts;

  // Truncate input if over limit
  const truncated = userPrompt.length > PROMPT_LIMITS.maxInputChars
    ? userPrompt.slice(0, PROMPT_LIMITS.maxInputChars) + "\n\n[TRUNCATED — input exceeded limit]"
    : userPrompt;

  const bodyStr = JSON.stringify({
    model,
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: "user", content: truncated }],
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: bodyStr,
  });

  const raw = await response.text();

  if (!response.ok) {
    throw new Error(`Claude API error ${response.status}: ${raw}`);
  }

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    throw new Error(`Claude API non-JSON response: ${raw.slice(0, 200)}`);
  }

  const block = (data.content as Array<{type: string; text: string}>)?.[0];
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return block.text;
}

/**
 * Parse JSON from a Claude response that may be wrapped in markdown fences,
 * have leading/trailing text, or be slightly malformed.
 *
 * Strategy (in order):
 *   1. Strip ```json / ``` fences, then try JSON.parse on full cleaned string.
 *   2. Extract the FIRST {...} block from the raw string and try that.
 *   3. Walk backwards from the last } to find the longest valid JSON object.
 *   4. Regex fallback — grab anything matching a top-level {...} block.
 *   5. Throw with logged context only if all attempts fail.
 */
export function parseJsonResponse<T>(raw: string): T {
  // ── Pass 1: strip markdown fences ──────────────────────────────────────
  const fenceStripped = raw
    .replace(/^```(?:json)?\s*/m, "")
    .replace(/\s*```\s*$/m, "")
    .trim();

  try {
    return JSON.parse(fenceStripped) as T;
  } catch { /* fall through */ }

  // ── Pass 2: extract first { ... } block (handles leading/trailing text) ─
  const firstBrace = raw.indexOf("{");
  const lastBrace  = raw.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace <= firstBrace) {
    console.error(
      `[parseJsonResponse] Truncated JSON: no closing brace found. Raw (first 500 chars):\n${raw.slice(0, 500)}`
    );
    throw new Error("Truncated JSON: no closing brace found");
  }

  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const extracted = raw.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(extracted) as T;
    } catch { /* fall through */ }

    // ── Pass 3: trim to last valid closing brace (handles truncated output) ─
    let candidate = extracted;
    for (let end = candidate.length - 1; end > 0; end--) {
      if (candidate[end] === "}") {
        try {
          return JSON.parse(candidate.slice(0, end + 1)) as T;
        } catch { /* keep trimming */ }
      }
    }
  }

  // ── Pass 4: regex fallback — grab top-level JSON object block ───────────
  const jsonBlockMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonBlockMatch) {
    try {
      return JSON.parse(jsonBlockMatch[0]) as T;
    } catch { /* fall through */ }
  }

  // ── Pass 5: force-close truncated JSON by balancing open brackets ────────
  if (firstBrace !== -1) {
    const fragment = raw.slice(firstBrace);
    const closes: string[] = [];
    let inString = false;
    let escape = false;
    for (const ch of fragment) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") closes.push("}");
      else if (ch === "[") closes.push("]");
      else if (ch === "}" || ch === "]") closes.pop();
    }
    // Strip trailing comma before we close, then append missing closers
    const patched = fragment.replace(/,\s*$/, "") + closes.reverse().join("");
    try {
      return JSON.parse(patched) as T;
    } catch { /* fall through */ }
  }

  // ── All passes failed ────────────────────────────────────────────────────
  console.error(
    `[parseJsonResponse] All parse attempts failed. Raw response (first 500 chars):\n${raw.slice(0, 500)}`
  );
  throw new Error(
    `Failed to parse agent JSON response. Raw (first 200): ${raw.slice(0, 200)}`
  );
}
