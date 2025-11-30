const PaymentService = require('../services/PaymentService');

const PaymentController = {
  async create(req, res) {
    try {
      const { order_id, payment_method, return_url } = req.body;
      if (!order_id || !payment_method) {
        return res.status(400).json({ error: 'order_id and payment_method required' });
      }
      const result = await PaymentService.createPayment({ order_id, payment_method, return_url });
      return res.status(201).json(result);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  },

  async listByOrder(req, res) {
    try {
      const orderId = req.params.orderId;
      const payments = await PaymentService.listPaymentsByOrder(orderId);
      return res.json({ payments });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};

module.exports = PaymentController;