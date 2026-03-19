/**
 * MatchingRunnerService — Phase 6 Scheduled Matching Engine
 *
 * JOBS
 * ─────────────────────────────────────────────────────────────────────────────
 * 1. NIGHTLY_OPPORTUNITY_EVAL  — 02:00 UTC daily
 *    Scans users with opportunityAlerts=true, runs MatchingService, and creates
 *    OPPORTUNITY_MATCH notifications for high-confidence results (score ≥ 70).
 *    Also creates LAST_MINUTE notifications for users with lastMinuteAlerts=true
 *    when a departing-soon opportunity scores ≥ 50.
 *
 * 2. WEEKLY_TRAVEL_RADAR       — 08:00 UTC every Monday
 *    Scans users with travelRadarAlerts=true and creates a TRAVEL_RADAR
 *    notification carrying their top 3 opportunities as a digest payload.
 *
 * BATCHING
 * ─────────────────────────────────────────────────────────────────────────────
 * Users are processed in batches of BATCH_SIZE to avoid loading the full user
 * table into memory. A short pause between batches prevents DB saturation.
 *
 * NOTIFICATION WRITES
 * ─────────────────────────────────────────────────────────────────────────────
 * Notifications are written directly to the Notification table via PrismaService.
 * Push delivery is delegated to NotificationsService.sendPushToUser().
 * This keeps NotificationsService as the single push delivery path without
 * requiring MatchingModule to import NotificationsModule circularly.
 *
 * DEDUPLICATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Before creating a notification, the runner checks whether an identical
 * opportunity notification was already sent to this user within 24h.
 * This prevents double-alerting on restarts or overlapping job windows.
 *
 * SCORE THRESHOLDS
 * ─────────────────────────────────────────────────────────────────────────────
 *   OPPORTUNITY_MATCH  score ≥ 70  (high confidence)
 *   LAST_MINUTE        score ≥ 50  (urgency compensates for lower score)
 *   TRAVEL_RADAR       no minimum  (digest is informational, not urgent)
 */

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import { MatchingService } from './matching.service';
import { NotificationsService } from '../notifications/notifications.service';
import { PriceAlertBridgeService } from './price-alert-bridge.service';
import { MembershipTier } from '@prisma/client';

const BATCH_SIZE           = 100;
const BATCH_PAUSE_MS       = 100;
const OPPORTUNITY_THRESHOLD = 70;
const LAST_MINUTE_THRESHOLD = 50;
const DEDUP_WINDOW_MS      = 24 * 3_600_000; // 24h

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

@Injectable()
export class MatchingRunnerService {
  private readonly logger = new Logger(MatchingRunnerService.name);

  constructor(
    private readonly prisma:         PrismaService,
    private readonly matching:       MatchingService,
    private readonly notifications:  NotificationsService,
    private readonly priceAlertBridge: PriceAlertBridgeService,
  ) {}

  // ── Nightly opportunity evaluation ────────────────────────────────────────

  /**
   * Runs daily at 02:00 UTC.
   * Evaluates opportunities for all users with opportunityAlerts=true.
   */
  @Cron('0 2 * * *', { name: 'nightly_opportunity_eval', timeZone: 'UTC' })
  async runNightlyOpportunityEvaluation(): Promise<void> {
    this.logger.log('Nightly opportunity evaluation started');
    let cursor: string | undefined;
    let totalNotified = 0;

    for (;;) {
      const users = await this.prisma.user.findMany({
        where: {
          preferences: {
            opportunityAlerts: true,
          },
        },
        select: {
          id:         true,
          email:      true,
          membership: { select: { tier: true } },
          preferences: {
            select: {
              lastMinuteAlerts:  true,
              pushNotifications: true,
            },
          },
        },
        take:    BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      });

      if (users.length === 0) break;
      cursor = users[users.length - 1].id;

      for (const user of users) {
        try {
          await this.evaluateAndNotifyUser(user);
          totalNotified++;
        } catch (err) {
          this.logger.error(`Runner failed for user ${user.id}: ${(err as Error).message}`);
        }
      }

      if (users.length === BATCH_SIZE) await sleep(BATCH_PAUSE_MS);
      else break;
    }

    // Run PriceAlert bridge scan as part of the same nightly window
    const priceMatches = await this.priceAlertBridge.runBridgeScan();
    this.logger.log(
      `Nightly evaluation complete. Evaluated ${totalNotified} users. ` +
      `PriceAlert bridge: ${priceMatches} matches surfaced.`,
    );
  }

  // ── Weekly travel radar digest ────────────────────────────────────────────

