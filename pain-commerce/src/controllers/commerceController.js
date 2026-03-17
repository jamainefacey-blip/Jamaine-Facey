const StripeService = require('../services/stripeService');
const LicenseService = require('../services/licenseService');
const LedgerService = require('../services/ledgerService');
const Customer = require('../models/customer');
const Subscription = require('../models/subscription');

const CommerceController = {
  /**
   * POST /commerce/create-checkout
   * Body: { email, name, priceId, mode, successUrl, cancelUrl, productId }
   */
  async createCheckout(req, res) {
    try {
      const { email, name, priceId, mode, successUrl, cancelUrl, productId } = req.body;

      if (!email || !priceId || !successUrl || !cancelUrl) {
        return res.status(400).json({ error: 'Missing required fields: email, priceId, successUrl, cancelUrl' });
      }

      // Ensure customer exists in Stripe and local DB
      const stripeCustomer = await StripeService.getOrCreateCustomer(email, name);

      let customer = await Customer.findByEmail(email);
      if (!customer) {
        customer = await Customer.create({
          email,
          name: name || null,
          stripeCustomerId: stripeCustomer.id,
        });
      } else if (!customer.stripe_customer_id) {
        await Customer.updateStripeId(customer.customer_id, stripeCustomer.id);
      }

      const session = await StripeService.createCheckoutSession({
        customerId: stripeCustomer.id,
        priceId,
        mode: mode || 'payment',
        successUrl,
        cancelUrl,
        metadata: {
          customerId: customer.customer_id,
          productId: productId || '',
        },
      });

      return res.json({ sessionId: session.id, url: session.url });
    } catch (err) {
      console.error('create-checkout error:', err.message);
      return res.status(500).json({ error: 'Failed to create checkout session' });
    }
  },

  /**
   * POST /commerce/webhook
   * Stripe webhook handler — raw body required for signature verification.
   */
  async webhook(req, res) {
    const signature = req.headers['stripe-signature'];
    let event;

    try {
      event = StripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid signature' });
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          await handleCheckoutComplete(event.data.object);
          break;
        }
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          await handleSubscriptionUpdate(event.data.object);
          break;
        }
        case 'customer.subscription.deleted': {
          await handleSubscriptionDeleted(event.data.object);
          break;
        }
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }

      return res.json({ received: true });
    } catch (err) {
      console.error('Webhook processing error:', err.message);
      return res.status(500).json({ error: 'Webhook processing failed' });
    }
  },

  /**
   * GET /commerce/licenses/:user
   */
  async getLicenses(req, res) {
    try {
      const customer = await Customer.findById(req.params.user);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      const licenses = await LicenseService.getByCustomer(customer.customer_id);
      return res.json({ licenses });
    } catch (err) {
      console.error('get-licenses error:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve licenses' });
    }
  },

  /**
   * GET /commerce/subscriptions/:user
   */
  async getSubscriptions(req, res) {
    try {
      const customer = await Customer.findById(req.params.user);
      if (!customer) {
        return res.status(404).json({ error: 'Customer not found' });
      }
      const subscriptions = await Subscription.findByCustomerId(customer.customer_id);
      return res.json({ subscriptions });
    } catch (err) {
      console.error('get-subscriptions error:', err.message);
      return res.status(500).json({ error: 'Failed to retrieve subscriptions' });
    }
  },
};

// --- Internal webhook handlers ---

async function handleCheckoutComplete(session) {
  const { customer: stripeCustomerId, amount_total, metadata } = session;

  let customer = await Customer.findByStripeId(stripeCustomerId);
  if (!customer) {
    // Create local record if webhook arrives before create-checkout response
    customer = await Customer.create({
      email: session.customer_details?.email || 'unknown',
      name: session.customer_details?.name || null,
      stripeCustomerId,
    });
  }

  const productId = metadata?.productId || session.line_items?.data?.[0]?.description || 'unknown';

  // Issue license
  await LicenseService.issue({
    productId,
    customerId: customer.customer_id,
  });

  // Record in Spider Strategy ledger
  await LedgerService.recordPayment({
    product: productId,
    amount: amount_total || 0,
  });

  // If this was a subscription checkout, record the subscription
  if (session.mode === 'subscription' && session.subscription) {
    const sub = await StripeService.retrieveSubscription(session.subscription);
    await Subscription.create({
      customerId: customer.customer_id,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price?.id || null,
      status: sub.status,
      currentPeriodStart: new Date(sub.current_period_start * 1000),
      currentPeriodEnd: new Date(sub.current_period_end * 1000),
    });
  }
}

async function handleSubscriptionUpdate(sub) {
  const existing = await Subscription.findByStripeId(sub.id);
  if (existing) {
    await Subscription.updateStatus(sub.id, sub.status, sub.canceled_at ? new Date(sub.canceled_at * 1000) : null);
  }
}

async function handleSubscriptionDeleted(sub) {
  await Subscription.updateStatus(sub.id, 'canceled', new Date());
}

module.exports = CommerceController;
