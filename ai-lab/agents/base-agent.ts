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
 * Safe for Deno/Netlify Edge environments (no Node deps).
 */
export async function callClaude(opts: AgentCallOptions): Promise<string> {
  const { systemPrompt, userPrompt, apiKey, model, maxTokens = PROMPT_LIMITS.maxOutputTokens } = opts;

  // Truncate input if over limit
  const truncated = userPrompt.length > PROMPT_LIMITS.maxInputChars
    ? userPrompt.slice(0, PROMPT_LIMITS.maxInputChars) + "\n\n[TRUNCATED — input exceeded limit]"
    : userPrompt;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages: [{ role: "user", content: truncated }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  const block = data.content?.[0];
  if (!block || block.type !== "text") {
    throw new Error("Claude returned no text content");
  }
  return block.text as string;
}

/**
 * Parse JSON from a Claude response that may be wrapped in markdown fences.
 */
export function parseJsonResponse<T>(raw: string): T {
  // Strip ```json ... ``` or ``` ... ``` wrappers
  const cleaned = raw
    .replace(/^```(?:json)?\n?/m, "")
    .replace(/\n?```$/m, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    throw new Error(`Failed to parse agent JSON response: ${cleaned.slice(0, 200)}`);
  }
}
