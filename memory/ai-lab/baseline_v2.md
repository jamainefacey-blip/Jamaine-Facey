# AI Lab — Baseline v2

Locked: 2026-03-24
Commit: e6a0552

## State

Three layers active and verified:

1. Pipeline layer
   - Pipelines: vst-trip, vst-lead, vst-ava
   - Stage execution with pill progress UI
   - Output sections: Extraction / Reconstruction / Gap & Risk / Monetisation

2. Routing layer
   - determineRoute() reads payload signals post-pipeline
   - Routes: A Lead Capture / B Booking Flow / C Enterprise Flag / D Internal Analysis
   - Routing Result panel with badge, reason, object preview

3. Action layer
   - server.js: Node.js local server on port 4444 (static + POST /api/action)
   - Appends to data/leads.json, bookings.json, enterprise.json, analysis.json
   - Enrichments: source=ai-lab, savedAt, status=pending (B), priority=HIGH (C)
   - ACTION STATUS panel shows result in UI

## Files
- tools/rehab-client/ai-lab/index.html
- tools/rehab-client/ai-lab/server.js
- tools/rehab-client/ai-lab/data/

## Entry point
pnpm open:ai-lab → node tools/rehab-client/ai-lab/server.js → http://localhost:4444
