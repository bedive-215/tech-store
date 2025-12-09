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

// --- NEW ---
// Get all orders (admin)
router.get('/admin/all', OrderController.listAll);

// Set order status => shipping
router.put('/:id/ship', OrderController.setShipping);

// Set order status => completed
router.put('/:id/complete', OrderController.setCompleted);

module.exports = router;
