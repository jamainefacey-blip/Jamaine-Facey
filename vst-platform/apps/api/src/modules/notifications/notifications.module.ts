import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TwilioService } from '../../integrations/twilio/twilio.service';
import { ResendService } from '../../integrations/resend/resend.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, TwilioService, ResendService],
  // Export NotificationsService so SafetyModule can call dispatchSosNotifications
  exports: [NotificationsService, TwilioService, ResendService],
})
export class NotificationsModule {}
