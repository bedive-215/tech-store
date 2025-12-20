import React, {
  createContext,
  useState,
  useContext,
  useCallback,
} from "react";
import { orderService } from "@/services/orderService";
import { toast } from "react-toastify";

// ============================
// Context
// ============================
export const OrderContext = createContext();

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error("useOrder must be used within an OrderProvider");
  }
  return context;
};

// ============================
// Normalize Order
// ============================
const normalizeOrder = (serverOrder) => {
  if (!serverOrder) return null;

  return {
    order_id: serverOrder.order_id ?? serverOrder.id ?? serverOrder._id ?? null,
    status: serverOrder.status ?? serverOrder.order_status ?? "",
    total_amount: serverOrder.total_amount ?? serverOrder.total ?? 0,
    currency: serverOrder.currency ?? "VND",
    created_at:
      serverOrder.created_at ??
      serverOrder.createdAt ??
      serverOrder.date ??
      null,
    updated_at: serverOrder.updated_at ?? serverOrder.updatedAt ?? null,
    items: serverOrder.items ?? serverOrder.order_items ?? [],
    shipping: serverOrder.shipping ?? serverOrder.shipping_info ?? {},
    payment: serverOrder.payment ?? serverOrder.payment_info ?? {},
    customer: serverOrder.customer ?? serverOrder.user ?? null,
    raw: serverOrder,
  };
};

// ============================
// Provider
// ============================
export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ====================================================
  // ORDER
  // ====================================================

  const createOrder = async (payload, token) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.createOrder(payload, token);
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) => (normalized ? [normalized, ...prev] : prev));
      toast.success("Tạo đơn hàng thành công");
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo đơn thất bại";
      toast.error(msg);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = useCallback(async (params = {}, token) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.listOrders(params, token);

      const raw = res.data?.data ?? res.data ?? {};
      const serverList =
        raw.orders ??
        raw.items ??
        raw.data ??
        (Array.isArray(res.data) ? res.data : []);

      const normalizedList = Array.isArray(serverList)
        ? serverList.map(normalizeOrder)
        : [];

      setOrders(normalizedList);
      return { data: normalizedList, meta: raw.meta ?? null };
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy danh sách đơn thất bại";
      toast.error(msg);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllOrders = useCallback(async (params = {}, token) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.listAllOrders(params, token);

      const raw = res.data?.data ?? res.data ?? {};
      const serverList =
        raw.orders ??
        raw.items ??
        raw.data ??
        (Array.isArray(res.data) ? res.data : []);

      const normalizedList = Array.isArray(serverList)
        ? serverList.map(normalizeOrder)
        : [];

      setOrders(normalizedList);
      return { data: normalizedList, meta: raw.meta ?? raw.total ?? null };
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy tất cả đơn thất bại";
      toast.error(msg);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrderDetail = async (orderId, token) => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrderDetail(orderId, token);
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);
      setCurrentOrder(normalized);
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy đơn hàng";
      toast.error(msg);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelOrder = async (orderId, payload = {}, token) => {
    const ok = window.confirm("Bạn có chắc chắn muốn huỷ đơn hàng?");
    if (!ok) return false;

    setLoading(true);
    setError(null);
    try {
      const res = await orderService.cancelOrder(orderId, payload, token);
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);

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
      toast.error(msg);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // CONFIRM ORDER (NEW)
  // ============================
  const confirmOrder = async (orderId, body = {}, token) => {
    const ok = window.confirm("Xác nhận đơn hàng này?");
    if (!ok) return false;

    setLoading(true);
    setError(null);
    try {
      const res = await orderService.setOrderConfirmed(orderId, body, token);
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) =>
        prev.map((o) => (o.order_id === normalized.order_id ? normalized : o))
      );

      if (currentOrder?.order_id === normalized.order_id) {
        setCurrentOrder(normalized);
      }

      toast.success("Đã xác nhận đơn hàng");
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Xác nhận đơn thất bại";
      toast.error(msg);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const shipOrder = async (orderId, body = {}, token) => {
    const ok = window.confirm("Chuyển đơn sang trạng thái shipping?");
    if (!ok) return false;

    setLoading(true);
    setError(null);
    try {
      const res = await orderService.setOrderShipping(orderId, body, token);
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) =>
        prev.map((o) => (o.order_id === normalized.order_id ? normalized : o))
      );

      if (currentOrder?.order_id === normalized.order_id) {
        setCurrentOrder(normalized);
      }

      toast.success("Đã chuyển sang shipping");
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      toast.error(msg);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const completeOrder = async (orderId, body = {}, token) => {
    const ok = window.confirm("Đánh dấu đơn hàng là completed?");
    if (!ok) return false;

    setLoading(true);
    setError(null);
    try {
      const res = await orderService.setOrderCompleted(orderId, body, token);
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) =>
        prev.map((o) => (o.order_id === normalized.order_id ? normalized : o))
      );

      if (currentOrder?.order_id === normalized.order_id) {
        setCurrentOrder(normalized);
      }

      toast.success("Đã hoàn thành đơn hàng");
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      toast.error(msg);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // COUPON
  // ====================================================

  const validateCoupon = async (payload, token) => {
    setLoading(true);
    try {
      const res = await orderService.coupon.validate(payload, token);
      toast.success("Mã giảm giá hợp lệ");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Mã giảm giá không hợp lệ";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async (payload, token) => {
    setLoading(true);
    try {
      const res = await orderService.coupon.create(payload, token);
      toast.success("Tạo coupon thành công");
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo coupon thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listCoupons = async (params = {}, token) => {
    setLoading(true);
    try {
      const res = await orderService.coupon.list(params, token);
      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Không lấy được coupon";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = async (id, token) => {
    const ok = window.confirm("Xoá coupon này?");
    if (!ok) return false;

    setLoading(true);
    try {
      await orderService.coupon.remove(id, token);
      toast.success("Xoá coupon thành công");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Xoá coupon thất bại";
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ====================================================
  // Helpers
  // ====================================================
  const clearError = () => setError(null);
  const clearOrders = () => {
    setOrders([]);
    setCurrentOrder(null);
  };

  // ====================================================
  // Provider value
  // ====================================================
  const value = {
    // state
    orders,
    currentOrder,
    loading,
    error,

    // order
    createOrder,
    fetchOrders,
    fetchAllOrders,
    fetchOrderDetail,
    cancelOrder,
    confirmOrder, // ✅ NEW
    shipOrder,
    completeOrder,

    // coupon
    validateCoupon,
    createCoupon,
    listCoupons,
    removeCoupon,

    // helpers
    clearError,
    clearOrders,

    // setters
    setOrders,
    setCurrentOrder,
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};

export default OrderProvider;
