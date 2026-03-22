// ─────────────────────────────────────────────
// AI LAB — EXTRACTOR AGENT
//
// Role   : Extract full structured system knowledge
//          from raw asset sources (files, chats, repos)
// Input  : RawAsset (id, name, sources[])
// Output : ExtractedSystem
// Rules  :
//   - Never invent data not present in sources
//   - Mark gaps honestly as knownGaps[]
//   - Do not touch product logic
// ─────────────────────────────────────────────

import { callClaude, parseJsonResponse } from "./base-agent.ts";
import type { ExtractedSystem, RawAsset } from "../types.ts";

const SYSTEM_PROMPT = `
You are the Extractor Agent inside the AI Lab Pain System.

Your ONLY job is to extract structured system knowledge from raw asset sources.
You must return a single JSON object conforming exactly to the ExtractedSystem schema.

Rules:
- Extract ONLY what is explicitly present in the sources. Do not invent.
- List anything missing or unclear in knownGaps[].
- Be precise: use exact names from the source material.
- Do not suggest improvements or recommendations — only extract.
- Your output must be valid JSON with no additional commentary.

ExtractedSystem schema:
{
  "assetId": string,
  "name": string,
  "purpose": string,
  "coreEntities": [{ "name": string, "type": "model"|"service"|"api"|"ui"|"store"|"agent"|"other", "description": string, "attributes": string[] }],
  "flows": [{ "name": string, "steps": string[], "trigger": string, "output": string, "status": "complete"|"partial"|"missing" }],
  "integrations": [{ "name": string, "type": "inbound"|"outbound"|"bidirectional", "protocol": "http"|"webhook"|"queue"|"sdk"|"other", "status": "live"|"planned"|"unknown" }],
  "techStack": string[],
  "knownGaps": string[],
  "extractedAt": string,
  "confidence": {
    "level": "high"|"medium"|"low",
    "score": number (0-100, how complete/reliable the extraction is),
    "ambiguityNotes": string[] (specific items that were unclear, inferred, or missing from sources)
  }
}

Confidence scoring guide:
- high (80–100): sources are complete, all entities/flows extracted with certainty
- medium (40–79): partial sources, some inferences required
- low (0–39): minimal sources, significant gaps, most entities inferred
`.trim();

export async function runExtractorAgent(
  asset: RawAsset,
  apiKey: string,
  model: string,
): Promise<ExtractedSystem> {
  const sourcesText = asset.sources
    .map((s) => `--- SOURCE [${s.kind.toUpperCase()}]: ${s.label} ---\n${s.content}`)
    .join("\n\n");

  const userPrompt = `
Asset ID  : ${asset.id}
Asset Name: ${asset.name}

SOURCES:
${sourcesText}

Extract the full structured system from the above sources.
Return ONLY valid JSON matching the ExtractedSystem schema.
`.trim();

  const raw = await callClaude({ systemPrompt: SYSTEM_PROMPT, userPrompt, apiKey, model });
  const result = parseJsonResponse<ExtractedSystem>(raw);
  result.assetId = asset.id;
  result.extractedAt = new Date().toISOString();
  return result;
}
