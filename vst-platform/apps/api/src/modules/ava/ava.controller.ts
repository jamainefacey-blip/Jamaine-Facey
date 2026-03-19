/**
 * Ava Controller — Route plan
 *
 *   POST /v1/ava/query                — main conversational endpoint
 *   GET  /v1/ava/capabilities?mode=   — returns active + stubbed feature set
 *
 * Auth: all routes require ClerkAuthGuard.
 * Tier: all authenticated users can access Ava (GUEST included).
 *       Feature depth varies by tier (surfaced in response suggestions).
 */

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AvaService } from './ava.service';
import { AvaQueryDto, AvaMode } from './dto/ava.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { MembershipTier } from '@prisma/client';

@Controller('ava')
@UseGuards(ClerkAuthGuard)
export class AvaController {
  constructor(private readonly avaService: AvaService) {}

  /**
   * POST /v1/ava/query
   * Main Ava conversation endpoint.
   * Accepts a message + context, returns structured reply + suggestions.
   *
   * Phase 5: rule-based responses.
   * Phase 6: Claude claude-haiku-4-5 + claude-sonnet-4-6 with VST tool use.
   */
  @Post('query')
  query(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AvaQueryDto,
  ) {
    const tier = user.membership?.tier ?? MembershipTier.GUEST;
    return this.avaService.query(user.id, dto, tier);
  }

  /**
   * GET /v1/ava/capabilities?mode=LOCAL|LONG_DISTANCE
   * Returns active and stubbed capabilities for the given mode.
   * Used by the frontend Ava panel to render the correct feature set.
   */
  @Get('capabilities')
  getCapabilities(@Query('mode') mode: string) {
    const resolvedMode: AvaMode =
      mode === 'LOCAL' ? 'LOCAL' : 'LONG_DISTANCE';
    return this.avaService.getCapabilities(resolvedMode);
  }
}
