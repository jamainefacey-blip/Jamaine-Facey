/**
 * TranslationController — Route Plan
 *
 *   POST /v1/translate/text        — translate text (all authenticated tiers)
 *   GET  /v1/translate/languages   — list supported language codes
 *   POST /v1/translate/image       — camera/OCR translate (Phase 6, PREMIUM+)
 *   POST /v1/translate/conversation — live bidirectional translate (Phase 6, PREMIUM+)
 *
 * Quota enforcement: TranslationService (Redis-backed daily counter per user).
 * Tier gate: service-layer ForbiddenException on quota exceeded.
 */

import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
} from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslateTextDto } from './dto/translate-text.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { MembershipTier } from '@prisma/client';

@Controller('translate')
@UseGuards(ClerkAuthGuard)
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  /**
   * POST /v1/translate/text
   * Translate text into the target language.
   * Available to all authenticated users; daily quota varies by tier.
   *
   *   GUEST         : 5/day
   *   PREMIUM       : 100/day
   *   VOYAGE_ELITE  : unlimited
   */
  @Post('text')
  translateText(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TranslateTextDto,
  ) {
    const tier = (user.membership?.tier ?? MembershipTier.GUEST);
    return this.translationService.translateText(user.id, tier, dto);
  }

  /**
   * GET /v1/translate/languages
   * Returns supported ISO 639-1 language codes for the active provider.
   */
  @Get('languages')
  getSupportedLanguages() {
    return this.translationService.getSupportedLanguages();
  }

  /**
   * POST /v1/translate/image
   * Camera / OCR translation. STUB — Phase 6.
   */
  @Post('image')
  translateImage(@CurrentUser() user: AuthenticatedUser) {
    const tier = (user.membership?.tier ?? MembershipTier.GUEST);
    return this.translationService.translateImage(user.id, tier, '', '');
  }

  /**
   * POST /v1/translate/conversation
   * Live bidirectional translation. STUB — Phase 6.
   */
  @Post('conversation')
  startConversation(@CurrentUser() user: AuthenticatedUser) {
    const tier = (user.membership?.tier ?? MembershipTier.GUEST);
    return this.translationService.startConversation(user.id, tier, '', '');
  }
}
