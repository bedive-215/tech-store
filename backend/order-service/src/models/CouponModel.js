class CouponModel {
  constructor({
    id,
    code,
    discount_type,    // FIXED or PERCENT
    discount_value,
    max_discount,     // chỉ dùng cho PERCENT
    min_order_value,
    start_at,
    end_at,
    quantity
  }) {
    this.id = id;
    this.code = code;
    this.discount_type = discount_type;
    this.discount_value = discount_value;
    this.max_discount = max_discount;
    this.min_order_value = min_order_value;
    this.start_at = start_at;
    this.end_at = end_at;
    this.quantity = quantity;
  }
}

module.exports = CouponModel;
