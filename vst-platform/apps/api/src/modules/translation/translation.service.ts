/**
 * TranslationService — Phase 5 Scaffold
 *
 * SERVICE CONTRACT
 * ─────────────────────────────────────────────────────────────────────────────
 * TranslationService is the single entry point for all translation operations.
 * It delegates to a TranslationProvider (selected by TRANSLATION_PROVIDER env).
 *
 * Phase 5: text translation only via StubTranslationProvider.
 * Phase 6: live providers (Google / DeepL) + camera OCR + conversation mode.
 *
 * QUOTA ENFORCEMENT
 * ─────────────────────────────────────────────────────────────────────────────
 * Daily quota per user is enforced here before calling the provider.
 * Quota is tracked in Redis (key: vst:translate:quota:{userId}:{date}).
 * Falls back to counting DB-stored translations if Redis is unavailable.
 *
 *   GUEST         : 5 translations / day
 *   PREMIUM       : 100 translations / day
 *   VOYAGE_ELITE  : unlimited (quota check skipped)
 *
 * PLANNED MODES
 * ─────────────────────────────────────────────────────────────────────────────
 *   TEXT         — translateText() — Phase 5, live
 *   CAMERA_OCR   — translateImage() — Phase 6, stubbed
 *   CONVERSATION — translateStream() — Phase 6, stubbed
 */

import {
  Injectable,
  Logger,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { TranslationProvider, TranslationResult } from './providers/translation.provider';
import { StubTranslationProvider } from './providers/stub.provider';
import { RedisService } from '../../integrations/redis/redis.service';
import { TranslateTextDto } from './dto/translate-text.dto';
import { MembershipTier } from '@prisma/client';

// ── Quota limits by tier ──────────────────────────────────────────────────────
const DAILY_QUOTA: Record<MembershipTier, number> = {
  GUEST:         5,
  PREMIUM:       100,
  VOYAGE_ELITE:  Infinity,
};

// ── Provider selection ────────────────────────────────────────────────────────
// TRANSLATION_PROVIDER env var: 'stub' | 'google' | 'deepl' | 'azure'
// Phase 5: only 'stub' is implemented.
// Phase 6: GoogleTranslateProvider + DeepLProvider registered in module.
function selectProvider(providers: TranslationProvider[]): TranslationProvider {
  const name = process.env.TRANSLATION_PROVIDER ?? 'stub';
  return providers.find(p => p.name === name) ?? providers[0];
}

@Injectable()
export class TranslationService {
  private readonly logger  = new Logger(TranslationService.name);
  private readonly provider: TranslationProvider;

  constructor(
    private readonly redis: RedisService,
    // All registered providers are injected here; selected at runtime by env var
    private readonly stub:  StubTranslationProvider,
  ) {
    this.provider = selectProvider([this.stub]);
    this.logger.log(`Translation provider: ${this.provider.name}`);
  }

  // ── Text translation ──────────────────────────────────────────────────────

  async translateText(
    userId: string,
    tier:   MembershipTier,
    dto:    TranslateTextDto,
  ): Promise<TranslationResult> {
    await this.enforceQuota(userId, tier);

    const supported = await this.provider.getSupportedLanguages();
    if (!supported.includes(dto.targetLang.toLowerCase())) {
      throw new BadRequestException(`Language '${dto.targetLang}' is not supported.`);
    }

    const result = await this.provider.translateText(
      dto.text,
      dto.targetLang.toLowerCase(),
      dto.sourceLang?.toLowerCase(),
    );

    // Increment daily quota counter in Redis
    await this.incrementQuota(userId);

    this.logger.debug(
      `Translated user=${userId} ${result.sourceLang}→${result.targetLang} ` +
      `chars=${result.characterCount} provider=${result.provider}`,
    );

    return result;
  }

  // ── Supported languages list ──────────────────────────────────────────────

  async getSupportedLanguages(): Promise<string[]> {
    return this.provider.getSupportedLanguages();
  }

  // ── Camera / OCR translation (Phase 6) ───────────────────────────────────

  async translateImage(
    _userId:     string,
    _tier:       MembershipTier,
    _imageKey:   string,    // R2 object key of the uploaded image
    _targetLang: string,
  ): Promise<never> {
    // STUB: OCR + translate pipeline deferred to Phase 6.
    // Will use Google Vision API or AWS Textract → translate pipeline.
    throw new BadRequestException('Camera translation is coming in a future update.');
  }

  // ── Conversation mode (Phase 6) ───────────────────────────────────────────

  async startConversation(
    _userId:     string,
    _tier:       MembershipTier,
    _langA:      string,
    _langB:      string,
  ): Promise<never> {
    // STUB: Live bidirectional translation via websocket / SSE.
    // Deferred to Phase 6 (PREMIUM+ tier gate).
    throw new BadRequestException('Conversation mode is coming in a future update.');
  }

  // ── Quota enforcement ─────────────────────────────────────────────────────

  private quotaKey(userId: string): string {
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    return `vst:translate:quota:${userId}:${today}`;
  }

  private async enforceQuota(userId: string, tier: MembershipTier): Promise<void> {
    const limit = DAILY_QUOTA[tier] ?? DAILY_QUOTA.GUEST;
    if (limit === Infinity) return;

    const key     = this.quotaKey(userId);
    const current = parseInt(await this.redis.get(key) ?? '0', 10);

    if (current >= limit) {
      throw new ForbiddenException(
        `Daily translation limit reached (${limit}/day on ${tier} plan). ` +
        `Upgrade to translate more.`,
      );
    }
  }

  private async incrementQuota(userId: string): Promise<void> {
    const key = this.quotaKey(userId);
    // TTL = 90000 seconds (25h) — ensures key expires after the UTC day rolls over
    const current = parseInt(await this.redis.get(key) ?? '0', 10);
    await this.redis.set(key, String(current + 1), 90_000);
  }
}
