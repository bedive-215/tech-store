const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/CouponController');

// POST /api/v1/coupons/validate
router.post('/validate', CouponController.validate);

// POST /api/v1/coupons
router.post('/', CouponController.create);

// GET /api/v1/coupons
router.get('/', CouponController.list);

// DELETE /api/v1/coupons/:id
router.delete('/:id', CouponController.delete);

module.exports = router;
