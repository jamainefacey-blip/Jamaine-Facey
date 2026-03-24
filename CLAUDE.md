# PAIN SYSTEM — CLAUDE CODE CONTROL

## Identity
This repository contains multiple lanes. Do not mix them.

### Allowed lanes
- VST = Voyage Smart Travels
- AI_LAB = AI Lab orchestration panel
- FHI = Fraud Help Index
- ADMIN = Pain System admin/control layer
- BACKYARD = sandbox/prototype lane

If a task belongs to a different lane, reject it.

## Token discipline
- Do not restate instructions
- Do not explain reasoning unless asked
- Do not narrate steps
- Use minimal tokens
- Prefer editing files over long prose
- Return compact outputs only

## Execution rule
Build -> test -> fix -> retest -> pass

## Retry limits
- Max 2 fix cycles
- Fail fast if a command hangs or blocks

## Output format
STATUS:
FILES:
RESULT:
TESTS:
NEXT:

## Rules
- No scope expansion
- No redesign unless explicitly requested
- Do not change unrelated files
