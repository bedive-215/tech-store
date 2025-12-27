// src/providers/PaymentProvider.jsx
import React, { createContext, useState, useContext } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import paymentService from "../services/paymentService";

// ============================
// Context
// ============================
const PaymentContext = createContext(null);

export const usePayment = () => {
  const ctx = useContext(PaymentContext);
  if (!ctx) throw new Error("usePayment must be used within PaymentProvider");
  return ctx;
};

// ============================
// Normalize payment object
// ============================
const normalizePayment = (serverData) => {
  if (!serverData) return null;
  const raw = serverData.data ?? serverData.payment ?? serverData;

  return {
    ...raw,
    id: raw.id ?? raw.payment_id ?? raw.paymentId ?? null,
    order_id: raw.order_id ?? raw.orderId ?? null,
    amount: raw.amount ?? raw.total ?? 0,
    status: raw.status ?? raw.payment_status ?? null,
    gateway_url: raw.gateway_url ?? raw.paymentUrl ?? raw.payment_url ?? null,
  };
};

// ============================
// Provider
// ============================
export const PaymentProvider = ({ children }) => {
  const [payment, setPayment] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Helper token
  // ============================
  const getToken = async () => {
    if (payment && (payment.token || payment.access_token)) {
      return payment.token ?? payment.access_token;
    }
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) return token;
      const token2 = await AsyncStorage.getItem("token");
      return token2 ?? null;
    } catch {
      return null;
    }
  };

  const handleAlert = (title, message) => {
    Alert.alert(title, message);
  };

  // ============================
  // Actions
  // ============================
  const createPayment = async (payload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      const response = await paymentService.createPayment(payload, token);
      const normalized = normalizePayment(response.data ?? response);

      setPayment(normalized);

      if (normalized?.gateway_url) {
        setPaymentUrl(normalized.gateway_url);
      } else if (response.data?.paymentUrl) {
        setPaymentUrl(response.data.paymentUrl);
      }

      handleAlert("Thành công", "Khởi tạo thanh toán thành công");
      return response.data ?? response;
    } catch (err) {
      const msg = err?.response?.data?.message || "Khởi tạo thanh toán thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentReturn = async (query, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await paymentService.paymentReturn(query);
      const normalized = normalizePayment(response.data ?? response);

      setPaymentStatus(normalized ?? response.data ?? response);

      if (normalized) setPayment(normalized);

      handleAlert("Thành công", "Cập nhật trạng thái thanh toán thành công");
      return response.data ?? response;
    } catch (err) {
      const msg = err?.response?.data?.message || "Xử lý callback thanh toán thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchPayment = async (paymentId, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      const response = paymentService.getPaymentById
        ? await paymentService.getPaymentById(paymentId, token)
        : null;

      const normalized = normalizePayment(response?.data ?? response);
      if (normalized) setPayment(normalized);
      return response?.data ?? response;
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể lấy thông tin payment";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Reset
  // ============================
  const clearError = () => setError(null);

  const resetPayment = () => {
    setPayment(null);
    setPaymentUrl(null);
    setPaymentStatus(null);
    setError(null);
  };

  // ============================
  // Provider value
  // ============================
  const value = {
    payment,
    paymentUrl,
    paymentStatus,
    loading,
    error,
    clearError,
    resetPayment,

    // actions
    createPayment,
    handlePaymentReturn,
    fetchPayment,

    // setter
    setPayment,
    setPaymentUrl,
    setPaymentStatus,
  };

  return <PaymentContext.Provider value={value}>{children}</PaymentContext.Provider>;
};

export default PaymentProvider;
