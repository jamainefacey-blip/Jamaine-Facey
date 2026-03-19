/**
 * PreferencesService — Travel Preference + Availability Engine
 *
 * OWNERSHIP
 * ─────────────────────────────────────────────────────────────────────────────
 * This service owns all user travel preference data:
 *   UserPreferences        — scalars, arrays, notification toggles
 *   UserDestinationPreference — preferred / dream / excluded destinations
 *   UserAvailabilityWindow — date ranges when the user is free to travel
 *
 * The matching engine (MatchingService) reads from here — it does not write.
 * The notifications engine reads notification preference flags to decide
 * whether to deliver a given alert type.
 *
 * UPSERT PATTERN
 * ─────────────────────────────────────────────────────────────────────────────
 * UserPreferences is a 1:1 optional relation created on first access.
 * updateTravelPreferences() uses upsert to handle both create and update.
 * This is safe to call multiple times with partial data.
 */

import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { UpdateTravelPreferencesDto } from './dto/update-travel-preferences.dto';
import { AddDestinationPreferenceDto } from './dto/add-destination-preference.dto';
import { UpsertAvailabilityWindowDto } from './dto/upsert-availability-window.dto';

@Injectable()
export class PreferencesService {
  private readonly logger = new Logger(PreferencesService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ── GET full travel preference profile ────────────────────────────────────

  /**
   * Returns UserPreferences + destination preferences + active availability
   * windows as a single aggregated profile object.
   * Creates a default UserPreferences row if one does not yet exist.
   */
  async getTravelPreferences(userId: string) {
    const [prefs, destinations, windows] = await Promise.all([
      this.getOrCreatePreferences(userId),
      this.prisma.userDestinationPreference.findMany({
        where:   { userId },
        orderBy: { addedAt: 'desc' },
      }),
      this.prisma.userAvailabilityWindow.findMany({
        where:   { userId, isActive: true },
        orderBy: { startDate: 'asc' },
      }),
    ]);

    return {
      preferences:  prefs,
      destinations: {
        preferred: destinations.filter(d => d.type === 'PREFERRED'),
        dream:     destinations.filter(d => d.type === 'DREAM'),
        excluded:  destinations.filter(d => d.type === 'EXCLUDED'),
      },
      availabilityWindows: windows,
    };
  }

  // ── UPDATE travel preferences ─────────────────────────────────────────────

  async updateTravelPreferences(userId: string, dto: UpdateTravelPreferencesDto) {
    if (
      dto.minTripDays !== undefined &&
      dto.maxTripDays !== undefined &&
      dto.minTripDays > dto.maxTripDays
    ) {
      throw new BadRequestException('minTripDays must be ≤ maxTripDays');
    }

    if (
      dto.budgetMinGbp !== undefined &&
      dto.budgetMaxGbp !== undefined &&
      dto.budgetMinGbp > dto.budgetMaxGbp
    ) {
      throw new BadRequestException('budgetMinGbp must be ≤ budgetMaxGbp');
    }

    return this.prisma.userPreferences.upsert({
      where:  { userId },
      create: { userId, ...this.buildPrefsData(dto) },
      update: this.buildPrefsData(dto),
    });
  }

  // ── Availability windows ──────────────────────────────────────────────────

  async getAvailabilityWindows(userId: string) {
    return this.prisma.userAvailabilityWindow.findMany({
      where:   { userId },
      orderBy: { startDate: 'asc' },
    });
  }

  async createAvailabilityWindow(userId: string, dto: UpsertAvailabilityWindowDto) {
    const start = new Date(dto.startDate);
    const end   = new Date(dto.endDate);

    if (end <= start) {
      throw new BadRequestException('endDate must be after startDate');
    }

    if (dto.minTripDays && dto.maxTripDays && dto.minTripDays > dto.maxTripDays) {
      throw new BadRequestException('minTripDays must be ≤ maxTripDays');
    }

    return this.prisma.userAvailabilityWindow.create({
      data: {
        userId,
        label:         dto.label,
        startDate:     start,
        endDate:       end,
        isFlexible:    dto.isFlexible    ?? false,
        flexDaysBefore: dto.flexDaysBefore ?? 0,
        flexDaysAfter:  dto.flexDaysAfter  ?? 0,
        minTripDays:   dto.minTripDays,
        maxTripDays:   dto.maxTripDays,
        windowType:    dto.windowType    ?? 'TENTATIVE',
        isActive:      dto.isActive      ?? true,
      },
    });
  }

  async updateAvailabilityWindow(
    userId:   string,
    windowId: string,
    dto:      UpsertAvailabilityWindowDto,
  ) {
    const window = await this.prisma.userAvailabilityWindow.findUnique({
      where: { id: windowId },
    });
    if (!window)              throw new NotFoundException('Availability window not found');
    if (window.userId !== userId) throw new ForbiddenException('Not your availability window');

    const start = new Date(dto.startDate);
    const end   = new Date(dto.endDate);
    if (end <= start) throw new BadRequestException('endDate must be after startDate');

    return this.prisma.userAvailabilityWindow.update({
      where: { id: windowId },
      data:  {
        label:          dto.label,
        startDate:      start,
        endDate:        end,
        isFlexible:     dto.isFlexible,
        flexDaysBefore: dto.flexDaysBefore,
        flexDaysAfter:  dto.flexDaysAfter,
        minTripDays:    dto.minTripDays,
        maxTripDays:    dto.maxTripDays,
        windowType:     dto.windowType,
        isActive:       dto.isActive,
      },
    });
  }

  async deleteAvailabilityWindow(userId: string, windowId: string): Promise<void> {
    const window = await this.prisma.userAvailabilityWindow.findUnique({
      where: { id: windowId },
    });
    if (!window)                  throw new NotFoundException('Availability window not found');
    if (window.userId !== userId) throw new ForbiddenException('Not your availability window');
    await this.prisma.userAvailabilityWindow.delete({ where: { id: windowId } });
  }

  // ── Destination preferences ────────────────────────────────────────────────

  async getDestinationPreferences(userId: string) {
    const all = await this.prisma.userDestinationPreference.findMany({
      where:   { userId },
      orderBy: { addedAt: 'desc' },
    });
    return {
      preferred: all.filter(d => d.type === 'PREFERRED'),
      dream:     all.filter(d => d.type === 'DREAM'),
      excluded:  all.filter(d => d.type === 'EXCLUDED'),
    };
  }

  async addDestinationPreference(userId: string, dto: AddDestinationPreferenceDto) {
    try {
      return await this.prisma.userDestinationPreference.create({
        data: {
          userId,
          destinationCode: dto.destinationCode.toUpperCase(),
          type:            dto.type,
          note:            dto.note,
        },
      });
    } catch (err: any) {
      // P2002 = unique constraint violation (same user + code + type)
      if (err?.code === 'P2002') {
        throw new ConflictException(
          `${dto.type} preference for '${dto.destinationCode}' already exists`,
        );
      }
      throw err;
    }
  }

  async removeDestinationPreference(userId: string, prefId: string): Promise<void> {
    const pref = await this.prisma.userDestinationPreference.findUnique({
      where: { id: prefId },
    });
    if (!pref)                throw new NotFoundException('Destination preference not found');
    if (pref.userId !== userId) throw new ForbiddenException('Not your preference');
    await this.prisma.userDestinationPreference.delete({ where: { id: prefId } });
  }

  // ── Internal helpers ───────────────────────────────────────────────────────

  async getOrCreatePreferences(userId: string) {
    return this.prisma.userPreferences.upsert({
      where:  { userId },
      create: { userId },
      update: {},
    });
  }

  /** Strips undefined values so prisma upsert only updates supplied fields */
  private buildPrefsData(dto: UpdateTravelPreferencesDto): Record<string, any> {
    const data: Record<string, any> = {};
    const keys = Object.keys(dto) as (keyof UpdateTravelPreferencesDto)[];
    for (const key of keys) {
      if (dto[key] !== undefined) data[key] = dto[key];
    }
    return data;
  }
}
