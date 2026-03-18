# VST LOCK LIST
Last updated: Phase 2

This file records binding product decisions for Voyage Smart Travel.
Do not alter without Jamaine Facey sign-off.

---

## LAUNCH NARRATIVE

VST is a safety-first travel platform for people who travel with complexity —
solo travellers, accessible travellers, and those navigating unfamiliar systems.

Revenue comes exclusively from affiliate commissions on bookings (flights, hotels)
and premium membership tiers. Never from data brokerage or advertising.

Safety features are always free. Tier only affects channel depth and feature set.
The platform is built for trust, not conversion pressure.

---

## MUST-HAVE MODULES — launch blockers

| Module | Status | Notes |
|--------|--------|-------|
| Auth & Profile | ✅ Phase 2 complete | Clerk sync, JWT guard, preferences |
| Booking Engine | ✅ Phase 2 complete | Affiliate-only; search stubs ready |
| SOS Safety System | ✅ Phase 2 complete | Trigger, check-in, 5-min escalation |
| Notification Engine | ⏳ Phase 3 | Twilio + Resend + Push wiring |
| Membership System | ⏳ Phase 3 | Tier enforcement, Stripe prices |
| Payment Layer | ⏳ Phase 3 | Stripe subscriptions + webhooks |
| Visa & Embassy | ⏳ Phase 3 | Directory data + passport expiry alerts |
| Passport Expiry Alerts | ⏳ Phase 3 | Scheduled cron, email notification |

---

## DEFERRED MODULES — post-launch

| Module | Reason for deferral |
|--------|---------------------|
| Community (reviews, explorer map) | Needs moderation infrastructure before public |
| Partner Dashboard | Can use manual process at launch |
| AI Recommendations (TwinAXIS) | Platform must have booking volume first |
| Local Discovery | Depends on partner data density |
| Insurance Transparency | FCA review required before any display |
| Travel Continuity | Product definition not yet finalised |
| Hotel Right-to-Reply UI | Back-end schema exists; no UI needed at launch |

---

## LEGAL-RISK MODULES — require review before launch

| Module | Risk | Mitigation Required |
|--------|------|---------------------|
| Visa & Embassy data | Accuracy liability | Show `lastVerifiedAt` + official source URL + "Always check the official embassy" disclaimer on every page |
| SOS System | Substitute-for-emergency-services confusion | Hard disclaimer on every SOS UI element: "This is not a substitute for 999 / 112 / local emergency services" |
| Insurance Transparency | FCA regulated territory | Cannot recommend specific products or earn commission on insurance without FCA authorisation — content only, no links to purchase |
| Payments (Stripe) | PCI DSS | Stripe JS only — card data never touches VST servers |
| Community reviews | Defamation | Moderation queue (status: PENDING before PUBLISHED) + right-to-reply schema in place |
| Passport data | GDPR — sensitive adjacent | Encryption at rest required before launch (Phase 3). Cascade delete on account deletion already implemented |

---

## ARCHITECTURAL RULES — do not override

1. SOS trigger never gated by membership tier. Channel set varies; core event always created.
2. Affiliate-only booking model. VST never holds or processes payment for travel bookings.
3. Accessibility fields (wheelchair, dietary, assistive) are first-class data — not metadata.
4. All PII deletable on account deletion. Cascade rules in schema.prisma are binding.
5. Notification channels stack up by tier — never replace. EMAIL always fires for all tiers.
6. No lorem ipsum, fake reviews, or placeholder testimonials in any deployed environment.

---

## INTEGRATION SLOTS — reserved for later phases

These are not blocked, they are scheduled:

- TwinAXIS (AI layer) — slots into Booking module search pipeline via strategy pattern
- Local Discovery — slots into Destination module as a new data source
- n8n workflows — price alert checker and passport expiry notifier already designed
- Insurance display — slots into Destination/Booking pages as content-only blocks
