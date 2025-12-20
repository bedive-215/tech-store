// src/context/CartContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import { cartService } from "@/services/cartService";
import { toast } from "react-toastify";

// Tạo context
export const CartContext = createContext();

// Hook tiện lợi để dùng ở các component
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

// Provider chính
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null); // giữ toàn bộ object cart từ server hoặc normalized
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // helper lấy token (tìm trong cart.user trước, nếu không có thì localStorage)
  // (Giữ logic giống UserProvider để nếu cần lấy token dùng chung)
  const getToken = () => {
    // nếu bạn lưu user trong cart (tuỳ backend) hoặc global user, kiểm tra luôn
    if (cart && (cart.token || cart.access_token)) {
      return cart.token ?? cart.access_token;
    }
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      null
    );
  };

  // Normalize cart object trả về từ server
  const normalizeCart = (serverData) => {
    if (!serverData) return null;
    // serverData có thể nằm ở data, cart, hoặc trực tiếp
    const raw = serverData.data ?? serverData.cart ?? serverData;
    // Expect shape: { items: [{ product_id, quantity, price, product }], total, ... }
    const items = raw.items ?? raw.cart_items ?? raw.items_list ?? [];
    return {
      ...raw,
      items,
    };
  };

  // Lấy giỏ hàng hiện tại (GET /cart)
  const fetchCart = useCallback(
    async (options = {}) => {
      setLoading(true);
      setError(null);
      try {
        const token = options.token ?? getToken();
        const response = await cartService.getCart(token);
        const normalized = normalizeCart(response.data ?? response);
        setCart(normalized);
        return normalized;
      } catch (err) {
        const msg = err.response?.data?.message || "Không thể tải giỏ hàng";
        setError(msg);
        toast.error(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [cart]
  );

  // Thêm sản phẩm vào giỏ (POST /cart)
  // payload: { product_id, quantity }
  const addToCart = async (payload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      const response = await cartService.addToCart(payload, token);
      // server có thể trả về giỏ hàng mới
      const updated = normalizeCart(response.data ?? response);
      if (updated) {
        setCart(updated);
      } else {
        // nếu server trả về chỉ 1 item hoặc message, tốt nhất gọi fetchCart để đồng bộ
        await fetchCart({ token });
      }
      toast.success("Thêm vào giỏ hàng thành công");
      return updated;
    } catch (err) {
      const msg = err.response?.data?.message || "Thêm vào giỏ hàng thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật số lượng (PUT /cart/update)
  // payload: { product_id, quantity }
  const updateQty = async (payload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      const response = await cartService.updateQty(payload, token);
      const updated = normalizeCart(response.data ?? response);
      if (updated) {
        setCart(updated);
      } else {
        await fetchCart({ token });
      }
      toast.success("Cập nhật số lượng thành công");
      return updated;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Cập nhật số lượng thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa một item (DELETE /cart/remove/:product_id)
  const removeItem = async (productId, options = {}) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ?"))
      return false;

    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      const response = await cartService.removeItem(productId, token);
      const updated = normalizeCart(response.data ?? response);
      if (updated) {
        setCart(updated);
      } else {
        await fetchCart({ token });
      }
      toast.success("Xóa sản phẩm khỏi giỏ thành công");
      return true;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Xóa sản phẩm khỏi giỏ thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa toàn bộ giỏ (DELETE /cart/clear)
  const clearCart = async (options = {}) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?"))
      return false;

    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      await cartService.clearCart(token);
      setCart({ items: [], total: 0 });
      toast.success("Đã xóa toàn bộ giỏ hàng");
      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa giỏ hàng thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // helper compute tổng tiền / tổng quantity (cơ bản)
  const getTotalQuantity = () => {
    if (!cart || !Array.isArray(cart.items)) return 0;
    return cart.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  };

  const getTotalPrice = () => {
    if (!cart || !Array.isArray(cart.items)) return 0;
    return cart.items.reduce(
      (s, it) => s + (Number(it.quantity) || 0) * (Number(it.price) || 0),
      0
    );
  };

  // Reset lỗi
  const clearError = () => setError(null);

  const value = {
    cart,
    loading,
    error,
    clearError,
    fetchCart,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    setCart,

    // helpers
    getTotalQuantity,
    getTotalPrice,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
