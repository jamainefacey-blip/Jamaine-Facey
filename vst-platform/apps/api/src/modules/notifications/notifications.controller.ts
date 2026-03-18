import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@Controller('notifications')
@UseGuards(ClerkAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /v1/notifications?page=1&limit=20
  @Get()
  getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.getNotifications(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? Math.min(parseInt(limit, 10), 50) : 20,
    );
  }

  // PATCH /v1/notifications/:id/read
  @Patch(':id/read')
  @HttpCode(204)
  markAsRead(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.notificationsService.markAsRead(user.id, id);
  }

  // PATCH /v1/notifications/read-all
  @Patch('read-all')
  @HttpCode(204)
  markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.notificationsService.markAllRead(user.id);
  }

  // POST /v1/notifications/push/subscribe
  @Post('push/subscribe')
  @HttpCode(204)
  subscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: PushSubscriptionDto) {
    this.notificationsService.registerPushSubscription(user.id, dto);
  }

  // DELETE /v1/notifications/push/subscribe
  @Delete('push/subscribe')
  @HttpCode(204)
  unsubscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: { endpoint: string }) {
    this.notificationsService.removePushSubscription(user.id, dto.endpoint);
  }
}
