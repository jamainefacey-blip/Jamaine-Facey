import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { TriggerSosDto } from './dto/trigger-sos.dto';
import { CreateCheckInDto } from './dto/create-check-in.dto';

@Injectable()
export class SafetyService {
  private readonly logger = new Logger(SafetyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── SOS ───────────────────────────────────────────────────────────────────

  /**
   * Trigger a SOS event for a user.
   *
   * Flow:
   * 1. Create SOS event record
   * 2. Fetch all safety contacts with notifyOnSos: true
   * 3. Create SosContactNotification rows (PENDING) for each contact × channel
   * 4. STUB: dispatch actual notifications (email/SMS/push — wired in Phase 3)
   *
   * IMPORTANT: SOS logic must never be conditionally disabled or gated by tier.
   * SOS is always free. Tier only affects channel count (email always; SMS = Premium+).
   */
  async triggerSos(userId: string, dto: TriggerSosDto) {
    // Prevent duplicate active SOS events
    const existing = await this.prisma.sosEvent.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'ESCALATED'] } },
    });

    if (existing) {
      throw new BadRequestException(
        'An active SOS event already exists. Resolve it before triggering a new one.',
      );
    }

    // Determine location name from coords if provided — STUB for geocoding
    // Phase 3: reverse geocode via Mapbox to get human-readable location name
    const locationName = dto.latitude && dto.longitude
      ? `${dto.latitude.toFixed(4)}, ${dto.longitude.toFixed(4)}`
      : null;

    const sosEvent = await this.prisma.sosEvent.create({
      data: {
        userId,
        triggerType: 'MANUAL',
        status: 'ACTIVE',
        latitude:     dto.latitude ?? null,
        longitude:    dto.longitude ?? null,
        locationName,
        message:      dto.message ?? null,
      },
    });

    // Fetch user membership to determine notification channels
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: { membership: true, safetyContacts: { where: { notifyOnSos: true } } },
    });

    const tier = user.membership?.tier ?? 'GUEST';
    const channels: Array<'EMAIL' | 'SMS'> = ['EMAIL'];
    if (tier === 'PREMIUM' || tier === 'VOYAGE_ELITE') channels.push('SMS');

    // Create notification records for every contact × channel
    for (const contact of user.safetyContacts) {
      for (const channel of channels) {
        if (channel === 'SMS' && !contact.phone) continue;
        if (channel === 'EMAIL' && !contact.email) continue;

        await this.prisma.sosContactNotification.create({
          data: {
            sosEventId:      sosEvent.id,
            safetyContactId: contact.id,
            channel,
            status: 'PENDING',
          },
        });
      }
    }

    // STUB: dispatch notifications — Phase 3 wires Twilio + Resend
    // await this.notificationsService.dispatchSosNotifications(sosEvent.id);
    this.logger.warn(
      `SOS TRIGGERED — user ${userId} | event ${sosEvent.id} | ` +
      `${user.safetyContacts.length} contacts | NOTIFICATIONS STUBBED`,
    );

    return sosEvent;
  }

  async getSosEvent(userId: string, sosEventId: string) {
    const event = await this.prisma.sosEvent.findUnique({
      where: { id: sosEventId },
      include: { notifications: true, checkins: true },
    });
    if (!event || event.userId !== userId) throw new NotFoundException('SOS event not found');
    return event;
  }

  async resolveSos(userId: string, sosEventId: string) {
    const event = await this.prisma.sosEvent.findUnique({ where: { id: sosEventId } });
    if (!event || event.userId !== userId) throw new NotFoundException('SOS event not found');
    if (event.status === 'RESOLVED' || event.status === 'FALSE_ALARM') {
      throw new BadRequestException('SOS event is already resolved');
    }

    return this.prisma.sosEvent.update({
      where: { id: sosEventId },
      data: {
        status: 'RESOLVED',
        resolvedAt: new Date(),
        resolvedBy: 'user',
      },
    });
  }

  // ── Check-ins ──────────────────────────────────────────────────────────────

  async createCheckIn(userId: string, dto: CreateCheckInDto) {
    return this.prisma.checkIn.create({
      data: {
        userId,
        latitude:    dto.latitude ?? null,
        longitude:   dto.longitude ?? null,
        note:        dto.note ?? null,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        checkedInAt: new Date(),
      },
    });
  }

  async getCheckIns(userId: string) {
    return this.prisma.checkIn.findMany({
      where: { userId },
      orderBy: { checkedInAt: 'desc' },
      take: 50,
    });
  }

  // ── Escalation (called by scheduler task) ─────────────────────────────────

  /**
   * Check for SOS events still ACTIVE after 30 minutes without resolution.
   * Escalate status and queue re-notification.
   * Called by SosEscalationTask on a cron schedule.
   */
  async escalateStaleEvents() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const stale = await this.prisma.sosEvent.findMany({
      where: {
        status: 'ACTIVE',
        createdAt: { lt: thirtyMinutesAgo },
      },
    });

    for (const event of stale) {
      await this.prisma.sosEvent.update({
        where: { id: event.id },
        data: { status: 'ESCALATED' },
      });

      // STUB: re-notify contacts at escalation level — Phase 3
      // await this.notificationsService.dispatchEscalationNotifications(event.id);
      this.logger.warn(`SOS ESCALATED — event ${event.id} | NOTIFICATIONS STUBBED`);
    }

    return stale.length;
  }
}
