import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ExplorerService, CreatePinDto, PinBoundsQuery } from './explorer.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

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
   * PATCH /v1/admin/explorer/pins/:id/publish
   * Internal — editorial publish/unpublish control.
   */
  @Patch('admin/explorer/pins/:id/publish')
  @UseGuards(ClerkAuthGuard)
  publishPin(@Param('id') id: string, @Body('publish') publish: boolean) {
    return this.explorerService.publishPin(id, publish);
  }
}
