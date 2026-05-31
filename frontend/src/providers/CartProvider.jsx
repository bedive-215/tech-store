// src/providers/CartProvider.jsx
import React, { createContext, useState, useContext, useCallback, useEffect } from "react";
import { cartService } from "@/services/cartService";
import { toast } from "react-toastify";

// Constants
const GUEST_CART_KEY = "guest_cart";

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

// Helper: Load guest cart from localStorage
const loadGuestCart = () => {
  try {
    const saved = localStorage.getItem(GUEST_CART_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { items: Array.isArray(parsed.items) ? parsed.items : [] };
    }
  } catch (e) {
    console.warn("Failed to load guest cart:", e);
    localStorage.removeItem(GUEST_CART_KEY);
  }
  return { items: [] };
};

// Helper: Save guest cart to localStorage
const saveGuestCart = (cart) => {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
  } catch (e) {
    console.warn("Failed to save guest cart:", e);
  }
};

// Helper: Clear guest cart from localStorage
export const clearGuestCart = () => {
  try {
    localStorage.removeItem(GUEST_CART_KEY);
  } catch (e) {
    console.warn("Failed to clear guest cart:", e);
  }
};

// Provider chính
const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(null); // Server cart (logged in users)
  const [guestCart, setGuestCart] = useState(() => loadGuestCart()); // Guest cart (localStorage)
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper lấy token
  const getToken = useCallback(() => {
    if (cart && (cart.token || cart.access_token)) {
      return cart.token ?? cart.access_token;
    }
    return (
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      null
    );
  }, [cart]);

  // Check if user is guest (no token)
  const isGuest = useCallback(() => {
    return !getToken();
  }, [getToken]);

  // Persist guest cart to localStorage when it changes
  useEffect(() => {
    if (isGuest()) {
      saveGuestCart(guestCart);
    }
  }, [guestCart, isGuest]);

  // Get the active cart (guest or server)
  const getActiveCart = useCallback(() => {
    return isGuest() ? guestCart : cart;
  }, [isGuest, guestCart, cart]);

  // Normalize cart object trả về từ server
  const normalizeCart = (serverData) => {
    if (!serverData) return null;

    const raw = serverData.data ?? serverData.cart ?? serverData;

    if (Array.isArray(raw)) {
      return { items: raw };
    }

    const items = raw.items ?? raw.cart_items ?? raw.items_list ?? [];
    return {
      ...raw,
      items,
    };
  };

  // Lấy giỏ hàng hiện tại (GET /cart) - only for logged in users
  const fetchCart = useCallback(
    async (options = {}) => {
      const token = options.token ?? getToken();

      // If guest, return guest cart
      if (!token) {
        return guestCart;
      }

      setLoading(true);
      setError(null);
      try {
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
    [getToken, guestCart]
  );

  // Thêm sản phẩm vào giỏ (works for both guest and logged in)
  const addToCart = async (payload, options = {}) => {
    const token = options.token ?? getToken();

    // GUEST MODE: Add to localStorage
    if (!token) {
      setGuestCart((prev) => {
        const existingIndex = prev.items.findIndex(
          (it) => String(it.product_id) === String(payload.product_id)
        );

        let newItems;
        if (existingIndex >= 0) {
          // Update quantity of existing item
          newItems = prev.items.map((it, idx) =>
            idx === existingIndex
              ? { ...it, quantity: it.quantity + (payload.quantity || 1) }
              : it
          );
        } else {
          // Add new item
          const newItem = {
            product_id: payload.product_id,
            name: payload.product_name || payload.name || "Sản phẩm",
            price: Number(payload.price) || 0,
            quantity: payload.quantity || 1,
            image: payload.image_url || payload.image || "/placeholder.png",
            stock: payload.stock || 999,
          };
          newItems = [...prev.items, newItem];
        }

        return { items: newItems };
      });

      toast.success("Thêm vào giỏ hàng thành công ✓");
      return guestCart;
    }

    // LOGGED IN MODE: Use server API
    setLoading(true);
    setError(null);
    try {
      await cartService.addToCart(payload, token);
      const updated = await fetchCart({ token });
      toast.success("Thêm vào giỏ hàng thành công ✓");
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
  const updateQty = async (payload, options = {}) => {
    const token = options.token ?? getToken();

    // GUEST MODE
    if (!token) {
      setGuestCart((prev) => {
        const newItems = prev.items.map((it) =>
          String(it.product_id) === String(payload.product_id)
            ? { ...it, quantity: Math.max(1, payload.quantity) }
            : it
        );
        return { items: newItems };
      });
      toast.success("Cập nhật số lượng thành công");
      return guestCart;
    }

    // LOGGED IN MODE
    setLoading(true);
    setError(null);
    try {
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
      const msg = err.response?.data?.message || "Cập nhật số lượng thất bại";
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

    const token = options.token ?? getToken();

    // GUEST MODE
    if (!token) {
      setGuestCart((prev) => ({
        items: prev.items.filter(
          (it) => String(it.product_id) !== String(productId)
        ),
      }));
      toast.success("Xóa sản phẩm khỏi giỏ thành công");
      return true;
    }

    // LOGGED IN MODE
    setLoading(true);
    setError(null);
    try {
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
      const msg = err.response?.data?.message || "Xóa sản phẩm khỏi giỏ thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Xóa toàn bộ giỏ (DELETE /cart/clear)
  const clearCart = async (options = {}) => {
    const skipConfirm = options.skipConfirm || false;
    if (!skipConfirm && !window.confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?"))
      return false;

    const token = options.token ?? getToken();

    // GUEST MODE
    if (!token) {
      setGuestCart({ items: [] });
      clearGuestCart();
      if (!skipConfirm) toast.success("Đã xóa toàn bộ giỏ hàng");
      return true;
    }

    // LOGGED IN MODE
    setLoading(true);
    setError(null);
    try {
      await cartService.clearCart(token);
      setCart({ items: [], total: 0 });
      if (!skipConfirm) toast.success("Đã xóa toàn bộ giỏ hàng");
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

  // Merge guest cart to server cart (call after login)
  const mergeGuestCartToServer = async (token) => {
    const guestItems = guestCart.items || [];
    if (guestItems.length === 0) return;

    setLoading(true);
    try {
      for (const item of guestItems) {
        try {
          await cartService.addToCart(
            {
              product_id: item.product_id,
              quantity: item.quantity,
            },
            token
          );
        } catch (e) {
          console.warn("Failed to merge item:", item.product_id, e);
        }
      }

      // Clear guest cart after successful merge
      setGuestCart({ items: [] });
      clearGuestCart();

      // Fetch updated server cart
      await fetchCart({ token });

      toast.success("Đã đồng bộ giỏ hàng!");
    } catch (err) {
      console.error("Failed to merge guest cart:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper compute tổng số lượng
  const getTotalQuantity = useCallback(() => {
    const activeCart = getActiveCart();
    if (!activeCart || !Array.isArray(activeCart.items)) return 0;
    return activeCart.items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  }, [getActiveCart]);

  // Helper compute tổng tiền
  const getTotalPrice = useCallback(() => {
    const activeCart = getActiveCart();
    if (!activeCart || !Array.isArray(activeCart.items)) return 0;
    return activeCart.items.reduce(
      (s, it) => s + (Number(it.quantity) || 0) * (Number(it.price) || 0),
      0
    );
  }, [getActiveCart]);

  // Reset lỗi
  const clearError = () => setError(null);

  const value = {
    // State
    cart: getActiveCart(), // Returns guest cart or server cart
    serverCart: cart,
    guestCart,
    loading,
    error,

    // Helpers
    isGuest,
    getActiveCart,
    clearError,
    getTotalQuantity,
    getTotalPrice,

    // Actions
    fetchCart,
    addToCart,
    updateQty,
    removeItem,
    clearCart,
    setCart,
    setGuestCart,
    mergeGuestCartToServer,
    clearGuestCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export default CartProvider;
