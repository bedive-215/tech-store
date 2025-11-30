const { v4: uuidv4 } = require('uuid');
const PaymentRepository = require('../repositories/PaymentRepository');
const OrderRepository = require('../repositories/OrderRepository');

const PaymentService = {
  async createPayment({ order_id, payment_method, return_url }) {
    // Ensure order exists
    const order = await OrderRepository.findById(order_id);
    if (!order) throw new Error('Order not found');

    // Create payment record
    const paymentId = `PAY-${uuidv4()}`;
    const now = new Date();
    const paymentObj = {
      id: paymentId,
      order_id,
      method: payment_method,
      status: 'pending',
      transaction_id: null,
      created_at: now
    };
    await PaymentRepository.create(null, paymentObj);

    // Mock payment URL and QR code
    const fakeToken = Buffer.from(paymentId).toString('base64');
    const paymentUrl = `https://pay.example.com/${payment_method.toLowerCase()}?token=${fakeToken}&return_url=${encodeURIComponent(return_url || '')}`;
    const qrCode = `data:image/png;base64,${Buffer.from(`qr:${paymentId}`).toString('base64')}`;

    return {
      payment_id: paymentId,
      order_id,
      status: 'pending',
      payment_url: paymentUrl,
      qr_code: qrCode
    };
  },

  async listPaymentsByOrder(orderId) {
    const payments = await PaymentRepository.findByOrder(orderId);
    return payments.map(p => ({
      payment_id: p.id,
      method: p.method,
      amount: p.amount || null,
      status: p.status,
      transaction_id: p.transaction_id,
      paid_at: p.created_at
    }));
  }
};

module.exports = PaymentService;