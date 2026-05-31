import apiClient from "../api/apiClient";

/**
 * Lưu ý:
 * - file trong RN phải là { uri, type, name }
 * - token: string
 */
export const warrantyService = {
  // ===============================
  // USER
  // ===============================

  /**
   * User tạo yêu cầu bảo hành
   * POST /api/v1/warranty
   * multipart/form-data (files[])
   */
createWarranty: async (payload, token) => {
  return apiClient.post(
    "/api/v1/warranty",
    {
      product_id: payload.product_id,
      order_id: payload.order_id,
      serial: payload.serial || null,
      issue_description: payload.issue_description,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );
},


  /**
   * User xem danh sách yêu cầu bảo hành của mình
   * GET /api/v1/warranty/my
   */
  getMyWarranties: async (token) =>
    apiClient.get("/api/v1/warranty/my", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ===============================
  // ADMIN
  // ===============================

  /**
   * Admin xem tất cả yêu cầu bảo hành
   * GET /api/v1/warranty
   */
  getAllWarranties: async (params = {}, token) =>
    apiClient.get("/api/v1/warranty", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * Admin cập nhật trạng thái bảo hành
   * PATCH /api/v1/warranty/:id/status
   */
  updateWarrantyStatus: async (id, payload = {}, token) =>
    apiClient.patch(`/api/v1/warranty/${id}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * Admin kiểm tra yêu cầu bảo hành hợp lệ
   * POST /api/v1/warranty/:warranty_id/valid
   */
  validateWarranty: async (warrantyId, payload = {}, token) =>
    apiClient.post(`/api/v1/warranty/${warrantyId}/valid`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default warrantyService;
