const pool = require('../config/db');

const CouponRepository = {

  async findByCode(conn, code) {
    const [rows] = await conn.execute(
      `SELECT * FROM coupons WHERE code = ? LIMIT 1`,
      [code]
    );
    return rows[0];
  },

  async create(coupon) {
    const sql = `
      INSERT INTO coupons
      (id, code, discount_type, discount_value, max_discount,
       min_order_value, start_at, end_at, quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    await pool.execute(sql, [
      coupon.id,
      coupon.code,
      coupon.discount_type,
      coupon.discount_value,
      coupon.max_discount,
      coupon.min_order_value,
      coupon.start_at,
      coupon.end_at,
      coupon.quantity
    ]);

    return coupon;
  },

  async list({ active, page = 1, limit = 20 }) {
    const offset = (Number(page) - 1) * Number(limit);
    let sql = `SELECT * FROM coupons WHERE 1=1`;
    if (active) {
      sql += ` AND start_at <= NOW() AND end_at >= NOW()`;
    }
    sql += ` ORDER BY created_at DESC LIMIT ?, ?`;

    const [rows] = await pool.query(sql, [offset, Number(limit)]);
    return rows;
  },


  async decreaseQuantity(conn, id) {
    await conn.execute(
      `UPDATE coupons 
       SET quantity = quantity - 1 
       WHERE id = ? AND quantity > 0`,
      [id]
    );
  },

  async increaseQuantity(code) {
    await pool.execute(
      `UPDATE coupons SET quantity = quantity + 1 WHERE code = ?`,
      [code]
    );
  },

  async deleteById(id) {
    await pool.execute(`DELETE FROM coupons WHERE id = ?`, [id]);
  }
};

module.exports = CouponRepository;
