const pool = require('../config/db');

const OrderItemRepository = {
  async bulkCreate(conn, items) {
    if (!items || items.length === 0) return [];

    const placeholders = items.map(() => '(?,?,?,?,?,?)').join(',');
    const params = [];
    items.forEach(it => {
      params.push(
        it.id,
        it.order_id,
        it.product_id,
        it.product_name,
        parseInt(it.quantity, 10),
        parseFloat(it.price)
      );
    });

    const sql = `INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price) VALUES ${placeholders}`;
    await conn.execute(sql, params);
    return items;
  },

  async findByOrder(orderId) {
    if (!orderId) return [];
    // Chỉ lấy dữ liệu từ order_items, không join products
    const sql = `
      SELECT *
      FROM order_items
      WHERE order_id = ?
    `;
    const [rows] = await pool.execute(sql, [orderId]);
    return rows;
  }
};

module.exports = OrderItemRepository;
