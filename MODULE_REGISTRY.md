# Pain System Sandbox Modules
This repository is used as a sandbox environment for building and testing small, portable modules that may later be integrated into the main Pain System platform.
The purpose of this registry is to document every experimental module created in the sandbox so it can later be moved, tested, hardened, or integrated into the production system.
---
## pain-system endpoint
Path: /pain-system
Type: Netlify Edge Function
Location: netlify/edge-functions/pain-system.ts
Purpose:
Provides a simple status endpoint confirming that the Pain System sandbox node is operational.
Response example:
{
  "system": "Pain System",
  "status": "online",
  "node": "Netlify Edge Sandbox"
}
Notes:
- This endpoint is intended as a health/status check for the sandbox environment.
- It confirms that the Netlify edge execution environment is working.
- It serves as the first module in the Pain System sandbox module registry.
---
---
## Example Sandbox Tools

### Hello Pain
Tool Name: Hello Pain
Endpoint: /tools/hello-pain
Location: tools/hello-pain/handler.ts
Purpose: Confirms that the sandbox tool system is functioning
Response example:
{
  "tool": "hello-pain",
  "message": "Pain System tool sandbox operational"
}
---
## Rehab Client App

Tool Name: Rehab Client
Endpoint: /tools/rehab-client
Location: tools/rehab-client/
Type: Static Web App (SPA)
Purpose: Mobile-first rehab / PT coaching app for individual clients. Displays a personalised rehab program, session schedule, exercise library with coaching cues, progress tracking, and coach notes. Built as a white-label template reusable for any PT or rehab client by editing the data files only.
Key files:
- index.html — app shell
- styles/app.css — mobile-first styles
- scripts/app.js — SPA router and all view logic
- scripts/data/client.js — client profile, goals, coach, branding (edit to white-label)
- scripts/data/exercises.js — exercise library with sets, reps, tempo, cues
- scripts/data/plan.js — 12-week session schedule
Demo client: Sarah Thompson — Post-ACL reconstruction, 12-week program
Phase: MVP — static data, no login required
---
---
## AI Lab Orchestrator

System Name: AI Lab Orchestrator
Version: 1.0.0
Type: Infrastructure Layer — Build, Analysis, and Scale System
Location: ai-lab/

Purpose:
The AI Lab Orchestrator is the infrastructure layer of the Pain System. It extracts full system knowledge from any asset, reconstructs missing architecture, identifies gaps and risks, generates monetisation strategies, and produces Claude Code-ready build specifications. It operates outside all product code as a pure build and analysis layer.

### Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| /ai-lab/status | GET | Health check, lists pipelines, agents, registered assets |
| /ai-lab/run | POST | Full orchestration run — all pipelines for one asset |
| /ai-lab/extract | POST | Fast extraction only — Pipeline A |

### Architecture

```
LAYER 1 — ORCHESTRATOR
  ai-lab/orchestrator.ts
  Controls pipelines, assigns agents, manages execution order.
  Batches assets up to maxConcurrentJobs in parallel.

LAYER 2 — PIPELINES
  ai-lab/pipelines/asset-extraction.ts      → ExtractedSystem
  ai-lab/pipelines/asset-reconstruction.ts  → ReconstructedArchitecture
  ai-lab/pipelines/gap-risk-analysis.ts     → GapRiskReport
  ai-lab/pipelines/monetisation.ts          → MonetisationReport
  ai-lab/pipelines/build-output.ts          → BuildSpec

LAYER 3 — AGENTS
  ai-lab/agents/extractor-agent.ts          → Extracts structured system from raw sources
  ai-lab/agents/architect-agent.ts          → Reconstructs full architecture
  ai-lab/agents/product-manager-agent.ts    → Gap & risk analysis
  ai-lab/agents/monetisation-agent.ts       → Pricing, positioning, revenue paths
  ai-lab/agents/validator-agent.ts          → Claude Code-ready build specifications
```

### Shared Types
Location: ai-lab/types.ts
Defines: RawAsset, ExtractedSystem, ReconstructedArchitecture, GapRiskReport, MonetisationReport, BuildSpec, PipelineJob, OrchestratorRun, all sub-types.

### Config
Location: ai-lab/config.ts
Controls: model selection, concurrency, pipeline order, asset registry.

### Runners

| Runner | Purpose |
|---|---|
| ai-lab/runner/run-asset.ts | CLI: run any single asset |
| ai-lab/runner/run-vst-fhi.ts | CLI: run VST + FHI in parallel |

### Asset Seeds
Location: ai-lab/assets/
- vst-seed.ts — Voyage Smart Travels asset definition
- fhi-seed.ts — Fraud Help Index asset definition

### Usage Example (POST /ai-lab/run)
```json
{
  "assetId": "vst",
  "assetName": "Voyage Smart Travels",
  "sources": [
    {
      "kind": "doc",
      "label": "VST Overview",
      "content": "..."
    }
  ],
  "pipelines": ["asset-extraction", "gap-risk-analysis", "build-output"]
}
```

### Usage Example (Deno CLI)
```sh
ANTHROPIC_API_KEY=sk-... deno run --allow-net --allow-env \
  ai-lab/runner/run-vst-fhi.ts --json
```

### Rules
- Operates OUTSIDE all product code (VST, FHI, BIAB, etc.)
- Does NOT modify or interfere with VST backend, FHI product logic, or any production API
- All outputs are structured, named, and pipeline-ready
- No vague responses — every output is typed and defined

---
Future modules added to this repository should be documented here with:
- Module name
- Endpoint path (if applicable)
- File location
- Purpose
- Example response or behavior
