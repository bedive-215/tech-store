class OrderModel {
  constructor({ id, user_id, status, total_price, discount_amount, final_price, created_at, updated_at, shipping_address }) {
    this.id = id;
    this.user_id = user_id;
    this.status = status;
    this.total_price = total_price;
    this.discount_amount = discount_amount;
    this.final_price = final_price;   // thêm dòng này
    this.created_at = created_at;
    this.updated_at = updated_at;
    this.shipping_address = shipping_address;
  }
}

module.exports = OrderModel;
