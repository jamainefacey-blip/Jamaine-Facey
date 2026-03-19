# Fraud Help Index — Project Audit

**Date:** 2026-03-19
**Branch:** `claude/audit-fhi-project-6OzcK`
**Commit:** `d2e93484a663e22941b00350aeaaea359020b59c`

---

## 1. SUMMARY

The repository (`Jamaine-Facey`) is currently a **Netlify Edge Functions sandbox** forked from Netlify's example repo. It hosts a "Pain System" platform concept with two sandbox tools: a health-check edge function and a rehab-client SPA. **No Fraud Help Index (FHI) code, schemas, routes, or UI exists yet.** The entire FHI platform must be built from scratch, but the existing Netlify infrastructure (edge functions, static hosting, SPA routing) provides a solid deployment foundation.

---

## 2. CURRENT PROJECT STATE

### What Exists Already
| Area | Status | Details |
|------|--------|---------|
| Netlify deployment pipeline | **Working** | `netlify.toml` configured, SPA fallback routing, edge functions wired |
| Edge function infrastructure | **Working** | 20+ example edge functions, custom `pain-system.ts` health endpoint |
| Rehab Client SPA | **Complete MVP** | Full static SPA with hash routing, mobile-first CSS, data-driven architecture |
| Module registry pattern | **Established** | `MODULE_REGISTRY.md` documents each tool/module consistently |
| Tool template | **Available** | `tools/tool-template/` provides scaffolding pattern for new modules |

### What Is Partially Built
- Nothing FHI-specific is partially built.

### What Is Missing (FHI-Specific)
- Fraud report intake form / submission flow
- Report data model / schema
- Evidence attachment structure
- Case categorization system (scam types, severity, status)
- Search / lookup interface
- Case detail view
- Moderation / admin panel
- User trust signals (vote, confirm, flag)
- API layer (edge functions for CRUD)
- Persistent storage integration
- Authentication / role separation (reporter vs moderator)

---

## 3. FILES / MODULES IDENTIFIED

### Reusable Infrastructure
| File/Dir | Reuse for FHI |
|----------|---------------|
| `netlify.toml` | Deployment config — will extend with FHI edge routes |
| `netlify/edge-functions/pain-system.ts` | Pattern for FHI API endpoints |
| `tools/rehab-client/` | SPA architecture pattern (hash routing, data modules, mobile-first CSS) |
| `tools/tool-template/` | Scaffolding for new FHI tool |
| `components/layout.js` | Shared layout if FHI integrates with top-level site |
| `MODULE_REGISTRY.md` | Will register FHI module here |

### FHI Modules to Create
| Module | Location (proposed) |
|--------|-------------------|
| FHI App Shell | `tools/fraud-help-index/index.html` |
| FHI Styles | `tools/fraud-help-index/styles/app.css` |
| FHI App Router | `tools/fraud-help-index/scripts/app.js` |
| Report Schema | `tools/fraud-help-index/scripts/data/schema.js` |
| Category Taxonomy | `tools/fraud-help-index/scripts/data/categories.js` |
| Seed/Demo Reports | `tools/fraud-help-index/scripts/data/reports.js` |
| FHI Edge API | `netlify/edge-functions/fhi-api.ts` |

---

## 4. MVP SCOPE PROPOSAL

### In Scope (MVP)
1. **Report Intake** — Multi-step form: scam type, description, evidence links, contact method, date of incident
2. **Category Taxonomy** — Predefined fraud categories (phishing, romance scam, investment fraud, identity theft, tech support scam, marketplace fraud, government impersonation, other)
3. **Report Data Model** — Structured JSON schema for each report (id, category, severity, status, description, evidence[], reporter metadata, timestamps)
4. **Case Feed / Browse** — Filterable list view of submitted reports (by category, date, status)
5. **Case Detail View** — Full report view with evidence, status badge, community trust signals
6. **Search / Lookup** — Text search across report titles, descriptions, scam identifiers (phone numbers, URLs, emails)
7. **Community Trust Signals** — "I experienced this too" confirmations + flag as inaccurate (local state MVP)
8. **Moderation Panel** — Admin view to review, approve, reject, or escalate reports; change status
9. **Static Data MVP** — localStorage-backed persistence (no backend DB for MVP — keeps it deployable on Netlify free tier)
10. **Mobile-First Responsive UI** — Following the rehab-client pattern

