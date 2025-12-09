// src/services/categoryService.js
import apiClient from "@/api/apiClient";

export const categoryService = {
  // GET /api/v1/categories?params
  getCategories: (params = {}) => apiClient.get("/api/v1/categories", { params }),

  // POST /api/v1/categories (admin)
  // If payload contains `image` (File) or `icon` (File), send multipart/form-data automatically.
  createCategory: (payload = {}, token) => {
    // detect file fields
    const hasFile =
      payload &&
      (payload.image instanceof File ||
        payload.icon instanceof File ||
        (Array.isArray(payload.images) && payload.images.length > 0));

    if (hasFile) {
      const formData = new FormData();

      if (payload.image instanceof File) formData.append("image", payload.image);
      if (payload.icon instanceof File) formData.append("icon", payload.icon);
      if (Array.isArray(payload.images)) {
        payload.images.forEach((f) => {
          if (f instanceof File) formData.append("images", f);
        });
      }

      Object.keys(payload).forEach((k) => {
        if (["image", "icon", "images"].includes(k)) return;
        const v = payload[k];
        if (v !== undefined && v !== null) formData.append(k, v);
      });

      return apiClient.post("/api/v1/categories", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          // don't set Content-Type manually
        },
      });
    }

    // default: send JSON
    return apiClient.post("/api/v1/categories", payload, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  },

  // DELETE /api/v1/categories/:id (admin)
  deleteCategory: (id, token) =>
    apiClient.delete(`/api/v1/categories/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // GET single category
  getCategoryById: (id) => apiClient.get(`/api/v1/categories/${id}`),
};

export default categoryService;
