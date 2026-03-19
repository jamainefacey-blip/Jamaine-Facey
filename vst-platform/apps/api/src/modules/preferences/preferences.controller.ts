/**
 * PreferencesController — Route plan
 *
 *   GET    /v1/preferences/travel             — full preference profile
 *   PUT    /v1/preferences/travel             — update travel preferences
 *   GET    /v1/preferences/availability       — list availability windows
 *   POST   /v1/preferences/availability       — create window
 *   PATCH  /v1/preferences/availability/:id   — update window
 *   DELETE /v1/preferences/availability/:id   — delete window
 *   GET    /v1/preferences/destinations       — list destination preferences
 *   POST   /v1/preferences/destinations       — add destination preference
 *   DELETE /v1/preferences/destinations/:id   — remove destination preference
 *
 * All routes: ClerkAuthGuard. User may only read/write their own data.
 */

import {
  Controller,
  Get,
  Put,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { PreferencesService } from './preferences.service';
import { UpdateTravelPreferencesDto } from './dto/update-travel-preferences.dto';
import { UpsertAvailabilityWindowDto } from './dto/upsert-availability-window.dto';
import { AddDestinationPreferenceDto } from './dto/add-destination-preference.dto';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller('preferences')
@UseGuards(ClerkAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesService: PreferencesService) {}

  // ── Travel preferences ────────────────────────────────────────────────────

  /**
   * GET /v1/preferences/travel
   * Returns full travel preference profile: preferences + destinations + windows.
   * Creates default preferences if none exist.
   */
  @Get('travel')
  getTravelPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.preferencesService.getTravelPreferences(user.id);
  }

  /**
   * PUT /v1/preferences/travel
   * Updates travel preferences. All fields optional — partial update safe.
   */
  @Put('travel')
  updateTravelPreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateTravelPreferencesDto,
  ) {
    return this.preferencesService.updateTravelPreferences(user.id, dto);
  }

  // ── Availability windows ──────────────────────────────────────────────────

  /**
   * GET /v1/preferences/availability
   * Lists all availability windows (active + inactive), ordered by startDate.
   */
  @Get('availability')
  getAvailabilityWindows(@CurrentUser() user: AuthenticatedUser) {
    return this.preferencesService.getAvailabilityWindows(user.id);
  }

  /**
   * POST /v1/preferences/availability
   * Creates a new availability window.
   */
  @Post('availability')
  createAvailabilityWindow(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertAvailabilityWindowDto,
  ) {
    return this.preferencesService.createAvailabilityWindow(user.id, dto);
  }

  /**
   * PATCH /v1/preferences/availability/:id
   * Updates an existing availability window. Ownership-checked.
   */
  @Patch('availability/:id')
  updateAvailabilityWindow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpsertAvailabilityWindowDto,
  ) {
    return this.preferencesService.updateAvailabilityWindow(user.id, id, dto);
  }

  /**
   * DELETE /v1/preferences/availability/:id
   * Deletes an availability window. Ownership-checked.
   */
  @Delete('availability/:id')
  @HttpCode(204)
  deleteAvailabilityWindow(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.preferencesService.deleteAvailabilityWindow(user.id, id);
  }

  // ── Destination preferences ───────────────────────────────────────────────

  /**
   * GET /v1/preferences/destinations
   * Returns destinations grouped by type: { preferred, dream, excluded }.
   */
  @Get('destinations')
  getDestinationPreferences(@CurrentUser() user: AuthenticatedUser) {
    return this.preferencesService.getDestinationPreferences(user.id);
  }

  /**
   * POST /v1/preferences/destinations
   * Adds a destination preference (PREFERRED | DREAM | EXCLUDED).
   * Returns 409 if the same code + type already exists.
   */
  @Post('destinations')
  addDestinationPreference(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AddDestinationPreferenceDto,
  ) {
    return this.preferencesService.addDestinationPreference(user.id, dto);
  }

  /**
   * DELETE /v1/preferences/destinations/:id
   * Removes a destination preference by record ID. Ownership-checked.
   */
  @Delete('destinations/:id')
  @HttpCode(204)
  removeDestinationPreference(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.preferencesService.removeDestinationPreference(user.id, id);
  }
}
