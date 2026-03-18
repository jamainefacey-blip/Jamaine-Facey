import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { CreateCampaignDto } from './dto/create-campaign.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PartnerStatus, PartnerType, UserRole } from '@prisma/client';

@Controller()
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // ── Public endpoints ──────────────────────────────────────────────────────

  /**
   * GET /v1/partners?type=HOTEL
   * Public — lists ACTIVE partners; optional type filter.
   */
  @Get('partners')
  listPartners(@Query('type') type?: string) {
    return this.partnersService.listPartners(type as PartnerType | undefined);
  }

  /**
   * GET /v1/partners/:id
   * Public — partner profile with active campaigns.
   */
  @Get('partners/:id')
  getPartner(@Param('id') id: string) {
    return this.partnersService.getPartner(id);
  }

  // ── Admin: partner CRUD ───────────────────────────────────────────────────

  /**
   * POST /v1/admin/partners
   * Creates a new partner in PENDING status. Requires ADMIN role.
   */
  @Post('admin/partners')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  createPartner(@Body() dto: CreatePartnerDto) {
    return this.partnersService.createPartner(dto);
  }

  /**
   * PATCH /v1/admin/partners/:id
   * Update partner profile fields. Requires ADMIN role.
   */
  @Patch('admin/partners/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  updatePartner(
    @Param('id') id: string,
    @Body() dto: Partial<CreatePartnerDto>,
  ) {
    return this.partnersService.updatePartner(id, dto);
  }

  /**
   * PATCH /v1/admin/partners/:id/status
   * Lifecycle: PENDING → ACTIVE | TERMINATED; ACTIVE → SUSPENDED | TERMINATED.
   * Requires ADMIN role.
   */
  @Patch('admin/partners/:id/status')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  updatePartnerStatus(
    @Param('id') id: string,
    @Body('status') status: PartnerStatus,
  ) {
    return this.partnersService.updatePartnerStatus(id, status);
  }

  /**
   * PATCH /v1/admin/partners/:id/verify
   * Verification placeholder. Requires ADMIN role. Full workflow in Phase 6.
   */
  @Patch('admin/partners/:id/verify')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @HttpCode(200)
  verifyPartner(@Param('id') id: string) {
    return this.partnersService.verifyPartner(id);
  }

  // ── Admin: campaigns ──────────────────────────────────────────────────────

  /**
   * POST /v1/admin/partners/:id/campaigns
   * Create a campaign for a partner. Requires ADMIN role.
   */
  @Post('admin/partners/:id/campaigns')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  createCampaign(
    @Param('id') id: string,
    @Body() dto: CreateCampaignDto,
  ) {
    return this.partnersService.createCampaign(id, dto);
  }

  /**
   * GET /v1/admin/partners/:id/campaigns
   * Full campaign list (including inactive). Requires ADMIN role.
   */
  @Get('admin/partners/:id/campaigns')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  listCampaigns(@Param('id') id: string) {
    return this.partnersService.listCampaigns(id);
  }
}