### Out of Scope (Post-MVP)
- User authentication / accounts
- Server-side database (Supabase, Fauna, etc.)
- File upload for evidence (MVP uses links only)
- Email notifications
- Public API
- Analytics dashboard
- Multi-language support

---

## 5. CRITICAL GAPS

| # | Gap | Severity | Resolution |
|---|-----|----------|------------|
| 1 | No FHI code exists at all | **Critical** | Full build required |
| 2 | No persistent storage layer | **High** | MVP uses localStorage; post-MVP adds external DB |
| 3 | No authentication | **Medium** | MVP uses role toggle (reporter/moderator) without login; post-MVP adds auth |
| 4 | No input sanitization library | **High** | Must sanitize all user input to prevent XSS in report content |
| 5 | No rate limiting on submissions | **Medium** | Edge function can add basic throttle; full solution post-MVP |
| 6 | `netlify.toml` publishes rehab-client as root | **High** | Must reconfigure or add path-based routing for FHI |

---

## 6. RECOMMENDED BUILD ORDER

```
Phase 1 — Foundation
  1.1  Create tools/fraud-help-index/ directory structure
  1.2  Define report data schema (scripts/data/schema.js)
  1.3  Define category taxonomy (scripts/data/categories.js)
  1.4  Create seed/demo reports (scripts/data/reports.js)

Phase 2 — App Shell + Core UI
  2.1  Build index.html app shell (mobile-first, hash routing)
  2.2  Build styles/app.css (design system, components)
  2.3  Build scripts/app.js (SPA router, view renderer)

Phase 3 — Report Flow
  3.1  Report intake form (multi-step, validation, category selection)
  3.2  localStorage persistence layer (save/load/query reports)
  3.3  Case feed / browse view (list, filter by category/status)
  3.4  Case detail view (full report, evidence, status)

Phase 4 — Search + Trust
  4.1  Search / lookup (text match against reports)
  4.2  Community trust signals ("me too" confirm, flag)

Phase 5 — Moderation
  5.1  Moderation panel (review queue, approve/reject/escalate)
  5.2  Role toggle (reporter vs moderator mode)
  5.3  Report status lifecycle (submitted → under review → confirmed → resolved)

Phase 6 — Edge API + Polish
  6.1  FHI status edge function (health check)
  6.2  Update netlify.toml with FHI routing
  6.3  Update MODULE_REGISTRY.md
  6.4  Input sanitization pass (XSS prevention)
  6.5  Final QA and deploy test
```

---

## 7. RISKS / BLOCKERS

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | `netlify.toml` publish dir is `tools/rehab-client` — FHI cannot be root simultaneously | **Blocker** | Reconfigure to publish a shared root, or use path-based deploy with redirects |
| 2 | localStorage has ~5MB limit — large report volumes will hit ceiling | **Medium** | Acceptable for MVP demo; post-MVP migrates to external DB |
| 3 | No server-side validation — client-only data can be spoofed | **Medium** | Acceptable for MVP; edge function API adds validation post-MVP |
| 4 | XSS via user-submitted report content | **High** | Sanitize all rendered content; escape HTML in report text fields |
| 5 | No backup/export for localStorage data | **Low** | Add JSON export button in moderation panel |

---

## 8. EXACT BRANCH / COMMIT HASH

- **Branch:** `claude/audit-fhi-project-6OzcK`
- **Base Commit:** `d2e93484a663e22941b00350aeaaea359020b59c`
- **Remote:** `origin` → `jamainefacey-blip/Jamaine-Facey`
