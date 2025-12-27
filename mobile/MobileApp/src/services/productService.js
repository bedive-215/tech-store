// src/services/productService.js
import apiClient from "../api/apiClient";

const PRODUCT_BASE = "/api/v1/products";

export const productService = {
  /* =========================
   *        GET PRODUCTS
   * ========================= */
  getProducts: (params = {}) =>
    apiClient.get(PRODUCT_BASE, { params }),

  getProductById: (id) =>
    apiClient.get(`${PRODUCT_BASE}/${id}`),

  /* =========================
   *      CREATE PRODUCT
   *  (admin – có thể upload ảnh)
   * ========================= */
  createProduct: (payload = {}) => {
    const formData = new FormData();

    // images (array)
    if (Array.isArray(payload.images)) {
      payload.images.forEach((file) => {
        formData.append("images", file);
      });
    }

    // các field khác
    Object.keys(payload).forEach((key) => {
      if (key !== "images" && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

    return apiClient.post(PRODUCT_BASE, formData, {
      headers: {
        // KHÔNG set Content-Type thủ công
        // axios tự thêm boundary
      },
    });
  },

  /* =========================
   *        UPDATE PRODUCT
   * ========================= */
  updateProduct: (id, payload = {}) =>
    apiClient.put(`${PRODUCT_BASE}/${id}`, payload),

  /* =========================
   *        DELETE PRODUCT
   * ========================= */
  deleteProduct: (id) =>
    apiClient.delete(`${PRODUCT_BASE}/${id}`),

  /* =========================
   *          MEDIA
   * ========================= */

  /** Upload nhiều ảnh */
  uploadProductMedia: (productId, files = []) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

    return apiClient.post(
      `${PRODUCT_BASE}/${productId}/media`,
      formData
    );
  },

  /** Đặt ảnh chính */
  setPrimaryImage: (productId, file) => {
    const formData = new FormData();
    formData.append("file", file);

    return apiClient.post(
      `${PRODUCT_BASE}/${productId}/media/primary`,
      formData
    );
  },

  /** Xóa image */
  deleteMedia: (productId, mediaId) =>
    apiClient.delete(
      `${PRODUCT_BASE}/${productId}/media`,
      {
        data: { media_id: mediaId },
      }
    ),
};

export default productService;
