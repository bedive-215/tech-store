const pool = require('../config/db');

const OrderRepository = {
  async create(conn, order) {
    const c = conn || pool;
    const sql = `
      INSERT INTO orders 
      (id, user_id, status, total_price, discount_amount, created_at, updated_at, shipping_address, cancelled_at, cancel_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      order.id,
      order.user_id,
      order.status || 'pending',
      order.total_price,
      order.discount_amount || 0.0,
      order.created_at || new Date(),
      order.updated_at || new Date(),
      order.shipping_address || null,
      order.cancelled_at || null,
      order.cancel_reason || null
    ];
    await c.execute(sql, params);
    return order;
  },

  async findById(orderId) {
    if (!orderId) return null;
    const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    return rows[0] || null;
  },

  async findByUser(userId, { page = 1, limit = 10, status } = {}) {
    if (!userId) return { rows: [], total: 0 };

    const limitNum = Number(limit) || 10;
    const pageNum = Number(page) || 1;
    const offsetNum = (pageNum - 1) * limitNum;

    let where = 'WHERE user_id = ?';
    const params = [userId];

    if (status) {
      where += ' AND status = ?';
      params.push(status);
    }

    // Inline LIMIT để tránh lỗi MySQL2
    const sql = `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ${offsetNum}, ${limitNum}`;
    const [rows] = await pool.execute(sql, params);

    // COUNT tổng số
    const countSql = `SELECT COUNT(*) AS total FROM orders ${where}`;
    const [countRows] = await pool.execute(countSql, params);
    const total = countRows[0]?.total || 0;

    return { rows, total };
  },

  async updateStatus(connOrPool, orderId, status, extraFields = {}) {
    const conn = connOrPool || pool;
    const sets = ['status = ?', 'updated_at = ?'];
    const params = [status, new Date()];

    for (const k of Object.keys(extraFields)) {
      sets.push(`${k} = ?`);
      params.push(extraFields[k]);
    }

    params.push(orderId);
    const sql = `UPDATE orders SET ${sets.join(', ')} WHERE id = ?`;
    await conn.execute(sql, params);

    return this.findById(orderId);
  }
};

module.exports = OrderRepository;
