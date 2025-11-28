import React, { createContext, useState } from "react";

// Tạo context
export const PaymentContext = createContext();

// Provider cơ bản
export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const value = { 
    payments, 
    loading, 
    error, 
    setPayments, 
    setLoading, 
    setError };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

export default PaymentProvider;
