/**
 * VST Platform — Staging Seed Script
 *
 * Creates a minimal but realistic dataset for authenticated product validation
 * of the Phase 6 matching engine, Long Way Round, Ava, and Travel Radar.
 *
 * USERS CREATED
 * ─────────────────────────────────────────────────────────────────────────────
 *   guest@vst-staging.test    — GUEST tier, no membership row
 *   premium@vst-staging.test  — PREMIUM tier, active membership
 *
 * NOTE: clerkId values are stubs for staging only. In a real Clerk environment
 * these must match the `sub` claim of actual Clerk JWTs. Replace before running
 * authenticated HTTP tests (see validation checklist at bottom of file).
 *
 * SEED COORDINATES
 * ─────────────────────────────────────────────────────────────────────────────
 * All local events and explorer pins are seeded near Central London:
 *   lat: 51.51, lng: -0.12
 * This means GET /v1/matching/opportunities?mode=LOCAL&lat=51.51&lng=-0.12
 * will return live seeds from DB rather than static fallbacks.
 *
 * RUN
 * ─────────────────────────────────────────────────────────────────────────────
 *   cd packages/db
 *   DATABASE_URL="postgresql://..." npx ts-node seed.ts
 *   # OR via npm script:
 *   DATABASE_URL="..." npm run db:seed
 */

import { PrismaClient, MembershipTier, MembershipStatus, LocalEventCategory } from '@prisma/client';

const prisma = new PrismaClient();

// ── Staging-fixed IDs (deterministic for repeatability) ──────────────────────
// Use upsert throughout so the script is idempotent.

const GUEST_CLERK_ID   = 'user_staging_guest_001';
const PREMIUM_CLERK_ID = 'user_staging_premium_001';

const LONDON_LAT = 51.51;
const LONDON_LNG = -0.12;

// ── Future dates relative to script execution ─────────────────────────────────
function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(19, 0, 0, 0);
  return d;
}

