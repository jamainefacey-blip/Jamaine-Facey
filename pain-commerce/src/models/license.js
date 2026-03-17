const pool = require('../../db/pool');

const License = {
  async findByCustomerId(customerId) {
    const { rows } = await pool.query(
      'SELECT * FROM licenses WHERE customer_id = $1 ORDER BY issue_date DESC',
      [customerId],
    );
    return rows;
  },

  async create({ productId, customerId, expiry, status }) {
    const { rows } = await pool.query(
      `INSERT INTO licenses (product_id, customer_id, expiry, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [productId, customerId, expiry, status || 'active'],
    );
    return rows[0];
  },

  async updateStatus(licenseId, status) {
    const { rows } = await pool.query(
      `UPDATE licenses SET status = $1 WHERE license_id = $2 RETURNING *`,
      [status, licenseId],
    );
    return rows[0];
  },
};

module.exports = License;
