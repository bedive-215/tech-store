// src/services/paymentService.js
import apiClient from "../api/apiClient";

const paymentService = {
  /**
   * POST /api/v1/payments
   * Khởi tạo thanh toán (VNPAY)
   * payload: { order_id }
   */
  createPayment: (payload = {}) =>
    apiClient.post("/api/v1/payments", payload),

  /**
   * GET /api/v1/payments/vnpay_return
   * Callback từ VNPAY
   * query: object chứa các query params VNPAY trả về
   */
  paymentReturn: (query = {}) =>
    apiClient.get("/api/v1/payments/vnpay_return", {
      params: query,
    }),
};

export default paymentService;
