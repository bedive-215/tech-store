// src/services/cartService.js
import apiClient from "../api/apiClient";

const cartService = {
  /**
   * GET /api/v1/carts
   * Lấy giỏ hàng của user hiện tại
   */
  getCart: () =>
    apiClient.get("/api/v1/carts"),

  /**
   * POST /api/v1/carts
   * Thêm sản phẩm vào giỏ
   * payload: { product_id, quantity }
   */
  addToCart: (payload) =>
    apiClient.post("/api/v1/carts", payload),

  /**
   * PUT /api/v1/carts/update
   * Cập nhật số lượng sản phẩm
   * payload: { product_id, quantity }
   */
  updateQty: (payload) =>
    apiClient.put("/api/v1/carts/update", payload),

  /**
   * DELETE /api/v1/carts/remove/:product_id
   * Xóa 1 sản phẩm khỏi giỏ
   */
  removeItem: (productId) =>
    apiClient.delete(`/api/v1/carts/remove/${productId}`),

  /**
   * DELETE /api/v1/carts/clear
   * Xóa toàn bộ giỏ hàng
   */
  clearCart: () =>
    apiClient.delete("/api/v1/carts/clear"),
};

export default cartService;
