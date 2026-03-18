import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { R2Service } from '../../integrations/r2/r2.service';

export interface CreatePinDto {
  latitude:     number;
  longitude:    number;
  title:        string;
  description?: string;
  mediaUrl?:    string;
  tags?:        string[];
  countryCode?: string;    // links pin to a Destination
}

export interface RequestPinUploadUrlDto {
  filename:     string;
  contentType:  'image/jpeg' | 'image/png' | 'image/webp' | 'video/mp4';
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
    private readonly r2: R2Service,
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

  // ── POST /v1/explorer/pins/:id/upload-url — PREMIUM+ ─────────────────────
  // Returns a presigned R2 PUT URL for the pin's media asset.
  // Flow: client uploads directly to R2 → updates pin mediaUrl with publicUrl.
  // Only the pin's author can request an upload URL.

  async requestPinUploadUrl(pinId: string, userId: string, dto: RequestPinUploadUrlDto) {
    const pin = await this.prisma.explorerPin.findUnique({ where: { id: pinId } });
    if (!pin) throw new NotFoundException('Pin not found');
    if (pin.authorId !== userId) throw new ForbiddenException('Not your pin');

    // Build a safe, scoped object key using R2Service path conventions
    const key = this.r2.buildExplorerPinKey(pinId, dto.filename);

    // Generate a real presigned PUT URL via Cloudflare R2
    const { uploadUrl, publicUrl, expiresIn } = await this.r2.presignUpload(
      key,
      dto.contentType,
    );

    const mediaType = dto.contentType.startsWith('video') ? 'VIDEO' : 'IMAGE';

    return {
      uploadUrl,   // PUT here — expires in expiresIn seconds; never stored
      publicUrl,   // CDN URL — use this as pin.mediaUrl after upload completes
      mediaType,
      expiresIn,
    };
  }
}
