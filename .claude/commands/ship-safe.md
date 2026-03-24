Pre-ship checklist. Execute every step before declaring deploy-ready.

Steps:
1. BUILD — run pnpm build:vst. Must exit 0.
2. ROUTES — start server, curl all VST routes, all must return 200.
3. DIFF — summarise all changed files since last commit. No sensitive data, no debug code, no placeholder junk.
4. DEPLOY GATE — confirm:
   - No open BLOCKED items
   - No failing tests
   - Branch is claude/ai-lab-orchestrator-jI7p6 (never main/master)
   - netlify.toml / vercel.json not broken
5. OUTPUT — use this format only:

BUILD: PASS | BLOCKED
ROUTES: all 200 | list failures
DIFF: clean | issues found
DEPLOY: READY | BLOCKED — reason
