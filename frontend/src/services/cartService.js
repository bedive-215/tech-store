// src/services/cartService.js
import apiClient from "@/api/apiClient";

export const cartService = {
  /**
   * GET /api/v1/cart
   * Lấy giỏ hàng của user hiện tại
   */
  getCart: (token) =>
    apiClient.get("/api/v1/carts", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * POST /api/v1/cart
   * Thêm sản phẩm vào giỏ
   * payload: { product_id, quantity }
   */
  addToCart: (payload, token) =>
    apiClient.post("/api/v1/carts", payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * PUT /api/v1/cart/update
   * Cập nhật số lượng sản phẩm
   * payload: { product_id, quantity }
   */
  updateQty: (payload, token) =>
    apiClient.put("/api/v1/carts/update", payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * DELETE /api/v1/cart/remove/:product_id
   * Xóa 1 sản phẩm khỏi giỏ
   */
  removeItem: (productId, token) =>
    apiClient.delete(`/api/v1/carts/remove/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * DELETE /api/v1/cart/clear
   * Xóa toàn bộ giỏ hàng
   */
  clearCart: (token) =>
    apiClient.delete("/api/v1/carts/clear", {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default cartService;
