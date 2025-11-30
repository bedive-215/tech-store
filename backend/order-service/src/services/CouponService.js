const { v4: uuidv4 } = require('uuid');
const CouponRepository = require('../repositories/CouponRepository');

const CouponService = {
  async validateCoupon(code, total_amount) {
  const coupon = await CouponRepository.findByCode(code);
  if (!coupon) return { valid: false, reason: 'not_found' };

  // debug: log coupon to inspect fields (tạm thời)
  // console.log('coupon', coupon);

  const now = Date.now();

  const safeParse = (d) => {
    if (!d) return null;
    const s = String(d).trim();
    if (!s || s === '0000-00-00 00:00:00') return null;
    // replace space with T so Date parses as local ISO-like string
    // (avoids some engine quirks). If DB stored UTC and you want UTC, append 'Z'.
    const isoLike = s.replace(' ', 'T');
    const t = new Date(isoLike).getTime();
    return Number.isNaN(t) ? null : t;
  };

  const startMs = safeParse(coupon.start_at) || 0;
  const endMs = safeParse(coupon.end_at) || Infinity;

  if (startMs && startMs > now) {
    return { valid: false, reason: 'not_started' };
  }
  if (endMs && endMs < now) {
    return { valid: false, reason: 'expired' };
  }

  // treat null quantity as unlimited (change if you want)
  if (coupon.quantity !== null && coupon.quantity !== undefined && Number(coupon.quantity) <= 0) {
    return { valid: false, reason: 'no_quantity' };
  }

  const discount_value = Number(coupon.discount_percent) || 0;
  const discount_amount = Math.floor((discount_value / 100) * Number(total_amount || 0));

  return {
    valid: true,
    discount_type: 'percent',
    discount_value,
    discount_amount,
    final_amount: Number(total_amount || 0) - discount_amount,
    expires_at: coupon.end_at
  };
},

  async createCoupon({ code, discount_type, discount_value, usage_limit, expires_at }) {
    const id = `CP-${uuidv4()}`;

    const coupon = {
      id,
      code,
      discount_percent: discount_type === 'percent' ? Number(discount_value) : 0,
      start_at: new Date(),
      end_at: expires_at ? new Date(expires_at) : new Date(Date.now() + 365*86400*1000),
      quantity: usage_limit || 0
    };

    await CouponRepository.create(coupon);

    return {
      coupon_id: id,
      code,
      created_at: new Date().toISOString()
    };
  },

  async listCoupons({ active, page, limit }) {
    try {
      const rows = await CouponRepository.list({ active, page, limit });

      return rows.map(r => ({
        coupon_id: r.id,
        code: r.code,
        discount_type: 'percent',
        discount_value: r.discount_percent,
        expires_at: r.end_at
      }));
    } catch (err) {
      console.error("🔥 [CouponService.listCoupons] ERROR");
      console.error(err);
      throw err;
    }
  },
  async deleteCoupon(id) {
    await CouponRepository.deleteById(id);
    return { status: 'deleted', coupon_id: id };
  }
};

module.exports = CouponService;
