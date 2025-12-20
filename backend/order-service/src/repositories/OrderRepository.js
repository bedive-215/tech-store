const pool = require('../config/db');

const OrderRepository = {
  async create(conn, order) {
    const c = conn || pool;

    console.log("=== DEBUG ORDER CREATE ===");
    console.log("ORDER ID:", order.id);
    console.log("ORDER ID LENGTH:", order.id?.length);
    console.log("ORDER OBJ:", order);

    const sql = `
      INSERT INTO orders 
      (id, user_id, status, total_price, discount_amount, final_price, created_at, updated_at, shipping_address, cancelled_at, cancel_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      order.id,
      order.user_id,
      order.status || 'pending',
      order.total_price,
      order.discount_amount || 0.0,
      order.final_price,
      order.created_at || new Date(),
      order.updated_at || new Date(),
      order.shipping_address || null,
      order.cancelled_at || null,
      order.cancel_reason || null
    ];

    console.log("SQL:", sql);
    console.log("PARAMS:", params.map(v => (typeof v === 'string' ? `${v} (len=${v.length})` : v)));

    try {
      await c.execute(sql, params);
      console.log("=== ORDER CREATED SUCCESSFULLY ===");
    } catch (err) {
      console.error("SQL ERROR (create):", err.message);
      throw err;
    }

    return order;
  },

  async findById(orderId) {
    if (!orderId) return null;
    try {
      console.log('>> findById called with:', orderId);
      const [rows] = await pool.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
      console.log('>> findById result rows:', rows.length);
      return rows[0] || null;
    } catch (err) {
      console.error('SQL ERROR (findById):', err.message, 'orderId:', orderId);
      throw err;
    }
  },

  async findAll({ page = null, limit = null } = {}) {
    try {
      let sql;
      let params = [];

      if (page != null && limit != null) {
        const limitNum = Math.max(1, Number(limit) || 10);
        const pageNum = Math.max(1, Number(page) || 1);
        const offsetNum = (pageNum - 1) * limitNum;
        sql = `SELECT * FROM orders ORDER BY created_at DESC LIMIT ?, ?`;
        params = [offsetNum, limitNum];
      } else if (limit != null) {
        const limitNum = Math.max(1, Number(limit) || 100);
        sql = `SELECT * FROM orders ORDER BY created_at DESC LIMIT ?`;
        params = [limitNum];
      } else {
        // trả tất cả (cẩn thận nếu bảng lớn)
        sql = `SELECT * FROM orders ORDER BY created_at DESC`;
        params = [];
      }

      const [rows] = await pool.execute(sql, params);

      // total count: nếu có phân trang thì tính COUNT toàn bộ, nếu không, total = rows.length
      let total;
      if (page != null && limit != null) {
        const [countRows] = await pool.execute(`SELECT COUNT(*) AS total FROM orders`);
        total = countRows[0]?.total || 0;
      } else {
        total = rows.length;
      }

      return { rows, total };
    } catch (err) {
      console.error('SQL ERROR (findAll):', err.message);
      throw err;
    }
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

    const sql = `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ${offsetNum}, ${limitNum}`;
    console.log('DEBUG findByUser SQL:', sql);
    console.log('DEBUG findByUser PARAMS:', params);

    try {
      const [rows] = await pool.execute(sql, params);
      const countSql = `SELECT COUNT(*) AS total FROM orders ${where}`;
      console.log('DEBUG countSql:', countSql);
      console.log('DEBUG countSql PARAMS:', params);
      const [countRows] = await pool.execute(countSql, params);
      const total = countRows[0]?.total || 0;
      return { rows, total };
    } catch (err) {
      console.error('SQL EXEC ERROR in findByUser:', err);
      throw err;
    }
  },

  async updateStatus(conn, orderId, status, extra = {}) {
    const c = conn || pool;

    // Lấy order trước
    const [rows] = await c.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    const order = rows[0];
    if (!order) return null;

    const fields = ['status = ?', 'updated_at = ?'];
    const values = [status, new Date()];

    if (status === 'paid') {
      fields.push('paid_at = ?');
      values.push(extra.paid_at || new Date());
    }

    if (status === 'cancelled') {
      fields.push('cancelled_at = ?');
      values.push(extra.cancelled_at || new Date());

      if (extra.cancel_reason) {
        fields.push('cancel_reason = ?');
        values.push(extra.cancel_reason);
      }
    }

    values.push(orderId);

    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
    await c.execute(sql, values);

    const [updatedRows] = await c.execute('SELECT * FROM orders WHERE id = ?', [orderId]);
    return updatedRows[0];
  },

  async findByIdWithItems(orderId) {
    if (!orderId) return null;

    try {
      const [orders] = await pool.execute(
        'SELECT * FROM orders WHERE id = ?',
        [orderId]
      );

      if (!orders.length) return null;

      const order = orders[0];

      const [items] = await pool.execute(
        `SELECT product_id, quantity, price 
       FROM order_items 
       WHERE order_id = ?`,
        [orderId]
      );

      order.items = items;
      return order;

    } catch (err) {
      console.error('SQL ERROR (findByIdWithItems):', err.message);
      throw err;
    }
  },

  async findPaidOrdersByDateRange(startDate, endDate) {
    const sql = `
    SELECT final_price
    FROM orders
    WHERE status = 'paid'
      AND paid_at BETWEEN ? AND ?
  `;

    const [rows] = await pool.execute(sql, [startDate, endDate]);
    return rows;
  },

  async revenueByDay(startDate, endDate) {
    const sql = `
    SELECT 
      DATE(paid_at) AS date,
      SUM(final_price) AS revenue,
      COUNT(*) AS total_orders
    FROM orders
    WHERE status = 'paid'
      AND paid_at BETWEEN ? AND ?
    GROUP BY DATE(paid_at)
    ORDER BY DATE(paid_at)
  `;

    const [rows] = await pool.execute(sql, [startDate, endDate]);
    return rows;
  },

  async revenueByMonth(year) {
    const sql = `
    SELECT 
      MONTH(paid_at) AS month,
      SUM(final_price) AS revenue,
      COUNT(*) AS total_orders
    FROM orders
    WHERE status = 'paid'
      AND YEAR(paid_at) = ?
    GROUP BY MONTH(paid_at)
    ORDER BY month
  `;

    const [rows] = await pool.execute(sql, [year]);
    return rows;
  },

  async revenueByYear() {
    const sql = `
    SELECT 
      YEAR(paid_at) AS year,
      SUM(final_price) AS revenue,
      COUNT(*) AS total_orders
    FROM orders
    WHERE status = 'paid'
    GROUP BY YEAR(paid_at)
    ORDER BY year
  `;

    const [rows] = await pool.execute(sql);
    return rows;
  },

};

module.exports = OrderRepository;
