# Codespaces Baseline Notes

Lane: GOVERNANCE
Last updated: 2026-03-24

## Environment

| Service | Port | Start command |
|---------|------|---------------|
| VST (Next.js) | 3000 | `pnpm open:vst` |
| AI Lab (Node) | 4444 | `pnpm open:ai-lab` |

## Codespaces config

File: `.devcontainer/devcontainer.json`
Base image: `mcr.microsoft.com/devcontainers/javascript-node:18`
Post-create: `npm install -g pnpm && pnpm install`

## Baseline state

AI Lab baseline_v2 locked at commit e6a0552.
Protected files (do not modify without explicit approval):
- `tools/rehab-client/ai-lab/server.js`
- pipeline stages and routing logic in `tools/rehab-client/ai-lab/index.html`

## First-run checks

```bash
pnpm check:vst       # curl -I http://localhost:3000
pnpm check:ai-lab    # curl -I http://localhost:4444
```

## Audit log

Hook-generated session audit log: `/tmp/pain-system-audit.log`
This file is local to the session — not committed.
