# AVACORE — MULTI-LLM ROUTER SPEC
# Pain System | AI_LAB Lane | GOVERNANCE Layer

---

## Version

`2.0.0` — 10-model router with auto-fallback chains

---

## Overview

AVACORE is the multi-LLM routing layer of the Pain System AI Lab. It selects the optimal model for each task type based on skill, complexity, lane, and priority. If the primary model fails, AVACORE executes an ordered fallback chain until a response is produced or the chain is exhausted.

---

## Model Registry

| ID | Model | Provider | Primary Task Types |
|----|-------|----------|--------------------|
| `claude` | Claude (Opus / Sonnet / Haiku) | Anthropic | Orchestration, analysis, build specs, pipeline control |
| `gpt4o` | GPT-4o | OpenAI | Multimodal tasks, structured output, document understanding |
| `gemini` | Gemini 1.5 Pro | Google | Long-context processing, large document ingestion |
| `grok` | Grok | xAI | Real-time data, live context, search-augmented tasks |
| `mistral` | Mistral Large | Mistral AI | European data residency tasks, multilingual content |
| `hermes3` | Hermes 3 | NousResearch | Agent routing, multi-step tool use, agentic orchestration |
| `mixtral` | Mixtral 8x7B | Mistral AI | Fast tasks, high-throughput batch, low-latency responses |
| `qwen` | Qwen 2.5 | Alibaba | Reasoning, function calling, structured tool invocation |
| `deepseek` | DeepSeek V3 | DeepSeek | Code generation, code review, debugging, refactoring |
| `llama` | Llama 3.3 70B | Meta | General tasks, summarisation, classification, fallback capacity |

---

## Task-Type Assignments

Each task type maps to a **primary model** and an ordered **fallback chain**.

### Orchestration & Pipeline Control

- **Primary:** `claude`
- **Fallback chain:** `gpt4o` → `gemini` → `llama`
- **Notes:** Pipeline sequencing, agent coordination, Pain System orchestrator runs

### Agent Routing & Multi-Step Tool Use

- **Primary:** `hermes3`
- **Fallback chain:** `claude` → `gpt4o` → `qwen`
- **Notes:** Agentic flows, tool-use chains, multi-hop decision trees

### Code Generation & Review

- **Primary:** `deepseek`
- **Fallback chain:** `claude` → `gpt4o` → `llama`
- **Notes:** TypeScript, Deno, Netlify Edge, Pain System modules

### Reasoning & Function Calling

- **Primary:** `qwen`
- **Fallback chain:** `claude` → `gpt4o` → `hermes3`
- **Notes:** Structured JSON output, typed function signatures, schema-bound responses

### Fast / High-Throughput Tasks

- **Primary:** `mixtral`
- **Fallback chain:** `llama` → `mistral` → `claude`
- **Notes:** Batch extraction, rapid classification, low-latency pipeline steps

### Long-Context / Document Ingestion

- **Primary:** `gemini`
- **Fallback chain:** `claude` → `gpt4o` → `llama`
- **Notes:** Assets > 100k chars, full codebase ingestion, large doc sets

### Multimodal & Structured Output

- **Primary:** `gpt4o`
- **Fallback chain:** `claude` → `gemini` → `llama`
- **Notes:** Image+text tasks, complex JSON schema generation, visual document parsing

### Real-Time / Search-Augmented Tasks

- **Primary:** `grok`
- **Fallback chain:** `gpt4o` → `claude` → `llama`
- **Notes:** Live data retrieval, current-events context, search-grounded answers

### Multilingual / Regional Tasks

- **Primary:** `mistral`
- **Fallback chain:** `gpt4o` → `claude` → `llama`
- **Notes:** EU data residency requirements, non-English content, GDPR-sensitive paths

### General / Fallback Capacity

- **Primary:** `llama`
- **Fallback chain:** `mistral` → `mixtral` → `claude`
- **Notes:** Catch-all tier, summarisation, classification, cost-sensitive paths

---

## Auto-Fallback Protocol

```
1. Primary model called with task payload
2. If primary returns error or timeout (> 10s):
   → Log failure: { model, taskType, error, timestamp }
   → Advance to next model in fallback chain
3. Repeat until:
   a. A model returns a valid response → SUCCESS
   b. Full chain exhausted → STATUS: BLOCKED
4. On BLOCKED:
   → Surface: taskType, primaryModel, chainTried[], lastError
   → Do not retry same chain again in same run
```

### Failure Log Schema

```json
{
  "runId": "<uuid>",
  "taskType": "<string>",
  "primaryModel": "<model-id>",
  "chainTried": ["<model-id>", "..."],
  "resolvedModel": "<model-id> | null",
  "status": "success | blocked",
  "failureReasons": [{ "model": "<id>", "error": "<string>", "at": "<iso-timestamp>" }],
  "resolvedAt": "<iso-timestamp>"
}
```

---

## Router Decision Rules

Evaluated in priority order:

| # | Condition | Routing Decision |
|---|-----------|-----------------|
| 1 | `retryAttempt > 0` | Use fallback chain for original taskType |
| 2 | `taskType` is explicitly set | Route to primary model for that taskType |
| 3 | `priority === "high"` + code skill | `deepseek` primary |
| 4 | `priority === "high"` + agent skill | `hermes3` primary |
| 5 | `priority === "high"` + general | `claude` primary |
| 6 | `sourceCharCount > 100,000` | `gemini` primary |
| 7 | `priority === "low"` or batch flag | `mixtral` primary |
| 8 | Default | `claude` primary |

---

## Complexity Tiers

| Tier | Models | Use Case |
|------|--------|----------|
| **Tier 1 — Core** | `claude`, `gpt4o`, `gemini` | Complex orchestration, high-value tasks |
| **Tier 2 — Specialist** | `hermes3`, `deepseek`, `qwen`, `grok` | Task-optimised routing |
| **Tier 3 — Fast / General** | `mixtral`, `mistral`, `llama` | Speed, volume, fallback capacity |

---

## Integration Points

| System | Integration |
|--------|-------------|
| `ai-lab/model-router.ts` | Existing Claude-tier router — AVACORE extends this, does not replace it |
| `ai-lab/orchestrator.ts` | Calls AVACORE router per pipeline stage |
| `ai-lab/config.ts` | `claudeModel` default remains for Claude-only pipelines |
| `ai-lab/audit_log.json` | AVACORE appends multi-model routing decisions here |
| `ai-lab/execution_log.json` | Per-task model selections logged here |

---

## Governance

- Lane: `AI_LAB`
- Baseline lock: `baseline_v2` (commit `e6a0552`) — pipeline, routing, action, and storage layers protected
- Any change to fallback chain order requires explicit approval
- Do not add models to this registry without updating the task-type assignment table
- Model IDs in this spec are canonical — use them exactly in code references

---

## Changelog

| Version | Date | Change |
|---------|------|--------|
| `1.0.0` | — | Initial Claude-only router (`local` / `external` / `fallback` tiers) |
| `2.0.0` | 2026-05-15 | AVACORE: 10-model registry, task-type assignments, auto-fallback chains |