async function main() {
  console.log('VST Staging Seed — starting…\n');

  // ── 1. GUEST USER ────────────────────────────────────────────────────────────
  console.log('1. Creating guest user…');
  const guest = await prisma.user.upsert({
    where: { clerkId: GUEST_CLERK_ID },
    update: {},
    create: {
      clerkId:       GUEST_CLERK_ID,
      email:         'guest@vst-staging.test',
      emailVerified: true,
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: guest.id },
    update: {},
    create: {
      userId:              guest.id,
      tripTypes:           ['CITY_BREAK', 'SHORT_BREAK'],
      stayTypes:           ['HOTEL', 'APARTMENT'],
      transportModes:      ['FLIGHT', 'TRAIN'],
      budgetRange:         'BUDGET',
      budgetMinGbp:        10_000,    // £100 per person
      budgetMaxGbp:        50_000,    // £500 per person
      travelStyle:         ['CULTURAL', 'SOLO'],
      minTripDays:         2,
      maxTripDays:         7,
      opportunityAlerts:   true,
      lastMinuteAlerts:    false,
      travelRadarAlerts:   false,     // GUEST — radar is PREMIUM only
      localDiscoveryAlerts: true,
      pushNotifications:   true,
    },
  });

  // GUEST: one tentative availability window (summer)
  const existingGuestWindow = await prisma.userAvailabilityWindow.findFirst({
    where: { userId: guest.id, label: 'Summer 2026' },
  });
  if (!existingGuestWindow) {
    await prisma.userAvailabilityWindow.create({
      data: {
        userId:        guest.id,
        label:         'Summer 2026',
        startDate:     new Date('2026-07-15'),
        endDate:       new Date('2026-07-29'),
        isFlexible:    true,
        flexDaysBefore: 3,
        flexDaysAfter:  3,
        windowType:    'TENTATIVE',
        isActive:      true,
      },
    });
  }

  // GUEST: destination preferences
  await prisma.userDestinationPreference.upsert({
    where: { userId_destinationCode_type: { userId: guest.id, destinationCode: 'ES', type: 'PREFERRED' } },
    update: {},
    create: { userId: guest.id, destinationCode: 'ES', type: 'PREFERRED', note: 'Love Barcelona' },
  });
  await prisma.userDestinationPreference.upsert({
    where: { userId_destinationCode_type: { userId: guest.id, destinationCode: 'JP', type: 'DREAM' } },
    update: {},
    create: { userId: guest.id, destinationCode: 'JP', type: 'DREAM', note: 'Bucket list' },
  });

  console.log(`   Guest created: ${guest.id}`);

  // ── 2. PREMIUM USER ──────────────────────────────────────────────────────────
  console.log('2. Creating premium user…');
  const premium = await prisma.user.upsert({
    where: { clerkId: PREMIUM_CLERK_ID },
    update: {},
    create: {
      clerkId:       PREMIUM_CLERK_ID,
      email:         'premium@vst-staging.test',
      emailVerified: true,
    },
  });

  await prisma.membership.upsert({
    where: { userId: premium.id },
    update: {},
    create: {
      userId:    premium.id,
      tier:      MembershipTier.PREMIUM,
      status:    MembershipStatus.ACTIVE,
      startedAt: new Date('2026-01-01'),
    },
  });

  await prisma.userPreferences.upsert({
    where: { userId: premium.id },
    update: {},
    create: {
      userId:               premium.id,
      tripTypes:            ['WEEK_HOLIDAY', 'LONG_HAUL', 'CITY_BREAK', 'SHORT_BREAK'],
      stayTypes:            ['HOTEL', 'BOUTIQUE', 'APARTMENT'],
      transportModes:       ['FLIGHT', 'TRAIN'],
      budgetRange:          'MODERATE',
      budgetMinGbp:         50_000,    // £500 per person
      budgetMaxGbp:         200_000,   // £2,000 per person
      travelStyle:          ['LUXURY', 'CULTURAL', 'ADVENTURE'],
      minTripDays:          5,
      maxTripDays:          21,
      opportunityAlerts:    true,
      lastMinuteAlerts:     true,
      travelRadarAlerts:    true,
      localDiscoveryAlerts: true,
      pushNotifications:    true,
    },
  });

  // PREMIUM: confirmed availability window (August bank holiday)
  const existingPremiumWindow = await prisma.userAvailabilityWindow.findFirst({
    where: { userId: premium.id, label: 'August 2026' },
  });
  if (!existingPremiumWindow) {
    await prisma.userAvailabilityWindow.create({
      data: {
        userId:        premium.id,
        label:         'August 2026',
        startDate:     new Date('2026-08-22'),
        endDate:       new Date('2026-09-05'),
        isFlexible:    false,
        windowType:    'CONFIRMED',
        isActive:      true,
      },
    });
  }

  // PREMIUM: richer destination preferences
  const premiumDestPrefs = [
    { code: 'ES', type: 'PREFERRED' as const, note: 'Ibiza and Mallorca — love it' },
    { code: 'IT', type: 'PREFERRED' as const, note: 'Amalfi every year' },
    { code: 'JP', type: 'DREAM' as const,    note: 'Cherry blossom season someday' },
    { code: 'TH', type: 'DREAM' as const,    note: 'Full moon party' },
    { code: 'RU', type: 'EXCLUDED' as const, note: 'Avoid currently' },
  ];
  for (const p of premiumDestPrefs) {
    await prisma.userDestinationPreference.upsert({
      where: { userId_destinationCode_type: { userId: premium.id, destinationCode: p.code, type: p.type } },
      update: {},
      create: { userId: premium.id, destinationCode: p.code, type: p.type, note: p.note },
    });
  }

  // PREMIUM: a draft Long Way Round route (for LWR validation)
  const existingRoute = await prisma.longWayRoundRoute.findFirst({
    where: { userId: premium.id, name: 'Asia Loop 2026' },
  });
  if (!existingRoute) {
    const route = await prisma.longWayRoundRoute.create({
      data: {
        userId:    premium.id,
        name:      'Asia Loop 2026',
        status:    'DRAFT',
        totalDays: 28,
        budgetGbp: 250_000,  // £2,500
        notes:     'Tokyo → Bangkok → Bali — seeded for staging validation',
      },
    });
    await prisma.longWayRoundStop.createMany({
      data: [
        { routeId: route.id, position: 1, destinationCode: 'JP', destinationName: 'Tokyo',   durationDays: 10, isFlexible: false },
        { routeId: route.id, position: 2, destinationCode: 'TH', destinationName: 'Bangkok', durationDays: 8,  isFlexible: true  },
        { routeId: route.id, position: 3, destinationCode: 'ID', destinationName: 'Bali',    durationDays: 10, isFlexible: true  },
      ],
    });
    console.log(`   LWR route seeded: ${route.id} (3 stops)`);
  }

  // PREMIUM: triggered price alert (destination in PREFERRED list → bridge will match)
  const existingAlert = await prisma.priceAlert.findFirst({
    where: { userId: premium.id, destination: 'ES', isActive: true },
  });
  if (!existingAlert) {
    await prisma.priceAlert.create({
      data: {
        userId:        premium.id,
        type:          'FLIGHT',
        origin:        'LHR',
        destination:   'ES',              // Spain — matches PREFERRED destination
        targetPrice:   15_000,           // £150 target
        thresholdPct:  20.0,             // 20% drop trigger
        isActive:      true,
        triggeredAt:   new Date(),        // seeded as already triggered (bridge scan will pick up)
        lastCheckedAt: new Date(),
      },
    });
    console.log('   Price alert (triggered, LHR→ES) seeded for premium user');
  }

  console.log(`   Premium created: ${premium.id}`);

  // ── 3. LOCAL EVENTS (near Central London, within ±0.5° bounding box) ─────────
  console.log('3. Seeding local events near London…');

  const localEvents = [
    {
      title:       'Southbank Food & Drink Festival',
      description: 'Three days of street food, craft beer, and live music along the Thames.',
      latitude:    51.508,
      longitude:   -0.117,
      address:     'Southbank Centre, London SE1',
      category:    LocalEventCategory.FOOD_DRINK,
      startDate:   daysFromNow(5),
      endDate:     daysFromNow(7),
      price:       null,            // free entry
      affiliateUrl: 'https://southbankcentre.co.uk',
      isPublished: true,
      accessibilityFeatures: ['wheelchair_access', 'hearing_loop'],
      tags: ['food', 'drink', 'outdoor', 'free'],
    },
    {
      title:       'Jazz at Ronnie Scotts',
      description: 'World-class jazz in Soho — intimate venue, late sessions available.',
      latitude:    51.513,
      longitude:   -0.131,
      address:     "47 Frith St, Soho, London W1D",
      category:    LocalEventCategory.MUSIC,
      startDate:   daysFromNow(3),
      endDate:     daysFromNow(3),
      price:       3500,            // £35 per person
      ticketUrl:   'https://ronniescotts.co.uk',
      isPublished: true,
      accessibilityFeatures: [],
      tags: ['jazz', 'music', 'soho', 'nightlife'],
    },
    {
      title:       'Shoreditch Street Art Tour',
      description: 'Guided walking tour of East London\'s iconic murals and installations.',
      latitude:    51.524,
      longitude:   -0.077,
      address:     'Shoreditch High St Station, London E1',
      category:    LocalEventCategory.ART,
      startDate:   daysFromNow(2),
      endDate:     daysFromNow(2),
      price:       1500,            // £15 per person
      isPublished: true,
      accessibilityFeatures: ['wheelchair_access'],
      tags: ['art', 'walking', 'culture', 'east-london'],
    },
    {
      title:       'Hyde Park Open Air Cinema',
      description: 'Classic films under the stars in Hyde Park. Bring a blanket.',
      latitude:    51.507,
      longitude:   -0.165,
      address:     'Hyde Park, London W2',
      category:    LocalEventCategory.CULTURE,
      startDate:   daysFromNow(10),
      endDate:     daysFromNow(12),
      price:       2000,            // £20 per person
      isPublished: true,
      accessibilityFeatures: ['wheelchair_access', 'large_print'],
      tags: ['cinema', 'outdoor', 'family', 'hyde-park'],
    },
  ];

  for (const event of localEvents) {
    const exists = await prisma.localEvent.findFirst({ where: { title: event.title } });
    if (!exists) {
      await prisma.localEvent.create({ data: event as any });
    }
  }
  console.log(`   ${localEvents.length} local events seeded`);

  // ── 4. EXPLORER PINS (near Central London, published + media confirmed) ───────
  console.log('4. Seeding explorer pins…');

  const pins = [
    {
      latitude:      51.515,
      longitude:     -0.100,
      title:         'Secret Rooftop Garden, Covent Garden',
      description:   'A hidden rooftop terrace above a Victorian arcade — stunning city views.',
      mediaUrl:      'https://cdn.voyagesmarttravel.com/staging/pin-rooftop.jpg',
      mediaType:     'IMAGE' as const,
      mediaConfirmed: true,
      isPublished:   true,
      tags:          ['rooftop', 'hidden', 'views', 'covent-garden'],
    },
    {
      latitude:      51.505,
      longitude:     -0.091,
      title:         'Victorian-era Warehouse Speakeasy, Bermondsey',
      description:   'Prohibition-era cocktail bar in a converted warehouse — ask for the password.',
      mediaUrl:      'https://cdn.voyagesmarttravel.com/staging/pin-speakeasy.jpg',
      mediaType:     'IMAGE' as const,
      mediaConfirmed: true,
      isPublished:   true,
      tags:          ['bar', 'hidden', 'cocktails', 'bermondsey'],
    },
  ];

  for (const pin of pins) {
    const exists = await prisma.explorerPin.findFirst({ where: { title: pin.title } });
    if (!exists) {
      await prisma.explorerPin.create({ data: pin as any });
    }
  }
  console.log(`   ${pins.length} explorer pins seeded`);

  // ── 5. RADAR SIGNALS ──────────────────────────────────────────────────────────
  console.log('5. Seeding travel radar signals…');

  const signals = [
    {
      type:            'PRICE_DROP',
      destinationCode: 'ES',
      destinationName: 'Spain',
      payload:         { route: 'LHR-BCN', fromPrice: 89, currency: 'GBP', airline: 'Vueling' },
      strength:        85,
      expiresAt:       daysFromNow(7),
    },
    {
      type:            'EVENT_CLUSTER',
      destinationCode: 'JP',
      destinationName: 'Japan',
      payload:         { eventCount: 12, topCategory: 'FESTIVAL', dateRange: 'Apr 2026' },
      strength:        75,
      expiresAt:       daysFromNow(30),
    },
    {
      type:            'VIRAL_PIN',
      destinationCode: 'GB',
      destinationName: 'London',
      payload:         { pinId: 'staging-pin-001', likesCount: 342, category: 'ART' },
      strength:        60,
      expiresAt:       daysFromNow(14),
    },
    {
      type:            'PRICE_DROP',
      destinationCode: 'IT',
      destinationName: 'Italy',
      payload:         { route: 'LHR-FCO', fromPrice: 119, currency: 'GBP', airline: 'BA' },
      strength:        70,
      expiresAt:       daysFromNow(5),
    },
  ];

  for (const sig of signals) {
    const exists = await prisma.radarSignal.findFirst({
      where: { destinationCode: sig.destinationCode, type: sig.type as any },
    });
    if (!exists) {
      await prisma.radarSignal.create({ data: sig as any });
    }
  }
  console.log(`   ${signals.length} radar signals seeded`);

  // ── 6. DESTINATION RECORDS (required for community endpoint) ──────────────────
  console.log('6. Seeding destinations…');

  const destinations = [
    { countryCode: 'GB', countryName: 'United Kingdom', region: 'Europe' },
    { countryCode: 'ES', countryName: 'Spain',          region: 'Europe' },
    { countryCode: 'IT', countryName: 'Italy',          region: 'Europe' },
    { countryCode: 'JP', countryName: 'Japan',          region: 'Asia'   },
    { countryCode: 'TH', countryName: 'Thailand',       region: 'Asia'   },
    { countryCode: 'FR', countryName: 'France',         region: 'Europe' },
    { countryCode: 'PT', countryName: 'Portugal',       region: 'Europe' },
    { countryCode: 'GR', countryName: 'Greece',         region: 'Europe' },
  ];

  for (const dest of destinations) {
    await prisma.destination.upsert({
      where:  { countryCode: dest.countryCode },
      update: {},
      create: dest,
    });
  }
  console.log(`   ${destinations.length} destinations upserted`);

  console.log('\nSeed complete.\n');
  console.log('STAGING USERS');
  console.log('─────────────────────────────────────────────────────────────────');
  console.log(`  guest@vst-staging.test    id=${guest.id}   clerkId=${GUEST_CLERK_ID}`);
  console.log(`  premium@vst-staging.test  id=${premium.id}  clerkId=${PREMIUM_CLERK_ID}`);
  console.log('\nAUTHENTICATED SMOKE TESTS — replace Bearer tokens before running:');
  console.log('  GET  /v1/matching/opportunities?mode=LOCAL&lat=51.51&lng=-0.12');
  console.log('  GET  /v1/matching/opportunities?mode=LONG_DISTANCE');
  console.log('  POST /v1/ava/query  body: {"message":"suggest a trip","context":{"mode":"LONG_DISTANCE"}}');
  console.log('  POST /v1/matching/lwr  (PREMIUM JWT — expect 201)');
  console.log('  POST /v1/matching/lwr  (GUEST JWT — expect 403)');
  console.log('  POST /v1/matching/dev/run-nightly  (triggers nightly eval immediately)');
  console.log('  POST /v1/matching/dev/run-radar    (triggers weekly radar immediately)');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
