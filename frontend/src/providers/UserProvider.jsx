// src/context/UserContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import { userService } from "@/services/userService";
import { toast } from "react-toastify";

// Tạo context
export const UserContext = createContext();

// Hook tiện lợi để dùng ở các component
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

// Provider chính
const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Lấy thông tin cá nhân (GET /me)
const fetchMyInfo = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await userService.getUserInfo();

    const serverUser = res.data?.user ?? res.data?.data ?? null;
    if (!serverUser) {
      throw new Error("Invalid user data from server");
    }

    const normalized = {
      user_id: serverUser.user_id ?? serverUser.id ?? serverUser._id ?? null,

      // ⚡ GIỮ ĐÚNG TÊN GIỐNG UI
      full_name: serverUser.full_name ?? serverUser.name ?? "",
      email: serverUser.email ?? "",
      phone_number: serverUser.phone_number ?? serverUser.phone ?? "",
      date_of_birth: serverUser.date_of_birth ?? "",

      avatar:
        serverUser.avatar
          ? serverUser.avatar.startsWith("http") || serverUser.avatar.startsWith("data:")
            ? serverUser.avatar
            : `${API_BASE_URL}${serverUser.avatar}`
          : null,

      address: serverUser.address ?? "",
      role: serverUser.role ?? null,
    };

    setUser(normalized);
    return normalized;
  } catch (err) {
    const msg = err.response?.data?.message || "Không thể tải thông tin người dùng";
    setError(msg);
    setUser(null);
    toast.error(msg);
    throw err;
  } finally {
    setLoading(false);
  }
}, []);


  // Cập nhật thông tin cá nhân + avatar (PATCH /me)
  const updateMyInfo = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const response = await userService.updateUserInfo(payload);
      const updatedUser = response.data.data;
      setUser(updatedUser);
      toast.success("Cập nhật thông tin thành công!");
      return updatedUser;
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lấy thông tin user theo ID (GET /:id)
  const fetchUserById = async (userId) => {
    setLoading(true);
    try {
      const response = await userService.getUserById(userId);
      return response.data.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy người dùng";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách user (GET / - admin only)
  const fetchListUsers = async (params = {}) => {
    setLoading(true);
    try {
      const response = await userService.getListOfUser(params);
      return response.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy danh sách thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa user (DELETE /:id - admin only)
  const removeUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return false;

    setLoading(true);
    try {
      await userService.deleteUser(userId);
      toast.success("Xóa người dùng thành công");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset lỗi
  const clearError = () => setError(null);

  // Logout thủ công
  const logout = () => {
    setUser(null);
    setError(null);
  };

  const value = {
    user,
    loading,
    error,
    clearError,
    fetchMyInfo,
    updateMyInfo,
    fetchUserById,
    fetchListUsers,
    removeUser,
    logout,
    setUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserProvider;