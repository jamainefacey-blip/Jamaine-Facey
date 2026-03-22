// ─────────────────────────────────────────────
// EDGE FUNCTION: /ai-lab/status
// Health check + system info for AI Lab
// ─────────────────────────────────────────────

import type { Context } from "https://edge.netlify.com";
import { AI_LAB_VERSION, ASSET_REGISTRY, PIPELINE_SEQUENCE } from "../../ai-lab/config.ts";

export default function handler(_req: Request, _ctx: Context): Response {
  const status = {
    system: "AI Lab Orchestrator",
    version: AI_LAB_VERSION,
    status: "online",
    node: "Netlify Edge",
    pipelines: PIPELINE_SEQUENCE,
    agents: ["extractor", "architect", "product-manager", "monetisation", "validator"],
    registeredAssets: ASSET_REGISTRY,
    endpoints: {
      run: "POST /ai-lab/run",
      status: "GET /ai-lab/status",
      extract: "POST /ai-lab/extract",
    },
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(status, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export const config = { path: "/ai-lab/status" };
