import React, {
  createContext,
  useState,
  useContext,
  useCallback,
} from "react";
import { Alert } from "react-native";
import orderService from "../services/orderService";
import { useAuth } from "./AuthProvider"; // ✅ LẤY TOKEN Ở ĐÂY

// ============================
// Context
// ============================
const OrderContext = createContext(null);

export const useOrder = () => {
  const ctx = useContext(OrderContext);
  if (!ctx) {
    throw new Error("useOrder must be used within OrderProvider");
  }
  return ctx;
};

// ============================
// Normalize order
// ============================
const normalizeOrder = (serverOrder) => {
  if (!serverOrder) return null;

  return {
    order_id:
      serverOrder.order_id ??
      serverOrder.id ??
      serverOrder._id ??
      null,

    status:
      serverOrder.status ??
      serverOrder.order_status ??
      "",

    total_amount:
      serverOrder.total_amount ??
      serverOrder.total ??
      0,

    currency:
      serverOrder.currency ??
      "VND",

    created_at:
      serverOrder.created_at ??
      serverOrder.createdAt ??
      serverOrder.date ??
      null,

    updated_at:
      serverOrder.updated_at ??
      serverOrder.updatedAt ??
      null,

    items:
      serverOrder.items ??
      serverOrder.order_items ??
      [],

    shipping:
      serverOrder.shipping ??
      serverOrder.shipping_info ??
      {},

    payment:
      serverOrder.payment ??
      serverOrder.payment_info ??
      {},

    customer:
      serverOrder.customer ??
      serverOrder.user ??
      null,

    raw: serverOrder,
  };
};

