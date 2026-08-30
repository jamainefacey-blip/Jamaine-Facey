# VST EXISTING BUILD AND OLD-CHAT RECOVERY ROUNDTABLE AUDIT

**Status:** Canon recovery audit — no feature may be represented as LIVE without behavioural and runtime evidence.  
**Scope:** What already exists in the VST repository versus founder-approved concepts recovered from prior VST discussions.  
**Branch:** `chatgpt/vst-accessibility-intelligence-canon`

## 1. Roundtable seats

- Founder/Product Authority
- Product Archaeologist
- Community and Creator Economy Lead
- Travel Marketplace Architect
- Safety and Trust Lead
- Accessibility Lead
- Rewards and Commercial Lead
- Data and Map Lead
- Legal and Compliance Reviewer
- Delivery and Runtime Verifier

## 2. Executive verdict

VST already contains a substantial travel, safety, accessibility, profile, booking and AI-planning foundation. It does **not** contain the complete founder-described community and creator economy.

The repository includes only weak traces of community entitlement, principally membership-tier fields that mark community access as `read-only` or `full`. Searches across source, specifications, migrations and current documentation found no complete implementation or canonical specification for:

- travellers uploading location videos or photos to the map;
- community verification of hidden gems or useful places;
- earning free tickets, flights, accommodation or travel credit from approved contributions;
- a creator points ledger;
- contributor tiers, pyramid progression or status ladder;
- leaderboards;
- ambassador roles;
- referral rewards;
- moderation, fraud prevention, rights licensing or reward settlement;
- a social map feed linked to bookings and live journey planning.

These concepts were recovered from prior founder discussions, but were not confirmed as live implementation. They must therefore be classified as **RECOVERED CONCEPT — NOT YET CANONICALLY SPECIFIED OR BUILT**.

## 3. Founder concepts recovered from prior VST discussions

The earlier VST concept included:

1. Travellers upload short videos or photos of useful, attractive or overlooked locations.
2. Approved contributions appear as discoverable places on the VST map.
3. Other travellers use the content to find hidden gems, local experiences and safer or better-value options.
4. Contributors earn points, status, travel rewards or free-ticket opportunities based on verified value created.
5. Progression may use levels, a pyramid or tier ladder, leaderboards and ambassador/community-contributor roles.
6. Referral and creator activity contributes to rewards.
7. The community layer supports social travel, local discovery and live traveller intelligence.

### Governance interpretation of “pyramid”

Until the founder defines the exact model, `pyramid` must mean a transparent contribution-status ladder, not recruitment-led multi-level compensation. Rewards must be earned from verified travel value, completed eligible actions or disclosed referrals—not from recruiting chains.

## 4. Repository evidence: what is already present

### VERIFIED IN SOURCE

- User membership tiers exist: `GUEST`, `PREMIUM`, `VOYAGE_ELITE`.
- Tier capability data includes community access states: guest `read-only`; premium and elite `full`.
- User profiles, travel preferences, accessibility needs, SOS contacts, travel history and notification preferences are specified.
- AI planner, itinerary, booking, safety, accessibility, destination and fare-search surfaces exist in source.
- Static accessibility hotel, transport and venue intelligence exists.
- A live website and Vercel project exist, but feature-specific runtime status must be verified separately.

### PARTIAL OR IMPLIED

- “Community” is named as a tier capability, but no complete community domain model, routes, UI, moderation system or contribution workflow was found.
- Destination and map-oriented content exists, but no verified user-generated map contribution pipeline was found.
- Traveller intelligence and community feedback are described in some customer-facing copy, but no complete contributor evidence and reward system was found.

### MISSING FROM THE CURRENT RECOVERED SOURCE

- Creator profile and contributor reputation model.
- User-generated place submission API.
- Video/photo upload and media storage contract.
- Geolocation and map-pin validation.
- Duplicate-place detection.
- Content verification and moderation queue.
- Safety, accessibility and factual evidence fields for community places.
- Rights, consent and media-licensing workflow.
- Reward points ledger and immutable transaction history.
- Reward catalogue and free-ticket eligibility contract.
- Sponsor/affiliate-funded reward settlement.
- Contribution quality score.
- Fraud, spam, stolen-content and location-spoofing controls.
- Appeals, takedowns and dispute handling.
- Referral tracking and attribution.
- Ambassador programme.
- Leaderboards and progression ladder.
- Community trip groups, chat, events or travel matching.
- Connection between community content and the canonical Journey Object.

