const OrderService = require('../services/OrderService');

const OrderController = {
  async create(req, res) {
    try {
      const userId = req.body.user_id || req.query.user_id || 'U-ANON';
      const payload = {
        items: req.body.items,
        coupon_code: req.body.coupon_code,
        shipping_address: req.body.shipping_address,
        payment_method: req.body.payment_method
      };
      const result = await OrderService.createOrder(userId, payload);
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async list(req, res) {
    try {
      const userId = req.query.user_id || 'U-ANON';
      const page = Number(req.query.page || 1);
      const limit = Number(req.query.limit || 10);
      const status = req.query.status || null;
      const result = await OrderService.listUserOrders(userId, { page, limit, status });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  async detail(req, res) {
    try {
      const orderId = req.params.id;
      const result = await OrderService.getOrderDetail(orderId);
      if (!result) return res.status(404).json({ error: 'Order not found' });
      return res.json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  async cancel(req, res) {
    try {
      const orderId = req.params.id;
      const reason = req.body.reason || null;
      const result = await OrderService.cancelOrder(orderId, reason);
      return res.json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }
};

module.exports = OrderController;