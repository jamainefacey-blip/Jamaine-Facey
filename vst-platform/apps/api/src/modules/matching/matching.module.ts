import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { PreferencesModule } from '../preferences/preferences.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:     [AuthModule, PreferencesModule],
  controllers: [MatchingController],
  providers:   [MatchingService],
  exports:     [MatchingService],   // AvaService reads top opportunities for context
})
export class MatchingModule {}
