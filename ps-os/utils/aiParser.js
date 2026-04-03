'use strict';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const SYSTEM_PROMPT = `You are a structured data extractor. Given raw text, extract all mentioned projects, tools, workflows, systems, notes, and decisions.

Return ONLY valid JSON in this exact format:
{
  "projects":  [{ "name": "", "purpose": "", "status": "idea|defined|building|active|monetising|exit", "priority": 1-5, "notes": [] }],
  "tools":     [{ "name": "", "purpose": "", "status": "idea|defined|building|active|monetising|exit", "priority": 1-5, "notes": [] }],
  "workflows": [{ "name": "", "purpose": "", "status": "idea|defined|building|active|monetising|exit", "priority": 1-5, "notes": [] }],
  "systems":   [{ "name": "", "purpose": "", "status": "idea|defined|building|active|monetising|exit", "priority": 1-5, "notes": [] }],
  "notes":     ["standalone note text"],
  "decisions": ["decision text"]
}

Rules:
- If a field is unclear, use sensible defaults (status: "idea", priority: 3)
- notes array inside each item = specific notes about that item
- Do not include empty arrays if nothing was found
- Return ONLY the JSON object, no markdown, no explanation`;

async function parseWithOpenAI(rawText) {
  if (!OPENAI_API_KEY) {
    return fallbackParse(rawText);
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: rawText.slice(0, 12000) },
      ],
      temperature: 0.1,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${response.status} — ${err}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  return JSON.parse(content);
}

function fallbackParse(rawText) {
  // Basic keyword-based fallback when no API key
  const lines = rawText.split('\n').filter(l => l.trim());
  const result = {
    projects: [],
    tools: [],
    workflows: [],
    systems: [],
    notes: [],
    decisions: [],
  };

  const patterns = {
    project:  /\b(project|app|application|product|service|platform)\b/i,
    tool:     /\b(tool|utility|script|cli|library|plugin|extension)\b/i,
    workflow: /\b(workflow|process|pipeline|flow|procedure|automation)\b/i,
    system:   /\b(system|infrastructure|backend|api|server|database|db)\b/i,
  };

  for (const line of lines) {
    let matched = false;
    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(line)) {
        const name = line.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 80);
        if (name.length > 3) {
          result[type + 's'].push({ name, purpose: line.trim(), status: 'idea', priority: 3, notes: [] });
          matched = true;
          break;
        }
      }
    }
    if (!matched && line.trim().length > 10) {
      result.notes.push(line.trim());
    }
  }

  return result;
}

// If input is already valid structured JSON, return it directly
function isStructuredJson(text) {
  try {
    const parsed = JSON.parse(text);
    const keys = ['projects', 'tools', 'workflows', 'systems', 'notes', 'decisions'];
    return keys.some(k => Array.isArray(parsed[k]));
  } catch {
    return false;
  }
}

async function parseRawInput(rawText, source = 'unknown') {
  if (isStructuredJson(rawText)) {
    return { data: JSON.parse(rawText), skippedAI: true };
  }
  const data = await parseWithOpenAI(rawText);
  return { data, skippedAI: false };
}

module.exports = { parseRawInput };
