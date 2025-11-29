const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');

// Create order
router.post('/', OrderController.create);

// List user's orders
router.get('/', OrderController.list);

// Order detail
router.get('/:id', OrderController.detail);

// Cancel order
router.put('/:id/cancel', OrderController.cancel);

module.exports = router;
