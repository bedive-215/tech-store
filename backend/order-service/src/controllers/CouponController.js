const CouponService = require('../services/CouponService');

const CouponController = {
  async validate(req, res) {
    try {
      const { code, total_amount } = req.body;

      if (!code) return res.status(400).json({ error: 'code required' });

      const result = await CouponService.validateCoupon(
        code,
        Number(total_amount || 0)
      );

      res.json(result);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  async create(req, res) {
    try {
      const { code, discount_type, discount_value, usage_limit, expires_at } = req.body;

      if (!code || !discount_type || !discount_value) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const result = await CouponService.createCoupon({
        code,
        discount_type,
        discount_value,
        usage_limit,
        expires_at
      });

      res.status(201).json(result);

    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  },

async list(req, res) {
    try {
      const active = req.query.active === "true";
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 20);

      const coupons = await CouponService.listCoupons({
        active,
        page,
        limit
      });

      return res.json({ coupons });

    } catch (err) {
      console.error("🔥 [CouponController.list] ERROR");
      console.error(err);

      return res.status(500).json({
        error: err.message,
        stack: err.stack
      });
    }
  },

  async delete(req, res) {
    try {
      const id = req.params.id;

      const result = await CouponService.deleteCoupon(id);

      res.json(result);

    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};

module.exports = CouponController;
