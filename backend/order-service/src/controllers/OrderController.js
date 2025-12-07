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
      const { user_id: userId, order_id: orderId, page, limit, status } = req.query;

      if (orderId) {
        // Nếu có order_id => trả về chi tiết đơn
        const order = await OrderService.getOrderById(orderId);
        if (!order) return res.status(404).json({ error: "Order not found" });
        return res.json(order);
      }

      if (!userId) {
        return res.status(400).json({ error: "user_id is required if order_id not provided" });
      }

      // Trường hợp lấy danh sách đơn hàng theo user_id
      const result = await OrderService.listUserOrders(userId, {
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        status: status || null
      });

      return res.json(result);
    } catch (err) {
      console.error(err);
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