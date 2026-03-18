import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MembershipService } from '../membership/membership.service';

export interface CreatePinDto {
  latitude:     number;
  longitude:    number;
  title:        string;
  description?: string;
  mediaUrl?:    string;
  tags?:        string[];
  countryCode?: string;    // links pin to a Destination
}

export interface PinBoundsQuery {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  tags?:  string;         // comma-separated
}

@Injectable()
export class ExplorerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
  ) {}

  // ── GET /v1/explorer/pins?minLat=&maxLat=&minLng=&maxLng= ────────────────
  // Public read — GUEST can browse. Bounding box geographic query.

  async getPins(q: PinBoundsQuery) {
    const tags = q.tags ? q.tags.split(',').map(t => t.trim()) : undefined;

    const pins = await this.prisma.explorerPin.findMany({
      where: {
        isPublished: true,
        latitude:    { gte: q.minLat, lte: q.maxLat },
        longitude:   { gte: q.minLng, lte: q.maxLng },
        ...(tags?.length ? { tags: { hasSome: tags } } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 200,   // cap per request — pagination in Phase 5
    });

    return { pins };
  }

  // ── POST /v1/explorer/pins — PREMIUM+ ────────────────────────────────────

  async createPin(userId: string, dto: CreatePinDto) {
    const tier = await this.membershipService.getUserTier(userId);
    if (tier === 'GUEST') {
      throw new ForbiddenException('Upgrade to Premium to submit explorer pins');
    }

    let destinationId: string | undefined;
    if (dto.countryCode) {
      const dest = await this.prisma.destination.findUnique({
        where: { countryCode: dto.countryCode.toUpperCase() },
      });
      if (dest) destinationId = dest.id;
    }

    const pin = await this.prisma.explorerPin.create({
      data: {
        destinationId: destinationId ?? null,
        latitude:    dto.latitude,
        longitude:   dto.longitude,
        title:       dto.title,
        description: dto.description,
        mediaUrl:    dto.mediaUrl,
        tags:        dto.tags ?? [],
        authorId:    userId,
        isPublished: false,  // moderation gate — published by editorial team
      },
    });

    return { id: pin.id, isPublished: pin.isPublished };
  }

  // ── GET /v1/explorer/pins/:id ─────────────────────────────────────────────

  async getPin(pinId: string) {
    const pin = await this.prisma.explorerPin.findUnique({ where: { id: pinId } });
    if (!pin || !pin.isPublished) throw new NotFoundException('Pin not found');
    return pin;
  }

  // ── PATCH /v1/admin/explorer/pins/:id/publish ─────────────────────────────

  async publishPin(pinId: string, publish: boolean) {
    const pin = await this.prisma.explorerPin.findUnique({ where: { id: pinId } });
    if (!pin) throw new NotFoundException('Pin not found');

    await this.prisma.explorerPin.update({
      where: { id: pinId },
      data:  { isPublished: publish },
    });

    return { id: pinId, isPublished: publish };
  }
}
