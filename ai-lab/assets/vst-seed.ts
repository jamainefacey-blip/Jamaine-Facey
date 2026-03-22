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
  ]
}
