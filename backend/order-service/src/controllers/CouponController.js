const CouponService = require('../services/CouponService');
const pool = require('../config/db');

const CouponController = {

  async validate(req, res) {
    const conn = await pool.getConnection();
    try {
      const { code, total_amount } = req.body;

      if (!code) {
        return res.status(400).json({
          valid: false,
          reason: 'code_required'
        });
      }

      const result = await CouponService.validateCoupon(
        conn,
        code,
        Number(total_amount || 0)
      );

      return res.json(result);

    } catch (err) {
      console.error('[CouponController.validate] error', err);
      return res.status(500).json({
        valid: false,
        error: err.message
      });
    } finally {
      conn.release();
    }
  },

  async create(req, res) {
    try {
      const {
        code,
        discount_type,      // 'PERCENT' | 'FIXED'
        discount_value,
        max_discount,
        min_order_value,
        quantity,
        start_at,
        end_at
      } = req.body;

      if (!code || !discount_type || discount_value == null) {
        return res.status(400).json({
          error: 'Missing required fields'
        });
      }

      if (!['PERCENT', 'FIXED'].includes(discount_type)) {
        return res.status(400).json({
          error: 'discount_type must be PERCENT or FIXED'
        });
      }

      const result = await CouponService.createCoupon({
        code,
        discount_type,
        discount_value: Number(discount_value),
        max_discount: max_discount ? Number(max_discount) : null,
        min_order_value: min_order_value ? Number(min_order_value) : 0,
        quantity: quantity ?? 0,
        start_at,
        end_at
      });

      return res.status(201).json(result);

    } catch (err) {
      console.error('[CouponController.create] error', err);
      return res.status(500).json({ error: err.message });
    }
  },

  async list(req, res) {
    try {
      const active = req.query.active === 'true';
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);

      const coupons = await CouponService.listCoupons({
        active,
        page,
        limit
      });

      return res.json({ coupons });

    } catch (err) {
      console.error('[CouponController.list] error', err);
      return res.status(500).json({ error: err.message });
    }
  },

  async delete(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({ error: 'id required' });
      }

      const result = await CouponService.deleteCoupon(id);
      return res.json(result);

    } catch (err) {
      console.error('[CouponController.delete] error', err);
      return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = CouponController;
