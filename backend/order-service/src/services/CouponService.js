const { v4: uuidv4 } = require('uuid');
const CouponRepository = require('../repositories/CouponRepository');

const CouponService = {

  async validateCoupon(conn, code, totalAmount) {
    const coupon = await CouponRepository.findByCode(conn, code);
    if (!coupon) return { valid: false, reason: 'not_found' };

    const now = Date.now();
    const start = new Date(coupon.start_at).getTime();
    const end = new Date(coupon.end_at).getTime();

    if (start > now) return { valid: false, reason: 'not_started' };
    if (end < now) return { valid: false, reason: 'expired' };

    if (coupon.quantity !== null && coupon.quantity <= 0) {
      return { valid: false, reason: 'out_of_quantity' };
    }

    if (coupon.min_order_value && totalAmount < coupon.min_order_value) {
      return { valid: false, reason: 'min_order_not_met' };
    }

    let discountAmount = 0;

    if (coupon.discount_type === 'PERCENT') {
      discountAmount = Math.floor(
        totalAmount * coupon.discount_value / 100
      );

      if (coupon.max_discount) {
        discountAmount = Math.min(discountAmount, coupon.max_discount);
      }
    }

    if (coupon.discount_type === 'FIXED') {
      discountAmount = coupon.discount_value;
    }

    discountAmount = Math.min(discountAmount, totalAmount);

    return {
      valid: true,
      coupon_id: coupon.id,
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      discount_amount: discountAmount,
      final_amount: totalAmount - discountAmount,
      expires_at: coupon.end_at
    };
  },

  async createCoupon(data) {
    const id = `${uuidv4()}`;

    const coupon = {
      id,
      code: data.code,
      discount_type: data.discount_type, // 'PERCENT' | 'FIXED'
      discount_value: data.discount_value,
      max_discount: data.max_discount || null,
      min_order_value: data.min_order_value || 0,
      start_at: data.start_at || new Date(),
      end_at: data.end_at,
      quantity: data.quantity ?? 0
    };

    await CouponRepository.create(coupon);

    return {
      coupon_id: id,
      code: coupon.code
    };
  },

  async listCoupons(params) {
    const rows = await CouponRepository.list(params);

    return rows.map(c => ({
      coupon_id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      max_discount: c.max_discount,
      min_order_value: c.min_order_value,
      quantity: c.quantity,
      expires_at: c.end_at
    }));
  },

  async deleteCoupon(id) {
    await CouponRepository.deleteById(id);
    return { status: 'deleted', coupon_id: id };
  }
};

module.exports = CouponService;
