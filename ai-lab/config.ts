// ─────────────────────────────────────────────
// AI LAB — CONFIGURATION
// ─────────────────────────────────────────────

import type { OrchestratorConfig, PipelineId } from "./types.ts";

export const AI_LAB_VERSION = "1.1.0";

export const DEFAULT_CONFIG: OrchestratorConfig = {
  maxConcurrentJobs: 10,
  defaultPipelines: [
    "asset-extraction",
    "asset-reconstruction",
    "gap-risk-analysis",
    "monetisation",
    "build-output",
  ],
  claudeModel: "claude-sonnet-4-6",
  outputDir: "ai-lab/outputs",
  // Safeguard defaults — must be explicitly overridden
  mode: "analysis",       // no write operations unless caller sets "write"
  allowMultiAsset: false, // single-asset boundary enforced by default
};

/** Full pipeline execution order for a new asset */
export const PIPELINE_SEQUENCE: PipelineId[] = [
  "asset-extraction",
  "asset-reconstruction",
  "gap-risk-analysis",
  "monetisation",
  "build-output",
];

/** Which pipelines can run in parallel (no dependency between them) */
export const PARALLEL_SAFE_PIPELINES: PipelineId[] = [
  "gap-risk-analysis",
  "monetisation",
];

/** Asset registry — add new assets here */
export const ASSET_REGISTRY: Record<string, string> = {
  vst: "Voyage Smart Travels",
  fhi: "Fraud Help Index",
  biab: "Business In A Box",
  "rehab-client": "Rehab Client",
};

/** Claude API prompt limits (chars) */
export const PROMPT_LIMITS = {
  maxInputChars: 180_000,
  maxOutputTokens: 4096,
};
