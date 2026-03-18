import {
  Controller,
  Get,
  Patch,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { CreateSafetyContactDto } from './dto/create-safety-contact.dto';
import { UpsertPassportDto } from './dto/upsert-passport.dto';

@Controller('users')
@UseGuards(ClerkAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // GET /v1/users/me
  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getMe(user.id);
  }

  // PATCH /v1/users/me/profile
  @Patch('me/profile')
  updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }

  // PATCH /v1/users/me/preferences
  @Patch('me/preferences')
  updatePreferences(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdatePreferencesDto,
  ) {
    return this.usersService.updatePreferences(user.id, dto);
  }

  // ── Safety Contacts ────────────────────────────────────────────────────────

  // GET /v1/users/me/safety-contacts
  @Get('me/safety-contacts')
  getSafetyContacts(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getSafetyContacts(user.id);
  }

  // POST /v1/users/me/safety-contacts
  @Post('me/safety-contacts')
  createSafetyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSafetyContactDto,
  ) {
    const tier = user.membership?.tier ?? 'GUEST';
    return this.usersService.createSafetyContact(user.id, dto, tier);
  }

  // PATCH /v1/users/me/safety-contacts/:id
  @Patch('me/safety-contacts/:id')
  updateSafetyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: Partial<CreateSafetyContactDto>,
  ) {
    return this.usersService.updateSafetyContact(user.id, id, dto);
  }

  // DELETE /v1/users/me/safety-contacts/:id
  @Delete('me/safety-contacts/:id')
  deleteSafetyContact(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.usersService.deleteSafetyContact(user.id, id);
  }

  // ── Passport ───────────────────────────────────────────────────────────────

  // GET /v1/users/me/passport
  @Get('me/passport')
  getPassport(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.getPassport(user.id);
  }

  // PUT /v1/users/me/passport
  @Put('me/passport')
  upsertPassport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpsertPassportDto,
  ) {
    return this.usersService.upsertPassport(user.id, dto);
  }
}
