import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TwilioService } from '../../integrations/twilio/twilio.service';
import { ResendService } from '../../integrations/resend/resend.service';

// ── HTML email template helpers ───────────────────────────────────────────────

function sosEmailHtml(contactName: string, triggerName: string, locationText: string, message: string | null): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#09101f;color:#e2e8f0;padding:32px;border-radius:8px;">
      <div style="background:#dc2626;padding:16px;border-radius:6px;margin-bottom:24px;">
        <h1 style="margin:0;font-size:20px;color:#fff;">⚠️ SOS ALERT — Voyage Smart Travel</h1>
      </div>
      <p style="font-size:16px;">Hi <strong>${contactName}</strong>,</p>
      <p style="font-size:16px;"><strong>${triggerName}</strong> has triggered an SOS alert on Voyage Smart Travel.</p>
      <table style="width:100%;background:#1a2540;border-radius:6px;padding:16px;margin:24px 0;">
        <tr><td style="padding:8px 0;color:#7d8fa6;">Location</td><td style="padding:8px 0;">${locationText}</td></tr>
        ${message ? `<tr><td style="padding:8px 0;color:#7d8fa6;">Message</td><td style="padding:8px 0;">${message}</td></tr>` : ''}
      </table>
      <p style="color:#7d8fa6;font-size:13px;border-top:1px solid #1e2d4a;padding-top:16px;margin-top:24px;">
        This is NOT a substitute for 999, 112, or local emergency services.<br/>
        If you believe this person is in immediate danger, contact emergency services immediately.
      </p>
    </div>`;
}

function priceAlertEmailHtml(destination: string, dropPct: number, newPrice: number, affiliateUrl: string): string {
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#09101f;color:#e2e8f0;padding:32px;border-radius:8px;">
      <h1 style="color:#d4a853;font-size:22px;">Price Drop Alert 📉</h1>
      <p style="font-size:16px;">A price you're tracking has dropped <strong>${dropPct}%</strong> for <strong>${destination}</strong>.</p>
      <p style="font-size:24px;font-weight:bold;color:#d4a853;">Now £${(newPrice / 100).toFixed(2)}</p>
      <a href="${affiliateUrl}" style="display:inline-block;background:#d4a853;color:#09101f;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:bold;margin-top:16px;">
        View Deal
      </a>
      <p style="color:#7d8fa6;font-size:13px;margin-top:24px;">Prices change frequently. This alert is for reference only.</p>
    </div>`;
}

function passportExpiryEmailHtml(daysRemaining: number, nationality: string): string {
  const urgent = daysRemaining <= 30;
  return `
    <div style="font-family:sans-serif;max-width:560px;margin:0 auto;background:#09101f;color:#e2e8f0;padding:32px;border-radius:8px;">
      <h1 style="color:${urgent ? '#dc2626' : '#d4a853'};font-size:22px;">${urgent ? '🚨' : '⚠️'} Passport Expiry Reminder</h1>
      <p style="font-size:16px;">Your <strong>${nationality}</strong> passport expires in <strong>${daysRemaining} days</strong>.</p>
      <p style="font-size:15px;color:#7d8fa6;">Many countries require 6 months validity beyond your travel dates. Check requirements before booking.</p>
    </div>`;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // In-memory push subscription store — Phase 4: move to Redis or DB table
  private readonly pushSubscriptions = new Map<string, any[]>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly twilio: TwilioService,
    private readonly resend: ResendService,
  ) {}

  // ── SOS dispatch (called by SafetyService + SosEscalationTask) ─────────────

  /**
   * Sends all PENDING SosContactNotification rows for a given SOS event.
   * Updates each row status to SENT or FAILED based on delivery result.
   * This is the method that was stubbed in Phase 2 Safety module.
   */
  async dispatchSosNotifications(sosEventId: string): Promise<void> {
    const pendingNotifs = await this.prisma.sosContactNotification.findMany({
      where: { sosEventId, status: 'PENDING' },
      include: { safetyContact: true, sosEvent: { include: { user: { include: { profile: true } } } } },
    });

    if (pendingNotifs.length === 0) return;

    const { sosEvent } = pendingNotifs[0];
    const triggerName = sosEvent.user.profile
      ? `${sosEvent.user.profile.firstName} ${sosEvent.user.profile.lastName}`
      : sosEvent.user.email;
    const locationText = sosEvent.locationName ?? 'Location not shared';

    for (const notif of pendingNotifs) {
      const contact = notif.safetyContact;
      let success = false;

      if (notif.channel === 'SMS' && contact.phone) {
        const body =
          `🚨 VST SOS ALERT: ${triggerName} has triggered an SOS. ` +
          `Location: ${locationText}. ` +
          (sosEvent.message ? `Message: ${sosEvent.message}. ` : '') +
          `NOT a substitute for 999/112.`;
        success = await this.twilio.sendSms(contact.phone, body);

      } else if (notif.channel === 'EMAIL' && contact.email) {
        success = await this.resend.send({
          to: contact.email,
          subject: `⚠️ SOS Alert — ${triggerName} needs help`,
          html: sosEmailHtml(contact.name, triggerName, locationText, sosEvent.message),
        });
      }

      await this.prisma.sosContactNotification.update({
        where: { id: notif.id },
        data: { status: success ? 'SENT' : 'FAILED', sentAt: success ? new Date() : null },
      });

      this.logger.log(
        `SOS notif ${notif.channel} → ${contact.name} | ${success ? 'SENT' : 'FAILED'}`,
      );
    }
  }

  // ── General notification creation + routing ────────────────────────────────

  async sendPriceAlert(
    userId: string,
    destination: string,
    dropPct: number,
    newPrice: number,
    affiliateUrl: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { preferences: true },
    });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'PRICE_ALERT',
        channel: 'IN_APP',
        title: `Price drop: ${destination}`,
        body: `Price dropped ${dropPct}% — now £${(newPrice / 100).toFixed(2)}`,
        data: { destination, dropPct, newPrice, affiliateUrl },
      },
    });

    if (user.preferences?.emailAlerts) {
      await this.resend.send({
        to: user.email,
        subject: `Price drop alert — ${destination}`,
        html: priceAlertEmailHtml(destination, dropPct, newPrice, affiliateUrl),
      });
    }
  }

  async sendPassportExpiryAlert(userId: string, daysRemaining: number, nationality: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'PASSPORT_EXPIRY',
        channel: 'IN_APP',
        title: 'Passport expiring soon',
        body: `Your ${nationality} passport expires in ${daysRemaining} days`,
        data: { daysRemaining, nationality },
      },
    });

    await this.resend.send({
      to: user.email,
      subject: `Passport expiry reminder — ${daysRemaining} days`,
      html: passportExpiryEmailHtml(daysRemaining, nationality),
    });
  }

  // ── Push subscriptions ─────────────────────────────────────────────────────

  registerPushSubscription(userId: string, subscription: any): void {
    const subs = this.pushSubscriptions.get(userId) ?? [];
    const exists = subs.some(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      this.pushSubscriptions.set(userId, subs);
    }
    // Phase 4: persist to DB or Redis for cross-instance support
  }

  removePushSubscription(userId: string, endpoint: string): void {
    const subs = this.pushSubscriptions.get(userId) ?? [];
    this.pushSubscriptions.set(userId, subs.filter(s => s.endpoint !== endpoint));
  }

  // ── Notification list + read state ────────────────────────────────────────

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userId } }),
    ]);
    return { items, meta: { page, limit, total } };
  }

  async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notif = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notif || notif.userId !== userId) throw new NotFoundException('Notification not found');
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() },
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}
