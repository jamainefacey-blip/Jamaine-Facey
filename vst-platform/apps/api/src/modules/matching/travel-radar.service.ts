/**
 * TravelRadarService — Phase 6
 *
 * DESIGN
 * ─────────────────────────────────────────────────────────────────────────────
 * The Travel Radar is VST's signal aggregation layer. External and internal
 * signals (price drops, trending destinations, event clusters, viral pins,
 * visa changes) flow IN via ingestSignal() and flow OUT to users via:
 *   - getSignalsForUser()    — on-demand query (used by MatchingService + Ava)
 *   - buildWeeklyDigest()   — weekly summary called by MatchingRunnerService
 *
 * SIGNAL FLOW
 * ─────────────────────────────────────────────────────────────────────────────
 *
 *   External source                      RadarSignal (DB)
 *   ───────────────                      ────────────────
 *   Price monitoring job          ──→    PRICE_DROP
 *   EventsService (cluster detect) ──→  EVENT_CLUSTER
 *   ExplorerService (engagement)  ──→    VIRAL_PIN
 *   VisaService (rule change)     ──→    VISA_CHANGE
 *   SafetyService (advisory lift) ──→    SAFETY_CHANGE
 *   Future: trending data API     ──→    TRENDING_DEST
 *
 *   RadarSignal (DB)
 *   ────────────────
 *       ↓ getSignalsForUser() — filters by user destination prefs
 *       ↓ buildWeeklyDigest() — top N by strength × recency
 *       ↓ MatchingRunnerService → TRAVEL_RADAR Notification
 *
 * RELEVANCE SCORING
 * ─────────────────────────────────────────────────────────────────────────────
 * A signal's relevance to a user is computed from:
 *   - base signal.strength (0–100)
 *   - +30 if destinationCode is in user PREFERRED list
 *   - +20 if destinationCode is in user DREAM list
 *   - -50 if destinationCode is in user EXCLUDED list (filtered out)
 *   - ×  recency decay: signals > 7 days old are multiplied by 0.5
 *
 * HOOKS FOR FUTURE SIGNALS
 * ─────────────────────────────────────────────────────────────────────────────
 * Any VST service can call ingestSignal() without knowing about users.
 * The radar layer handles all user-relevance logic centrally.
 * This means adding a new signal source = one call to ingestSignal().
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RadarSignalType, MembershipTier } from '@prisma/client';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateRadarSignalDto {
  type:            RadarSignalType;
  destinationCode: string;
  destinationName?: string;
  payload:         Record<string, unknown>;  // type-specific data
  strength?:       number;   // 0–100; defaults to 50
  expiresAt?:      Date;     // signal auto-expires; defaults to 7 days from now
}

export interface RadarSignalRelevance {
  signalId:        string;
  type:            RadarSignalType;
  destinationCode: string;
  destinationName: string | null;
  payload:         unknown;
  baseStrength:    number;
  relevanceScore:  number;   // user-adjusted score
  ageHours:        number;
  expiresAt:       Date | null;
}

export interface WeeklyDigestDto {
  userId:        string;
  generatedAt:   string;
  topSignals:    RadarSignalRelevance[];
  signalCount:   number;
  isEligible:    boolean;    // false for GUEST tier (radar is PREMIUM+)
}

// Tier gate — radar digest requires PREMIUM or VOYAGE_ELITE
const RADAR_ELIGIBLE_TIERS: MembershipTier[] = [
  MembershipTier.PREMIUM,
  MembershipTier.VOYAGE_ELITE,
];

const DECAY_THRESHOLD_DAYS  = 7;
const DECAY_MULTIPLIER       = 0.5;
const DEFAULT_SIGNAL_TTL_MS  = 7 * 24 * 3_600_000;
const DIGEST_TOP_N           = 5;

@Injectable()
export class TravelRadarService {
  private readonly logger = new Logger(TravelRadarService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Signal ingestion ──────────────────────────────────────────────────────

  /**
   * Ingest a radar signal from any VST subsystem.
   * Duplicate signals for the same destination+type within 1h are ignored
   * to prevent flooding from noisy sources.
   */
  async ingestSignal(dto: CreateRadarSignalDto): Promise<string> {
    const code     = dto.destinationCode.toUpperCase();
    const strength = dto.strength ?? 50;
    const expiresAt = dto.expiresAt
      ?? new Date(Date.now() + DEFAULT_SIGNAL_TTL_MS);

    // Dedup: skip if an identical type+destination signal exists in the last hour
    const recent = await this.prisma.radarSignal.findFirst({
      where: {
        type:            dto.type,
        destinationCode: code,
        createdAt:       { gte: new Date(Date.now() - 3_600_000) },
      },
    });

    if (recent) {
      this.logger.debug(
        `Radar signal deduped: ${dto.type} for ${code} (existing: ${recent.id})`,
      );
      return recent.id;
    }

    const signal = await this.prisma.radarSignal.create({
      data: {
        type:            dto.type,
        destinationCode: code,
        destinationName: dto.destinationName,
        payload:         dto.payload as any,
        strength,
        expiresAt,
      },
    });

    this.logger.debug(`Radar signal ingested: ${dto.type} for ${code} strength=${strength}`);
    return signal.id;
  }

  // ── User-relevant signal query ────────────────────────────────────────────

  /**
   * Returns active signals ordered by relevance to the given user's
   * destination preferences.
   * Excluded destinations are filtered out.
   * Expired signals are excluded.
   */
  async getSignalsForUser(
    userId: string,
    limit   = 20,
  ): Promise<RadarSignalRelevance[]> {
    const now = new Date();

    const [signals, destPrefs] = await Promise.all([
      this.prisma.radarSignal.findMany({
        where: {
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: now } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take:    100,   // fetch more, score, then trim
      }),
      this.prisma.userDestinationPreference.findMany({
        where: { userId },
        select: { destinationCode: true, type: true },
      }),
    ]);

    const prefMap = new Map(
      destPrefs.map(d => [d.destinationCode, d.type]),
    );

    const scored: RadarSignalRelevance[] = [];

    for (const sig of signals) {
      const prefType = prefMap.get(sig.destinationCode);
      // Hard suppress excluded destinations
      if (prefType === 'EXCLUDED') continue;

      let relevance = sig.strength;
      if (prefType === 'PREFERRED') relevance += 30;
      if (prefType === 'DREAM')     relevance += 20;

      // Recency decay
      const ageHours = (now.getTime() - sig.createdAt.getTime()) / 3_600_000;
      if (ageHours > DECAY_THRESHOLD_DAYS * 24) {
        relevance = Math.round(relevance * DECAY_MULTIPLIER);
      }

      scored.push({
        signalId:        sig.id,
        type:            sig.type,
        destinationCode: sig.destinationCode,
        destinationName: sig.destinationName,
        payload:         sig.payload,
        baseStrength:    sig.strength,
        relevanceScore:  Math.min(relevance, 100),
        ageHours:        Math.round(ageHours),
        expiresAt:       sig.expiresAt,
      });
    }

    return scored
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, limit);
  }

  // ── Weekly digest builder ─────────────────────────────────────────────────

  /**
   * Builds a weekly radar digest for a user.
   * Returns top DIGEST_TOP_N signals by relevance.
   * Returns isEligible=false for GUEST tier (radar is PREMIUM+ only).
   */
  async buildWeeklyDigest(
    userId: string,
    tier:   MembershipTier,
  ): Promise<WeeklyDigestDto> {
    const isEligible = RADAR_ELIGIBLE_TIERS.includes(tier);

    if (!isEligible) {
      return {
        userId,
        generatedAt: new Date().toISOString(),
        topSignals:  [],
        signalCount: 0,
        isEligible:  false,
      };
    }

    const signals = await this.getSignalsForUser(userId, DIGEST_TOP_N);

    return {
      userId,
      generatedAt: new Date().toISOString(),
      topSignals:  signals,
      signalCount: signals.length,
      isEligible:  true,
    };
  }

  // ── Convenience ingestion methods for VST subsystems ─────────────────────
  // These wrappers give callers a typed interface without knowing the signal schema.

  /** Called when a price drop is detected on a popular route. */
  async signalPriceDrop(
    destinationCode: string,
    destinationName: string,
    dropPct:         number,
    newPricePence:   number,
  ): Promise<void> {
    await this.ingestSignal({
      type:            RadarSignalType.PRICE_DROP,
      destinationCode,
      destinationName,
      strength:        Math.min(30 + dropPct, 100),
      payload:         { dropPct, newPricePence },
    });
  }

  /** Called when multiple events cluster at a destination this week. */
  async signalEventCluster(
    destinationCode: string,
    destinationName: string,
    eventCount:      number,
    categories:      string[],
  ): Promise<void> {
    await this.ingestSignal({
      type:            RadarSignalType.EVENT_CLUSTER,
      destinationCode,
      destinationName,
      strength:        Math.min(40 + eventCount * 3, 90),
      payload:         { eventCount, categories },
      expiresAt:       new Date(Date.now() + 3 * 24 * 3_600_000),  // 3 days
    });
  }

  /** Called when an explorer pin surpasses an engagement threshold. */
  async signalViralPin(
    destinationCode: string,
    pinId:           string,
    pinTitle:        string,
  ): Promise<void> {
    await this.ingestSignal({
      type:            RadarSignalType.VIRAL_PIN,
      destinationCode,
      strength:        60,
      payload:         { pinId, pinTitle },
    });
  }

  /** Called by VisaService when a country eases entry requirements. */
  async signalVisaChange(
    destinationCode: string,
    destinationName: string,
    changeNote:      string,
  ): Promise<void> {
    await this.ingestSignal({
      type:            RadarSignalType.VISA_CHANGE,
      destinationCode,
      destinationName,
      strength:        70,
      payload:         { changeNote },
    });
  }

  /** Called by SafetyService when a travel advisory is lifted or downgraded. */
  async signalSafetyChange(
    destinationCode: string,
    destinationName: string,
    previousLevel:   string,
    newLevel:        string,
  ): Promise<void> {
    await this.ingestSignal({
      type:            RadarSignalType.SAFETY_CHANGE,
      destinationCode,
      destinationName,
      strength:        75,
      payload:         { previousLevel, newLevel },
    });
  }
}