  /**
   * Runs every Monday at 08:00 UTC.
   * Creates TRAVEL_RADAR notification with top-3 opportunities as a digest.
   * Only for users with travelRadarAlerts=true and PREMIUM / VOYAGE_ELITE tier.
   */
  @Cron('0 8 * * 1', { name: 'weekly_travel_radar', timeZone: 'UTC' })
  async runWeeklyTravelRadar(): Promise<void> {
    this.logger.log('Weekly travel radar started');
    let cursor: string | undefined;
    let totalSent = 0;

    for (;;) {
      const users = await this.prisma.user.findMany({
        where: {
          preferences: { travelRadarAlerts: true },
          membership: {
            tier:   { in: [MembershipTier.PREMIUM, MembershipTier.VOYAGE_ELITE] },
            status: 'ACTIVE',
          },
        },
        select: {
          id:         true,
          email:      true,
          membership: { select: { tier: true } },
          preferences: { select: { pushNotifications: true } },
        },
        take:    BATCH_SIZE,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
      });

      if (users.length === 0) break;
      cursor = users[users.length - 1].id;

      for (const user of users) {
        try {
          await this.sendWeeklyRadarDigest(user);
          totalSent++;
        } catch (err) {
          this.logger.error(`Radar digest failed for user ${user.id}: ${(err as Error).message}`);
        }
      }

      if (users.length === BATCH_SIZE) await sleep(BATCH_PAUSE_MS);
      else break;
    }

    this.logger.log(`Weekly radar complete. Sent ${totalSent} digests.`);
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private async evaluateAndNotifyUser(user: {
    id:          string;
    email:       string;
    membership:  { tier: MembershipTier } | null;
    preferences: { lastMinuteAlerts: boolean; pushNotifications: boolean } | null;
  }): Promise<void> {
    const tier = user.membership?.tier ?? MembershipTier.GUEST;

    const { opportunities } = await this.matching.getOpportunities(
      user.id, tier, { mode: 'BOTH', limit: 10 },
    );

    for (const opp of opportunities) {
      if (opp.requiresUpgrade) continue;

      // High-confidence match
      if (opp.score >= OPPORTUNITY_THRESHOLD) {
        if (!await this.alreadyNotified(user.id, opp.id, 'OPPORTUNITY_MATCH')) {
          await this.createOpportunityNotification(user, opp, 'OPPORTUNITY_MATCH');
        }
      }

      // Last-minute urgency
      if (
        opp.isLastMinute &&
        opp.score >= LAST_MINUTE_THRESHOLD &&
        user.preferences?.lastMinuteAlerts
      ) {
        if (!await this.alreadyNotified(user.id, opp.id, 'LAST_MINUTE')) {
          await this.createOpportunityNotification(user, opp, 'LAST_MINUTE');
        }
      }
    }
  }

  private async sendWeeklyRadarDigest(user: {
    id:          string;
    email:       string;
    membership:  { tier: MembershipTier } | null;
    preferences: { pushNotifications: boolean } | null;
  }): Promise<void> {
    const tier = user.membership?.tier ?? MembershipTier.GUEST;

    const { opportunities } = await this.matching.getOpportunities(
      user.id, tier, { mode: 'BOTH', limit: 3 },
    );

    const top3 = opportunities.filter(o => !o.requiresUpgrade).slice(0, 3);
    if (top3.length === 0) return;

    const body = top3
      .map(o => `${o.destinationName} (${o.priceHint ?? 'Check prices'})`)
      .join(' · ');

    await this.prisma.notification.create({
      data: {
        userId:  user.id,
        type:    'TRAVEL_RADAR',
        channel: 'IN_APP',
        title:   'Your weekly travel radar',
        body,
        data: {
          opportunities: top3.map(o => ({
            id:              o.id,
            destinationCode: o.destinationCode,
            destinationName: o.destinationName,
            priceHint:       o.priceHint,
            score:           o.score,
            actions:         o.actions,
          })),
        },
      },
    });

    if (user.preferences?.pushNotifications) {
      await this.notifications.sendPushToUser(
        user.id,
        'Your weekly travel radar',
        body,
        { type: 'TRAVEL_RADAR', count: top3.length },
      );
    }

    this.logger.debug(`Radar digest sent to user ${user.id} with ${top3.length} opportunities`);
  }

  private async createOpportunityNotification(
    user: { id: string; preferences: { pushNotifications: boolean } | null },
    opp:  { id: string; destinationName: string; priceHint?: string; score: number; type: string; actions: any[] },
    notifType: 'OPPORTUNITY_MATCH' | 'LAST_MINUTE',
  ): Promise<void> {
    const title = notifType === 'LAST_MINUTE'
      ? `Last-minute deal: ${opp.destinationName}`
      : `Match for you: ${opp.destinationName}`;

    const body = opp.priceHint
      ? `${opp.priceHint} — ${opp.score}% match with your preferences`
      : `${opp.score}% match with your preferences`;

    await this.prisma.notification.create({
      data: {
        userId:  user.id,
        type:    notifType === 'LAST_MINUTE' ? 'OPPORTUNITY_MATCH' : 'OPPORTUNITY_MATCH',
        channel: 'IN_APP',
        title,
        body,
        data:    { opportunityId: opp.id, type: notifType, score: opp.score, actions: opp.actions },
      },
    });

    if (user.preferences?.pushNotifications) {
      await this.notifications.sendPushToUser(user.id, title, body, {
        type:          notifType,
        opportunityId: opp.id,
      });
    }
  }

  /**
   * Deduplication check — prevents re-sending the same opportunity within 24h.
   * Uses Notification.data.opportunityId to identify re-triggers.
   */
  private async alreadyNotified(
    userId:        string,
    opportunityId: string,
    type:          string,
  ): Promise<boolean> {
    const cutoff = new Date(Date.now() - DEDUP_WINDOW_MS);
    const existing = await this.prisma.notification.findFirst({
      where: {
        userId,
        type:      'OPPORTUNITY_MATCH',
        createdAt: { gte: cutoff },
        data:      { path: ['opportunityId'], equals: opportunityId },
      },
    });
    return existing !== null;
  }
}
