const pool = require('../../db/pool');

const Subscription = {
  async findByCustomerId(customerId) {
    const { rows } = await pool.query(
      'SELECT * FROM subscriptions WHERE customer_id = $1 ORDER BY created_at DESC',
      [customerId],
    );
    return rows;
  },

  async findByStripeId(stripeSubscriptionId) {
    const { rows } = await pool.query(
      'SELECT * FROM subscriptions WHERE stripe_subscription_id = $1',
      [stripeSubscriptionId],
    );
    return rows[0] || null;
  },

  async create({ customerId, stripeSubscriptionId, stripePriceId, status, currentPeriodStart, currentPeriodEnd }) {
    const { rows } = await pool.query(
      `INSERT INTO subscriptions
         (customer_id, stripe_subscription_id, stripe_price_id, status, current_period_start, current_period_end)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [customerId, stripeSubscriptionId, stripePriceId, status, currentPeriodStart, currentPeriodEnd],
    );
    return rows[0];
  },

  async updateStatus(stripeSubscriptionId, status, canceledAt) {
    const { rows } = await pool.query(
      `UPDATE subscriptions
       SET status = $1, canceled_at = $2, updated_at = NOW()
       WHERE stripe_subscription_id = $3
       RETURNING *`,
      [status, canceledAt, stripeSubscriptionId],
    );
    return rows[0];
  },
};

module.exports = Subscription;
