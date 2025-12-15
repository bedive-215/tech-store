const express = require('express');
const router = express.Router();
const CouponController = require('../controllers/CouponController');
const authMiddleware = require('../middlewares/auth');

// POST /api/v1/coupons/validate
router.post('/validate', authMiddleware.auth, CouponController.validate);

// POST /api/v1/coupons
router.post('/', authMiddleware.auth, authMiddleware.checkRole('admin'), CouponController.create);

// GET /api/v1/coupons
router.get('/', CouponController.list);

// DELETE /api/v1/coupons/:id
router.delete('/:id', authMiddleware.auth, authMiddleware.checkRole('admin'), CouponController.delete);

module.exports = router;
