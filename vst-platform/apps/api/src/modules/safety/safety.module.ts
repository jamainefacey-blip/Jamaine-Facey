import { Module, forwardRef } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { SafetyController, CheckInController } from './safety.controller';
import { SosEscalationTask } from './tasks/sos-escalation.task';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  // forwardRef prevents circular dependency: SafetyModule ↔ NotificationsModule
  imports: [AuthModule, forwardRef(() => NotificationsModule)],
  controllers: [SafetyController, CheckInController],
  providers: [SafetyService, SosEscalationTask],
  exports: [SafetyService],
})
export class SafetyModule {}
