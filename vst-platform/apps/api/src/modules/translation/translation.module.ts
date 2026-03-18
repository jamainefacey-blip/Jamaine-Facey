import { Module } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';
import { StubTranslationProvider } from './providers/stub.provider';
import { RedisService } from '../../integrations/redis/redis.service';
import { AuthModule } from '../auth/auth.module';

/**
 * TranslationModule
 *
 * Providers registered here:
 *   StubTranslationProvider  — active in Phase 5 (TRANSLATION_PROVIDER=stub)
 *   RedisService             — quota tracking
 *
 * Phase 6: add GoogleTranslateProvider / DeepLProvider here.
 * TranslationService selects the active provider at runtime via env var —
 * no code changes needed to switch.
 */
@Module({
  imports:     [AuthModule],
  controllers: [TranslationController],
  providers:   [TranslationService, StubTranslationProvider, RedisService],
  exports:     [TranslationService],
})
export class TranslationModule {}
