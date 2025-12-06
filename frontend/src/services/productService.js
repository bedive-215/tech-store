import apiClient from "@/api/apiClient";

export const productService = {
  getProducts: (params = {}) =>
    apiClient.get("/api/v1/products", { params }),

  getProductById: (id) =>
    apiClient.get(`/api/v1/products/${id}`),

  /**
   * POST / - Tạo sản phẩm (admin)
   * Có thể có upload hình ảnh → dùng FormData
   */
  createProduct: (payload, token) => {
    const formData = new FormData();

    // Nếu có file ảnh
    if (payload.images && Array.isArray(payload.images)) {
      payload.images.forEach((file) => formData.append("images", file));
    }

    // Append các field khác
    Object.keys(payload).forEach((key) => {
      if (key !== "images" && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

  return apiClient.post("/api/v1/products", payload, {
      headers: {
    "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

 updateProduct: (id, payload, token) => {
  return apiClient.put(`/api/v1/products/${id}`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
},


  deleteProduct: (id, token) =>
    apiClient.delete(`/api/v1/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // ----------------------------------------------------------
  // NEW 🔥 MEDIA APIs
  // ----------------------------------------------------------

  /** Upload nhiều ảnh sản phẩm */
  uploadProductMedia: (productId, files, token) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return apiClient.post(
      `/api/v1/products/${productId}/media`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      }
    );
  },

  /** Đặt ảnh chính */
  setPrimaryImage: (productId, file, token) => {
  const formData = new FormData();
  formData.append("file", file);

  return apiClient.post(
    `/api/v1/products/${productId}/media/primary`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        // DON'T set Content-Type manually — axios will set it with correct boundary
      },
    }
  );
},


  /** Xóa image */
  deleteMedia: (productId, mediaId, token) =>
    apiClient.delete(
      `/api/v1/products/${productId}/media`,
      {
        data: { media_id: mediaId },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ),
};

export default productService;
