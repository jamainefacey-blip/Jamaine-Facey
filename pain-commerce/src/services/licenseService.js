const License = require('../models/license');

const LicenseService = {
  /**
   * Issue a new license for a customer + product.
   * Default expiry is 1 year from now if not specified.
   */
  async issue({ productId, customerId, expiryDays }) {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + (expiryDays || 365));

    return License.create({
      productId,
      customerId,
      expiry: expiry.toISOString(),
      status: 'active',
    });
  },

  async getByCustomer(customerId) {
    return License.findByCustomerId(customerId);
  },

  async revoke(licenseId) {
    return License.updateStatus(licenseId, 'revoked');
  },
};

module.exports = LicenseService;
