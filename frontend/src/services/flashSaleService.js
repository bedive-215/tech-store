// src/services/flashSaleService.js
import apiClient from "@/api/apiClient";

/**
 * Flash Sale service
 * Routes assumed base: /api/v1/flash-sales
 *
 * Endpoints:
 * POST   /               -> createFlashSale (admin)
 * GET    /               -> getActiveFlashSales
 * GET    /:id            -> getFlashSaleDetail
 * POST   /:id/items      -> addItem (admin)
 * DELETE /items/:item_id -> removeItem (admin)
 */

export const flashSaleService = {
  // POST / - create flash sale (admin)
  createFlashSale: (payload, token) =>
    apiClient.post("/api/v1/flash-sales", payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  // GET / - get active flash sales (or all, depends on server)
  getActiveFlashSales: (params) =>
    apiClient.get("/api/v1/flash-sales", {
      params,
    }),

  // GET /:id - get flash sale detail
  getFlashSaleDetail: (id) => apiClient.get(`/api/v1/flash-sales/${id}`),

  // POST /:id/items - add item to flash sale (admin)
  addItem: (flashSaleId, payload, token) =>
    apiClient.post(`/api/v1/flash-sales/${flashSaleId}/items`, payload, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),

  // DELETE /items/:item_id - remove item from flash sale (admin)
  removeItem: (itemId, token) =>
    apiClient.delete(`/api/v1/flash-sales/items/${itemId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }),
};

export default flashSaleService;
