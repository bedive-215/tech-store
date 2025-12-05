// src/services/productService.js
import apiClient from "@/api/apiClient";

export const productService = {
  /** 
   * GET / - Lấy danh sách sản phẩm
   * params: { page, limit, search, categoryId, ... }
   */
  getProducts: (params = {}) =>
    apiClient.get("/api/v1/products", { params }),

  /**
   * GET /:id - Lấy chi tiết 1 sản phẩm theo ID
   */
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

  /**
   * PUT /:id - Cập nhật sản phẩm (admin)
   */
 updateProduct: (id, payload, token) => {
  return apiClient.put(`/api/v1/products/${id}`, payload, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
},


  /**
   * DELETE /:id - Xóa sản phẩm (admin)
   */
  deleteProduct: (id, token) =>
    apiClient.delete(`/api/v1/products/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }),
};

export default productService;
