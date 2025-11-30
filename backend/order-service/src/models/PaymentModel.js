// src/models/PaymentModel.js
class PaymentModel {
  constructor({ id, order_id, method, status, transaction_id, created_at }) {
    this.id = id;
    this.order_id = order_id;
    this.method = method;
    this.status = status;
    this.transaction_id = transaction_id;
    this.created_at = created_at;
  }
}

module.exports = PaymentModel;
