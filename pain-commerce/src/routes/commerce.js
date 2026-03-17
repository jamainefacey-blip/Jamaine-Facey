const { Router } = require('express');
const CommerceController = require('../controllers/commerceController');

const router = Router();

router.post('/create-checkout', CommerceController.createCheckout);
router.get('/licenses/:user', CommerceController.getLicenses);
router.get('/subscriptions/:user', CommerceController.getSubscriptions);

// Note: webhook route is mounted separately in server.js with raw body parsing

module.exports = router;