// ============================
// Provider
// ============================
export const OrderProvider = ({ children }) => {
  // ✅ LẤY TOKEN TỪ AUTH PROVIDER
  const { token, user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Helpers
  // ============================
  const clearError = () => setError(null);

  const clearOrders = () => {
    setOrders([]);
    setCurrentOrder(null);
  };

  const handleConfirm = (message) =>
    new Promise((resolve) => {
      Alert.alert("Xác nhận", message, [
        { text: "Hủy", style: "cancel", onPress: () => resolve(false) },
        { text: "OK", onPress: () => resolve(true) },
      ]);
    });

  // ============================
  // ORDER ACTIONS
  // ============================

  // --- CREATE ORDER ---
  const createOrder = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await orderService.createOrder(payload, token);

      const serverOrder =
        res.data?.data ??
        res.data?.order ??
        res.data;

      const normalized = normalizeOrder(serverOrder);

      if (normalized) {
        setOrders((prev) => [normalized, ...prev]);
      }

      Alert.alert("Thành công", "Tạo đơn hàng thành công");
      return normalized;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Tạo đơn thất bại";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- FETCH USER ORDERS ---
  const fetchOrders = useCallback(
    async (userId) => {
      if (!userId && !user?.id) {
        const msg = "Cần user_id để lấy danh sách đơn hàng";
        setError(msg);
        return { data: [], meta: null };
      }

      setLoading(true);
      setError(null);

      try {
        const params = {
          user_id: userId ?? user.id,
        };

        const res = await orderService.listOrders(
          params,
          token
        );

        const raw =
          res.data?.data ??
          res.data ??
          {};

        const serverList =
          raw.orders ??
          raw.items ??
          raw.data ??
          (Array.isArray(res.data)
            ? res.data
            : []);

        const normalizedList = Array.isArray(serverList)
          ? serverList.map(normalizeOrder)
          : [];

        setOrders(normalizedList);

        return {
          data: normalizedList,
          meta: raw.meta ?? null,
        };
      } catch (err) {
        const msg =
          err?.response?.data?.message ??
          "Lấy danh sách đơn thất bại";
        setError(msg);
        Alert.alert("Lỗi", msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [token, user]
  );

  // --- ORDER DETAIL ---
  const fetchOrderDetail = async (orderId) => {
    setLoading(true);
    setError(null);

    try {
      const res = await orderService.getOrderDetail(
        orderId,
        token
      );

      const serverOrder =
        res.data?.data ??
        res.data?.order ??
        res.data;

      const normalized = normalizeOrder(serverOrder);
      setCurrentOrder(normalized);
      return normalized;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Không tìm thấy đơn hàng";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- CANCEL ORDER ---
  const cancelOrder = async (orderId, payload = {}) => {
    const ok = await handleConfirm(
      "Bạn có chắc chắn muốn huỷ đơn hàng?"
    );
    if (!ok) return false;

    setLoading(true);
    setError(null);

    try {
      const res = await orderService.cancelOrder(
        orderId,
        payload,
        token
      );

      const serverOrder =
        res.data?.data ??
        res.data?.order ??
        res.data;

      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === normalized.order_id
            ? normalized
            : o
        )
      );

      if (
        currentOrder?.order_id === normalized.order_id
      ) {
        setCurrentOrder(normalized);
      }

      Alert.alert("Thành công", "Huỷ đơn thành công");
      return normalized;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Huỷ đơn thất bại";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- CONFIRM ORDER (ADMIN) ---
  const confirmOrder = async (orderId, body = {}) => {
    const ok = await handleConfirm(
      "Xác nhận đơn hàng này?"
    );
    if (!ok) return false;

    setLoading(true);
    setError(null);

    try {
      const res = await orderService.setOrderConfirmed(
        orderId,
        body,
        token
      );

      const serverOrder =
        res.data?.data ??
        res.data?.order ??
        res.data;

      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === normalized.order_id
            ? normalized
            : o
        )
      );

      if (
        currentOrder?.order_id === normalized.order_id
      ) {
        setCurrentOrder(normalized);
      }

      Alert.alert("Thành công", "Đã xác nhận đơn hàng");
      return normalized;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Xác nhận đơn thất bại";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- SHIPPING ---
  const shipOrder = async (orderId, body = {}) => {
    const ok = await handleConfirm(
      "Chuyển đơn sang trạng thái shipping?"
    );
    if (!ok) return false;

    setLoading(true);
    setError(null);

    try {
      const res = await orderService.setOrderShipping(
        orderId,
        body,
        token
      );

      const serverOrder =
        res.data?.data ??
        res.data?.order ??
        res.data;

      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === normalized.order_id
            ? normalized
            : o
        )
      );

      if (
        currentOrder?.order_id === normalized.order_id
      ) {
        setCurrentOrder(normalized);
      }

      Alert.alert(
        "Thành công",
        "Đã chuyển sang shipping"
      );
      return normalized;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Cập nhật thất bại";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // --- COMPLETED ---
  const completeOrder = async (orderId, body = {}) => {
    const ok = await handleConfirm(
      "Đánh dấu đơn hàng là completed?"
    );
    if (!ok) return false;

    setLoading(true);
    setError(null);

    try {
      const res = await orderService.setOrderCompleted(
        orderId,
        body,
        token
      );

      const serverOrder =
        res.data?.data ??
        res.data?.order ??
        res.data;

      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) =>
        prev.map((o) =>
          o.order_id === normalized.order_id
            ? normalized
            : o
        )
      );

      if (
        currentOrder?.order_id === normalized.order_id
      ) {
        setCurrentOrder(normalized);
      }

      Alert.alert(
        "Thành công",
        "Đã hoàn thành đơn hàng"
      );
      return normalized;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Cập nhật thất bại";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // COUPON
  // ============================
  const validateCoupon = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await orderService.coupon.validate(
        payload,
        token
      );
      Alert.alert("Thành công", "Mã giảm giá hợp lệ");
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Mã giảm giá không hợp lệ";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async (payload) => {
    setLoading(true);
    setError(null);

    try {
      const res = await orderService.coupon.create(
        payload,
        token
      );
      Alert.alert("Thành công", "Tạo coupon thành công");
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Tạo coupon thất bại";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const listCoupons = async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const res = await orderService.coupon.list(
        params,
        token
      );
      return res.data;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Không lấy được coupon";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = async (id) => {
    const ok = await handleConfirm(
      "Xoá coupon này?"
    );
    if (!ok) return false;

    setLoading(true);
    setError(null);

    try {
      await orderService.coupon.remove(id, token);
      Alert.alert(
        "Thành công",
        "Xoá coupon thành công"
      );
      return true;
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        "Xoá coupon thất bại";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Provider value
  // ============================
  const value = {
    orders,
    currentOrder,
    loading,
    error,

    // order
    createOrder,
    fetchOrders,
    fetchOrderDetail,
    cancelOrder,
    confirmOrder,
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
