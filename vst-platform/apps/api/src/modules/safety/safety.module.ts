import { Module } from '@nestjs/common';
import { SafetyService } from './safety.service';
import { SafetyController, CheckInController } from './safety.controller';
import { SosEscalationTask } from './tasks/sos-escalation.task';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SafetyController, CheckInController],
  providers: [SafetyService, SosEscalationTask],
  exports: [SafetyService],
})
export class SafetyModule {}
