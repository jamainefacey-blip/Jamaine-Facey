# PAIN SYSTEM — CLAUDE CODE CONTROL v2
# Behaviour Enforcement Layer

---

## IDENTITY

This repository contains multiple lanes. Do not mix them.

### Allowed lanes
- VST = Voyage Smart Travels
- AI_LAB = AI Lab orchestration panel
- FHI = Fraud Help Index
- ADMIN = Pain System admin/control layer
- BACKYARD = sandbox/prototype lane
- GOVERNANCE = rules, memory, control layer

If a task belongs to a lane not listed above, reject it.
If a task spans lanes without explicit permission, reject it.

---

## EXECUTION RULES

### Workflow — mandatory order
1. Build
2. Test
3. Fix (max 2 cycles)
4. Retest
5. Pass — only then return output

Do not return output before pass. Do not skip steps.

### Execution over explanation
- Write code, not descriptions of code
- Edit files, do not quote them back
- If blocked, state the blocker — do not speculate around it

### Retry limits
- Max 2 fix cycles per task
- If not resolved after 2 cycles: STOP, return BLOCKED status, state exact failure

### Fail fast
- If a command hangs or blocks after 10s: kill it, log it, move on
- Do not retry a hanging command more than once

---

## OUTPUT CONTRACT

Every response to a task MUST use this exact structure. No exceptions.

```
STATUS:   COMPLETE | BLOCKED | PARTIAL | FAIL
FILES:    list of files changed (path only, one per line)
RESULT:   what was done — verified facts only
TESTS:    what was run and what passed/failed
NEXT:     one concrete next action, or NONE
```

### Rules
- STATUS must be one of the four values above — no free text
- FILES must list only files actually changed in this response
- RESULT must contain only verified output — no predictions, no assumptions
- TESTS must reference actual commands run or checks performed
- NEXT must be a single actionable item, not a list
- If a section has nothing to report: write the key with a dash (`FILES: —`)

---

## TOKEN DISCIPLINE

- Do not restate instructions
- Do not explain reasoning unless explicitly asked
- Do not narrate steps
- Do not add preamble or closing remarks
- Use minimal tokens
- Prefer editing files over prose
- One sentence per point — never pad

---

## MONETISATION AWARENESS

When output touches AI_LAB or VST:
- Note route type if routing layer fired (A / B / C / D)
- Flag any output that has commercial value or escalation potential
- Do not suppress HIGH VALUE tags — surface them in RESULT

---

## NO SPECULATIVE OUTPUT

- Do not predict future behaviour
- Do not describe what "should" happen — only what did happen
- If something is unknown, write: `UNKNOWN: <what is unknown>`
- Do not fill gaps with assumptions

---

## SYSTEM PROTECTION

### Baseline lock
- baseline_v2 (commit e6a0552) is the protected AI Lab state
- Do not modify: pipeline stages, routing logic, action layer, server.js write logic
- Any task that would break baseline_v2 must be rejected or explicitly approved

### File protection
- Do not change unrelated files
- Do not refactor working code unless the task explicitly says so
- Do not delete files without explicit instruction

### No scope expansion
- Do not add features not requested
- Do not redesign unless explicitly requested
- Scope is exactly what the task states — nothing more

---

## FAIL CONDITIONS

Stop immediately and return `STATUS: FAIL` if any of the following occur:

| # | Condition |
|---|-----------|
| F1 | A command fails twice with the same error |
| F2 | A test cannot be run (missing dependency, wrong env) |
| F3 | A change would modify a baseline-locked file without approval |
| F4 | Task requires mixing lanes without explicit permission |
| F5 | Output cannot be verified (no test, no log, no observable result) |
| F6 | Fix cycle limit (2) reached without passing tests |
| F7 | A file write would overwrite data (not append) in data/ stores |
| F8 | Task specifies a layer and a modification targets a different layer |

On FAIL: state condition number + exact reason. Do not attempt workarounds.

---

## SCOPE LOCK

If a task specifies a layer (UI / PIPELINE / ROUTING / ACTION / STORAGE):
- ONLY that layer may be modified
- Any cross-layer modification = F8

Forbidden without explicit instruction:
- .gitignore changes
- file tracking changes
- storage behaviour changes
- repo structure changes

If uncertain → STOP and ask. Never assume optimisation permission.

---

## EXECUTION MODE SWITCHES

Declare mode at start of task if non-default.

### BUILD (default)
- Write or modify code to meet spec
- Follow full build → test → fix → retest → pass cycle
- Return OUTPUT CONTRACT on completion

### DEBUG
- Diagnose only — do not change logic
- Identify root cause with evidence (log lines, file refs, line numbers)
- Return: root cause + affected files + recommended fix (no code written unless asked)

### AUDIT
- Read-only inspection of a system or file set
- List findings only — no changes
- Flag: broken contracts, missing tests, baseline violations, security issues
- Return OUTPUT CONTRACT with RESULT = findings list

### DEPLOY
- Push verified build to target branch
- Confirm: branch, commit hash, files pushed
- Do not push unverified or partial builds
- Return OUTPUT CONTRACT with FILES = pushed files, RESULT = confirmed commit

---

## MEMORY REFERENCES

| File | Purpose |
|------|---------|
| `memory/vst/decisions.md` | VST system decisions |
| `memory/vst/flows.md` | VST pipeline flows |
| `memory/ai-lab/baseline_v2.md` | AI Lab locked baseline |
| `PRIMER.md` | Lane and port reference |
