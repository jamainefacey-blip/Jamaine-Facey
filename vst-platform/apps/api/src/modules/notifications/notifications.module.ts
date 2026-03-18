import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TwilioService } from '../../integrations/twilio/twilio.service';
import { ResendService } from '../../integrations/resend/resend.service';
import { RedisService } from '../../integrations/redis/redis.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, TwilioService, ResendService, RedisService],
  // Export NotificationsService + RedisService so other modules can use both
  exports: [NotificationsService, TwilioService, ResendService, RedisService],
})
export class NotificationsModule {}
