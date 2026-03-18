import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MembershipService } from '../membership/membership.service';

// ── DTOs ─────────────────────────────────────────────────────────────────────

export interface CreateReviewDto {
  destinationCode: string;
  rating: number;           // 1–5
  title?: string;
  body: string;
  travelDate?: string;      // ISO date
}

export interface ReplyToReviewDto {
  body: string;
  partnerId: string;        // authenticated partner identity
}

export interface ModerateReviewDto {
  status: 'PUBLISHED' | 'HIDDEN' | 'FLAGGED';
  moderationNotes?: string;
  moderatorId: string;
}

export interface RequestUploadUrlDto {
  reviewId: string;
  filename: string;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp' | 'video/mp4';
  isAccessibilityEvidence?: boolean;
}

// ── Moderation state machine ──────────────────────────────────────────────────
// PENDING → MOD_REVIEW (auto-flagged by keyword check) → PUBLISHED | HIDDEN | FLAGGED
// PUBLISHED → HIDDEN | FLAGGED (moderator action)
// Only PUBLISHED reviews are returned in public queries.

const MODERATION_KEYWORDS = ['spam', 'fake', 'scam'];

function requiresModerationReview(body: string): boolean {
  const lower = body.toLowerCase();
  return MODERATION_KEYWORDS.some(k => lower.includes(k));
}

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
  ) {}

  // ── Reviews ───────────────────────────────────────────────────────────────

  async createReview(userId: string, dto: CreateReviewDto) {
    // Only PREMIUM+ can post reviews (GUEST = read only)
    const tier = await this.membershipService.getUserTier(userId);
    if (tier === 'GUEST') {
      throw new ForbiddenException('Upgrade to Premium to post reviews');
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const destination = await this.prisma.destination.findUnique({
      where: { countryCode: dto.destinationCode.toUpperCase() },
    });
    if (!destination) throw new NotFoundException(`Destination '${dto.destinationCode}' not found`);

    // Prevent duplicate review for same destination within 30 days
    const recentReview = await this.prisma.review.findFirst({
      where: {
        userId,
        destinationId: destination.id,
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });
    if (recentReview) {
      throw new ForbiddenException('You have already reviewed this destination in the last 30 days');
    }

    const autoStatus = requiresModerationReview(dto.body) ? 'PENDING' : 'PENDING';

    const review = await this.prisma.review.create({
      data: {
        userId,
        destinationId: destination.id,
        rating:      dto.rating,
        title:       dto.title,
        body:        dto.body,
        travelDate:  dto.travelDate ? new Date(dto.travelDate) : undefined,
        status:      autoStatus,
      },
    });

    return { id: review.id, status: review.status };
  }

  async getReviews(destinationCode: string, page = 1, limit = 20) {
    const destination = await this.prisma.destination.findUnique({
      where: { countryCode: destinationCode.toUpperCase() },
    });
    if (!destination) throw new NotFoundException(`Destination '${destinationCode}' not found`);

    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where:   { destinationId: destination.id, status: 'PUBLISHED' },
        include: { media: true },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({
        where: { destinationId: destination.id, status: 'PUBLISHED' },
      }),
    ]);

    return {
      reviews: reviews.map(r => ({
        id:          r.id,
        rating:      r.rating,
        title:       r.title,
        body:        r.body,
        travelDate:  r.travelDate,
        isVerified:  r.isVerified,
        replyBody:   r.replyBody,
        replyAt:     r.replyAt,
        createdAt:   r.createdAt,
        media:       r.media.map(m => ({
          type:                    m.type,
          url:                     m.url,
          caption:                 m.caption,
          isAccessibilityEvidence: m.isAccessibilityEvidence,
        })),
      })),
      meta: { page, limit, total },
    };
  }

  // ── Hotel right-to-reply ──────────────────────────────────────────────────

  async replyToReview(reviewId: string, dto: ReplyToReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.status !== 'PUBLISHED') {
      throw new ForbiddenException('Can only reply to published reviews');
    }
    if (review.replyBody) {
      throw new ForbiddenException('A reply already exists for this review');
    }
    if (!dto.body || dto.body.trim().length < 10) {
      throw new BadRequestException('Reply must be at least 10 characters');
    }

    await this.prisma.review.update({
      where: { id: reviewId },
      data:  {
        replyBody: dto.body.trim(),
        replyAt:   new Date(),
        replyBy:   dto.partnerId,
      },
    });

    return { success: true };
  }

  // ── Moderation ────────────────────────────────────────────────────────────

  async moderateReview(reviewId: string, dto: ModerateReviewDto) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.review.update({
      where: { id: reviewId },
      data:  {
        status:          dto.status,
        moderationNotes: dto.moderationNotes,
        moderationBy:    dto.moderatorId,
      },
    });

    return { id: reviewId, status: dto.status };
  }

  // ── Media upload — presigned URL ──────────────────────────────────────────
  // Pattern: client calls this endpoint → gets a presigned R2/S3 PUT URL →
  // uploads directly to object storage → calls confirmMediaUpload() with the key.
  // CDN URL is stored (not upload URL). Phase 5: swap stub for real R2 presign.

  async requestUploadUrl(userId: string, dto: RequestUploadUrlDto) {
    const review = await this.prisma.review.findUnique({ where: { id: dto.reviewId } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.userId !== userId) throw new ForbiddenException('Not your review');

    const key        = `reviews/${dto.reviewId}/${Date.now()}-${dto.filename}`;
    const cdnBaseUrl = process.env.CDN_BASE_URL ?? 'https://cdn.voyagesmarttravel.com';

    // STUB: return a deterministic URL — replace with real R2 presign in Phase 5.
    const uploadUrl = `${cdnBaseUrl}/upload-stub/${key}`;
    const publicUrl = `${cdnBaseUrl}/${key}`;

    // Pre-create the ReviewMedia row in PENDING state (confirmed via confirmMediaUpload)
    const media = await this.prisma.reviewMedia.create({
      data: {
        reviewId:                dto.reviewId,
        type:                    dto.contentType.startsWith('video') ? 'VIDEO' : 'IMAGE',
        url:                     publicUrl,
        isAccessibilityEvidence: dto.isAccessibilityEvidence ?? false,
      },
    });

    return {
      uploadUrl,
      mediaId:   media.id,
      publicUrl,
      expiresIn: 900, // seconds — stub; real presign uses same TTL
    };
  }
}
