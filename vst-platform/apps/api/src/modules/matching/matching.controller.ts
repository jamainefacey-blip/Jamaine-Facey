/**
 * MatchingController — Route plan
 *
 *   GET /v1/matching/opportunities   — ranked opportunity list for this user
 *
 * Query params:
 *   mode     LOCAL | LONG_DISTANCE | BOTH (default: BOTH)
 *   limit    1–50 (default: 10; capped by tier)
 *   tripType optional TripType filter
 *   lat      user latitude (LOCAL mode; optional)
 *   lng      user longitude (LOCAL mode; optional)
 *
 * Auth: ClerkAuthGuard. User reads their own opportunities only.
 * Tier: response content gated by membership tier (GUEST / PREMIUM / ELITE).
 */

import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  ForbiddenException,
  HttpCode,
} from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingRunnerService } from './matching-runner.service';
import { MatchingQueryOptions } from './dto/matching-result.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { MembershipTier } from '@prisma/client';

@Controller('matching')
@UseGuards(ClerkAuthGuard)
export class MatchingController {
  constructor(
    private readonly matchingService:  MatchingService,
    private readonly runnerService:    MatchingRunnerService,
  ) {}

  /**
   * GET /v1/matching/opportunities
   *
   * Returns a ranked list of travel + local opportunities matching the user's
   * stored preference profile and availability windows.
   *
   * Result depth varies by tier:
   *   GUEST         — up to 3 opportunities (LOCAL + SHORT_BREAK)
   *   PREMIUM       — up to 10 (+ WEEK_HOLIDAY, LAST_MINUTE, PRICE_DROP_MATCH)
   *   VOYAGE_ELITE  — up to 50 (all types including LONG_HAUL + LONG_WAY_ROUND)
   *
   * Phase 5: preference-aware stub scoring.
   * Phase 6: live pricing, EventsService geospatial, Redis cached results.
   */
  @Get('opportunities')
  getOpportunities(
    @CurrentUser() user: AuthenticatedUser,
    @Query('mode')      mode?:     string,
    @Query('limit')     limit?:    string,
    @Query('tripType')  tripType?: string,
    @Query('lat')       lat?:      string,
    @Query('lng')       lng?:      string,
  ) {
    const tier = (user.membership?.tier ?? MembershipTier.GUEST);

    const options: MatchingQueryOptions = {
      mode:     (mode as any) ?? 'BOTH',
      limit:    limit ? Math.min(parseInt(limit, 10), 50) : 10,
      tripType: tripType ?? undefined,
      lat:      lat  ? parseFloat(lat)  : undefined,
      lng:      lng  ? parseFloat(lng)  : undefined,
    };

    return this.matchingService.getOpportunities(user.id, tier, options);
  }

  // ── Dev-only manual triggers ───────────────────────────────────────────────
  // These routes allow the nightly and weekly cron jobs to be triggered
  // on-demand during staging validation — without waiting for the cron window.
  //
  // GUARD: throws 403 in NODE_ENV=production.
  // Auth: ClerkAuthGuard still required — must be a signed-in user.

  /**
   * POST /v1/matching/dev/run-nightly
   * Immediately runs the nightly opportunity evaluation job.
   * Processes all users with opportunityAlerts=true.
   * Blocked in production.
   */
  @Post('dev/run-nightly')
  @HttpCode(200)
  async devRunNightly() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev trigger not available in production');
    }
    await this.runnerService.runNightlyOpportunityEvaluation();
    return { triggered: 'nightly_opportunity_eval', completedAt: new Date().toISOString() };
  }

  /**
   * POST /v1/matching/dev/run-radar
   * Immediately runs the weekly travel radar digest job.
   * Sends digests to all PREMIUM/ELITE users with travelRadarAlerts=true.
   * Blocked in production.
   */
  @Post('dev/run-radar')
  @HttpCode(200)
  async devRunRadar() {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Dev trigger not available in production');
    }
    await this.runnerService.runWeeklyTravelRadar();
    return { triggered: 'weekly_travel_radar', completedAt: new Date().toISOString() };
  }
}
