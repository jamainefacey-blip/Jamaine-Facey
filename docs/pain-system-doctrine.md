# Pain System — Platform Doctrine

**Version:** 1.0
**Last updated:** 2026-03-16
**Purpose:** Permanent platform doctrine for Claude-assisted development. Defines the vision, layered architecture, and long-term direction of the Pain System ecosystem. Read alongside `docs/pain-build-constitution.md` before executing any development task.

---

## Section 1 — Pain System Vision

The Pain System is a modular platform designed to build digital tools, apps, and systems that empower individuals, businesses, and communities to take control of their health, operations, and daily lives.

The platform is not a single product. It is an ecosystem of independent but interoperable applications, each built on shared engineering principles that make them portable, maintainable, and composable over time.

### Core principles

| Principle | Meaning |
|---|---|
| **Modular architecture** | Each application is a self-contained unit. Components, data layers, and UIs can be replaced or extended without rebuilding the whole system. |
| **Portable systems** | Every application must be deployable from a plain file system, a static host, or a minimal server. No proprietary runtime required. |
| **Minimal vendor lock-in** | No dependency on a single cloud provider, database vendor, or framework. Standards-based technologies (HTML, CSS, plain JavaScript, git) are preferred at every layer. |
| **Reusable engines** | Core logic — data loaders, routing systems, exercise libraries, design tokens — is written once and shared across applications where appropriate. |
| **AI-assisted development** | Claude operates as a disciplined development partner. All AI-assisted work follows the checkpoint protocol in `docs/pain-build-constitution.md`. |

---

## Section 2 — Platform Layers

The Pain System is organised into two layers: core infrastructure and the application layer.

```
┌───────────────────────────────────────────────────────────┐
│                     Pain System (umbrella)                │
├───────────────────────────────────────────────────────────┤
│                     Core Infrastructure                   │
│                                                           │
│   Pain Portal     AI Lab     Builder Systems    Governance│
├───────────────────────────────────────────────────────────┤
│                     Application Layer                     │
│                                                           │
│  Rehab / PT    Accessibility    Travel    Business-in-a-  │
│  Systems       Platforms        Systems   Box Tools       │
│                                                           │
│  + Other vertical applications as the platform grows     │
└───────────────────────────────────────────────────────────┘
```

### Core infrastructure

| Component | Role |
|---|---|
| **Pain Portal** | Central hub for navigating Pain System applications, user accounts, and platform-level settings. |
| **AI Lab** | Experimental environment for testing AI-assisted tools, coaching assistants, and generative workflows before they graduate to production applications. |
| **Builder Systems** | Internal tooling, CLI utilities, and scaffolding systems used to create and maintain Pain System applications. |
| **Governance Layer** | Standards, constitutions, and doctrine documents (this file, `pain-build-constitution.md`) that define how the platform is built and extended. |

### Application layer

| Application type | Purpose |
|---|---|
| **Rehab / PT systems** | Rehabilitation, injury recovery, client monitoring, and clinical coaching. Current application: `mrpainpt/`. |
| **Accessibility platforms** | Tools designed to support users with disabilities or accessibility needs in navigating health and community services. |
| **Travel systems** | Itinerary management, accessible travel planning, and trip-support tools built on the same file-driven, portable principles. |
| **Business-in-a-box tools** | Lightweight, deployable business management systems for small operators who need portable, low-infrastructure tooling. |
| **Other vertical applications** | Any domain-specific application that adopts Pain System architecture principles and integrates with the core infrastructure layer. |

---

## Section 3 — Application Philosophy

Every application built inside the Pain System ecosystem must conform to the following properties. These are not suggestions — they are architectural requirements.

### Required properties

**Modular**
Internal components (data loaders, view renderers, routing systems) must be separable units. A change to the data layer must not require a change to the view layer. A change to the routing system must not require a change to the data model.

**Portable**
An application must be deployable with minimal infrastructure. The target baseline is: a folder of files served over HTTPS. Server-side runtimes, databases, and build pipelines are additions, not prerequisites.

**File-driven when possible**
Data that does not require real-time mutation should live in versioned files. Files are readable by any tool, diffable by git, and require no running service to access. This is the default data strategy for Phase 3 applications.

**Able to run independently**
Each application must function as a standalone unit. It must not require another Pain System application to be running in order to operate. Integration points are optional additions, not hard dependencies.

**Able to integrate into the wider Pain System ecosystem**
When an application needs to communicate with other platform components (authentication, shared data, analytics), it must do so through defined API contracts — not by importing internals from another application's directory.

---

## Section 4 — Current Application: Rehab Platform

The current production application within the Pain System is the rehabilitation and coaching platform, located at `mrpainpt/`.

### Purpose

A rehabilitation and coaching system designed for injury recovery, client monitoring, and clinical training. Delivered as two separate SPAs that share a canonical data layer but operate independently.

### Main components

| Component | Path | Audience |
|---|---|---|
| **Client App** | `mrpainpt/apps/client/` | The patient or rehab client completing their programme |
| **Coach Portal** | `mrpainpt/apps/coach/` | The physiotherapist or coach monitoring and directing care |
| **Canonical client data** | `mrpainpt/clients/<slug>/` | Source of truth for all client configuration, rehab plans, and coach notes |
| **Exercise library** | `mrpainpt/packages/exercise-library/` | Shared canonical set of exercises referenced by all client plans |

