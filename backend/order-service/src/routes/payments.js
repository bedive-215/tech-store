const express = require('express');
const router = express.Router();
const PaymentController = require('../controllers/PaymentController');

// Create payment
router.post('/', PaymentController.create);

// Get payment history for order
router.get('/:orderId', PaymentController.listByOrder);

module.exports = router;
