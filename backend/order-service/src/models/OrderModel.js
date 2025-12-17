class OrderModel {
  constructor({
    id,
    user_id,
    status,
    total_price,
    discount_amount,
    final_price,
    shipping_address,

    paid_at,
    cancelled_at,
    cancel_reason,

    created_at,
    updated_at
  }) {
    this.id = id;
    this.user_id = user_id;
    this.status = status;

    this.total_price = total_price;
    this.discount_amount = discount_amount;
    this.final_price = final_price;

    this.shipping_address = shipping_address;

    this.paid_at = paid_at;
    this.cancelled_at = cancelled_at;
    this.cancel_reason = cancel_reason;

    this.created_at = created_at;
    this.updated_at = updated_at;
  }
}
