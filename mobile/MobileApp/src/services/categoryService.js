// src/services/categoryService.js
import apiClient from "../api/apiClient";

const categoryService = {
  /**
   * GET /api/v1/categories
   */
  getCategories: (params = {}) =>
    apiClient.get("/api/v1/categories", { params }),

  /**
   * POST /api/v1/categories (admin)
   * payload có thể chứa:
   * - image (single image)
   * - icon (single image)
   * - images (array image)
   */
  createCategory: (payload = {}) => {
    const formData = new FormData();

    // image
    if (payload.image) {
      formData.append("image", {
        uri: payload.image.uri,
        name: payload.image.fileName || "image.jpg",
        type: payload.image.type || "image/jpeg",
      });
    }

    // icon
    if (payload.icon) {
      formData.append("icon", {
        uri: payload.icon.uri,
        name: payload.icon.fileName || "icon.jpg",
        type: payload.icon.type || "image/jpeg",
      });
    }

    // multiple images
    if (Array.isArray(payload.images)) {
      payload.images.forEach((img, index) => {
        if (img?.uri) {
          formData.append("images", {
            uri: img.uri,
            name: img.fileName || `image_${index}.jpg`,
            type: img.type || "image/jpeg",
          });
        }
      });
    }

    // các field text khác
    Object.keys(payload).forEach((key) => {
      if (["image", "icon", "images"].includes(key)) return;
      const value = payload[key];
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    return apiClient.post("/api/v1/categories", formData);
    // ❌ KHÔNG set Content-Type
    // ✅ Authorization tự gắn bằng interceptor
  },

  /**
   * DELETE /api/v1/categories/:id
   */
  deleteCategory: (id) =>
    apiClient.delete(`/api/v1/categories/${id}`),

  /**
   * GET /api/v1/categories/:id
   */
  getCategoryById: (id) =>
    apiClient.get(`/api/v1/categories/${id}`),
};

export default categoryService;
