// src/context/OrderContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import { orderService } from "@/services/orderService";
import { toast } from "react-toastify";

// Tạo context
export const OrderContext = createContext();

// Hook tiện lợi để dùng ở các component
export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};

// Helper chuẩn hoá order từ server sang UI model
const normalizeOrder = (serverOrder) => {
  if (!serverOrder) return null;

  return {
    order_id: serverOrder.order_id ?? serverOrder.id ?? serverOrder._id ?? null,
    status: serverOrder.status ?? serverOrder.order_status ?? "",
    total_amount: serverOrder.total_amount ?? serverOrder.total ?? 0,
    currency: serverOrder.currency ?? "VND",
    created_at: serverOrder.created_at ?? serverOrder.createdAt ?? serverOrder.date ?? null,
    updated_at: serverOrder.updated_at ?? serverOrder.updatedAt ?? null,
    items: serverOrder.items ?? serverOrder.order_items ?? [],
    shipping: serverOrder.shipping ?? serverOrder.shipping_info ?? {},
    payment: serverOrder.payment ?? serverOrder.payment_info ?? {},
    customer: serverOrder.customer ?? serverOrder.user ?? null,
    raw: serverOrder, // giữ bản gốc nếu cần
  };
};

// Provider chính
export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]); // cache danh sách đơn (nếu muốn)
  const [currentOrder, setCurrentOrder] = useState(null); // chi tiết đơn hiện tại
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Tạo đơn (POST /orders)
  const createOrder = async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.createOrder(payload);
      // backend có thể trả res.data.data hoặc res.data.order
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);
      // thêm vào cache local (nếu muốn)
      setOrders((prev) => (normalized ? [normalized, ...prev] : prev));
      toast.success("Tạo đơn hàng thành công");
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo đơn thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Lấy danh sách đơn (GET /orders) - có thể truyền params: { page, limit, status, ... }
  const fetchOrders = useCallback(
    async (params = {}) => {
      setLoading(true);
      setError(null);
      try {
        const res = await orderService.listOrders(params);
        // server có thể trả { data: { orders: [...], meta: {...} } } hoặc res.data.data...
        const raw = res.data?.data ?? res.data ?? {};
        // cố gắng lấy mảng orders từ nhiều cấu trúc phổ biến
        const serverList =
          raw.orders ?? raw.items ?? raw.data ?? (Array.isArray(res.data) ? res.data : []);
        const normalizedList = Array.isArray(serverList)
          ? serverList.map(normalizeOrder)
          : [];
        setOrders(normalizedList);
        return { data: normalizedList, meta: raw.meta ?? null };
      } catch (err) {
        const msg = err.response?.data?.message || "Lấy danh sách đơn thất bại";
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [setOrders]
  );

  // Lấy chi tiết đơn (GET /orders/:id)
  const fetchOrderDetail = async (orderId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrderDetail(orderId);
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);
      setCurrentOrder(normalized);
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy đơn hàng";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Huỷ đơn (PUT /orders/:id/cancel)
  const cancelOrder = async (orderId, payload = {}) => {
    const ok = window.confirm("Bạn có chắc chắn muốn huỷ đơn hàng này?");
    if (!ok) return false;

    setLoading(true);
    setError(null);
    try {
      const res = await orderService.cancelOrder(orderId, payload);
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);

      // cập nhật cache orders & currentOrder nếu trùng
      setOrders((prev) =>
        prev.map((o) => (o.order_id === normalized.order_id ? normalized : o))
      );
      if (currentOrder?.order_id === normalized.order_id) {
        setCurrentOrder(normalized);
      }

      toast.success("Huỷ đơn thành công");
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Huỷ đơn thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => setError(null);

  // Reset / clear orders cache (nếu cần)
  const clearOrders = () => {
    setOrders([]);
    setCurrentOrder(null);
  };

  const value = {
    orders,
    currentOrder,
    loading,
    error,
    clearError,
    clearOrders,
    createOrder,
    fetchOrders,
    fetchOrderDetail,
    cancelOrder,
    setCurrentOrder,
    setOrders,
  };

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
};

export default OrderProvider;
