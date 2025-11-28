import React, { createContext, useState } from "react";

// Tạo context
export const UserContext = createContext();

// Provider cơ bản
const UserProvider = ({ children }) => {
  // State cơ bản
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Value cung cấp ra context
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

export default UserProvider;
