import React, { createContext, useState } from "react";

// Tạo context
export const UserContext = createContext();

// Provider
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);          // Lưu thông tin user
  const [loading, setLoading] = useState(false);   // Trạng thái loading
  const [error, setError] = useState(null);        // Trạng thái lỗi

  const value = {
    user,
    loading,
    error,
    setUser,
    setLoading,
    setError,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

// Export default để không bị lỗi "does not provide an export named 'default'"
export default UserProvider;
