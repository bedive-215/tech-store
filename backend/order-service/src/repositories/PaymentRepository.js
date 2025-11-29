const pool = require('../config/db');

const PaymentRepository = {
  async create(connOrPool, payment) {
    const db = connOrPool || pool;
    const sql = `
      INSERT INTO payments (id, order_id, method, status, transaction_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const params = [
      payment.id,
      payment.order_id,
      payment.method,
      payment.status || 'pending',
      payment.transaction_id || null,
      payment.created_at || new Date()
    ];
    await db.execute(sql, params);
    return payment;
  },

  async findByOrder(orderId) {
    if (!orderId) return [];
    const sql = 'SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC';
    const [rows] = await pool.execute(sql, [orderId]);
    return rows;
  }
};

module.exports = PaymentRepository;
