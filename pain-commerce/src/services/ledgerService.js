const SpiderLedger = require('../models/spiderLedger');

const LedgerService = {
  /**
   * Record a payment in the Spider Strategy ledger.
   * Stripe fees are estimated at 2.9% + $0.30 if not provided.
   */
  async recordPayment({ product, amount, fee }) {
    const revenue = amount / 100; // Stripe amounts are in cents
    const estimatedFee = fee != null ? fee / 100 : +(revenue * 0.029 + 0.30).toFixed(2);
    const netRevenue = +(revenue - estimatedFee).toFixed(2);

    return SpiderLedger.record({
      product,
      revenue,
      fee: estimatedFee,
      netRevenue,
    });
  },

  async list(options) {
    return SpiderLedger.list(options);
  },
};

module.exports = LedgerService;
