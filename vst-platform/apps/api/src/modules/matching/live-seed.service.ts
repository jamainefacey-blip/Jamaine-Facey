/**
 * LiveSeedService — Phase 6
 *
 * Produces SeedOpportunity[] for the matching engine from live data sources:
 *
 *   LOCAL_DISCOVERY seeds
 *   ─────────────────────────────────────────────────────────────────────────
 *   Source 1: LocalEvent table — upcoming published events within a bounding
 *             box around the user's lat/lng (±RADIUS_DEG degrees ≈ 55 km).
 *             Events filtered to the next 30 days, limited to 20.
 *             Accessibility features are propagated first-class.
 *
 *   Source 2: ExplorerPin table — published confirmed-media pins within the
 *             same bounding box. Converted to 1-day city-break seeds.
 *
 *   PRICE_DROP_MATCH seeds
 *   ─────────────────────────────────────────────────────────────────────────
 *   Source: PriceAlert rows where:
 *     - userId matches the requesting user
 *     - isActive = true
 *     - triggeredAt is within the last 48h (recent drop)
 *     - destination is in the user's PREFERRED or DREAM list
 *   These are returned as PRICE_DROP_MATCH SeedOpportunity entries so the
 *   scoring engine can weight them appropriately.
 *
 *   FALLBACK
 *   ─────────────────────────────────────────────────────────────────────────
 *   If lat/lng are not provided, LOCAL_DISCOVERY live seeds are empty.
 *   The matching engine falls back to the static FALLBACK_LOCAL_SEEDS below.
 *   Long-distance static seeds (Barcelona, Paris, Japan, etc.) remain as
 *   FALLBACK_LONG_DISTANCE_SEEDS until live pricing integration in Phase 7.
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SeedOpportunity, OpportunityType } from './dto/matching-result.dto';

// ── Geographic bounding box helpers ───────────────────────────────────────────
const RADIUS_DEG = 0.5;   // ≈ 55 km at equator; sufficient for local discovery

function bounds(lat: number, lng: number) {
  return {
    minLat: lat - RADIUS_DEG,
    maxLat: lat + RADIUS_DEG,
    minLng: lng - RADIUS_DEG,
    maxLng: lng + RADIUS_DEG,
  };
}

// ── Fallback seeds ─────────────────────────────────────────────────────────────
// Used when no live data is available for a given slot.
// Long-distance seeds are replaced by live pricing in Phase 7.

export const FALLBACK_LOCAL_SEED: SeedOpportunity = {
  type:            'LOCAL_DISCOVERY',
  destinationCode: 'LOCAL',
  destinationName: 'Near You',
  tripType:        'CITY_BREAK',
  estimatedDays:   1,
  priceHint:       'Free',
  isLastMinute:    false,
};

export const FALLBACK_LONG_DISTANCE_SEEDS: SeedOpportunity[] = [
  { type: 'SHORT_BREAK',      destinationCode: 'ES',    destinationName: 'Barcelona',    tripType: 'SHORT_BREAK',  estimatedDays: 4,  priceHint: 'from £199',   isLastMinute: false },
  { type: 'SHORT_BREAK',      destinationCode: 'FR',    destinationName: 'Paris',        tripType: 'CITY_BREAK',   estimatedDays: 3,  priceHint: 'from £149',   isLastMinute: false },
  { type: 'WEEK_HOLIDAY',     destinationCode: 'IT',    destinationName: 'Amalfi Coast', tripType: 'WEEK_HOLIDAY', estimatedDays: 10, priceHint: 'from £549',   isLastMinute: false },
  { type: 'WEEK_HOLIDAY',     destinationCode: 'GR',    destinationName: 'Santorini',    tripType: 'WEEK_HOLIDAY', estimatedDays: 7,  priceHint: 'from £449',   isLastMinute: false },
  { type: 'LONG_HAUL',        destinationCode: 'JP',    destinationName: 'Japan',        tripType: 'LONG_HAUL',    estimatedDays: 14, priceHint: 'from £699',   isLastMinute: false },
  { type: 'LONG_HAUL',        destinationCode: 'TH',    destinationName: 'Thailand',     tripType: 'LONG_HAUL',    estimatedDays: 14, priceHint: 'from £549',   isLastMinute: false },
  { type: 'LAST_MINUTE',      destinationCode: 'PT',    destinationName: 'Lisbon',       tripType: 'SHORT_BREAK',  estimatedDays: 4,  priceHint: 'from £129',   isLastMinute: true,  daysUntilDepart: 7  },
  { type: 'LAST_MINUTE',      destinationCode: 'NL',    destinationName: 'Amsterdam',    tripType: 'CITY_BREAK',   estimatedDays: 3,  priceHint: 'from £99',    isLastMinute: true,  daysUntilDepart: 10 },
  { type: 'LONG_WAY_ROUND',   destinationCode: 'MULTI', destinationName: 'Round the World', tripType: 'LONG_WAY_ROUND', estimatedDays: 30, priceHint: 'from £1,299', isLastMinute: false },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysUntil(date: Date): number {
  return Math.ceil((date.getTime() - Date.now()) / 86_400_000);
}

function penceToHint(pence: number | null): string {
  return pence != null ? `from £${(pence / 100).toFixed(2)}` : 'Free';
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable()
export class LiveSeedService {
  private readonly logger = new Logger(LiveSeedService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns LOCAL_DISCOVERY seeds from upcoming LocalEvents near lat/lng.
   * Respects user accessibility preferences if provided.
   */
  async getLocalEventSeeds(
    lat: number,
    lng: number,
    opts: { accessibilityRequired?: boolean } = {},
  ): Promise<SeedOpportunity[]> {
    const { minLat, maxLat, minLng, maxLng } = bounds(lat, lng);
    const now      = new Date();
    const horizon  = new Date(now.getTime() + 30 * 86_400_000);  // next 30 days

    const events = await this.prisma.localEvent.findMany({
      where: {
        isPublished: true,
        latitude:    { gte: minLat, lte: maxLat },
        longitude:   { gte: minLng, lte: maxLng },
        startDate:   { gte: now, lte: horizon },
        // accessibility filter: if user needs it, only surface events that declare features
        ...(opts.accessibilityRequired
          ? { accessibilityFeatures: { isEmpty: false } }
          : {}),
      },
      orderBy: { startDate: 'asc' },
      take:    20,
    });

    if (events.length === 0) return [];

    const seeds: SeedOpportunity[] = events.map(ev => {
      const days = daysUntil(ev.startDate);
      return {
        type:                  'LOCAL_DISCOVERY',
        destinationCode:       'LOCAL',
        destinationName:       ev.title,
        tripType:              'CITY_BREAK',
        estimatedDays:         1,
        priceHint:             penceToHint(ev.price),
        isLastMinute:          days <= 14,
        daysUntilDepart:       days > 0 ? days : 0,
        sourceId:              ev.id,
        latitude:              ev.latitude,
        longitude:             ev.longitude,
        affiliateUrl:          ev.affiliateUrl ?? ev.ticketUrl ?? undefined,
        accessibilityFeatures: ev.accessibilityFeatures,
      };
    });

    this.logger.debug(`Live event seeds: ${seeds.length} near (${lat},${lng})`);
    return seeds;
  }

  /**
   * Returns LOCAL_DISCOVERY seeds from published ExplorerPins near lat/lng.
   * Only pins with confirmed media are included.
   */
  async getExplorerPinSeeds(
    lat: number,
    lng: number,
  ): Promise<SeedOpportunity[]> {
    const { minLat, maxLat, minLng, maxLng } = bounds(lat, lng);

    const pins = await this.prisma.explorerPin.findMany({
      where: {
        isPublished:    true,
        mediaConfirmed: true,
        latitude:       { gte: minLat, lte: maxLat },
        longitude:      { gte: minLng, lte: maxLng },
      },
      orderBy: { createdAt: 'desc' },
      take:    10,
    });

    if (pins.length === 0) return [];

    const seeds: SeedOpportunity[] = pins.map(pin => ({
      type:            'LOCAL_DISCOVERY' as OpportunityType,
      destinationCode: 'LOCAL',
      destinationName: pin.title,
      tripType:        'CITY_BREAK',
      estimatedDays:   1,
      priceHint:       'Free',
      isLastMinute:    false,
      sourceId:        pin.id,
      latitude:        pin.latitude,
      longitude:       pin.longitude,
    }));

    this.logger.debug(`Explorer pin seeds: ${seeds.length} near (${lat},${lng})`);
    return seeds;
  }

  /**
   * Returns PRICE_DROP_MATCH seeds for a user whose preferred/dream destinations
   * have an active, recently-triggered PriceAlert.
   *
   * A "recently triggered" alert is one where triggeredAt is within the last 48h.
   * This is called during both on-demand matching and the nightly runner.
   */
  async getPriceDropSeeds(
    userId:    string,
    destPrefs: { destinationCode: string; type: string }[],
  ): Promise<SeedOpportunity[]> {
    const preferredCodes = new Set(
      destPrefs
        .filter(d => d.type === 'PREFERRED' || d.type === 'DREAM')
        .map(d => d.destinationCode),
    );

    if (preferredCodes.size === 0) return [];

    const cutoff = new Date(Date.now() - 48 * 3_600_000); // 48h ago

    const alerts = await this.prisma.priceAlert.findMany({
      where: {
        userId,
        isActive:    true,
        triggeredAt: { gte: cutoff },
      },
    });

    const seeds: SeedOpportunity[] = [];

    for (const alert of alerts) {
      // Normalise — alerts store country codes or IATA codes
      const code = alert.destination.toUpperCase();
      if (!preferredCodes.has(code)) continue;

      seeds.push({
        type:            'PRICE_DROP_MATCH',
        destinationCode: code,
        destinationName: alert.destination,
        tripType:        alert.type === 'FLIGHT' ? 'WEEK_HOLIDAY' : 'WEEK_HOLIDAY',
        estimatedDays:   7,
        priceHint:       alert.targetPrice ? `from £${(alert.targetPrice / 100).toFixed(0)} ↓` : 'Price drop ↓',
        isLastMinute:    false,
        sourceId:        alert.id,
      });
    }

    this.logger.debug(`Price-drop seeds: ${seeds.length} for user ${userId}`);
    return seeds;
  }
}
