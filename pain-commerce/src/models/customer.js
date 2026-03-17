const pool = require('../../db/pool');

const Customer = {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM customers WHERE email = $1',
      [email],
    );
    return rows[0] || null;
  },

  async findById(customerId) {
    const { rows } = await pool.query(
      'SELECT * FROM customers WHERE customer_id = $1',
      [customerId],
    );
    return rows[0] || null;
  },

  async findByStripeId(stripeCustomerId) {
    const { rows } = await pool.query(
      'SELECT * FROM customers WHERE stripe_customer_id = $1',
      [stripeCustomerId],
    );
    return rows[0] || null;
  },

  async create({ email, name, stripeCustomerId }) {
    const { rows } = await pool.query(
      `INSERT INTO customers (email, name, stripe_customer_id)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email, name, stripeCustomerId],
    );
    return rows[0];
  },

  async updateStripeId(customerId, stripeCustomerId) {
    const { rows } = await pool.query(
      `UPDATE customers SET stripe_customer_id = $1, updated_at = NOW()
       WHERE customer_id = $2
       RETURNING *`,
      [stripeCustomerId, customerId],
    );
    return rows[0];
  },
};

module.exports = Customer;
