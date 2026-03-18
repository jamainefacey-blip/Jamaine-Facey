/**
 * PartnersService — Phase 5 Foundation
 *
 * SCOPE
 * ─────────────────────────────────────────────────────────────────────────────
 * This is the first scaffold for the VST Partner ecosystem. It covers:
 *   - Partner profile CRUD (admin-managed)
 *   - Partner status lifecycle: PENDING → ACTIVE → SUSPENDED | TERMINATED
 *   - Campaign placeholders (commission structure, date range)
 *   - Trust / verification stubs (extended in Phase 6)
 *   - Hotel right-to-reply link (Review.replyBy = partner.id, already in schema)
 *
 * OUT OF SCOPE FOR PHASE 5
 * ─────────────────────────────────────────────────────────────────────────────
 * - Full marketplace / partner portal
 * - Partner API key issuance
 * - Affiliate tracking code generation
 * - Commission payout calculations
 * - Partner self-service onboarding
 *
 * PARTNER TYPES (from schema)
 * ─────────────────────────────────────────────────────────────────────────────
 *   HOTEL | AIRLINE | TOUR_OPERATOR | INSURANCE | EXPERIENCE | TRANSPORT | TECHNOLOGY
 *
 * RIGHT-TO-REPLY LINKAGE
 * ─────────────────────────────────────────────────────────────────────────────
 * Review.replyBy stores a partner.id. The community service already validates
 * this via partnerId in ReplyToReviewDto. Full partner auth for replies is
 * deferred to Phase 6 (partner API keys).
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PartnerStatus, PartnerType } from '@prisma/client';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@Injectable()
export class PartnersService {
  private readonly logger = new Logger(PartnersService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Public read ───────────────────────────────────────────────────────────

  /**
   * GET /v1/partners — public list of ACTIVE partners.
   * Supports optional filter by type.
   */
  async listPartners(type?: PartnerType) {
    const partners = await this.prisma.partner.findMany({
      where: {
        status: PartnerStatus.ACTIVE,
        ...(type ? { type } : {}),
      },
      select: {
        id:           true,
        name:         true,
        type:         true,
        website:      true,
        logoUrl:      true,
        status:       true,
        createdAt:    true,
        // Campaign count as a trust signal — not exposing full campaign data publicly
        _count: { select: { campaigns: true } },
      },
      orderBy: { name: 'asc' },
    });

    return { partners };
  }

  /**
   * GET /v1/partners/:id — public partner profile.
   */
  async getPartner(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({
      where: { id: partnerId },
      include: {
        campaigns: {
          where:   { isActive: true },
          select:  { id: true, name: true, description: true, startDate: true, endDate: true },
        },
        _count: { select: { affiliates: true } },
      },
    });

    if (!partner || partner.status !== PartnerStatus.ACTIVE) {
      throw new NotFoundException('Partner not found');
    }

    return {
      id:          partner.id,
      name:        partner.name,
      type:        partner.type,
      website:     partner.website,
      logoUrl:     partner.logoUrl,
      activeCampaigns: partner.campaigns,
      // STUB: trust score and verification badge — Phase 6
      trust: {
        isVerified:      false,
        verifiedAt:      null,
        trustScore:      null,   // 0–100; computed from reviews + tenure + compliance
        badgeLevel:      null,   // 'BRONZE' | 'SILVER' | 'GOLD' | null
      },
    };
  }

  // ── Admin: partner management ─────────────────────────────────────────────

  /**
   * POST /v1/admin/partners — create a new partner record (PENDING status).
   */
  async createPartner(dto: CreatePartnerDto) {
    const existing = await this.prisma.partner.findFirst({
      where: { contactEmail: dto.contactEmail },
    });
    if (existing) {
      throw new ConflictException(`A partner with email '${dto.contactEmail}' already exists`);
    }

    const partner = await this.prisma.partner.create({
      data: {
        name:         dto.name,
        type:         dto.type,
        contactEmail: dto.contactEmail,
        contactName:  dto.contactName,
        website:      dto.website,
        logoUrl:      dto.logoUrl,
        status:       PartnerStatus.PENDING,
      },
    });

    this.logger.log(`Partner created: [${partner.id}] ${partner.name} (${partner.type})`);
    return { id: partner.id, name: partner.name, status: partner.status };
  }

  /**
   * PATCH /v1/admin/partners/:id/status — lifecycle transition.
   * Valid transitions:
   *   PENDING   → ACTIVE | TERMINATED
   *   ACTIVE    → SUSPENDED | TERMINATED
   *   SUSPENDED → ACTIVE | TERMINATED
   *   TERMINATED → (no transitions — terminal state)
   */
  async updatePartnerStatus(partnerId: string, status: PartnerStatus) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');

    if (partner.status === PartnerStatus.TERMINATED) {
      throw new ForbiddenException('Terminated partners cannot be updated');
    }

    await this.prisma.partner.update({
      where: { id: partnerId },
      data:  { status },
    });

    this.logger.log(`Partner [${partnerId}] status: ${partner.status} → ${status}`);
    return { id: partnerId, status };
  }

  /**
   * PATCH /v1/admin/partners/:id — update partner profile fields.
   */
  async updatePartner(partnerId: string, dto: Partial<CreatePartnerDto>) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');

    return this.prisma.partner.update({
      where: { id: partnerId },
      data:  {
        ...(dto.name         !== undefined && { name:         dto.name }),
        ...(dto.contactEmail !== undefined && { contactEmail: dto.contactEmail }),
        ...(dto.contactName  !== undefined && { contactName:  dto.contactName }),
        ...(dto.website      !== undefined && { website:      dto.website }),
        ...(dto.logoUrl      !== undefined && { logoUrl:      dto.logoUrl }),
      },
    });
  }

  // ── Admin: campaign management ────────────────────────────────────────────

  /**
   * POST /v1/admin/partners/:id/campaigns — add a campaign to a partner.
   */
  async createCampaign(partnerId: string, dto: CreateCampaignDto) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');

    const campaign = await this.prisma.partnerCampaign.create({
      data: {
        partnerId,
        name:          dto.name,
        description:   dto.description,
        commissionPct: dto.commissionPct,
        startDate:     new Date(dto.startDate),
        endDate:       dto.endDate ? new Date(dto.endDate) : null,
        isActive:      dto.isActive ?? true,
      },
    });

    return { id: campaign.id, name: campaign.name, commissionPct: campaign.commissionPct };
  }

  /**
   * GET /v1/admin/partners/:id/campaigns — full campaign list for admin view.
   */
  async listCampaigns(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');

    return this.prisma.partnerCampaign.findMany({
      where:   { partnerId },
      orderBy: { startDate: 'desc' },
    });
  }

  // ── Admin: trust / verification stubs ────────────────────────────────────
  // Phase 5: placeholder only. Full verification workflow in Phase 6.

  /**
   * PATCH /v1/admin/partners/:id/verify
   * STUB — marks partner as verified. Real workflow deferred to Phase 6:
   * document collection, compliance check, automated trust scoring.
   */
  async verifyPartner(partnerId: string) {
    const partner = await this.prisma.partner.findUnique({ where: { id: partnerId } });
    if (!partner) throw new NotFoundException('Partner not found');

    // STUB: no verification_date or trust_score fields in schema yet.
    // Phase 6 adds: verifiedAt DateTime?, trustScore Int?, badgeLevel Enum?
    this.logger.warn(`Partner verify [${partnerId}] — STUB: no schema fields yet. Phase 6.`);

    return {
      id:        partnerId,
      verified:  false,
      message:   'Verification workflow is a Phase 6 feature. Record noted.',
    };
  }
}
