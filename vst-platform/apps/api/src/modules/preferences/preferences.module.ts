import { Module } from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { PreferencesController } from './preferences.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports:     [AuthModule],
  controllers: [PreferencesController],
  providers:   [PreferencesService],
  exports:     [PreferencesService],   // MatchingService + AvaService read from here
})
export class PreferencesModule {}
