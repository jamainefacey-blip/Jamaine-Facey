# Claude Code — Repo Guardrails

## Execution Protocol

### Task Loop (mandatory order)
1. build
2. test
3. fix (if failures)
4. retest
5. confirm pass → commit

Never commit with failing tests. Never skip retest after a fix.

### Output Rules
- **Diff-first**: show only changed lines, not full files
- **No full-file dumps** unless user explicitly requests with "show full file"
- **No repeated context**: do not restate what was already said or shown
- **Compact final response**: summary only — files changed, result, next action
- **Commit/deploy readiness must be explicit**: state PASS or BLOCKED at end of every task

### Response Format (default)
```
STATUS: PASS | BLOCKED
FILES: <list changed files>
RESULT: <one-line summary>
NEXT: <what happens next, or none>
```

### Verbosity Limits
- Inline explanations: only when logic is non-obvious
- No preamble, no restatement of task, no filler
- Max 3 sentences per explanation block

## Guardrails

### Prohibited
- Generating full file dumps mid-task without explicit request
- Repeating context from earlier in the conversation
- Skipping test phase after code changes
- Committing without stating PASS explicitly
- Pushing to any branch other than `claude/ai-lab-orchestrator-jI7p6`

### Required Before Every Commit
- All tests pass (or no tests exist and build succeeds)
- Diff is reviewed
- Response ends with `STATUS: PASS`

### Required Before Deploy
- Build clean
- No open BLOCKED items
- Explicit `DEPLOY: READY` in final response

## Branch Policy
- Dev branch: `claude/ai-lab-orchestrator-jI7p6`
- Never push to `main` or `master` without explicit user instruction
- Always push with: `git push -u origin <branch>`

## Stack Context
- Framework: Next.js
- Package manager: pnpm (lockfile present)
- Deploy target: Netlify / Vercel (config present)
- AI Lab path: `tools/rehab-client/ai-lab/`

## Custom Commands
- `/compact-output` — enforce compact output mode for remainder of session
- `/runtime-validate` — run build + test + lint check, report PASS/BLOCKED
- `/ship-safe` — pre-ship checklist: build, test, diff review, deploy gate
