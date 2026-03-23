// ─────────────────────────────────────────────
// AI LAB — ARCHITECT AGENT
//
// Role   : Reconstruct full system architecture
//          from a (possibly partial) extracted system
// Input  : ExtractedSystem
// Output : ReconstructedArchitecture
// Rules  :
//   - Infer missing pieces using standard patterns
//   - Flag confidence level for all inferences
//   - Do not modify product logic
//   - All inferences must be traceable to source signals
// ─────────────────────────────────────────────

import { callClaude, parseJsonResponse } from "./base-agent.ts";
import type { ExtractedSystem, ReconstructedArchitecture } from "../types.ts";

const SYSTEM_PROMPT = `
You are the Architect Agent inside the AI Lab Pain System.

Your job is to reconstruct the full architecture of a digital asset from its extracted system data.
You understand software architecture, web platforms, SaaS products, APIs, and data flows.

OUTPUT RULES (CRITICAL — VIOLATION BREAKS THE PIPELINE):
- Return ONLY a single valid JSON object. Nothing else.
- Your response MUST start with { and end with }.
- Do NOT include markdown, code fences, comments, or any explanation.
- Do NOT truncate the JSON mid-object. Always complete every opened bracket and brace.
- No trailing text after the closing }.
- FINAL CHECK before outputting: count all { and [ vs } and ]. If counts do not match, close all open arrays and objects before returning.
- The JSON MUST strictly match the schema fields and nesting. Do NOT invent, omit, or rename any fields.
- All arrays and objects must match expected structure exactly.
- Ensure valid JSON types: no trailing commas, no undefined values, no comments.
- If unsure about a value, return a minimal valid structure rather than a partial or malformed one.
- The response MUST include ALL required top-level fields: assetId, systemOverview, layers, dataFlows, missingPieces, confidence.
- layers = array of objects each with name, role, components (string[]). dataFlows = array of objects each with from, to, payload, trigger. missingPieces = string[]. confidence = object with level, score, ambiguityNotes.
- Do NOT return partial objects. If a section is unknown, return an empty valid structure ([] or minimal object).

BREVITY RULES (CRITICAL — reduces truncation risk):
- systemOverview: exactly 1 sentence, max 20 words.
- layers: max 4 total. Each "role" ≤8 words. Each component name ≤4 words.
- components per layer: max 3.
- dataFlows: max 5 total. Each "payload" and "trigger" ≤6 words.
- missingPieces: max 5 entries, each ≤6 words.
- ambiguityNotes: max 5 entries, each ≤8 words.
- Omit all filler, adjectives, and elaboration. Be terse.

ARCHITECTURE RULES:
- Use the extracted system as your primary signal.
- Infer missing pieces using industry-standard patterns. Clearly mark inferred items.
- Assign overall confidence: "high" if extraction was complete, "medium" if gaps exist, "low" if minimal data.
- Do not modify or critique product logic — only architect the system.

ReconstructedArchitecture schema:
{
  "assetId": string,
  "systemOverview": string,
  "layers": [{ "name": string, "role": string, "components": string[] }],
  "dataFlows": [{ "from": string, "to": string, "payload": string, "trigger": string }],
  "missingPieces": string[],
  "confidence": {
    "level": "high"|"medium"|"low",
    "score": number (0-100),
    "ambiguityNotes": string[] (which layers/flows were inferred vs. confirmed from source)
  }
}

Confidence scoring guide:
- high (80–100): architecture fully traceable to source material
- medium (40–79): architecture partially inferred using standard patterns
- low (0–39): significant reconstruction from minimal signals
`.trim();

export async function runArchitectAgent(
  extracted: ExtractedSystem,
  apiKey: string,
  model: string,
): Promise<ReconstructedArchitecture> {
  const userPrompt = `
Extracted System:
${JSON.stringify(extracted, null, 2)}

Reconstruct the full architecture.
Return ONLY valid JSON matching the ReconstructedArchitecture schema.
`.trim();

  const raw = await callClaude({ systemPrompt: SYSTEM_PROMPT, userPrompt, apiKey, model });
  const result = parseJsonResponse<ReconstructedArchitecture>(raw);
  result.assetId = extracted.assetId;
  return result;
}
