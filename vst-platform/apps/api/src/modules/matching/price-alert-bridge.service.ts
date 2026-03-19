/**
 * PriceAlertBridgeService — Phase 6
 *
 * RESPONSIBILITY
 * ─────────────────────────────────────────────────────────────────────────────
 * Bridges the existing PriceAlert system with the matching engine.
 * When a price drop is detected for a route/destination, this service
 * determines whether any user has that destination flagged as PREFERRED
 * or DREAM, and whether the new price fits within their budget band.
 *
 * If both conditions are true, a PRICE_DROP_MATCH notification is created
 * in-app, and an optional push is sent.
 *
 * INVOCATION
 * ─────────────────────────────────────────────────────────────────────────────
 * Called from the nightly matching runner (MatchingRunnerService) which
 * scans recently-triggered PriceAlert rows. This avoids coupling to
 * NotificationsService and prevents circular module dependencies.
 *
 * Can also be called directly in future from a dedicated price-monitoring
 * job when live fare data is integrated (Phase 7).
 *
 * BUDGET MATCHING
 * ─────────────────────────────────────────────────────────────────────────────
 * Priority order for budget comparison:
 *   1. budgetMaxGbp (precise pence value) if set
 *   2. budgetRange enum → implied max pence ceiling:
 *       BUDGET    → £500/person  (50_000 pence)
 *       MODERATE  → £1,500/person (150_000 pence)
 *       PREMIUM   → £3,000/person (300_000 pence)
 *       LUXURY    → unlimited (always matches)
 */

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// Implied budget ceilings (pence) for BudgetRange enum values
const BUDGET_RANGE_CEILING: Record<string, number> = {
  BUDGET:   50_000,
  MODERATE: 150_000,
  PREMIUM:  300_000,
  LUXURY:   Infinity,
};

@Injectable()
export class PriceAlertBridgeService {
  private readonly logger = new Logger(PriceAlertBridgeService.name);

  constructor(
    private readonly prisma:         PrismaService,
    private readonly notifications:  NotificationsService,
  ) {}

  /**
   * Scans all PriceAlert rows triggered within the last 48h and cross-references
   * them with user destination preferences and budget bands.
   *
   * Creates a PRICE_DROP_MATCH notification + optional push for each match found.
   * Called by MatchingRunnerService as part of the nightly evaluation.
   *
   * Returns the count of matches surfaced.
   */
  async runBridgeScan(): Promise<number> {
    const cutoff = new Date(Date.now() - 48 * 3_600_000);

    const triggeredAlerts = await this.prisma.priceAlert.findMany({
      where: {
        isActive:    true,
        triggeredAt: { gte: cutoff },
      },
      include: {
        user: {
          include: {
            preferences:           true,
            destinationPreferences: true,
            membership:            { select: { tier: true, status: true } },
          },
        },
      },
    });

    if (triggeredAlerts.length === 0) return 0;

    this.logger.debug(`PriceAlert bridge scan: ${triggeredAlerts.length} recently triggered alerts`);

    let matched = 0;

    for (const alert of triggeredAlerts) {
      const { user } = alert;
      if (!user) continue;

      // Destination preference check
      const destCode = alert.destination.toUpperCase();
      const destPref = user.destinationPreferences?.find(
        d => d.destinationCode === destCode &&
             (d.type === 'PREFERRED' || d.type === 'DREAM'),
      );
      if (!destPref) continue;

      // Budget check
      const newPricePence = alert.targetPrice ?? 0;
      if (newPricePence > 0 && !this.withinBudget(user.preferences, newPricePence)) {
        continue;
      }

      // Dedup: don't re-notify if a PRICE_DROP_MATCH for this alert already exists in 48h
      const alreadyNotified = await this.prisma.notification.findFirst({
        where: {
          userId:    user.id,
          type:      'OPPORTUNITY_MATCH',
          createdAt: { gte: cutoff },
          data:      { path: ['alertId'], equals: alert.id },
        },
      });
      if (alreadyNotified) continue;

      const priceHint = alert.targetPrice
        ? `from £${(alert.targetPrice / 100).toFixed(0)}`
        : 'Price dropped';
      const title = `Price drop: ${alert.destination}`;
      const body  = `${priceHint} — matches your ${destPref.type.toLowerCase()} destination`;

      await this.prisma.notification.create({
        data: {
          userId:  user.id,
          type:    'OPPORTUNITY_MATCH',
          channel: 'IN_APP',
          title,
          body,
          data: {
            type:            'PRICE_DROP_MATCH',
            alertId:         alert.id,
            destinationCode: destCode,
            priceHint,
            destPrefType:    destPref.type,
          },
        },
      });

      if (user.preferences?.pushNotifications) {
        await this.notifications.sendPushToUser(user.id, title, body, {
          type:            'PRICE_DROP_MATCH',
          destinationCode: destCode,
        });
      }

      this.logger.debug(
        `PRICE_DROP_MATCH: user=${user.id} dest=${destCode} ` +
        `prefType=${destPref.type} price=${newPricePence}p`,
      );

      matched++;
    }

    this.logger.log(`PriceAlert bridge: ${matched} matches surfaced from ${triggeredAlerts.length} alerts`);
    return matched;
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private withinBudget(
    prefs: { budgetMaxGbp: number | null; budgetRange: string } | null,
    pricePence: number,
  ): boolean {
    if (!prefs) return true;  // no preferences = no filter
    if (pricePence <= 0)      return true;  // zero price always matches

    // Precise budget band takes precedence
    if (prefs.budgetMaxGbp != null && prefs.budgetMaxGbp > 0) {
      return pricePence <= prefs.budgetMaxGbp;
    }

    // Fall back to BudgetRange ceiling
    const ceiling = BUDGET_RANGE_CEILING[prefs.budgetRange] ?? Infinity;
    return pricePence <= ceiling;
  }
}
