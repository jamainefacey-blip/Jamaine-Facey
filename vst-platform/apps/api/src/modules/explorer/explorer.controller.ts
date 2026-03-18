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
import { ExplorerService, CreatePinDto, PinBoundsQuery, RequestPinUploadUrlDto } from './explorer.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class ExplorerController {
  constructor(private readonly explorerService: ExplorerService) {}

  /**
   * GET /v1/explorer/pins?minLat=&maxLat=&minLng=&maxLng=&tags=
   * Public — GUEST can browse the map.
   */
  @Get('explorer/pins')
  getPins(@Query() q: Record<string, string>) {
    const bounds: PinBoundsQuery = {
      minLat: parseFloat(q['minLat'] ?? '-90'),
      maxLat: parseFloat(q['maxLat'] ?? '90'),
      minLng: parseFloat(q['minLng'] ?? '-180'),
      maxLng: parseFloat(q['maxLng'] ?? '180'),
      tags:   q['tags'],
    };
    return this.explorerService.getPins(bounds);
  }

  /**
   * GET /v1/explorer/pins/:id
   */
  @Get('explorer/pins/:id')
  getPin(@Param('id') id: string) {
    return this.explorerService.getPin(id);
  }

  /**
   * POST /v1/explorer/pins
   * PREMIUM+ required — submitted for editorial approval.
   */
  @Post('explorer/pins')
  @UseGuards(ClerkAuthGuard)
  createPin(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePinDto) {
    return this.explorerService.createPin(user.id, dto);
  }

  /**
   * POST /v1/explorer/pins/:id/upload-url
   * PREMIUM+ required (same tier as createPin).
   * Returns a presigned R2 PUT URL for the pin's media asset.
   * After upload completes, call /confirm with the returned publicUrl.
   */
  @Post('explorer/pins/:id/upload-url')
  @UseGuards(ClerkAuthGuard)
  requestPinUploadUrl(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RequestPinUploadUrlDto,
  ) {
    return this.explorerService.requestPinUploadUrl(id, user.id, dto);
  }

  /**
   * POST /v1/explorer/pins/:id/media/confirm
   * Client calls this after a successful PUT to the R2 presigned URL.
   * Sets mediaUrl + mediaType on the pin and marks mediaConfirmed = true.
   * Only confirmed media is returned in pin detail responses.
   * Idempotent — safe to call more than once.
   */
  @Post('explorer/pins/:id/media/confirm')
  @UseGuards(ClerkAuthGuard)
  @HttpCode(200)
  confirmPinMedia(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body('publicUrl') publicUrl: string,
    @Body('mediaType') mediaType: 'IMAGE' | 'VIDEO',
  ) {
    return this.explorerService.confirmPinMedia(id, user.id, publicUrl, mediaType);
  }

  /**
   * PATCH /v1/admin/explorer/pins/:id/publish
   * Internal — editorial publish/unpublish control. Requires ADMIN role.
   */
  @Patch('admin/explorer/pins/:id/publish')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  publishPin(@Param('id') id: string, @Body('publish') publish: boolean) {
    return this.explorerService.publishPin(id, publish);
  }
}
