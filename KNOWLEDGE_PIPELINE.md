# PAIN SYSTEM — KNOWLEDGE PIPELINE
# How information flows between systems

Last updated: 2026-06-02
Owner: All agents — update when pipeline changes

---

## ONE TRUTH ACTIVATION FLOW

```
STEP 1: CODE CHANGE
  Developer / Agent
  → Git commit to jamainefacey-blip/Jamaine-Facey
  → Push to branch

STEP 2: RUNTIME TRUTH UPDATE (mandatory at every session boundary)
  Agent
  → Update governance/RUNTIME_TRUTH.md
  → Record: what changed, what is live, what is blocked, evidence used
  → Commit and push

STEP 3: HANDOFF UPDATE (mandatory at every session boundary)
  Agent
  → Update governance/HANDOFF.md
  → Record: session summary, blockers, next action, open tasks
  → Commit and push

STEP 4: OBSIDIAN SYNC (operator action — manual until bridge is built)
  Operator
  → Pull from GitHub
  → Copy updated governance/ files to Obsidian SYSTEM/ folder
  → OR: use Local REST API bridge when configured (see OBSIDIAN_LINK_STATUS.md)

STEP 5: AVA CONSULTATION (when pipeline produces a decision)
  Operator / AI Lab
  → Run /ai-lab/run with asset input
  → Receive: ExtractedSystem, GapRiskReport, BuildSpec
  → Route via A/B/C/D

STEP 6: DECISION QUEUE (founder action layer)
  Operator
  → Review governance/QUEUE.md
  → Clear or escalate items
  → Document decision in governance/RUNTIME_TRUTH.md

STEP 7: AGENT EXECUTION (Claude / Codex / Dispatch)
  Agent receives task
  → Reads governance/RUNTIME_TRUTH.md FIRST (mandatory)
  → Reads governance/ACTIVE_TASK.md
  → Reads governance/QUEUE.md
  → Executes within declared lane
  → Returns to STEP 2
```

---

## SOURCE AUTHORITY — CONFLICT RESOLUTION

When two sources disagree, resolve using this priority order:

| Priority | Source | Beats |
|---|---|---|
| 1 | Live system probe (HTTP response, git status) | Everything |
| 2 | governance/RUNTIME_TRUTH.md | All documents |
| 3 | PAIN_SYSTEM_MASTER_ARCHITECTURE.md | Obsidian, memory/ files |
| 4 | GitHub committed code | Obsidian, local files |
| 5 | Obsidian vault | Agent memory, assumptions |
| 6 | Agent inference | Nothing — must be labelled ASSUMED |

**Rule:** If a source conflict exists, the higher-priority source wins. The lower-priority source must be updated to match.

---

## INFORMATION CLASSIFICATION

Every piece of system state must be labelled:

| Label | Meaning | Required action |
|---|---|---|
| VERIFIED | Confirmed by live probe, git log, or direct file read this session | None — use as-is |
| INFERRED | Consistent with evidence but not directly confirmed | Note inference, seek verification |
| ASSUMED | No evidence — logical guess | Label clearly, do not act on as fact |
| UNVERIFIED | Referenced but never checked | Block-until-verified before depending on it |

---

## SESSION DISCIPLINE — MANDATORY END-OF-SESSION CHECKLIST

Every agent session MUST complete before exit:

```
[ ] governance/RUNTIME_TRUTH.md updated with verified facts from this session
[ ] governance/HANDOFF.md updated with session summary and next action
[ ] governance/ACTIVE_TASK.md updated with current task status
[ ] governance/QUEUE.md updated with any new blockers or completed items
[ ] All changes committed and pushed to designated branch
[ ] Blockers documented with exact operator action required
[ ] Evidence cited for every status claim
[ ] Unverified items labelled UNVERIFIED
```

---

## AGENT ACCOUNTABILITY — MANDATORY REPORT FIELDS

Every future agent report MUST include:

```
AGENTS USED:       [list]
AGENTS NOT USED:   [list with reason]
SKILLS USED:       [list]
EVIDENCE:          [probe results, file reads, git log entries]
FILES INSPECTED:   [paths]
FILES CHANGED:     [paths]
VALIDATION:        [what was tested and how]
STILL UNVERIFIED:  [what remains unknown]
```

---

## KNOWLEDGE GAP REGISTER

Current gaps preventing full pipeline operation:

| Gap | Impact | Operator action required |
|---|---|---|
| SUPABASE_SERVICE_ROLE_KEY absent from Vercel env | VST database dead — 0 tables, no auth path | Add to Vercel Project Settings → Environment Variables |
| Obsidian Local REST API not configured | All agent insights lost at session boundary | Enable Obsidian plugin, document vault path |
| AVACORE has no live endpoint | Router built but unreachable | Create Lambda or Edge Function calling routeAvacore() |
| FHI code does not exist | tools/rehab-client/fhi/ empty | Operator to declare FHI scope and initiate build |
| Dispatch code does not exist | System referenced but has no implementation | Operator to declare Dispatch architecture |
| Pain Business OS has no code | System referenced but has no implementation | Operator to declare Pain Business OS scope |
| Two Vercel projects — canonical not declared | Deployment risk | Operator to declare which project is production |
| PR #22 open | Founder 401 access path blocked | Review and merge or close PR #22 |
| Root api/run-migrations.js + vercel.json functions block | Technical debt on main | Agent to clean up after migrations confirmed |
| SESSION_BOOT.md does not exist in repo | Every session starts cold with no bootstrap | Create governance/SESSION_BOOT.md |
| SYSTEM_MAP.md does not exist in repo | No topology reference for agents | Create governance/SYSTEM_MAP.md |

---

## PIPELINE STATUS

| Pipeline | Status |
|---|---|
| GitHub → RUNTIME_TRUTH | CREATED this session — operational |
| RUNTIME_TRUTH → HANDOFF | CREATED this session — operational |
| HANDOFF → Obsidian | MANUAL — no automated bridge |
| Obsidian → Agent | BLOCKED — no Local REST API |
| AVA → Decision Queue | OPERATIONAL (local only) |
| AVACORE → Any endpoint | BLOCKED — no live endpoint |
| VST Lambda → Supabase | BLOCKED — no credentials in env |
| GitHub → Vercel Deploy | OPERATIONAL |
