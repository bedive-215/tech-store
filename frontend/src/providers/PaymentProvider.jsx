// src/context/PaymentContext.jsx
import React, { createContext, useState, useContext } from "react";
import { paymentService } from "@/services/paymentService";
import { toast } from "react-toastify";

// Tạo context
export const PaymentContext = createContext();

// Hook tiện lợi để dùng ở các component
export const usePayment = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error("usePayment must be used within a PaymentProvider");
  }
  return context;
};

// Provider chính
const PaymentProvider = ({ children }) => {
  const [payment, setPayment] = useState(null); // lưu object payment trả về từ server
  const [paymentUrl, setPaymentUrl] = useState(null); // trường hợp server trả url thanh toán
  const [paymentStatus, setPaymentStatus] = useState(null); // trạng thái callback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // helper lấy token (giữ logic giống CartProvider / UserProvider)
  const getToken = () => {
    if (payment && (payment.token || payment.access_token)) {
      return payment.token ?? payment.access_token;
    }
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      null
    );
  };

  // Normalize payment object trả về từ server
  const normalizePayment = (serverData) => {
    if (!serverData) return null;
    const raw = serverData.data ?? serverData.payment ?? serverData;
    // ví dụ shape: { id, order_id, amount, status, gateway_url, ... }
    return {
      ...raw,
      // chuẩn hoá một số field phổ biến nếu cần
      id: raw.id ?? raw.payment_id ?? raw.paymentId ?? null,
      order_id: raw.order_id ?? raw.orderId ?? null,
      amount: raw.amount ?? raw.total ?? 0,
      status: raw.status ?? raw.payment_status ?? null,
      gateway_url: raw.gateway_url ?? raw.paymentUrl ?? raw.payment_url ?? null,
    };
  };

  // Tạo payment (POST /payment)
  // payload: { order_id, ... } ; options: { token }
  const createPayment = async (payload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      const response = await paymentService.createPayment(payload, token);

      const normalized = normalizePayment(response.data ?? response);
      setPayment(normalized);

      // nếu server trả url trả về, lưu vào paymentUrl
      if (normalized?.gateway_url) {
        setPaymentUrl(normalized.gateway_url);
      } else if (response.data?.paymentUrl) {
        setPaymentUrl(response.data.paymentUrl);
      }

      toast.success("Khởi tạo thanh toán thành công");
      return response.data ?? response;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Khởi tạo thanh toán thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xử lý callback trả về từ VNPAY (GET /payment/vnpay_return)
  // query: Object từ URLSearchParams
  const handlePaymentReturn = async (query, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      // paymentReturn thường không cần token, nhưng vẫn giữ options nếu backend yêu cầu
      const response = await paymentService.paymentReturn(query);

      const normalized = normalizePayment(response.data ?? response);
      setPaymentStatus(normalized ?? response.data ?? response);

      // nếu server trả trạng thái / payment object, cập nhật payment
      if (normalized) {
        setPayment(normalized);
      }

      toast.success("Cập nhật trạng thái thanh toán thành công");
      return response.data ?? response;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Xử lý callback thanh toán thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Optional: fetch payment by id nếu API có (ví dụ GET /payment/:id)
  // Nếu backend không có endpoint này bạn có thể bỏ hàm này
  const fetchPayment = async (paymentId, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      // giả sử có endpoint GET /api/v1/payment/:id -> bạn có thể thêm vào paymentService nếu cần
      const response = await paymentService.getPaymentById
        ? await paymentService.getPaymentById(paymentId, token)
        : null;

      const normalized = normalizePayment(response?.data ?? response);
      if (normalized) setPayment(normalized);
      return response?.data ?? response;
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể lấy thông tin payment";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Reset lỗi
  const clearError = () => setError(null);

  // Reset trạng thái payment nếu cần
  const resetPayment = () => {
    setPayment(null);
    setPaymentUrl(null);
    setPaymentStatus(null);
    setError(null);
  };

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

    // setter thô nếu component cần trực tiếp set
    setPayment,
    setPaymentUrl,
    setPaymentStatus,
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};

export default PaymentProvider;