## 5. Roundtable gap analysis

### P0 — Truth and legal safety

1. Do not advertise free tickets until funding, eligibility, availability, tax, expiry and no-cash-value terms are defined.
2. Do not use “pyramid” in public product language. Use `Contributor Progression Ladder` or another founder-approved name.
3. User-uploaded media requires explicit ownership/licensing declarations, consent for identifiable people, reporting and takedown controls.
4. Location content needs safety controls for private property, vulnerable locations, illegal access, wildlife risk and dangerous challenges.
5. Rewards need anti-fraud controls and an auditable points ledger.

### P0 — Product unification

Community must not become another isolated module. A community place must connect to:

- canonical traveller identity;
- destination and map record;
- evidence and verification record;
- accessibility and safety data;
- itinerary and journey objects;
- affiliate offers and booking handoff;
- creator/reward ledger;
- live-trip updates;
- post-trip learning.

### P1 — Creator economy specification

The product needs one governed contract covering:

- eligible contributions;
- approval and verification;
- contribution scoring;
- points calculation;
- contributor levels;
- reward redemption;
- sponsor and affiliate funding;
- expiry and reversals;
- referrals;
- disputes and moderation;
- disabled-user participation and accessible content requirements.

### P1 — Community map intelligence

Every submitted place should support:

- coordinates and boundary;
- place type;
- media;
- visit date;
- opening and cost information;
- safety notes;
- accessibility details;
- sensory/crowding information;
- family, backpacker, solo, VIP and budget suitability;
- evidence source;
- contributor identity/reputation;
- last verification date;
- booking/affiliate links where appropriate.

## 6. Proposed unified community system

### Community contribution journey

`Capture → Consent → Upload → Geolocate → Duplicate check → Automated safety scan → Human/community verification → Publish → Measure usefulness → Award points → Unlock status/reward → Reverify or expire`

### Contributor progression ladder

Working structure for later founder decision:

1. Explorer
2. Scout
3. Local Guide
4. Trusted Guide
5. Destination Ambassador
6. VST Community Partner

Progression must depend on verified usefulness, accuracy, safety, accessibility detail and sustained quality—not raw upload volume or recruitment.

### Reward types

Potential rewards, subject to commercial and legal approval:

- VST points;
- partner discount codes;
- baggage, seat or transfer upgrades;
- attraction tickets;
- accommodation credits;
- sponsored travel experiences;
- entry into clearly governed promotional draws;
- fixed free-ticket awards where a partner has contractually supplied inventory.

No reward should be described as available until the funding source and fulfilment route are verified.

## 7. Build-readiness artefacts required

Before implementation, produce:

1. VST Community and Creator Economy Canon.
2. Community Place and Media schema.
3. Creator Profile and Reputation schema.
4. Contribution Verification contract.
5. Reward Points Ledger contract.
6. Reward Catalogue and Redemption contract.
7. Referral and Attribution contract.
8. Moderation, Rights and Takedown policy.
9. Fraud and Location-Safety controls.
10. Community Map and Journey integration map.
11. Public-language and promotional-terms review.
12. Demo/PARTIAL/VERIFIED/LIVE evidence matrix.

## 8. Final roundtable classification

| Capability | Repository status |
|---|---|
| Membership tiers | VERIFIED IN SOURCE |
| Community entitlement flag | SPECIFIED/PARTIAL |
| Community map | NOT FOUND AS COMPLETE SYSTEM |
| User video/photo place submissions | NOT FOUND |
| Hidden-gem discovery from community uploads | RECOVERED CONCEPT |
| Contributor points | RECOVERED CONCEPT |
| Free tickets/travel rewards | RECOVERED CONCEPT; COMMERCIAL CONTRACT MISSING |
| Contributor pyramid/tier ladder | RECOVERED CONCEPT; NAME/MODEL UNRATIFIED |
| Referrals and ambassadors | RECOVERED CONCEPT |
| Moderation and rights | MISSING |
| Reward fraud controls | MISSING |
| Journey integration | MISSING |

## 9. Decision

Do not rebuild the existing VST foundation. Recover the missing founder IP into governed contracts, then connect it to the whole-product Journey Object and benchmark architecture.

The next canonical design task is the **VST Community and Creator Economy Canon**, using this recovery audit as its evidence base. It must remain on the existing PR/branch until reviewed, rather than creating a separate product fork.
