import { storeMemory, trackUsage, getUsage } from '../../utils/usageTracker';

const USAGE_LIMIT = 5;

const SYSTEM_PROMPT = `You are AVA, the intelligence layer of Pain System OS.
Respond with ONLY valid JSON — no markdown, no text outside the JSON object.
Required fields:
  spoken     (string)  — conversational reply
  written    (string)  — structured/formatted reply
  intent     (string)  — detected user intent: prefer "build_request" when user describes a business problem or asks to build something
  confidence (number)  — 0.0 to 1.0
  panel      (object)  — UI panel hint, e.g. { "type": "asset", "action": "open" }
  actions    (array)   — list of suggested system actions`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { input, sessionId } = req.body || {};
  if (!input || typeof input !== 'string' || !input.trim()) {
    return res.status(400).json({ error: 'input required' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  const sid   = String(sessionId || 'default').trim().slice(0, 64);
  const query = input.trim().slice(0, 2000);

  // Usage limit enforcement
  try {
    const usageCount = getUsage(sid).length;
    if (usageCount >= USAGE_LIMIT) {
      return res.status(200).json({
        preview: {
          spoken:     'You have reached your free usage limit.',
          written:    'Upgrade to continue using AVA.',
          intent:     'paywall',
          confidence: 1,
        },
        full:            null,
        paywallRequired: true,
        usageCount,
      });
    }
  } catch {}

  let raw, usage;
  try {
    const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'content-type':    'application/json',
        'x-api-key':       process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-3-5-sonnet-latest',
        max_tokens: 1024,
        system:     SYSTEM_PROMPT,
        messages:   [{ role: 'user', content: query }],
      }),
    });

    if (!apiRes.ok) {
      const err = await apiRes.json().catch(() => ({}));
      return res.status(502).json({ error: 'Claude API error', detail: err?.error?.message || apiRes.status });
    }

    const body = await apiRes.json();
    raw   = body.content?.[0]?.text || '';
    usage = body.usage || {};
  } catch (err) {
    return res.status(502).json({ error: 'AVA fetch failed', detail: err.message });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return res.status(500).json({ error: 'AVA returned non-JSON', raw: raw.slice(0, 200) });
  }

  const result = {
    spoken:     String(parsed.spoken     ?? ''),
    written:    String(parsed.written    ?? ''),
    intent:     String(parsed.intent     ?? ''),
    confidence: Number(parsed.confidence ?? 0),
    panel:      parsed.panel && typeof parsed.panel === 'object' ? parsed.panel : {},
    actions:    Array.isArray(parsed.actions) ? parsed.actions : [],
  };

  const tokens = (usage.input_tokens || 0) + (usage.output_tokens || 0);
  try {
    storeMemory(sid, query, result);
    trackUsage(sid, '/api/ava', tokens);
  } catch {}

  // Intent filter: non-build intents get a redirect hint
  if (result.intent !== 'build_request') {
    result.redirectHint = "I'll build that for you → go to /build";
  }

  // Split preview / full
  const writtenLines = result.written.split('\n');
  const previewWritten = writtenLines.slice(0, 3).join('\n');

  return res.status(200).json({
    preview: {
      spoken:     result.spoken,
      written:    previewWritten,
      intent:     result.intent,
      confidence: result.confidence,
      ...(result.redirectHint ? { redirectHint: result.redirectHint } : {}),
    },
    full:            result,
    paywallRequired: false,
  });
}
