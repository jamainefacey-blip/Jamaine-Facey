export const VST_ASSET = {
  sources: [
    {
      kind: "doc",
      label: "VST approved seed summary",
      content: `identity:
- Voyage Smart Travels (VST)
- Layer 2 Commercial Platform
- UK jurisdiction
- Pain System asset
- positioned for UK SMEs and public sector travel management

productDefinition:
- AI-powered business travel management platform
- purpose: reduce manual booking, compliance checking, and expense reconciliation
- pricing: Starter £49/month, Business £149/month, Enterprise custom
- target: UK SMEs, business travel managers, public sector procurement teams

currentSystem:
- backend confirmed working
- frontend near-zero
- major blockers are frontend activation, not backend rebuild

dataModels:
- User
- UserPreferences
- UserAvailabilityWindow
- UserDestinationPreference
- Membership
- Notification
- LocalEvent
- ExplorerPin
- PriceAlert
- RadarSignal
- LongWayRoundRoute
- LongWayRoundStop

workingFlows:
- Clerk signup → /v1/webhooks/clerk
- preferences setup
- matching opportunities
- Ava opportunity query
- nightly opportunity evaluation
- weekly travel radar
- membership subscribe + Stripe webhook
- notifications feed

frontendReality:
- apps/web/components empty
- dashboard routes missing
- onboarding/preferences UI missing
- opportunities dashboard missing
- Ava chat panel missing
- notification bell missing
- API client layer missing

activationGaps:
- no api client
- no onboarding/preferences flow
- no opportunities dashboard
- no Ava chat panel
- no notification bell
- no frontend action handlers

nextAction:
- frontend activation only
- do not rebuild backend
- do not mutate core backend logic`,
    },
    {
      kind: "doc",
      label: "VST technical alignment",
      content: `modules:
- auth — /v1/webhooks/clerk
- users — profile, safety contacts, passport
- preferences — travel, availability, destinations
- matching — opportunities + dev triggers
- long-way-round — routes + stops
- ava — query + capabilities
- notifications — feed + read routes
- membership — plans, subscribe, portal
- payments — stripe webhook + payments
- booking — flights, hotels, bookings, price alerts (partial)
- community — reviews + moderation
- explorer — pins + media
- events — public + admin
- safety — sos + check-ins
- translation — text live, image/conversation partial
- visa — check + destinations + embassies
- partners — partner + campaign routes

endpoints:
- POST /v1/webhooks/clerk
- GET|PUT /v1/preferences/travel
- GET|POST|PATCH|DELETE /v1/preferences/availability
- GET|POST|DELETE /v1/preferences/destinations
- GET /v1/matching/opportunities
- POST /v1/ava/query
- GET /v1/notifications
- PATCH /v1/notifications/:id/read
- PATCH /v1/notifications/read-all
- POST /v1/membership/subscribe
- POST /v1/webhooks/stripe

matchingLogic:
- +20 PREFERRED/DREAM destinations
- −∞ EXCLUDED destinations
- +15 availability overlap
- +10 budget match
- tier gate: GUEST=3, PREMIUM=10, VOYAGE_ELITE=50

systemReality:
- backend complete
- frontend near-zero
- all core value locked behind missing UI

activationBlockers:
- no api client
- no onboarding flow
- no opportunities dashboard
- no Ava chat panel
- no notification UI
- no action handlers`,
    },
  ]
}
