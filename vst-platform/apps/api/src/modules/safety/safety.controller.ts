import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { SafetyService } from './safety.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { TriggerSosDto } from './dto/trigger-sos.dto';
import { CreateCheckInDto } from './dto/create-check-in.dto';

@Controller('sos')
@UseGuards(ClerkAuthGuard)
export class SafetyController {
  constructor(private readonly safetyService: SafetyService) {}

  // POST /v1/sos
  @Post()
  @HttpCode(201)
  triggerSos(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: TriggerSosDto,
  ) {
    return this.safetyService.triggerSos(user.id, dto);
  }

  // GET /v1/sos/:id
  @Get(':id')
  getSosEvent(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.safetyService.getSosEvent(user.id, id);
  }

  // PATCH /v1/sos/:id/resolve
  @Patch(':id/resolve')
  @HttpCode(200)
  resolveSos(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.safetyService.resolveSos(user.id, id);
  }
}

@Controller('check-ins')
@UseGuards(ClerkAuthGuard)
export class CheckInController {
  constructor(private readonly safetyService: SafetyService) {}

  // POST /v1/check-ins
  @Post()
  @HttpCode(201)
  createCheckIn(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateCheckInDto,
  ) {
    return this.safetyService.createCheckIn(user.id, dto);
  }

  // GET /v1/check-ins
  @Get()
  getCheckIns(@CurrentUser() user: AuthenticatedUser) {
    return this.safetyService.getCheckIns(user.id);
  }
}
