const Stripe = require('stripe');
const config = require('../../config');

const stripe = new Stripe(config.stripe.secretKey);

const StripeService = {
  /**
   * Create or retrieve a Stripe customer.
   */
  async getOrCreateCustomer(email, name) {
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      return existing.data[0];
    }
    return stripe.customers.create({ email, name });
  },

  /**
   * Create a Checkout Session for a one-time payment or subscription.
   */
  async createCheckoutSession({ customerId, priceId, mode, successUrl, cancelUrl, metadata }) {
    return stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: mode || 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: metadata || {},
    });
  },

  /**
   * Construct and verify a webhook event from the raw body and signature.
   */
  constructWebhookEvent(rawBody, signature) {
    return stripe.webhooks.constructEvent(
      rawBody,
      signature,
      config.stripe.webhookSecret,
    );
  },

  /**
   * Retrieve a Checkout Session by ID (with line items expanded).
   */
  async retrieveSession(sessionId) {
    return stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    });
  },

  /**
   * Retrieve a subscription by ID.
   */
  async retrieveSubscription(subscriptionId) {
    return stripe.subscriptions.retrieve(subscriptionId);
  },
};

module.exports = StripeService;
