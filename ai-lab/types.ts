// ─────────────────────────────────────────────
// AI LAB — SHARED TYPE DEFINITIONS
// Pain System Infrastructure Layer
// ─────────────────────────────────────────────

// ── Asset ────────────────────────────────────

export type AssetId = string; // e.g. "vst", "fhi", "biab", "voyage-smart-travels"

export interface RawAsset {
  id: AssetId;
  name: string;
  /** Free-form input: file contents, chat transcripts, repo dumps, docs */
  sources: AssetSource[];
}

export interface AssetSource {
  kind: "file" | "chat" | "repo" | "doc" | "url";
  label: string;
  content: string;
}

// ── Extracted System ─────────────────────────

export interface ExtractedSystem {
  assetId: AssetId;
  name: string;
  purpose: string;
  coreEntities: Entity[];
  flows: Flow[];
  integrations: Integration[];
  techStack: string[];
  knownGaps: string[];
  extractedAt: string; // ISO timestamp
}

export interface Entity {
  name: string;
  type: "model" | "service" | "api" | "ui" | "store" | "agent" | "other";
  description: string;
  attributes: string[];
}

export interface Flow {
  name: string;
  steps: string[];
  trigger: string;
  output: string;
  status: "complete" | "partial" | "missing";
}

export interface Integration {
  name: string;
  type: "inbound" | "outbound" | "bidirectional";
  protocol: "http" | "webhook" | "queue" | "sdk" | "other";
  status: "live" | "planned" | "unknown";
}

// ── Reconstructed Architecture ───────────────

export interface ReconstructedArchitecture {
  assetId: AssetId;
  systemOverview: string;
  layers: ArchitectureLayer[];
  dataFlows: DataFlow[];
  missingPieces: string[];
  confidence: "high" | "medium" | "low";
}

export interface ArchitectureLayer {
  name: string;
  role: string;
  components: string[];
}

export interface DataFlow {
  from: string;
  to: string;
  payload: string;
  trigger: string;
}

// ── Gap & Risk Analysis ───────────────────────

export interface GapRiskReport {
  assetId: AssetId;
  gaps: Gap[];
  risks: Risk[];
  blockers: Blocker[];
  score: number; // 0–100, system completeness
}

export interface Gap {
  id: string;
  area: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  effort: "small" | "medium" | "large";
}

export interface Risk {
  id: string;
  area: string;
  description: string;
  likelihood: "high" | "medium" | "low";
  impact: "high" | "medium" | "low";
  mitigation: string;
}

export interface Blocker {
  id: string;
  description: string;
  dependency: string;
  resolution: string;
}

// ── Monetisation ─────────────────────────────

export interface MonetisationReport {
  assetId: AssetId;
  positioning: string;
  targetSegments: string[];
  pricingModel: PricingModel;
  revenuePaths: RevenuePath[];
  totalAddressableMarket: string;
  recommendedLaunchPath: string;
}

export interface PricingModel {
  type: "subscription" | "one-time" | "usage" | "freemium" | "hybrid";
  tiers: PricingTier[];
  currency: string;
}

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
  targetUser: string;
}

export interface RevenuePath {
  name: string;
  mechanism: string;
  estimatedMonthlyRevenue: string;
  timeToRevenue: string;
  effort: "low" | "medium" | "high";
}

// ── Build Output ─────────────────────────────

export interface BuildSpec {
  assetId: AssetId;
  title: string;
  objective: string;
  modules: BuildModule[];
  filesToCreate: FileSpec[];
  filesToModify: FileModification[];
  dependencies: string[];
  testPlan: string[];
  deployChecklist: string[];
}

export interface BuildModule {
  name: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  priority: "p0" | "p1" | "p2";
}

export interface FileSpec {
  path: string;
  purpose: string;
  contentSkeleton: string;
}

export interface FileModification {
  path: string;
  change: string;
  reason: string;
}

// ── Pipeline ─────────────────────────────────

export type PipelineId =
  | "asset-extraction"
  | "asset-reconstruction"
  | "gap-risk-analysis"
  | "monetisation"
  | "build-output";

export type PipelineStatus = "pending" | "running" | "complete" | "failed";

export interface PipelineJob {
  jobId: string;
  pipelineId: PipelineId;
  assetId: AssetId;
  status: PipelineStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  output?: PipelineOutput;
}

export type PipelineOutput =
  | ExtractedSystem
  | ReconstructedArchitecture
  | GapRiskReport
  | MonetisationReport
  | BuildSpec;

// ── Agent ─────────────────────────────────────

export type AgentId =
  | "extractor"
  | "architect"
  | "product-manager"
  | "monetisation"
  | "validator";

export interface AgentTask {
  taskId: string;
  agentId: AgentId;
  jobId: string;
  assetId: AssetId;
  input: unknown;
  output?: unknown;
  status: "pending" | "running" | "complete" | "failed";
  error?: string;
}

// ── Orchestrator ──────────────────────────────

export interface OrchestratorConfig {
  maxConcurrentJobs: number;
  defaultPipelines: PipelineId[];
  claudeModel: string;
  outputDir: string;
}

export interface OrchestratorRun {
  runId: string;
  assetIds: AssetId[];
  pipelines: PipelineId[];
  jobs: PipelineJob[];
  startedAt: string;
  completedAt?: string;
  status: "running" | "complete" | "partial" | "failed";
}
