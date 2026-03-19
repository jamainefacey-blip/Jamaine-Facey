/**
 * LongWayRoundController — Route Plan
 *
 *   POST   /v1/matching/lwr                      — create route (PREMIUM+)
 *   GET    /v1/matching/lwr                      — list user routes
 *   GET    /v1/matching/lwr/:id                  — get route detail
 *   PATCH  /v1/matching/lwr/:id                  — update route metadata
 *   PATCH  /v1/matching/lwr/:id/status           — transition status
 *   DELETE /v1/matching/lwr/:id                  — delete route
 *   POST   /v1/matching/lwr/:id/stops            — add stop
 *   PATCH  /v1/matching/lwr/:id/stops/:stopId    — update stop
 *   DELETE /v1/matching/lwr/:id/stops/:stopId    — remove stop
 *   GET    /v1/matching/lwr/:id/analyse          — analyse route (Phase 7 stub)
 */

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { LongWayRoundService } from './long-way-round.service';
import {
  CreateLongWayRoundRouteDto,
  UpsertLongWayRoundStopDto,
} from './dto/long-way-round.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { MembershipTier } from '@prisma/client';

@Controller('matching/lwr')
@UseGuards(ClerkAuthGuard)
export class LongWayRoundController {
  constructor(private readonly lwrService: LongWayRoundService) {}

  @Post()
  createRoute(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateLongWayRoundRouteDto,
  ) {
    const tier = user.membership?.tier ?? MembershipTier.GUEST;
    return this.lwrService.createRoute(user.id, tier, dto);
  }

  @Get()
  listRoutes(@CurrentUser() user: AuthenticatedUser) {
    return this.lwrService.listRoutes(user.id);
  }

  @Get(':id')
  getRoute(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lwrService.getRoute(user.id, id);
  }

  @Patch(':id')
  updateRoute(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateLongWayRoundRouteDto>,
  ) {
    return this.lwrService.updateRoute(user.id, id, dto);
  }

  @Patch(':id/status')
  updateRouteStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body('status') status: 'DRAFT' | 'PLANNED' | 'BOOKED' | 'COMPLETED' | 'ABANDONED',
  ) {
    return this.lwrService.updateRouteStatus(user.id, id, status);
  }

  @Delete(':id')
  @HttpCode(204)
  deleteRoute(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lwrService.deleteRoute(user.id, id);
  }

  @Post(':id/stops')
  addStop(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertLongWayRoundStopDto,
  ) {
    const tier = user.membership?.tier ?? MembershipTier.GUEST;
    return this.lwrService.addStop(user.id, id, tier, dto);
  }

  @Patch(':id/stops/:stopId')
  updateStop(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('stopId') stopId: string,
    @Body() dto: Partial<UpsertLongWayRoundStopDto>,
  ) {
    return this.lwrService.updateStop(user.id, id, stopId, dto);
  }

  @Delete(':id/stops/:stopId')
  @HttpCode(200)
  removeStop(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('stopId') stopId: string,
  ) {
    return this.lwrService.removeStop(user.id, id, stopId);
  }

  @Get(':id/analyse')
  analyseRoute(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.lwrService.analyseRoute(user.id, id);
  }
}
