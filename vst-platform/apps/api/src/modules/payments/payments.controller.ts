import {
  Controller,
  Post,
  Get,
  Req,
  Headers,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { ClerkAuthGuard } from '../../common/guards/clerk-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';

@Controller()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * POST /v1/webhooks/stripe
   * NOT guarded by ClerkAuthGuard — verified via Stripe signature instead.
   * Requires rawBody enabled in main.ts.
   */
  @Post('webhooks/stripe')
  @HttpCode(200)
  async handleStripeWebhook(
    @Req() req: any,
    @Headers('stripe-signature') signature: string,
  ) {
    const event = this.paymentsService.constructEvent(req.rawBody as Buffer, signature);
    await this.paymentsService.handleStripeEvent(event);
    return { received: true };
  }

  // GET /v1/payments
  @Get('payments')
  @UseGuards(ClerkAuthGuard)
  getPaymentHistory(@CurrentUser() user: AuthenticatedUser) {
    return this.paymentsService.getPaymentHistory(user.id);
  }
}
