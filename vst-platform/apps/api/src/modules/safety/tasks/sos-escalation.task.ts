import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SafetyService } from '../safety.service';

/**
 * Scheduled task: escalates SOS events that remain ACTIVE for >30 minutes.
 *
 * Runs every 5 minutes. Safe to run in parallel — Prisma query is idempotent.
 *
 * IMPORTANT: Do not gate or disable this task based on env flags.
 * Safety escalation must run in all environments including staging.
 */
@Injectable()
export class SosEscalationTask {
  private readonly logger = new Logger(SosEscalationTask.name);

  constructor(private readonly safetyService: SafetyService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async run() {
    const count = await this.safetyService.escalateStaleEvents();
    if (count > 0) {
      this.logger.warn(`Escalated ${count} stale SOS event(s)`);
    }
  }
}
