import apiClient from "@/api/apiClient";

export const warrantyService = {
  // ===============================
  // USER
  // ===============================

  /**
   * User tạo yêu cầu bảo hành
   * POST /api/v1/warranties
   * multipart/form-data (files[])
   */
  createWarranty: (payload = {}, token) => {
  const formData = new FormData();

  // files (tối đa 5)
  if (payload.files && Array.isArray(payload.files)) {
    payload.files.slice(0, 5).forEach((file) => {
      formData.append("files", file);
    });
  }

  // field backend yêu cầu
  const allowedFields = [
    "product_id",
    "order_id",
    "serial",
    "issue_description",
  ];

  allowedFields.forEach((key) => {
    if (payload[key] !== undefined && payload[key] !== null) {
      formData.append(key, payload[key]);
    }
  });

  return apiClient.post("/api/v1/warranty", formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      // KHÔNG set Content-Type
    },
  });
},


  /**
   * User xem danh sách yêu cầu bảo hành của mình
   * GET /api/v1/warranties/my
   */
  getMyWarranties: (token) =>
    apiClient.get("/api/v1/warranty/my", {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ===============================
  // ADMIN
  // ===============================

  /**
   * Admin xem tất cả yêu cầu bảo hành
   * GET /api/v1/warranties
   */
  getAllWarranties: (params = {}, token) =>
    apiClient.get("/api/v1/warranty", {
      params,
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * Admin cập nhật trạng thái bảo hành
   * PATCH /api/v1/warranties/:id/status
   */
  updateWarrantyStatus: (id, payload = {}, token) =>
    apiClient.patch(`/api/v1/warranty/${id}/status`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  /**
   * Admin kiểm tra yêu cầu bảo hành hợp lệ
   * POST /api/v1/warranties/:warranty_id/valid
   */
  validateWarranty: (warrantyId, payload = {}, token) =>
    apiClient.post(`/api/v1/warranty/${warrantyId}/valid`, payload, {
      headers: { Authorization: `Bearer ${token}` },
    }),
};

export default warrantyService;
