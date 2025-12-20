// src/services/paymentService.js
import apiClient from "@/api/apiClient";

export const paymentService = {
  /**
   * POST /api/v1/payment
   * Khởi tạo thanh toán (VNPAY)
   * payload: { order_id }
   */
  createPayment: (payload, token) =>
    apiClient.post("/api/v1/payments", payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * GET /api/v1/payment/vnpay_return
   * Callback từ VNPAY trả về sau khi thanh toán
   * query: VNPay trả về rất nhiều query params
   */
  paymentReturn: (query) =>
    apiClient.get("/api/v1/payments/vnpay_return", {
      params: query,
    }),
};

export default paymentService;
