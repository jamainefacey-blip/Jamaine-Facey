// ─────────────────────────────────────────────
// EDGE FUNCTION: /ai-lab/run
// Netlify Edge Function — AI Lab Orchestrator
//
// POST /ai-lab/run
// Body: { assetId, assetName, sources, pipelines? }
//
// Returns: OrchestratorRun JSON
// ─────────────────────────────────────────────

import type { Context } from "https://edge.netlify.com";
import { orchestrate } from "../../ai-lab/orchestrator.ts";
import { DEFAULT_CONFIG, PIPELINE_SEQUENCE } from "../../ai-lab/config.ts";
import type { AssetSource, PipelineId, RawAsset } from "../../ai-lab/types.ts";

export default async function handler(req: Request, _ctx: Context): Promise<Response> {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "POST required" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: {
    assetId?: string;
    assetName?: string;
    sources?: AssetSource[];
    pipelines?: PipelineId[];
  };

  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.assetId || !body.sources || body.sources.length === 0) {
    return new Response(
      JSON.stringify({ error: "Required: assetId, sources (non-empty array)" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const asset: RawAsset = {
    id: body.assetId,
    name: body.assetName ?? body.assetId,
    sources: body.sources,
  };

  const pipelines = body.pipelines ?? PIPELINE_SEQUENCE;

  try {
    const run = await orchestrate([asset], pipelines, apiKey, DEFAULT_CONFIG);
    return new Response(JSON.stringify(run), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Orchestration failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const config = { path: "/ai-lab/run" };
