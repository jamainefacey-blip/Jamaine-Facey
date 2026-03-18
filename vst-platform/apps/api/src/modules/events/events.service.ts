import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface CreateLocalEventDto {
  title:                 string;
  description:           string;
  latitude:              number;
  longitude:             number;
  address?:              string;
  category:              LocalEventCategoryDto;
  startDate:             string;   // ISO datetime
  endDate?:              string;   // ISO datetime
  isRecurring?:          boolean;
  recurrenceRule?:       string;   // iCal RRULE
  price?:                number;   // in pence; omit = free
  currency?:             string;
  affiliateUrl?:         string;
  ticketUrl?:            string;
  organizerId?:          string;
  accessibilityFeatures?: string[];
  tags?:                 string[];
}

export type LocalEventCategoryDto =
  | 'FOOD_DRINK' | 'CULTURE' | 'OUTDOOR' | 'TRANSPORT'
  | 'WELLNESS' | 'NIGHTLIFE' | 'FAMILY' | 'SHOPPING'
  | 'SPORT' | 'MUSIC' | 'ART' | 'FESTIVAL';

export interface EventBoundsQuery {
  minLat:   number;
  maxLat:   number;
  minLng:   number;
  maxLng:   number;
  category?: string;
  from?:    string;   // ISO date
  to?:      string;   // ISO date
  tags?:    string;   // comma-separated
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── GET /v1/events?minLat=&maxLat=&minLng=&maxLng= ───────────────────────
  // Public — geographic bounding box. Returns published events only.

  async getEvents(q: EventBoundsQuery) {
    const tags     = q.tags     ? q.tags.split(',').map(t => t.trim()) : undefined;
    const fromDate = q.from     ? new Date(q.from) : undefined;
    const toDate   = q.to       ? new Date(q.to)   : undefined;

    const events = await this.prisma.localEvent.findMany({
      where: {
        isPublished: true,
        latitude:    { gte: q.minLat, lte: q.maxLat },
        longitude:   { gte: q.minLng, lte: q.maxLng },
        ...(q.category ? { category: q.category as LocalEventCategoryDto } : {}),
        ...(fromDate   ? { startDate: { gte: fromDate } } : {}),
        ...(toDate     ? { startDate: { lte: toDate   } } : {}),
        ...(tags?.length ? { tags: { hasSome: tags } } : {}),
      },
      orderBy: { startDate: 'asc' },
      take: 100,
    });

    return { events };
  }

  // ── GET /v1/events/:id ────────────────────────────────────────────────────

  async getEvent(id: string) {
    const event = await this.prisma.localEvent.findUnique({ where: { id } });
    if (!event || !event.isPublished) throw new NotFoundException('Event not found');
    return event;
  }

  // ── POST /v1/admin/events ─────────────────────────────────────────────────
  // Internal — editorial + partner event creation.

  async createEvent(dto: CreateLocalEventDto) {
    if (!dto.title || !dto.description) {
      throw new BadRequestException('title and description are required');
    }
    if (dto.isRecurring && !dto.recurrenceRule) {
      throw new BadRequestException('recurrenceRule is required for recurring events');
    }

    const event = await this.prisma.localEvent.create({
      data: {
        title:                 dto.title,
        description:           dto.description,
        latitude:              dto.latitude,
        longitude:             dto.longitude,
        address:               dto.address,
        category:              dto.category,
        startDate:             new Date(dto.startDate),
        endDate:               dto.endDate ? new Date(dto.endDate) : undefined,
        isRecurring:           dto.isRecurring ?? false,
        recurrenceRule:        dto.recurrenceRule,
        price:                 dto.price,
        currency:              dto.currency ?? 'GBP',
        affiliateUrl:          dto.affiliateUrl,
        ticketUrl:             dto.ticketUrl,
        organizerId:           dto.organizerId,
        accessibilityFeatures: dto.accessibilityFeatures ?? [],
        tags:                  dto.tags ?? [],
        isPublished:           false,
      },
    });

    return { id: event.id, isPublished: event.isPublished };
  }

  // ── PATCH /v1/admin/events/:id/publish ───────────────────────────────────

  async publishEvent(id: string, publish: boolean) {
    const event = await this.prisma.localEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');

    await this.prisma.localEvent.update({
      where: { id },
      data:  { isPublished: publish },
    });

    return { id, isPublished: publish };
  }

  // ── DELETE /v1/admin/events/:id ───────────────────────────────────────────

  async deleteEvent(id: string) {
    const event = await this.prisma.localEvent.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Event not found');
    await this.prisma.localEvent.delete({ where: { id } });
    return { deleted: id };
  }
}
