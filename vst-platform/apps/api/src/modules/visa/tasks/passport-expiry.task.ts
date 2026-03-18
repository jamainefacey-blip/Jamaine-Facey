import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../../database/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';

@Injectable()
export class PassportExpiryTask {
  private readonly logger = new Logger(PassportExpiryTask.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Runs daily at 09:00 UTC.
   * Finds all passports where (expiryDate - alertDaysBefore) <= today
   * and no PASSPORT_EXPIRY notification has been sent in the last 24h.
   * Deduplication prevents daily spam while ensuring the alert still fires
   * if the user first sets up the passport close to expiry.
   */
  @Cron('0 9 * * *')
  async run(): Promise<void> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // All passports whose alert window has opened.
    // alertDaysBefore stored as Int on Passport model.
    const passports = await this.prisma.passport.findMany({});

    const due = passports.filter(p => {
      const alertDate = new Date(p.expiryDate);
      alertDate.setDate(alertDate.getDate() - p.alertDaysBefore);
      return alertDate <= today;
    });

    if (due.length === 0) return;

    let alertsSent = 0;

    for (const passport of due) {
      // Deduplication — skip if a PASSPORT_EXPIRY alert was sent in the last 24h.
      const recentAlert = await this.prisma.notification.findFirst({
        where: {
          userId:    passport.userId,
          type:      'PASSPORT_EXPIRY',
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      });

      if (recentAlert) continue;

      const daysRemaining = Math.ceil(
        (passport.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
      );

      await this.notificationsService.sendPassportExpiryAlert(
        passport.userId,
        daysRemaining,
        passport.nationality,
      );

      alertsSent++;
    }

    if (alertsSent > 0) {
      this.logger.log(`Passport expiry: sent ${alertsSent} alert(s)`);
    }
  }
}
