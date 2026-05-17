# Round Table Council — Pain System Governance

The Council is the governing body of the Pain System. It must convene before every build, deployment, or system change. No action proceeds without quorum and sign-off.

---

## Quorum Requirement

Minimum 4 of 6 seats must sign off before any of the following proceed:

- New build or compile step
- Deployment to any environment (dev / staging / production)
- Schema or database migration
- API contract change (breaking or additive)
- Security policy or access control change
- Addition of new external dependencies

---

## Seats

### Seat 1 — Mr Pain (Chair)
**Role:** Founder and ultimate authority. Sets mission direction and resolves deadlocked votes.

**Responsibilities:**
- Holds final say on product vision and feature scope
- Approves or rejects changes that alter the Pain System identity or core offering
- Convenes emergency sessions when critical failures occur

**Veto Rights:** Absolute veto on any change to system identity, mission, or brand

**Sign-off Criteria:** Confirms the proposed change aligns with Pain System mission and does not regress established vision

---

### Seat 2 — Architect
**Role:** Technical design authority. Owns system design, API contracts, and integration patterns.

**Responsibilities:**
- Reviews and approves architecture decisions
- Validates that new modules do not create technical debt or break existing contracts
- Maintains the canonical system diagram and dependency map

**Veto Rights:** Veto on changes that violate architectural principles or introduce unreviewed external dependencies

**Sign-off Criteria:** Technical design reviewed, dependency graph clean, no circular imports, contract versioning upheld

---

### Seat 3 — Security Officer
**Role:** Security and compliance authority. No code ships without security clearance.

**Responsibilities:**
- Applies the 47-point security validation checklist to every proposed change
- Reviews authentication, authorisation, input validation, and secret handling
- Flags and blocks changes that introduce OWASP Top 10 vulnerabilities

**Veto Rights:** Hard veto on any change failing the security checklist. Veto cannot be overridden by other seats.

**Sign-off Criteria:**
- 47-point security checklist passes
- No secrets in source
- Auth/authz paths validated
- Input sanitisation confirmed
- Rate limiting and abuse vectors reviewed

---

### Seat 4 — Builder
**Role:** Implementation authority. Owns code quality, test coverage, and build pipelines.

**Responsibilities:**
- Ensures all changes have appropriate test coverage before merge
- Validates CI/CD pipeline integrity
- Reviews code for correctness, performance, and maintainability

**Veto Rights:** Veto on changes with no tests, broken builds, or unresolved lint errors

**Sign-off Criteria:** Build passes, tests green, no regressions, code review complete

---

### Seat 5 — Governance Keeper
**Role:** Process and documentation authority. Owns the council process itself.

**Responsibilities:**
- Ensures this charter and all governance documents are current and followed
- Records council decisions and maintains the change log
- Flags process violations and calls for re-convening when protocol is bypassed

**Veto Rights:** Veto on changes that bypass the convening requirement or lack required documentation

**Sign-off Criteria:** Change is documented, rationale recorded, relevant PROJECT_STATE files updated, CLAUDE.md context current

---

### Seat 6 — Operator
**Role:** Operational authority. Owns runtime environment, infrastructure, and incident response.

**Responsibilities:**
- Reviews deployment targets and environment configuration
- Confirms environment variables and secrets are correctly provisioned (never in code)
- Owns rollback plans and incident runbooks

**Veto Rights:** Veto on deployments targeting misconfigured environments or lacking rollback plans

**Sign-off Criteria:** Environment validated, secrets confirmed out-of-band, rollback plan documented, monitoring in place

---

## Convening Protocol

1. **Trigger** — Any build, deploy, or system change triggers a mandatory council session.
2. **Briefing** — The proposing party submits a change brief: what, why, scope, risk.
3. **Security review** — Security Officer runs the 47-point checklist first. If it fails, the session ends.
4. **Seat review** — Each seat reviews within their domain and records sign-off or veto.
5. **Quorum check** — Governance Keeper confirms 4+ sign-offs with no active vetoes.
6. **Proceed or block** — If quorum is met: change proceeds. If vetoed: change is blocked until the vetoing seat's criteria are satisfied.
7. **Record** — Governance Keeper logs the outcome in the relevant PROJECT_STATE file.

---

## Veto Resolution

A veto blocks the change until the vetoing seat's sign-off criteria are met. Only the vetoing seat can lift its own veto. Mr Pain may call an emergency override only in cases of critical production incident, and only with all other 5 seats notified.

---

## Amendment

This charter may only be amended with sign-off from all 6 seats.

_Last amended: 2026-05-17_
