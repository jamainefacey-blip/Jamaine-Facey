# VST Phase 2.2 — Gap Closure Report

**Date:** 2026-04-20
**Branch:** `claude/voyage-smart-travel-site-Wq7fZ`
**Status:** PHASE 2.2 SPEC COMPLETE — AWAITING IMPLEMENTATION APPROVAL
**Governance:** Governance Before Build applies. No public deployment until approved.

---

## 1. Gaps That Were Open

Going into Phase 2.2, the VST build had three architectural gaps that blocked progress toward investor demo readiness:

| # | Gap | Impact If Unresolved |
|---|-----|----------------------|
| G1 | No notification architecture defined | SOS, booking alerts, Pain Guard hand-offs had no delivery path. Safety liability. |
| G2 | No user profile schema | Tier system (GUEST/PREMIUM/VOYAGE_ELITE), GDPR compliance, and SOS contact storage had no canonical structure. |
| G3 | No fare API adapter design | VST was implicitly locked to a single fare provider with no fallback, no circuit breaker, no price-alert hook. |

---

## 2. Spec Files That Close Them

### G1 → `specs/vst-notification-spec.json`
**Unified Notification Architecture v1.0.0**

Closes the entire notification delivery gap. Defines the single notification layer for all VST event domains.

- **Stack:** OneSignal (push + in-app), Twilio (SMS, WhatsApp, Voice)
- **Event domains covered:** booking, sos, pain_guard, eco, community, account (38 event types)
- **Priority tiers:** P0_CRITICAL → P3_LOW with SLA targets and retry policies
- **SOS flow:** 6-step sequence with hard SLAs (push 2s → SMS traveller 3s → SMS contacts 5s → voice 65s → escalate 120s)
- **Pain Guard:** Handoff notifications target operators, not travellers
- **Channel routing:** Per-priority defaults + tier overrides (GUEST: push/in-app only; PREMIUM: +WhatsApp; VOYAGE_ELITE: +voice)
- **Consent/opt-out:** P0 (SOS) cannot be opted out — GDPR legitimate interest basis (PECR compliant)

### G2 → `specs/vst-user-profile-schema.json`
**User Profile Schema v1.0.0**

Closes the user data structure gap. Canonical schema for all user-facing and operator-facing profile data.

- **Route prefix:** `/v1/users/` (11 endpoints defined)
- **Tier system:** GUEST | PREMIUM | VOYAGE_ELITE with embedded capability map per tier
- **Identity:** email, phone (E.164), passport (sensitive), KYC reference, verification flags
- **Accessibility:** mobility, vision, hearing, cognitive, dietary — all marked sensitive
- **SOS contacts:** Up to 5 contacts; `consent_given` required per contact
- **Travel history:** Stats object + paginated endpoint reference
- **GDPR object:** consent_record (all consent types with timestamps + versions), lawful_basis per processing activity, data_retention states (ACTIVE/DORMANT/PENDING_ERASURE/ERASED), GDPR Arts 15–22 request log
- **Field visibility table:** owner_read, owner_write, admin_read, admin_write, service_account_read, public — defined for every field

### G3 → `specs/vst-fare-adapter-spec.json`
**Live Fare API Adapter Interface v1.0.0**

Closes the provider lock-in and fare reliability gap. Provider-agnostic adapter design with full fallback logic.

- **Provider evaluation:**
  - Amadeus — PRIMARY (p1 priority, p50=600ms, no polling required, richest data)
  - Skyscanner — SECONDARY (p2, p50=800ms, polling required, broad coverage)
  - Kiwi.com — TERTIARY (p3, p50=900ms, self-transfer strength, budget routes)
- **FareAdapter interface:** `search()` / `getProviderName()` / `healthCheck()` — all providers implement identically
- **FareRouter:** Sits in front of all adapters. Manages fallback chain `["amadeus", "skyscanner", "kiwi"]`
- **Fallback triggers:** 4xx (non-400), 5xx, timeout, empty results, schema mismatch, circuit breaker open
- **Circuit breaker:** 5 failures / 60s window → OPEN 30s → HALF_OPEN probe
- **Cache:** 5-min TTL, stale-while-revalidate 60s, bypass on final pricing
- **Fare alerts:** `BOOKING_FARE_ALERT_TRIGGERED` event wired into the notification layer (G1 linkage)

---

## 3. Key Decisions Locked

These decisions are locked in the specs and should not be revisited without a formal governance change:

