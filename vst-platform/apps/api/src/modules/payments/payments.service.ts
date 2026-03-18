import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { MembershipService } from '../membership/membership.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  private readonly stripe: Stripe | null = null;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly membershipService: MembershipService,
    private readonly notificationsService: NotificationsService,
  ) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
    }
  }

  // ── Stripe webhook handler ─────────────────────────────────────────────────

  /**
   * Processes verified Stripe webhook events.
   * Raw body + signature verification happens in PaymentsController before this is called.
   *
   * Handles:
   * - customer.subscription.created/updated → applySubscriptionChange()
   * - customer.subscription.deleted         → downgradeToGuest()
   * - invoice.paid                          → create Payment record
   * - invoice.payment_failed                → notify user
   */
  async handleStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription;
        await this.membershipService.applySubscriptionChange(
          sub.id,
          sub.items.data[0]?.price?.id ?? '',
          sub.status,
          sub.customer as string,
          new Date(sub.current_period_start * 1000),
          new Date(sub.current_period_end   * 1000),
          sub.cancel_at_period_end,
        );
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription;
        await this.membershipService.downgradeToGuest(sub.customer as string);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.recordPayment(invoice, 'SUCCEEDED');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await this.recordPayment(invoice, 'FAILED');
        await this.notifyPaymentFailed(invoice.customer as string);
        break;
      }

      default:
        this.logger.debug(`Unhandled Stripe event: ${event.type}`);
    }
  }

  private async recordPayment(invoice: Stripe.Invoice, status: 'SUCCEEDED' | 'FAILED'): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { stripeCustomerId: invoice.customer as string },
    });
    if (!user) return;

    await this.prisma.payment.create({
      data: {
        userId:          user.id,
        stripePaymentId: invoice.payment_intent as string ?? null,
        amount:          invoice.amount_paid,
        currency:        invoice.currency.toUpperCase(),
        status,
        type:            'SUBSCRIPTION',
        metadata:        { invoiceId: invoice.id, invoiceNumber: invoice.number },
      },
    });
  }

  private async notifyPaymentFailed(stripeCustomerId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { stripeCustomerId } });
    if (!user) return;

    await this.prisma.notification.create({
      data: {
        userId:  user.id,
        type:    'MEMBERSHIP_RENEWAL',
        channel: 'IN_APP',
        title:   'Payment failed',
        body:    'Your subscription payment failed. Update your billing details to keep Premium access.',
        data:    { action: 'open_billing_portal' },
      },
    });

    // Also send email
    await this.notificationsService['resend']?.send({
      to:      user.email,
      subject: 'Action required — VST subscription payment failed',
      html:    `<p>Your Voyage Smart Travel payment failed. <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/billing">Update billing details</a>.</p>`,
    });
  }

  // ── Webhook verification ───────────────────────────────────────────────────

  constructEvent(rawBody: Buffer, signature: string): Stripe.Event {
    if (!this.stripe) throw new BadRequestException('Payment system not configured');
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!secret) throw new BadRequestException('Stripe webhook secret not configured');
    try {
      return this.stripe.webhooks.constructEvent(rawBody, signature, secret);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature');
    }
  }

  // ── Payment history ────────────────────────────────────────────────────────

  async getPaymentHistory(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
