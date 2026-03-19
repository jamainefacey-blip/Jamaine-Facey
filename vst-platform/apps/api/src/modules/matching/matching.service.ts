/**
 * MatchingService — VST Travel Preference + Availability Matching Engine
 *
 * ARCHITECTURE
 * ─────────────────────────────────────────────────────────────────────────────
 * The matching engine evaluates a user's stored preference profile against
 * the set of available opportunity types and produces a ranked list of
 * MatchResult objects. Each result carries a score, signals explaining the
 * match, and action chips for the UI.
 *
 * Phase 5: Scaffold with deterministic stub scoring logic.
 *          No live pricing, no live event data — all signals from stored prefs.
 *
 * Phase 6 expansion:
 *   - Pull live prices from PriceAlert triggers / Skyscanner API
 *   - Pull live events from EventsService (LocalEvent table)
 *   - Pull explorer pins from ExplorerService
 *   - Run nightly as a background job (ScheduleModule @Cron)
 *   - Cache results in Redis (vst:match:{userId}) with 6h TTL
 *   - Trigger push notifications for high-score opportunities
 *
 * SCORE ALGORITHM
 * ─────────────────────────────────────────────────────────────────────────────
 * Composite 0–100 score per opportunity. Additive signals:
 *
 *   +20  destination is PREFERRED or DREAM
 *   +15  trip type in user.tripTypes[]
 *   +10  duration within minTripDays / maxTripDays
 *   +10  travel style matches (≥1 TravelStyle overlap)
 *   +10  budget within user bands (if set)
 *   +10  active availability window covers the trip
 *   +10  transport mode in user.transportModes[]
 *   +5   accessibility features match (if requiresWheelchair / requiresAssistance)
 *   -30  destination is EXCLUDED → score forced to 0, suppressed
 *   -10  transport mode not available
 *
 * NOTIFICATION INTEGRATION DESIGN
 * ─────────────────────────────────────────────────────────────────────────────
 * The engine connects to NotificationsService via these pathways:
 *
 *   1. OPPORTUNITY_MATCH notification
 *      Trigger: nightly job finds score ≥ 70 for user who has opportunityAlerts=true
 *      Channels: IN_APP + push (if pushNotifications=true)
 *      Payload:  { opportunityId, destinationCode, score, signals, actions }
 *
 *   2. LAST_MINUTE notification
 *      Trigger: lastMinuteAlerts=true AND departure < 14 days AND score ≥ 50
 *      Channels: IN_APP + push + email (urgency)
 *
 *   3. TRAVEL_RADAR weekly digest
 *      Trigger: travelRadarAlerts=true AND cron(every Monday 8am)
 *      Payload:  top 3 opportunities of the week
 *
 *   4. LOCAL_DISCOVERY notification
 *      Trigger: localDiscoveryAlerts=true AND user near an event matching interests
 *      Source:  EventsService + ExplorerService geospatial queries
 *
 *   5. PRICE_DROP_MATCH notification
 *      Trigger: PriceAlert job detects a drop on a PREFERRED/DREAM destination
 *      Connects existing PriceAlert → matching engine → NotificationsService
 *
 * AVA INTEGRATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Ava reads the current user's MatchingResultsDto (cached in Redis) to:
 *   - Surface top 1-2 opportunities in conversational responses
 *   - Respond to "what should I do next?" with preference-aware suggestions
 *   - Switch context to LONG_DISTANCE mode if high-score long-haul exists
 *
 * MEMBERSHIP TIER LOGIC
 * ─────────────────────────────────────────────────────────────────────────────
 *   GUEST         — up to 3 opportunities, LOCAL + SHORT_BREAK only
 *   PREMIUM       — up to 10 opportunities, all types, last-minute alerts
 *   VOYAGE_ELITE  — unlimited, all types, travel radar, long way round, Ava integration
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PreferencesService } from '../preferences/preferences.service';
import {
  MatchResult,
  MatchingResultsDto,
  MatchingQueryOptions,
  OpportunityAction,
  OpportunityType,
  SeedOpportunity,
} from './dto/matching-result.dto';
import {
  LiveSeedService,
  FALLBACK_LOCAL_SEED,
  FALLBACK_LONG_DISTANCE_SEEDS,
} from './live-seed.service';
import { MembershipTier } from '@prisma/client';
import { createHash } from 'crypto';

// ── Tier limits ───────────────────────────────────────────────────────────────
const TIER_LIMITS: Record<MembershipTier, { maxResults: number; allowedTypes: OpportunityType[] }> = {
  GUEST: {
    maxResults:   3,
    allowedTypes: ['LOCAL_DISCOVERY', 'SHORT_BREAK'],
  },
  PREMIUM: {
    maxResults:   10,
    allowedTypes: ['LOCAL_DISCOVERY', 'SHORT_BREAK', 'WEEK_HOLIDAY', 'LAST_MINUTE', 'PRICE_DROP_MATCH'],
  },
  VOYAGE_ELITE: {
    maxResults:   50,
    allowedTypes: ['LOCAL_DISCOVERY', 'SHORT_BREAK', 'WEEK_HOLIDAY', 'LONG_HAUL', 'LAST_MINUTE', 'LONG_WAY_ROUND', 'PRICE_DROP_MATCH'],
  },
};

// ── NOTE: SeedOpportunity type is now defined in matching-result.dto.ts ───────
// FALLBACK_LOCAL_SEED and FALLBACK_LONG_DISTANCE_SEEDS are in live-seed.service.ts.
// MatchingService composes seeds from LiveSeedService + fallbacks at runtime.

// ── Opportunity ID (deterministic, dedup-safe) ────────────────────────────────
function opportunityId(type: string, code: string): string {
  return createHash('sha256').update(`${type}:${code}`).digest('hex').slice(0, 16);
}

// ── Score calculator ──────────────────────────────────────────────────────────
function scoreOpportunity(
  seed: SeedOpportunity,
  prefs: any,
  destinations: any[],
  windows: any[],
): { score: number; signals: string[] } {
  let score = 30; // baseline
  const signals: string[] = [];

  // Destination preference match
  const destPref = destinations.find(
    d => d.destinationCode === seed.destinationCode,
  );
  if (destPref?.type === 'EXCLUDED') {
    return { score: 0, signals: ['Destination excluded by your preferences'] };
  }
  if (destPref?.type === 'PREFERRED') {
    score += 20;
    signals.push('Preferred destination');
  } else if (destPref?.type === 'DREAM') {
    score += 20;
    signals.push('Dream destination');
  }

  // Trip type match
  if (prefs?.tripTypes?.length && seed.tripType && prefs.tripTypes.includes(seed.tripType)) {
    score += 15;
    signals.push(`Matches your ${seed.tripType?.toLowerCase().replace(/_/g, ' ')} preference`);
  }

  // Duration fit
  const min = prefs?.minTripDays;
  const max = prefs?.maxTripDays;
  if (seed.estimatedDays && min && max) {
    if (seed.estimatedDays >= min && seed.estimatedDays <= max) {
      score += 10;
      signals.push(`${seed.estimatedDays} days fits your trip length`);
    }
  }

  // Availability window overlap (stub: score +10 if any active window exists)
  if (windows.length > 0) {
    score += 10;
    const w = windows[0];
    if (w.label) signals.push(`Fits your "${w.label}" window`);
    else signals.push('Matches an availability window');
  }

  // Budget band (stub: penceHint vs prefs.budgetMaxGbp)
  if (prefs?.budgetMaxGbp && seed.priceHint) {
    // Rough parse: 'from £199' → 19900 pence
    const match = seed.priceHint.match(/£([\d,]+)/);
    if (match) {
      const pricePence = parseInt(match[1].replace(',', ''), 10) * 100;
      if (pricePence <= prefs.budgetMaxGbp) {
        score += 10;
        signals.push('Within your budget');
      }
    }
  } else if (prefs?.budgetRange) {
    score += 5;
  }

  // Last-minute bonus for last-minute preference
  if (seed.isLastMinute && prefs?.lastMinuteAlerts) {
    score += 10;
    signals.push('Last-minute deal — you have alerts on');
  }

  // Long way round bonus
  if (seed.type === 'LONG_WAY_ROUND' && prefs?.longWayRoundAlerts) {
    score += 10;
    signals.push('Multi-stop itinerary you enabled');
  }

  // Accessibility bonus (always surface accessible options at full score)
  if (prefs?.requiresWheelchair || prefs?.requiresAssistance) {
    score += 5;
    signals.push('Accessibility features noted — check destination details');
  }

  return { score: Math.min(score, 100), signals };
}

// ── Actions builder ───────────────────────────────────────────────────────────
function buildActions(seed: SeedOpportunity): OpportunityAction[] {
  const actions: OpportunityAction[] = [];

  if (seed.type === 'LOCAL_DISCOVERY') {
    actions.push({ type: 'VIEW_EVENTS',   label: 'Find events near me', value: '/events' });
    actions.push({ type: 'VIEW_EXPLORER', label: 'Open explorer map',   value: '/explorer' });
    actions.push({ type: 'ASK_AVA',       label: "Ask Ava what's on",   value: "what's happening near me today?" });
    return actions;
  }

  if (seed.type !== 'LONG_WAY_ROUND') {
    actions.push({
      type:  'SEARCH',
      label: `Search ${seed.destinationName}`,
      value: `/search/flights?destination=${seed.destinationCode}&days=${seed.estimatedDays ?? 7}`,
    });
    actions.push({
      type:  'SET_ALERT',
      label: 'Set price alert',
      value: `/alerts/new?destination=${seed.destinationCode}`,
    });
  }

  actions.push({
    type:  'ASK_AVA',
    label: `Ask Ava about ${seed.destinationName}`,
    value: `Tell me about travelling to ${seed.destinationName}`,
  });

  return actions;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class MatchingService {
  private readonly logger = new Logger(MatchingService.name);

  constructor(
    private readonly prisma:       PrismaService,
    private readonly preferences:  PreferencesService,
    private readonly liveSeeds:    LiveSeedService,
  ) {}

  /**
   * Generates a ranked list of travel opportunities for a user.
   *
   * Phase 5: preference-aware stub scoring against static seeds.
   * Phase 6: live LOCAL_DISCOVERY seeds from EventsService + ExplorerPins;
   *          live PRICE_DROP_MATCH seeds from triggered PriceAlerts.
   *          Long-distance seeds remain static until Phase 7 live pricing.
   */
  async getOpportunities(
    userId:  string,
    tier:    MembershipTier,
    options: MatchingQueryOptions = {},
  ): Promise<MatchingResultsDto> {
    const { mode = 'BOTH', limit = 10, tripType, lat, lng } = options;
    const tierConfig = TIER_LIMITS[tier] ?? TIER_LIMITS.GUEST;

    // Load preference profile
    const { preferences: prefs, destinations, availabilityWindows: windows } =
      await this.preferences.getTravelPreferences(userId);

    const allDests = [
      ...destinations.preferred,
      ...destinations.dream,
      ...destinations.excluded,
    ];

    // ── Compose seed list from live data + fallbacks ─────────────────────────
    // LOCAL_DISCOVERY: live event + pin seeds when lat/lng provided, else fallback
    const accessibilityRequired = !!(prefs?.requiresWheelchair || prefs?.requiresAssistance);
    const [liveEventSeeds, livePinSeeds, liveDropSeeds] = await Promise.all([
      lat != null && lng != null
        ? this.liveSeeds.getLocalEventSeeds(lat, lng, { accessibilityRequired })
        : Promise.resolve<SeedOpportunity[]>([]),
      lat != null && lng != null
        ? this.liveSeeds.getExplorerPinSeeds(lat, lng)
        : Promise.resolve<SeedOpportunity[]>([]),
      this.liveSeeds.getPriceDropSeeds(userId, allDests),
    ]);

    const localSeeds: SeedOpportunity[] =
      liveEventSeeds.length > 0 || livePinSeeds.length > 0
        ? [...liveEventSeeds, ...livePinSeeds]
        : [FALLBACK_LOCAL_SEED];

    const seedList: SeedOpportunity[] = [
      ...localSeeds,
      ...FALLBACK_LONG_DISTANCE_SEEDS,
      ...liveDropSeeds,
    ];

    const now     = new Date();
    const results: MatchResult[] = [];
    let   excluded = 0;

    for (const seed of seedList) {
      // Tier gate: skip types not available on this tier
      if (!tierConfig.allowedTypes.includes(seed.type)) continue;

      // Mode filter
      if (mode === 'LOCAL'         && seed.type !== 'LOCAL_DISCOVERY') continue;
      if (mode === 'LONG_DISTANCE' && seed.type === 'LOCAL_DISCOVERY') continue;

      // Trip type filter
      if (tripType && seed.tripType !== tripType) continue;

      const { score, signals } = scoreOpportunity(seed, prefs, allDests, windows);

      // Suppress excluded destinations silently
      if (score === 0 && signals[0]?.includes('excluded')) {
        excluded++;
        continue;
      }

      // For GUEST: require score ≥ 40 to keep results meaningful
      if (tier === 'GUEST' && score < 40) continue;

      const expiresAt = seed.isLastMinute && seed.daysUntilDepart
        ? new Date(now.getTime() + seed.daysUntilDepart * 86_400_000).toISOString()
        : undefined;

      results.push({
        id:              opportunityId(seed.type, seed.destinationCode),
        type:            seed.type,
        destinationCode: seed.destinationCode,
        destinationName: seed.destinationName,
        tripType:        seed.tripType,
        score,
        signals,
        actions:         buildActions(seed),
        estimatedDays:   seed.estimatedDays,
        priceHint:       seed.priceHint,
        windowLabel:     windows[0]?.label ?? undefined,
        expiresAt,
        isLastMinute:    seed.isLastMinute,
        requiresUpgrade: false,
      });
    }

    // Tier gate: show locked types as upgrade prompts using static fallback seeds
    if (tier === 'GUEST' || tier === 'PREMIUM') {
      const lockedTypes: OpportunityType[] = tier === 'GUEST'
        ? ['WEEK_HOLIDAY', 'LONG_HAUL', 'LAST_MINUTE', 'LONG_WAY_ROUND', 'PRICE_DROP_MATCH']
        : ['LONG_HAUL', 'LONG_WAY_ROUND'];
      for (const seed of FALLBACK_LONG_DISTANCE_SEEDS) {
        if (lockedTypes.includes(seed.type) && results.length < tierConfig.maxResults + 2) {
          results.push({
            id:              opportunityId(seed.type + ':locked', seed.destinationCode),
            type:            seed.type,
            destinationCode: seed.destinationCode,
            destinationName: seed.destinationName,
            tripType:        seed.tripType,
            score:           0,
            signals:         [],
            actions:         [{ type: 'SEARCH', label: 'Upgrade to unlock', value: '/membership/upgrade' }],
            estimatedDays:   seed.estimatedDays,
            priceHint:       seed.priceHint,
            isLastMinute:    seed.isLastMinute,
            requiresUpgrade: true,
          });
        }
      }
    }

    // Sort: non-upgrade results by score desc, then upgrade stubs at the end
    results.sort((a, b) => {
      if (a.requiresUpgrade !== b.requiresUpgrade) return a.requiresUpgrade ? 1 : -1;
      return b.score - a.score;
    });

    const cappedResults = results.slice(0, tierConfig.maxResults);
    const localCount    = cappedResults.filter(r => r.type === 'LOCAL_DISCOVERY').length;
    const longDistCount = cappedResults.filter(r => r.type !== 'LOCAL_DISCOVERY').length;

    this.logger.debug(
      `Matching user=${userId} tier=${tier} mode=${mode} ` +
      `results=${cappedResults.length} excluded=${excluded}`,
    );

    return {
      userId,
      generatedAt:  now.toISOString(),
      mode,
      opportunities: cappedResults,
      meta: {
        total:           cappedResults.length,
        localCount,
        longDistCount,
        excludedCount:   excluded,
        hasAvailability: windows.length > 0,
      },
    };
  }
}
