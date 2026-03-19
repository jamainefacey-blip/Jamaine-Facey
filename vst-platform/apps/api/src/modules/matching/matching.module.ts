import { Module } from '@nestjs/common';
import { MatchingService } from './matching.service';
import { MatchingController } from './matching.controller';
import { LiveSeedService } from './live-seed.service';
import { MatchingRunnerService } from './matching-runner.service';
import { PriceAlertBridgeService } from './price-alert-bridge.service';
import { TravelRadarService } from './travel-radar.service';
import { LongWayRoundService } from './long-way-round.service';
import { LongWayRoundController } from './long-way-round.controller';
import { PreferencesModule } from '../preferences/preferences.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports:     [AuthModule, PreferencesModule, NotificationsModule],
  controllers: [MatchingController, LongWayRoundController],
  providers:   [
    MatchingService,
    LiveSeedService,
    MatchingRunnerService,
    PriceAlertBridgeService,
    TravelRadarService,
    LongWayRoundService,
  ],
  exports:     [MatchingService, MatchingRunnerService, TravelRadarService],
})
export class MatchingModule {}
