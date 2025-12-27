// src/providers/CartProvider.jsx
import React, {
  createContext,
  useState,
  useContext,
  useCallback,
} from "react";
import { Alert } from "react-native";
import cartService from "../services/cartService";

// ============================
// Context
// ============================
const CartContext = createContext(null);

// ============================
// Hook
// ============================
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
};

// ============================
// Normalize cart
// ============================
const normalizeCart = (serverData) => {
  if (!serverData) return null;

  const raw = serverData.data ?? serverData.cart ?? serverData;
  const items =
    raw.items ?? raw.cart_items ?? raw.items_list ?? [];

  return {
    ...raw,
    items,
  };
};

// ============================
// Provider
// ============================
export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Fetch cart
  // ============================
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await cartService.getCart();
      const normalized = normalizeCart(res?.data ?? res);
      setCart(normalized);

      return normalized;
    } catch (err) {
      console.error("fetchCart error:", err);
      const msg =
        err?.response?.data?.message || "Không thể tải giỏ hàng";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================
  // Add to cart
  // payload: { product_id, quantity }
  // ============================
  const addToCart = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const res = await cartService.addToCart(payload);
      const updated = normalizeCart(res?.data ?? res);

      if (updated) {
        setCart(updated);
      } else {
        await fetchCart();
      }

      Alert.alert("Thành công", "Đã thêm vào giỏ hàng");
      return updated;
    } catch (err) {
      console.error("addToCart error:", err);
      const msg =
        err?.response?.data?.message || "Thêm vào giỏ hàng thất bại";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Update quantity
  // payload: { product_id, quantity }
  // ============================
  const updateQty = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const res = await cartService.updateQty(payload);
      const updated = normalizeCart(res?.data ?? res);

      if (updated) {
        setCart(updated);
      } else {
        await fetchCart();
      }

      Alert.alert("Thành công", "Cập nhật số lượng thành công");
      return updated;
    } catch (err) {
      console.error("updateQty error:", err);
      const msg =
        err?.response?.data?.message ||
        "Cập nhật số lượng thất bại";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Remove item
  // ============================
  const removeItem = async (productId) => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        "Xác nhận",
        "Bạn có chắc chắn muốn xóa sản phẩm này?",
        [
          { text: "Hủy", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Xóa",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                setError(null);

                const res = await cartService.removeItem(productId);
                const updated = normalizeCart(res?.data ?? res);

                if (updated) {
                  setCart(updated);
                } else {
                  await fetchCart();
                }

                Alert.alert("Thành công", "Đã xóa sản phẩm");
                resolve(true);
              } catch (err) {
                console.error("removeItem error:", err);
                const msg =
                  err?.response?.data?.message ||
                  "Xóa sản phẩm thất bại";
                setError(msg);
                Alert.alert("Lỗi", msg);
                reject(err);
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    });
  };

  // ============================
  // Clear cart
  // ============================
  const clearCart = async () => {
    return new Promise((resolve, reject) => {
      Alert.alert(
        "Xác nhận",
        "Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?",
        [
          { text: "Hủy", style: "cancel", onPress: () => resolve(false) },
          {
            text: "Xóa",
            style: "destructive",
            onPress: async () => {
              try {
                setLoading(true);
                setError(null);

                await cartService.clearCart();
                setCart({ items: [], total: 0 });

                Alert.alert("Thành công", "Đã xóa toàn bộ giỏ hàng");
                resolve(true);
              } catch (err) {
                console.error("clearCart error:", err);
                const msg =
                  err?.response?.data?.message ||
                  "Xóa giỏ hàng thất bại";
                setError(msg);
                Alert.alert("Lỗi", msg);
                reject(err);
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    });
  };

  // ============================
  // Helpers
  // ============================
  const getTotalQuantity = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0),
      0
    );
  };

  const getTotalPrice = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce(
      (sum, it) =>
        sum +
        (Number(it.quantity) || 0) * (Number(it.price) || 0),
      0
    );
  };

  const clearError = () => setError(null);

  // ============================
  // Provider value
  // ============================
  const value = {
    cart,
    loading,
    error,

    fetchCart,
    addToCart,
    updateQty,
    removeItem,
    clearCart,

    setCart,
    clearError,

    // helpers
    getTotalQuantity,
    getTotalPrice,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
