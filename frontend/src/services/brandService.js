// src/services/brandService.js
import apiClient from "@/api/apiClient";

export const brandService = {
  // GET /api/v1/brands?params
  getBrands: (params = {}) => apiClient.get("/api/v1/brands", { params }),

  // POST /api/v1/brands  (admin, có file logo)
  createBrand: (payload = {}, token) => {
    const formData = new FormData();

    // logo file (optional)
    if (payload.logo) {
      formData.append("logo", payload.logo);
    }

    // các field khác (name, description, ..)
    Object.keys(payload).forEach((k) => {
      if (k !== "logo" && payload[k] !== undefined && payload[k] !== null) {
        formData.append(k, payload[k]);
      }
    });

    return apiClient.post("/api/v1/brands", formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        // DON'T set Content-Type manually for multipart/form-data
      },
    });
  },

  // DELETE /api/v1/brands/:id  (admin)
  deleteBrand: (id, token) =>
    apiClient.delete(`/api/v1/brands/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    }),

  // GET single brand
  getBrandById: (id) => apiClient.get(`/api/v1/brands/${id}`),
};

export default brandService;
