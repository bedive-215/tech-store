const pool = require('../config/db');

const CouponRepository = {
  async findByCode(code) {
    const [rows] = await pool.execute(
      'SELECT * FROM coupons WHERE code = ? LIMIT 1',
      [code]
    );
    return rows[0];
  },

  async create(coupon) {
    const sql = `
      INSERT INTO coupons
      (id, code, discount_percent, start_at, end_at, quantity)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    await pool.execute(sql, [
      coupon.id,
      coupon.code,
      coupon.discount_percent,
      coupon.start_at,
      coupon.end_at,
      coupon.quantity
    ]);
    return coupon;
  },

async list({ active, page = 1, limit = 20 }) {
  let sql = "";
  let params = [];

  try {
    const limitNum = Number(limit);
    const pageNum = Number(page);
    const offsetNum = (pageNum - 1) * limitNum;

    sql = `SELECT * FROM coupons WHERE 1 = 1`;

    if (active) {
      sql += ` AND start_at <= NOW() AND end_at >= NOW()`;
    }

    // ✅ Inline offset + limit để MySQL2 chuẩn
    sql += ` ORDER BY start_at DESC LIMIT ${offsetNum}, ${limitNum}`;

    console.log("📌 SQL:", sql);

    const [rows] = await pool.execute(sql);
    return rows;

  } catch (err) {
    console.error("🔥 [CouponRepository.list] ERROR");
    console.error("SQL:", sql);
    console.error(err);
    throw err;
  }
}
,





  async deleteById(id) {
    await pool.execute(`DELETE FROM coupons WHERE id = ?`, [id]);
    return { id };
  },

  async decreaseQuantity(conn, id) {
    await conn.execute(
      `UPDATE coupons SET quantity = quantity - 1 WHERE id = ? AND quantity > 0`,
      [id]
    );
  }
};

module.exports = CouponRepository;
