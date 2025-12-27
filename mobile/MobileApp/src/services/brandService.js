// src/services/brandService.js
import apiClient from "../api/apiClient"; 
// ⬆️ dùng relative path cho React Native

const brandService = {
  // GET /api/v1/brands?params
  getBrands: (params = {}) =>
    apiClient.get("/api/v1/brands", { params }),

  // POST /api/v1/brands (admin, có upload logo)
  createBrand: (payload = {}) => {
    const formData = new FormData();

    // logo (React Native file object)
    if (payload.logo) {
      formData.append("logo", {
        uri: payload.logo.uri,
        name: payload.logo.fileName || "logo.jpg",
        type: payload.logo.type || "image/jpeg",
      });
    }

    // các field khác
    Object.keys(payload).forEach((key) => {
      if (key !== "logo" && payload[key] !== undefined && payload[key] !== null) {
        formData.append(key, payload[key]);
      }
    });

    return apiClient.post("/api/v1/brands", formData);
    // ⛔ KHÔNG set Content-Type
    // ✅ Authorization đã được interceptor tự gắn
  },

  // DELETE /api/v1/brands/:id
  deleteBrand: (id) =>
    apiClient.delete(`/api/v1/brands/${id}`),

  // GET /api/v1/brands/:id
  getBrandById: (id) =>
    apiClient.get(`/api/v1/brands/${id}`),
};

export default brandService;
