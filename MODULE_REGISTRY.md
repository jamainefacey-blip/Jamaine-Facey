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
Future modules added to this repository should be documented here with:
- Module name
- Endpoint path (if applicable)
- File location
- Purpose
- Example response or behavior
