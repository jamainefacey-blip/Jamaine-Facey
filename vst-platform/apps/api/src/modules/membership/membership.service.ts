import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../../database/prisma.service';
import { MembershipTier } from '@prisma/client';

// ── Plan definitions ──────────────────────────────────────────────────────────
// VST is BOTH a long-distance booking platform AND a local travel/discovery OS.
// Tier features reflect both use cases at every level.

export const VST_PLANS = [
  {
    tier: 'GUEST' as MembershipTier,
    name: 'Guest',
    monthlyGBP: 0,
    annualGBP:  0,
    stripePriceIdMonthly: null,
    stripePriceIdAnnual:  null,
    features: {
      longDistance: [
        'Flight and hotel search (affiliate)',
        'Visa requirements lookup',
        'Embassy directory',
        'Booking history',
      ],
      local: [
        'Browse local explorer map',
        'View community pins',
      ],
      safety: [
        'SOS trigger (email notification only)',
        'Up to 2 safety contacts',
        'Manual check-in',
      ],
      limits: {
        safetyContacts: 2,
        priceAlerts: 0,
        sosChannels: ['EMAIL'],
      },
    },
  },
  {
    tier: 'PREMIUM' as MembershipTier,
    name: 'Premium',
    monthlyGBP: 9.99,
    annualGBP:  89.99,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY ?? null,
    stripePriceIdAnnual:  process.env.STRIPE_PRICE_PREMIUM_ANNUAL  ?? null,
    features: {
      longDistance: [
        'Everything in Guest',
        'Unlimited price alerts',
        'Passport expiry alerts',
        'Priority search results',
        'Booking confirmation emails',
      ],
      local: [
        'Save local spots (unlimited)',
        'Personalised local recommendations',
        'Exclusive local deals from partners',
        'Community review posting',
        'Submit explorer map pins',
      ],
      safety: [
        'SOS via email + SMS',
        'Up to 5 safety contacts',
        'Timed check-in system',
        'Check-in miss alerts to contacts',
      ],
      limits: {
        safetyContacts: 5,
        priceAlerts: -1, // unlimited
        sosChannels: ['EMAIL', 'SMS'],
      },
    },
  },
  {
    tier: 'VOYAGE_ELITE' as MembershipTier,
    name: 'Voyage Elite',
    monthlyGBP: 24.99,
    annualGBP:  219.99,
    stripePriceIdMonthly: process.env.STRIPE_PRICE_ELITE_MONTHLY ?? null,
    stripePriceIdAnnual:  process.env.STRIPE_PRICE_ELITE_ANNUAL  ?? null,
    features: {
      longDistance: [
        'Everything in Premium',
        'AI travel recommendations (TwinAXIS)',
        'Travel continuity planning',
        'Concierge partner deals',
        'Early access to new features',
      ],
      local: [
        'Full local discovery OS access',
        'AI-powered local routing',
        'Local business rewards programme',
        'Offline local map cache',
        'Hyper-local event alerts',
      ],
      safety: [
        'SOS via email + SMS + push',
        'Unlimited safety contacts',
        'Live location sharing (SOS)',
        'Priority SOS escalation',
        'Dedicated safety profile',
      ],
      limits: {
        safetyContacts: -1, // unlimited
        priceAlerts: -1,
        sosChannels: ['EMAIL', 'SMS', 'PUSH'],
      },
    },
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable()
export class MembershipService {
  private readonly stripe: Stripe | null = null;
  private readonly logger = new Logger(MembershipService.name);

  constructor(private readonly prisma: PrismaService) {
    if (process.env.STRIPE_SECRET_KEY) {
      this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2023-10-16' });
    } else {
      this.logger.warn('STRIPE_SECRET_KEY missing — Stripe features DISABLED');
    }
  }

  getPlans() {
    return VST_PLANS;
  }

  async getUserTier(userId: string): Promise<'GUEST' | 'PREMIUM' | 'VOYAGE_ELITE'> {
    const membership = await this.prisma.membership.findUnique({ where: { userId } });
    return (membership?.tier ?? 'GUEST') as 'GUEST' | 'PREMIUM' | 'VOYAGE_ELITE';
  }

  async getMembership(userId: string) {
    const membership = await this.prisma.membership.findUnique({
      where: { userId },
      include: { user: { select: { email: true } } },
    });
    if (!membership) throw new NotFoundException('Membership record not found');
    const plan = VST_PLANS.find(p => p.tier === membership.tier)!;
    return { ...membership, plan };
  }

  // ── Stripe checkout ────────────────────────────────────────────────────────

  async createCheckoutSession(
    userId: string,
    tier: 'PREMIUM' | 'VOYAGE_ELITE',
    interval: 'monthly' | 'annual',
  ): Promise<string> {
    if (!this.stripe) throw new BadRequestException('Payment system not available');

    const plan = VST_PLANS.find(p => p.tier === tier)!;
    const priceId = interval === 'annual'
      ? plan.stripePriceIdAnnual
      : plan.stripePriceIdMonthly;

    if (!priceId) {
      throw new BadRequestException(`Stripe price ID not configured for ${tier}/${interval}`);
    }

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true },
    });

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({ email: user.email, metadata: { vstUserId: userId } });
      customerId = customer.id;
      await this.prisma.user.update({ where: { id: userId }, data: { stripeCustomerId: customerId } });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL}/pricing?checkout=cancelled`,
      metadata: { vstUserId: userId, tier, interval },
    });

    return session.url!;
  }

  async createBillingPortal(userId: string): Promise<string> {
    if (!this.stripe) throw new BadRequestException('Payment system not available');

    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { stripeCustomerId: true },
    });

    if (!user.stripeCustomerId) {
      throw new BadRequestException('No billing account found');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    });

    return session.url;
  }

  // ── Internal — called by PaymentsService webhook handler ──────────────────

  async applySubscriptionChange(
    stripeSubscriptionId: string,
    stripePriceId: string,
    status: string,
    customerId: string,
    periodStart: Date,
    periodEnd: Date,
    cancelAtPeriodEnd: boolean,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
    if (!user) {
      this.logger.warn(`No user found for Stripe customer ${customerId}`);
      return;
    }

    // Map Stripe price ID back to VST tier
    const tier = this.priceIdToTier(stripePriceId);
    const membershipStatus = this.stripeStatusToMembership(status);

    await this.prisma.$transaction([
      this.prisma.membership.update({
        where: { userId: user.id },
        data: { tier, status: membershipStatus },
      }),
      this.prisma.subscription.upsert({
        where: { stripeSubscriptionId },
        update: {
          stripePriceId,
          tier,
          status: this.stripeStatusToSubscription(status),
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd,
        },
        create: {
          userId: user.id,
          stripeSubscriptionId,
          stripePriceId,
          tier,
          status: this.stripeStatusToSubscription(status),
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd,
        },
      }),
    ]);

    this.logger.log(`Membership updated userId=${user.id} tier=${tier} status=${membershipStatus}`);
  }

  async downgradeToGuest(customerId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
    if (!user) return;
    await this.prisma.membership.update({
      where: { userId: user.id },
      data: { tier: 'GUEST', status: 'ACTIVE', expiresAt: new Date() },
    });
    this.logger.log(`Downgraded userId=${user.id} to GUEST`);
  }

  private priceIdToTier(priceId: string): MembershipTier {
    if (
      priceId === process.env.STRIPE_PRICE_PREMIUM_MONTHLY ||
      priceId === process.env.STRIPE_PRICE_PREMIUM_ANNUAL
    ) return 'PREMIUM';
    if (
      priceId === process.env.STRIPE_PRICE_ELITE_MONTHLY ||
      priceId === process.env.STRIPE_PRICE_ELITE_ANNUAL
    ) return 'VOYAGE_ELITE';
    return 'GUEST';
  }

  private stripeStatusToMembership(status: string) {
    if (['active', 'trialing'].includes(status)) return 'ACTIVE';
    if (status === 'past_due') return 'ACTIVE'; // grace period
    if (status === 'canceled') return 'CANCELLED';
    return 'PAUSED';
  }

  private stripeStatusToSubscription(status: string) {
    const map: Record<string, any> = {
      active: 'ACTIVE', trialing: 'TRIALING',
      past_due: 'PAST_DUE', canceled: 'CANCELLED',
      incomplete: 'INCOMPLETE',
    };
    return map[status] ?? 'ACTIVE';
  }
}
