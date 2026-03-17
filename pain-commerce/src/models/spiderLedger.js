const pool = require('../../db/pool');

const SpiderLedger = {
  async record({ product, revenue, fee, netRevenue }) {
    const { rows } = await pool.query(
      `INSERT INTO spider_ledger (product, revenue, fee, net_revenue)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [product, revenue, fee, netRevenue],
    );
    return rows[0];
  },

  async list({ limit = 50, offset = 0 } = {}) {
    const { rows } = await pool.query(
      'SELECT * FROM spider_ledger ORDER BY timestamp DESC LIMIT $1 OFFSET $2',
      [limit, offset],
    );
    return rows;
  },

  async getByProduct(product) {
    const { rows } = await pool.query(
      'SELECT * FROM spider_ledger WHERE product = $1 ORDER BY timestamp DESC',
      [product],
    );
    return rows;
  },
};

module.exports = SpiderLedger;
