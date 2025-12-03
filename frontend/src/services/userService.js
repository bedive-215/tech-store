// src/services/userService.js
import apiClient from "@/api/apiClient";


export const userService = {
  getUserInfo: () => apiClient.get("/api/v1/users/me"),
// GET /me - Lấy thông tin user hiện tại

  
  // PATCH /me - Cập nhật thông tin user hiện tại (có upload avatar)
  updateUserInfo: (payload) => {
    const formData = new FormData();
    
    // Nếu có avatar file
    if (payload.avatar) {
      formData.append("avatar", payload.avatar);
    }
    
    // Append các field khác
    Object.keys(payload).forEach(key => {
      if (key !== "avatar" && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });
    
    return apiClient.patch("/api/v1/users/me", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  },
  
  // GET /:id - Lấy thông tin user theo ID
  getUserById: (id) => apiClient.get(`/api/v1/users/${id}`),
  
  // GET / - Lấy danh sách user (chỉ admin)
// GET / - Lấy danh sách user (admin)
getListOfUser: (params, token) =>
  apiClient.get("/api/v1/users", {
    params,
    headers: { Authorization: `Bearer ${token}` },
  }),

// DELETE /:id - Xóa user (admin)
deleteUser: (id, token) =>
  apiClient.delete(`/api/v1/users/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  }),

};

export default userService;