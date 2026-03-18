import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { EventsService, CreateLocalEventDto, EventBoundsQuery } from './events.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  /**
   * GET /v1/events?minLat=&maxLat=&minLng=&maxLng=&category=&from=&to=&tags=
   * Public — geographic bounding box search.
   */
  @Get('events')
  getEvents(@Query() q: Record<string, string>) {
    const bounds: EventBoundsQuery = {
      minLat:   parseFloat(q['minLat']   ?? '-90'),
      maxLat:   parseFloat(q['maxLat']   ?? '90'),
      minLng:   parseFloat(q['minLng']   ?? '-180'),
      maxLng:   parseFloat(q['maxLng']   ?? '180'),
      category: q['category'],
      from:     q['from'],
      to:       q['to'],
      tags:     q['tags'],
    };
    return this.eventsService.getEvents(bounds);
  }

  /**
   * GET /v1/events/:id
   */
  @Get('events/:id')
  getEvent(@Param('id') id: string) {
    return this.eventsService.getEvent(id);
  }

  /**
   * POST /v1/admin/events
   * Internal — editorial / partner event creation. Requires ADMIN role.
   */
  @Post('admin/events')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  createEvent(@Body() dto: CreateLocalEventDto) {
    return this.eventsService.createEvent(dto);
  }

  /**
   * PATCH /v1/admin/events/:id/publish
   * Requires ADMIN role.
   */
  @Patch('admin/events/:id/publish')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  publishEvent(@Param('id') id: string, @Body('publish') publish: boolean) {
    return this.eventsService.publishEvent(id, publish);
  }

  /**
   * DELETE /v1/admin/events/:id
   * Requires ADMIN role.
   */
  @Delete('admin/events/:id')
  @Roles(UserRole.ADMIN)
  @UseGuards(ClerkAuthGuard, RolesGuard)
  @HttpCode(200)
  deleteEvent(@Param('id') id: string) {
    return this.eventsService.deleteEvent(id);
  }
}
