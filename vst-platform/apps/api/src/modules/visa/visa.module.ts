import { Module } from '@nestjs/common';
import { VisaService } from './visa.service';
import { VisaController } from './visa.controller';
import { PassportExpiryTask } from './tasks/passport-expiry.task';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports:     [NotificationsModule],
  controllers: [VisaController],
  providers:   [VisaService, PassportExpiryTask],
  exports:     [VisaService],
})
export class VisaModule {}
