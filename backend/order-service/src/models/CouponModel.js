class CouponModel {
  constructor({ id, code, discount_percent, start_at, end_at, quantity }) {
    this.id = id;
    this.code = code;
    this.discount_percent = discount_percent;
    this.start_at = start_at;
    this.end_at = end_at;
    this.quantity = quantity;
  }
}

module.exports = CouponModel;
