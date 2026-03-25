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

// ── Source Manifest ───────────────────────────
// Logged per run. Exact record of what was fed in.

export interface SourceManifestEntry {
  kind: AssetSource["kind"];
  label: string;
  charCount: number;
  /** SHA-256 hex digest of content for dedup/audit */
  sha256: string;
}

// ── Confidence Scoring ────────────────────────
// Every pipeline output must carry this.

export interface ConfidenceScore {
  /** Overall signal quality of output */
  level: "high" | "medium" | "low";
  /** 0–100 where 100 = fully confident */
  score: number;
  /** Specific ambiguities, inferences, or missing signals */
  ambiguityNotes: string[];
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
  confidence: ConfidenceScore;
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
  confidence: ConfidenceScore;
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
  confidence: ConfidenceScore;
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
  confidence: ConfidenceScore;
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
  confidence: ConfidenceScore;
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

export type FailureType = "recoverable" | "non-recoverable" | "blocked";

export interface RetryStep {
  attempt: number;
  pipelineId: string;
  error: string;
  failureType: FailureType;
  timestamp: string;
}

export interface PipelineJob {
  jobId: string;
  pipelineId: PipelineId;
  assetId: AssetId;
  status: PipelineStatus;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  output?: PipelineOutput;
  /** Retry attempts made before final status */
  retries?: RetryStep[];
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

// ── Validation Log ────────────────────────────
// Structured per-run log with pass/fail tracking.

export interface ValidationCheck {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface ValidationLog {
  taskName: string;
  timestamp: string;
  status: "PASS" | "FAIL" | "BLOCKED";
  stepsExecuted: string[];
  errors: string[];
  fixesApplied: string[];
  validationChecks: ValidationCheck[];
  commitReady: boolean;
  deployReady: boolean;
  runId?: string;
  retryCount: number;
  retrySteps: RetryStep[];
  recoveryActions: string[];
  finalFailureType?: FailureType;
  /** First pipeline stage that failed, if any */
  failedStage?: string;
  /** Per-stage pass/fail summary keyed by pipelineId */
  validationSummary: Record<string, "pass" | "fail">;
}

// ── Model Router ──────────────────────────────

/** Which model tier to use for execution */
export type ModelTier = "local" | "external" | "fallback";

/** Input to the model router */
export interface RouterInput {
  /** Asset lane identifier (e.g. "vst", "fhi") */
  lane: string;
  /** Explicit priority override */
  priority: "low" | "medium" | "high";
  /** Pipeline / skill being executed */
  skill: string;
  /** Current retry attempt (0 = first attempt) */
  retryAttempt?: number;
  /** Total source chars for the asset — used for complexity inference */
  sourceCharCount?: number;
}

/** Result of model routing */
export interface ModelSelection {
  tier: ModelTier;
  model: string;
  lane: string;
  skill: string;
  priority: "low" | "medium" | "high";
  retryAttempt: number;
  resolvedAt: string;
  reason: string;
}

// ── Orchestrator ──────────────────────────────

export interface OrchestratorConfig {
  maxConcurrentJobs: number;
  defaultPipelines: PipelineId[];
  claudeModel: string;
  outputDir: string;
  /**
   * "analysis" (default) — read-only; build-output pipeline is blocked.
   * "write" — full pipeline including build spec generation.
   */
  mode: "analysis" | "write";
  /**
   * false (default) — enforce single-asset per run.
   * true  — explicitly allow multi-asset batch runs.
   */
  allowMultiAsset: boolean;
  /**
   * Max retry attempts per pipeline step for recoverable failures. Default: 3.
   */
  maxRetries?: number;
}

export interface OrchestratorRun {
  runId: string;
  assetIds: AssetId[];
  pipelines: PipelineId[];
  /** Exact record of every source fed into this run */
  sourceManifest: Record<AssetId, SourceManifestEntry[]>;
  jobs: PipelineJob[];
  startedAt: string;
  completedAt?: string;
  status: "running" | "complete" | "partial" | "failed";
  mode: "analysis" | "write";
}