### Data architecture summary

```
mrpainpt/clients/<slug>/client.config.js   → CLIENT_CONFIG   (profile, goals, notes)
mrpainpt/clients/<slug>/plan.js            → REHAB_PLAN      (phases, weeks, sessions)
mrpainpt/packages/exercise-library/index.js → EXERCISE_LIBRARY (shared exercises)
```

All data is stored in versioned JS files. There is no database. Every change to client data is a git commit. Full history is preserved at zero infrastructure cost.

For full architectural rules governing the rehab platform, see `docs/pain-build-constitution.md`.

---

## Section 5 — Design Philosophy

Every tool built on the Pain System must make deliberate trade-offs in favour of the following properties.

### Priority order

1. **Clarity over feature clutter**
   A tool that does five things well is more valuable than a tool that does twenty things adequately. Each feature must justify its presence by solving a clearly defined user need. Generic engagement mechanics (streaks, badges, social feeds) are not features — they are distractions from the clinical or operational purpose of the tool.

2. **Clinical usefulness**
   For health-related applications, the primary question is: does this help the clinician or the patient make a better decision? Data that does not inform a decision should not be displayed. Data that does inform a decision must be immediately legible — not hidden behind a modal, a settings page, or a premium tier.

3. **Portability**
   A tool that locks its users into a single vendor, hosting environment, or data format creates a liability. Every design decision that trades portability for convenience must be explicitly justified and recorded.

4. **Low infrastructure complexity**
   The maintenance burden of a system grows with its infrastructure footprint. A static SPA that reads from git files requires no on-call rotation, no database backup strategy, and no deployment pipeline. Where these are truly required, they must be introduced deliberately, not by default.

5. **Minimal dependencies**
   Every external dependency is a future maintenance obligation. Dependencies must be chosen for their long-term stability and their alignment with platform principles. Framework lock-in (React, Vue, Angular) is incompatible with the portability requirement. Prefer the platform (HTML, CSS, the DOM API) over a library whenever the platform is sufficient.

---

## Section 6 — Future Platform Direction

The Pain System is designed to grow in defined phases. Each phase extends the platform without requiring a rewrite of earlier work. The architecture at each phase must remain backward-compatible with the phase before it.

### Planned future phases

| Phase | Focus |
|---|---|
| **API layer** | Replace the Phase 3 file-driven data layer with a thin server API (`loadClient()` becomes a `fetch()` call). All view files remain unchanged — this is the drop-in replacement contract defined in `pain-build-constitution.md` Section 7. |
| **Authentication** | Session-based or JWT authentication added to the coach portal and any future multi-user Pain System applications. |
| **Persistence layer** | Server-side database for data that requires real-time mutation (live session logging, in-session pain tracking, coach note writes without a git commit). |
| **AI-assisted coaching tools** | Claude-powered tools integrated into the coach portal: plan generation, session note summarisation, pain trend interpretation, and exercise prescription assistance. Governed by the AI Lab before promotion to production. |
| **White-label deployment** | Configurable branding, custom domains, and per-client deployment packages for third-party physiotherapy practices and health operators who want to run a Pain System application under their own identity. |

### Platform growth constraint

No future phase may introduce a change that breaks a Phase 3 application's ability to run in its Phase 3 configuration. Existing deployments must continue to work. New capabilities are additions; they do not replace or disable earlier ones.

---

## Section 7 — Claude's Role

Claude participates in Pain System development as a disciplined engineering partner with a defined operating mandate.

### Operating roles

| Role | Behaviour |
|---|---|
| **Disciplined software engineer** | Writes code that conforms to the platform's architecture principles. Does not introduce unnecessary abstractions, external dependencies, or deviations from the established patterns. |
| **System architect assistant** | Helps reason about structural decisions, data model changes, and integration points. Flags architectural risks before implementing changes that could violate platform doctrine. |
| **Checkpoint-driven builder** | All development work is executed in numbered checkpoints with a defined file scope. Claude does not begin the next checkpoint without explicit approval. It does not create files outside the checkpoint scope. |
| **Guardian of the architecture** | Refuses to make silent changes to protected files. Reports conflicts before acting. Confirms `git diff` before every commit. Runs Node.js `vm.createContext()` verification before committing any script. |

### Mandatory pre-task requirement

Before executing any development task, Claude must read:

```
docs/pain-build-constitution.md
```

The constitution is the authoritative source for all architectural rules, protected paths, script load order, and checkpoint protocol. This doctrine document provides strategic context. The constitution provides operational rules. Both must be read together.

### Behaviour Claude must never exhibit

- Modifying protected files without explicit checkpoint instruction
- Creating files outside the scope defined by the active checkpoint
- Introducing an external CDN dependency, build pipeline, or framework
- Making a `git push --force` or amending a previous commit without explicit user instruction
- Beginning the next checkpoint before receiving approval
- Skipping verification (Node.js vm test + git diff) before committing

---

*End of doctrine.*
