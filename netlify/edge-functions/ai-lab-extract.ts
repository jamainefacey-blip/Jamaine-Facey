// ─────────────────────────────────────────────
// EDGE FUNCTION: /ai-lab/extract
// Fast extraction-only endpoint.
// Runs Pipeline A (asset-extraction) only.
// Useful for quick system snapshots.
//
// POST /ai-lab/extract
// Body: { assetId, assetName, sources }
// Returns: ExtractedSystem JSON
// ─────────────────────────────────────────────

import type { Context } from "https://edge.netlify.com";
import { runExtractionPipeline } from "../../ai-lab/pipelines/asset-extraction.ts";
import { DEFAULT_CONFIG } from "../../ai-lab/config.ts";
import type { AssetSource, RawAsset } from "../../ai-lab/types.ts";

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

  let body: { assetId?: string; assetName?: string; sources?: AssetSource[] };

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

  try {
    const extracted = await runExtractionPipeline(asset, apiKey, DEFAULT_CONFIG.claudeModel);
    return new Response(JSON.stringify(extracted), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Extraction failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

export const config = { path: "/ai-lab/extract" };
