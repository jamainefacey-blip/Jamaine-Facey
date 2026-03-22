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

Rules:
- Use the extracted system as your primary signal.
- Infer missing pieces using industry-standard patterns. Clearly mark inferred items.
- Assign overall confidence: "high" if extraction was complete, "medium" if gaps exist, "low" if minimal data.
- Do not modify or critique product logic — only architect the system.
- Return ONLY valid JSON matching the ReconstructedArchitecture schema.

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
