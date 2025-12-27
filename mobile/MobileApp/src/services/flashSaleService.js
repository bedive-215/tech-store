// src/services/flashSaleService.js
import apiClient from "../api/apiClient";

/**
 * Flash Sale service
 * Base route: /api/v1/flash-sales
 */

const flashSaleService = {
  /**
   * POST /api/v1/flash-sales
   * Tạo flash sale (admin)
   */
  createFlashSale: (payload) =>
    apiClient.post("/api/v1/flash-sales", payload),

  /**
   * GET /api/v1/flash-sales
   * Lấy danh sách flash sale đang active
   */
  getActiveFlashSales: (params = {}) =>
    apiClient.get("/api/v1/flash-sales", { params }),

  /**
   * GET /api/v1/flash-sales/:id
   * Chi tiết flash sale
   */
  getFlashSaleDetail: (id) =>
    apiClient.get(`/api/v1/flash-sales/${id}`),

  /**
   * POST /api/v1/flash-sales/:id/items
   * Thêm sản phẩm vào flash sale (admin)
   */
  addItem: (flashSaleId, payload) =>
    apiClient.post(
      `/api/v1/flash-sales/${flashSaleId}/items`,
      payload
    ),

  /**
   * DELETE /api/v1/flash-sales/items/:itemId
   * Xóa sản phẩm khỏi flash sale (admin)
   */
  removeItem: (itemId) =>
    apiClient.delete(`/api/v1/flash-sales/items/${itemId}`),
};

export default flashSaleService;