| Decision | Rationale |
|----------|-----------|
| OneSignal for push + in-app (not Firebase) | Single SDK, cross-platform, in-app messaging included |
| Twilio for SMS/WhatsApp/Voice (not Vonage/Sinch) | Broadest API surface, TwiML voice, WhatsApp Business API in one account |
| P0_CRITICAL SOS cannot be opted out | GDPR Art. 6(1)(d) legitimate interest — safety of data subject |
| Amadeus as PRIMARY fare provider | Fastest p50, no polling, IATA-certified, richest ancillary data |
| Provider-agnostic FareAdapter interface before any provider integration | Prevents lock-in; allows swap without upstream code change |
| Circuit breaker before fallback (not retry-first) | Prevents cascading failures from a degraded provider |
| `/v1/users/` route prefix | Versioned from day one; non-breaking future schema evolution |
| `consent_given: true` required per SOS contact | Explicit consent for third-party data sharing; GDPR Art. 7 |
| Sensitive fields explicitly enumerated | Enables field-level encryption and audit log targeting |

---

## 4. Phase 2.2 Spec Completion Status

| Spec Area | Status | File |
|-----------|--------|------|
| Notification architecture | COMPLETE | `specs/vst-notification-spec.json` |
| User profile schema | COMPLETE | `specs/vst-user-profile-schema.json` |
| Fare adapter interface | COMPLETE | `specs/vst-fare-adapter-spec.json` |
| Ava Phase 6 intelligence layer | COMPLETE (implemented) | `js/ava-phase6.js` |
| Secure server-side API proxy | COMPLETE (implemented) | `server/vst-server.js`, `api/ava-evaluate.js` |
| Pain Guard UI + engine adapter | COMPLETE (implemented) | `pages/pain-control.js`, `js/pain-engine-adapter.js` |
| SPA routing + all pages | COMPLETE (implemented) | `js/router.js`, `pages/*` |
| Design system + token layer | COMPLETE (implemented) | `css/`, `js/components.js` |

**Phase 2.2 Spec Coverage: 100%** — All three open gaps are now closed with approved specs.

---

## 5. Next Build Priority — Investor Demo Readiness

The following gaps remain before VST can be shown to investors. Ranked by demo impact:

### Priority 1 — LIVE FARE SEARCH (Highest demo impact)
**What's missing:** No real flight prices. The Trip Request flow submits and Ava evaluates, but fare results come from Ava's estimate, not a live search.
**What's needed:** Implement `AmadeusAdapter` against `vst-fare-adapter-spec.json`. Wire fare results into the trip request result view.
**Demo risk if skipped:** Investors will ask "show me a real flight price" — currently impossible.

### Priority 2 — USER AUTHENTICATION + PROFILE API
**What's missing:** No login, no session, no persisted profile. All data is ephemeral per page load.
**What's needed:** Implement `/v1/users/` endpoints against `vst-user-profile-schema.json`. Add auth (JWT or session). Tier display on dashboard.
**Demo risk if skipped:** Cannot demonstrate PREMIUM vs VOYAGE_ELITE differentiation. No personalisation story.

### Priority 3 — NOTIFICATION DELIVERY (SOS + Booking)
**What's missing:** Notification spec exists but zero delivery is wired. SOS button on safety page has no backend path.
**What's needed:** Implement notification router against `vst-notification-spec.json`. Wire at minimum: `BOOKING_CONFIRMED` and `SOS_TRIGGERED`.
**Demo risk if skipped:** Safety/SOS is a key differentiator. Without a live demo of SOS notification, it reads as a mock feature.

### Priority 4 — BOOKING PERSISTENCE
**What's missing:** Trip request completes but no booking record is created or stored.
**What's needed:** POST `/v1/bookings/` endpoint. Booking confirmation state on dashboard.
**Demo risk if skipped:** The end-to-end flow breaks after Ava evaluation — no confirmation, no history.

### Priority 5 — ECO TRACKING DATA
**What's missing:** Carbon estimates come from Ava's static output. No real carbon calculation or badge system.
**What's needed:** Carbon calculation service. `ECO_MILESTONE_REACHED` notification hook.
**Demo risk if skipped:** Lower risk — eco is a supporting feature, not a core demo flow.

---

## 6. Recommended Next Session

> **Build Phase 3.1 — Fare Search Integration**
> Implement `AmadeusAdapter` (and stub `FareRouter`) against the approved `vst-fare-adapter-spec.json`.
> Wire into the Trip Request result view so real fares appear after Ava evaluation.
> This is the single highest-impact unbuilt feature for investor demo readiness.

---

*Report generated by Claude Code. All spec files committed at `906a45b`.*
