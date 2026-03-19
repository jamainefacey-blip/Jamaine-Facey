/**
 * LongWayRoundService — Phase 6 Architecture Scaffold
 *
 * SCOPE
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides CRUD operations for user-created multi-stop journey routes.
 * Route and stop management is fully functional in Phase 6.
 * Route analysis (feasibility, cost, visa chain) is stubbed for Phase 7.
 *
 * TIER GATES
 * ─────────────────────────────────────────────────────────────────────────────
 *   GUEST         — read only (own routes only)
 *   PREMIUM       — max 3 active routes; max 8 stops per route
 *   VOYAGE_ELITE  — unlimited routes + stops; analysis features (Phase 7)
 *
 * STATUS LIFECYCLE
 * ─────────────────────────────────────────────────────────────────────────────
 *   DRAFT     — being built, not yet planned
 *   PLANNED   — dates and stops confirmed
 *   BOOKED    — at least one leg booked via affiliate
 *   COMPLETED — trip taken
 *   ABANDONED — user cancelled planning
 *
 * INTEGRATION POINTS (Phase 7)
 * ─────────────────────────────────────────────────────────────────────────────
 *   - VisaService.checkChain(stops[].destinationCode, nationality)
 *   - MatchingService: LONG_WAY_ROUND seeds derived from saved DRAFT routes
 *   - BookingService: affiliate link generation per leg
 *   - TravelRadarService: VISA_CHANGE signals relevant to stops surfaced
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MembershipTier } from '@prisma/client';
import {
  CreateLongWayRoundRouteDto,
  UpsertLongWayRoundStopDto,
  LongWayRoundRouteDto,
  LongWayRoundStopDto,
} from './dto/long-way-round.dto';

const PREMIUM_MAX_ROUTES = 3;
const PREMIUM_MAX_STOPS  = 8;

@Injectable()
export class LongWayRoundService {
  private readonly logger = new Logger(LongWayRoundService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── Routes CRUD ───────────────────────────────────────────────────────────

  async createRoute(
    userId: string,
    tier:   MembershipTier,
    dto:    CreateLongWayRoundRouteDto,
  ): Promise<LongWayRoundRouteDto> {
    if (tier === MembershipTier.GUEST) {
      throw new ForbiddenException('Long Way Round route creation requires PREMIUM or above.');
    }

    if (tier === MembershipTier.PREMIUM) {
      const activeCount = await this.prisma.longWayRoundRoute.count({
        where: { userId, status: { notIn: ['COMPLETED', 'ABANDONED'] } },
      });
      if (activeCount >= PREMIUM_MAX_ROUTES) {
        throw new ForbiddenException(
          `PREMIUM tier allows up to ${PREMIUM_MAX_ROUTES} active routes. ` +
          'Upgrade to Voyage Elite for unlimited routes.',
        );
      }
    }

    const route = await this.prisma.longWayRoundRoute.create({
      data: {
        userId,
        name:      dto.name,
        budgetGbp: dto.budgetGbp,
        notes:     dto.notes,
        status:    'DRAFT',
      },
      include: { stops: { orderBy: { position: 'asc' } } },
    });

    this.logger.log(`LWR route created: [${route.id}] for user ${userId}`);
    return this.formatRoute(route);
  }

  async listRoutes(userId: string): Promise<LongWayRoundRouteDto[]> {
    const routes = await this.prisma.longWayRoundRoute.findMany({
      where:   { userId },
      include: { stops: { orderBy: { position: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return routes.map(r => this.formatRoute(r));
  }

  async getRoute(userId: string, routeId: string): Promise<LongWayRoundRouteDto> {
    const route = await this.findRouteOrThrow(userId, routeId);
    return this.formatRoute(route);
  }

  async updateRoute(
    userId:  string,
    routeId: string,
    dto:     Partial<CreateLongWayRoundRouteDto>,
  ): Promise<LongWayRoundRouteDto> {
    await this.findRouteOrThrow(userId, routeId);

    const updated = await this.prisma.longWayRoundRoute.update({
      where: { id: routeId },
      data: {
        ...(dto.name      !== undefined && { name:      dto.name }),
        ...(dto.budgetGbp !== undefined && { budgetGbp: dto.budgetGbp }),
        ...(dto.notes     !== undefined && { notes:     dto.notes }),
      },
      include: { stops: { orderBy: { position: 'asc' } } },
    });

    return this.formatRoute(updated);
  }

  async updateRouteStatus(
    userId:   string,
    routeId:  string,
    status:   'DRAFT' | 'PLANNED' | 'BOOKED' | 'COMPLETED' | 'ABANDONED',
  ): Promise<LongWayRoundRouteDto> {
    const route = await this.findRouteOrThrow(userId, routeId);

    if (route.status === 'COMPLETED' || route.status === 'ABANDONED') {
      throw new ForbiddenException(`Cannot update a ${route.status} route.`);
    }

    const updated = await this.prisma.longWayRoundRoute.update({
      where: { id: routeId },
      data:  { status },
      include: { stops: { orderBy: { position: 'asc' } } },
    });

    return this.formatRoute(updated);
  }

  async deleteRoute(userId: string, routeId: string): Promise<void> {
    await this.findRouteOrThrow(userId, routeId);
    await this.prisma.longWayRoundRoute.delete({ where: { id: routeId } });
  }

  // ── Stops CRUD ────────────────────────────────────────────────────────────

  async addStop(
    userId:  string,
    routeId: string,
    tier:    MembershipTier,
    dto:     UpsertLongWayRoundStopDto,
  ): Promise<LongWayRoundRouteDto> {
    const route = await this.findRouteOrThrow(userId, routeId);

    if (tier === MembershipTier.PREMIUM && route.stops.length >= PREMIUM_MAX_STOPS) {
      throw new ForbiddenException(
        `PREMIUM tier allows up to ${PREMIUM_MAX_STOPS} stops per route. ` +
        'Upgrade to Voyage Elite for unlimited stops.',
      );
    }

    // Conflict check: position must be unique within route
    const positionTaken = route.stops.some(s => s.position === dto.position);
    if (positionTaken) {
      throw new BadRequestException(
        `Position ${dto.position} is already taken. Use a different position or reorder first.`,
      );
    }

    await this.prisma.longWayRoundStop.create({
      data: {
        routeId,
        position:        dto.position,
        destinationCode: dto.destinationCode.toUpperCase(),
        destinationName: dto.destinationName,
        durationDays:    dto.durationDays,
        arrivalAfter:    dto.arrivalAfter ? new Date(dto.arrivalAfter) : undefined,
        isFlexible:      dto.isFlexible ?? true,
        notes:           dto.notes,
      },
    });

    return this.getRoute(userId, routeId);
  }

  async updateStop(
    userId:  string,
    routeId: string,
    stopId:  string,
    dto:     Partial<UpsertLongWayRoundStopDto>,
  ): Promise<LongWayRoundRouteDto> {
    const route = await this.findRouteOrThrow(userId, routeId);
    const stop  = route.stops.find(s => s.id === stopId);
    if (!stop) throw new NotFoundException('Stop not found on this route');

    await this.prisma.longWayRoundStop.update({
      where: { id: stopId },
      data:  {
        ...(dto.destinationCode !== undefined && { destinationCode: dto.destinationCode.toUpperCase() }),
        ...(dto.destinationName !== undefined && { destinationName: dto.destinationName }),
        ...(dto.durationDays    !== undefined && { durationDays:    dto.durationDays }),
        ...(dto.arrivalAfter    !== undefined && { arrivalAfter:    new Date(dto.arrivalAfter) }),
        ...(dto.isFlexible      !== undefined && { isFlexible:      dto.isFlexible }),
        ...(dto.notes           !== undefined && { notes:           dto.notes }),
        ...(dto.position        !== undefined && { position:        dto.position }),
      },
    });

    return this.getRoute(userId, routeId);
  }

  async removeStop(userId: string, routeId: string, stopId: string): Promise<LongWayRoundRouteDto> {
    const route = await this.findRouteOrThrow(userId, routeId);
    const stop  = route.stops.find(s => s.id === stopId);
    if (!stop) throw new NotFoundException('Stop not found on this route');

    await this.prisma.longWayRoundStop.delete({ where: { id: stopId } });
    return this.getRoute(userId, routeId);
  }

  // ── Analysis (Phase 7 stubs) ──────────────────────────────────────────────

  /**
   * STUB — Phase 7: feasibility analysis.
   * Will check: transit availability between stops, minimum connection days,
   * visa chain requirements per passport nationality, estimated total cost.
   */
  async analyseRoute(
    _userId:  string,
    _routeId: string,
  ): Promise<never> {
    throw new BadRequestException(
      'Route analysis is a Phase 7 feature. Build your route and we will analyse it soon.',
    );
  }

  // ── Internal helpers ──────────────────────────────────────────────────────

  private async findRouteOrThrow(userId: string, routeId: string) {
    const route = await this.prisma.longWayRoundRoute.findUnique({
      where:   { id: routeId },
      include: { stops: { orderBy: { position: 'asc' } } },
    });
    if (!route)               throw new NotFoundException('Long Way Round route not found');
    if (route.userId !== userId) throw new ForbiddenException('Not your route');
    return route;
  }

  private formatRoute(route: any): LongWayRoundRouteDto {
    const totalDays = route.stops.length > 0
      ? route.stops.reduce((sum: number, s: any) => sum + (s.durationDays ?? 0), 0) || null
      : null;

    return {
      id:        route.id,
      name:      route.name,
      status:    route.status,
      totalDays,
      budgetGbp: route.budgetGbp,
      notes:     route.notes,
      stops:     route.stops.map((s: any): LongWayRoundStopDto => ({
        id:              s.id,
        position:        s.position,
        destinationCode: s.destinationCode,
        destinationName: s.destinationName,
        durationDays:    s.durationDays,
        arrivalAfter:    s.arrivalAfter?.toISOString() ?? null,
        isFlexible:      s.isFlexible,
        notes:           s.notes,
      })),
      createdAt: route.createdAt.toISOString(),
      updatedAt: route.updatedAt.toISOString(),
      analysis:  {
        estimatedTotalCostGbp: null,
        visaChain:             null,
        carbonKg:              null,
        feasible:              null,
      },
    };
  }
}
