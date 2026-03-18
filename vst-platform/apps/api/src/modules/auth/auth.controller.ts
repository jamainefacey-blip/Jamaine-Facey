import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Webhook, WebhookRequiredHeaders } from 'svix';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private readonly authService: AuthService) {}

  /**
   * POST /v1/webhooks/clerk
   *
   * Receives Clerk lifecycle events. NOT protected by ClerkAuthGuard —
   * authenticated via svix HMAC signature verification instead.
   *
   * Requires rawBody to be enabled in main.ts: NestFactory.create(AppModule, { rawBody: true })
   */
  @Post('webhooks/clerk')
  @HttpCode(200)
  async handleClerkWebhook(
    @Req() req: any,
    @Headers('svix-id') svixId: string,
    @Headers('svix-timestamp') svixTimestamp: string,
    @Headers('svix-signature') svixSignature: string,
  ) {
    if (!svixId || !svixTimestamp || !svixSignature) {
      throw new BadRequestException('Missing svix signature headers');
    }

    const secret = process.env.CLERK_WEBHOOK_SECRET;
    if (!secret) {
      throw new BadRequestException('Webhook secret not configured');
    }

    const wh = new Webhook(secret);
    let evt: { type: string; data: any };

    try {
      const headers: WebhookRequiredHeaders = {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      };
      evt = wh.verify(req.rawBody as Buffer, headers) as typeof evt;
    } catch {
      throw new BadRequestException('Invalid webhook signature');
    }

    this.logger.log(`Clerk webhook: ${evt.type}`);

    switch (evt.type) {
      case 'user.created':
      case 'user.updated':
        await this.authService.syncUser(evt.data);
        break;
      case 'user.deleted':
        await this.authService.deleteUser(evt.data.id);
        break;
      default:
        // Unhandled event types — acknowledged but ignored
        this.logger.debug(`Unhandled event type: ${evt.type}`);
    }

    return { received: true };
  }
}
