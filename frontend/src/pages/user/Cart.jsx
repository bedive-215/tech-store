// src/components/Cart.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react";
import { toast } from "react-toastify";
import { useOrder } from "@/Providers/OrderProvider";
import { useCart } from "@/providers/CartProvider";

export default function Cart() {
  const COLORS = {
    primary: "#F97316",
    primaryHover: "#EA580C",
    primaryGradientStart: "#F97316",
    primaryGradientEnd: "#C2410C",
    secondary: "#FCD34D",
    secondaryHover: "#FBBF24",
    bgLight: "#FFFFFF",
    bgDark: "#1F2937",
    bgGrayLight: "#F3F4F6",
    bgGrayDark: "#374151",
    textLight: "#111827",
    textDark: "#F9FAFB",
    textGray: "#6B7280",
    borderLight: "#E5E7EB",
    borderDark: "#4B5563",
    error: "#F87171",
    white: "#FFFFFF",
    black: "#000000",
  };

  // step/orderResult not used for route-based checkout; kept minimal
  const [localItems, setLocalItems] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set()); // Track items being updated

  const navigate = useNavigate();

  const { createOrder } = useOrder?.() ?? {};
  const {
    cart,
    loading,
    error,
    fetchCart,
    updateQty,
    removeItem,
    clearCart,
    getTotalPrice,
  } = useCart();

  // Hàm normalize - xử lý object với numeric keys
  const normalizeItemsFromCart = (cartResponse) => {
    if (!cartResponse) return [];

    let items = [];

    // Case 1: { success: true, data: [...] }
    if (cartResponse.data && Array.isArray(cartResponse.data)) {
      items = cartResponse.data;
    }
    // Case 2: Trực tiếp là array
    else if (Array.isArray(cartResponse)) {
      items = cartResponse;
    }
    // Case 3: { items: [...] }
    else if (cartResponse.items && Array.isArray(cartResponse.items) && cartResponse.items.length > 0) {
      items = cartResponse.items;
    }
    // Case 4: Object với numeric keys {0: {...}, 1: {...}, 2: {...}}
    else if (typeof cartResponse === 'object' && !Array.isArray(cartResponse)) {
      const numericKeys = Object.keys(cartResponse)
        .filter(key => !isNaN(parseInt(key, 10)))
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

      if (numericKeys.length > 0) {
        items = numericKeys.map(key => cartResponse[key]);
      }
    }

    // Map items theo format chuẩn
    return items.map((item) => ({
      id: item.id ?? item.cart_id ?? item.rowId ?? null,
      product_id: item.product_id ?? item.productId ?? item.id ?? null,
      name: item.product_name || item.name || "—",
      price: parseFloat(item.price ?? 0) || 0,
      quantity: parseInt(item.quantity ?? 0, 10) || 0,
      image: item.image_url || item.image || "/placeholder.png",
      stock: parseInt(item.stock ?? 0, 10) || 0,
      selected: item.selected !== undefined ? item.selected : true,
    }));
  };

  // Fetch cart khi component mount
  useEffect(() => {
    let mounted = true;

    const loadCart = async () => {
      setLoadingLocal(true);
      try {
        const response = await fetchCart();
        if (!mounted) return;

        const normalized = normalizeItemsFromCart(response);
        setLocalItems(normalized);
      } catch (err) {
        console.error("Error loading cart:", err);
        if (mounted) setLocalItems([]);
      } finally {
        if (mounted) setLoadingLocal(false);
      }
    };

    loadCart();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync khi cart từ provider thay đổi (nhưng không override optimistic updates)
  useEffect(() => {
    if (cart && updatingItems.size === 0) {
      const normalized = normalizeItemsFromCart(cart);
      setLocalItems(normalized);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart]);

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND"
    }).format(price);
  };

  // Tính toán items đã chọn và tổng tiền
  const selectedItems = localItems.filter((it) => it.selected);
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // Toggle chọn sản phẩm
  const toggleSelect = (id) => {
    setLocalItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, selected: !it.selected } : it))
    );
  };

  // Cập nhật số lượng bằng nút +/- (giữ nguyên logic optimistic)
  const handleUpdateQuantity = async (item, delta) => {
    const newQty = Math.max(1, item.quantity + delta);
    if (newQty === item.quantity) return;

    // Kiểm tra stock
    if (item.stock && newQty > item.stock) {
      toast.error(`Chỉ còn ${item.stock} sản phẩm trong kho`);
      return;
    }

    // Mark item as updating
    setUpdatingItems(prev => {
      const s = new Set(prev);
      s.add(item.id);
      return s;
    });

    // Optimistic update UI ngay lập tức
    const oldQty = item.quantity;
    setLocalItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, quantity: newQty } : it))
    );

    try {
      // Gọi API update
      await updateQty({ product_id: item.product_id, quantity: newQty });

      // Fetch lại cart từ server để đồng bộ
      const response = await fetchCart();
      const normalized = normalizeItemsFromCart(response);

      // Giữ lại trạng thái selected của items
      setLocalItems((prev) =>
        normalized.map((newItem) => {
          const oldItem = prev.find((old) => old.id === newItem.id);
          return {
            ...newItem,
            selected: oldItem ? oldItem.selected : true,
          };
        })
      );

      toast.success("Cập nhật số lượng thành công");
    } catch (err) {
      // Revert về số lượng cũ nếu lỗi
      setLocalItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, quantity: oldQty } : it))
      );
      const msg = err?.response?.data?.message || err?.message || "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      // Remove from updating set
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // Cập nhật số lượng từ input (giữ nguyên, có thể debounce về sau)
  const handleSetQuantity = async (item, value) => {
    const parsed = parseInt(value, 10) || 1;
    const qty = Math.max(1, parsed);

    if (qty === item.quantity) return;

    if (item.stock && qty > item.stock) {
      toast.error(`Chỉ còn ${item.stock} sản phẩm trong kho`);
      return;
    }

    // Mark item as updating
    setUpdatingItems(prev => {
      const s = new Set(prev);
      s.add(item.id);
      return s;
    });

    // Optimistic update
    const oldQty = item.quantity;
    setLocalItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, quantity: qty } : it))
    );

    try {
      await updateQty({ product_id: item.product_id, quantity: qty });

      // Fetch lại cart để đồng bộ
      const response = await fetchCart();
      const normalized = normalizeItemsFromCart(response);

      setLocalItems((prev) =>
        normalized.map((newItem) => {
          const oldItem = prev.find((old) => old.id === newItem.id);
          return {
            ...newItem,
            selected: oldItem ? oldItem.selected : true,
          };
        })
      );

      toast.success("Cập nhật số lượng thành công");
    } catch (err) {
      // Revert
      setLocalItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, quantity: oldQty } : it))
      );
      const msg = err?.response?.data?.message || err?.message || "Cập nhật thất bại";
      toast.error(msg);
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // Xóa sản phẩm
  const handleRemoveItem = async (item) => {
    const ok = window.confirm(`Xóa "${item.name}" khỏi giỏ hàng?`);
    if (!ok) return;

    // Optimistic remove
    const oldItems = [...localItems];
    setLocalItems((prev) => prev.filter((it) => it.id !== item.id));

    try {
      await removeItem(item.product_id);

      // Fetch lại để đồng bộ
      const response = await fetchCart();
      const normalized = normalizeItemsFromCart(response);
      setLocalItems(normalized);

      toast.success("Đã xóa sản phẩm khỏi giỏ hàng");
    } catch (err) {
      // Revert nếu lỗi
      setLocalItems(oldItems);
      const msg = err?.response?.data?.message || err?.message || "Xóa thất bại";
      toast.error(msg);
    }
  };

  // Xóa toàn bộ giỏ hàng
  const handleClearCart = async () => {
    const ok = window.confirm("Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?");
    if (!ok) return;

    const oldItems = [...localItems];
    setLocalItems([]);

    try {
      await clearCart();
      toast.success("Đã xóa toàn bộ giỏ hàng");
    } catch (err) {
      setLocalItems(oldItems);
      const msg = err?.response?.data?.message || err?.message || "Xóa giỏ hàng thất bại";
      toast.error(msg);
    }
  };

  // Đồng bộ giỏ hàng từ server
  const handleSyncCart = async () => {
    try {
      setLoadingLocal(true);
      const response = await fetchCart();
      const normalized = normalizeItemsFromCart(response);

      // Giữ lại trạng thái selected
      setLocalItems((prev) =>
        normalized.map((newItem) => {
          const oldItem = prev.find((old) => old.id === newItem.id);
          return {
            ...newItem,
            selected: oldItem ? oldItem.selected : true,
          };
        })
      );

      toast.success("Đồng bộ giỏ hàng thành công");
    } catch (err) {
      toast.error("Không thể đồng bộ giỏ hàng");
    } finally {
      setLoadingLocal(false);
    }
  };

  // MỚI: Khi bấm tiếp tục thanh toán -> chuyển sang trang CustomerInfo
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      toast.warning("Vui lòng chọn ít nhất 1 sản phẩm");
      return;
    }

    // Chuyển trang, truyền selected items để CustomerInfo có thể prefill
    navigate("/user/customer-info", { state: { preselected: selectedItems } });
  };

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: COLORS.bgGrayLight }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <ShoppingCart size={32} style={{ color: COLORS.primary }} />
          <h1 className="text-3xl font-bold" style={{ color: COLORS.textLight }}>
            Giỏ Hàng Của Bạn
          </h1>
        </div>

        {/* Loading state */}
        {(loading || loadingLocal) ? (
          <div
            className="rounded-2xl shadow-lg p-12 text-center"
            style={{ backgroundColor: COLORS.bgLight }}
          >
            <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-orange-500 rounded-full mx-auto mb-4"></div>
            <p className="text-xl" style={{ color: COLORS.textGray }}>
              Đang tải giỏ hàng...
            </p>
          </div>
        ) : localItems.length === 0 ? (
          // Empty cart
          <div
            className="rounded-2xl shadow-lg p-12 text-center"
            style={{ backgroundColor: COLORS.bgLight }}
          >
            <Package
              size={64}
              style={{ color: COLORS.textGray, margin: "0 auto 1rem" }}
            />
            <p className="text-xl mb-2" style={{ color: COLORS.textGray }}>
              Giỏ hàng trống
            </p>
            <p className="text-sm" style={{ color: COLORS.textGray }}>
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>
          </div>
        ) : (
          // Cart with items
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {localItems.map((item) => {
                const isUpdating = updatingItems.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="rounded-xl shadow-md p-4 flex gap-4 transition-all hover:shadow-lg relative"
                    style={{
                      backgroundColor: COLORS.bgLight,
                      border: `2px solid ${
                        item.selected ? COLORS.primary : COLORS.borderLight
                      }`,
                      opacity: isUpdating ? 0.7 : 1,
                    }}
                  >
                    {/* Loading overlay khi đang update */}
                    {isUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 rounded-xl z-10">
                        <div className="animate-spin w-8 h-8 border-3 border-gray-300 border-t-orange-500 rounded-full"></div>
                      </div>
                    )}

                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-5 h-5 mt-2 cursor-pointer"
                      style={{ accentColor: COLORS.primary }}
                      disabled={isUpdating}
                    />

                    {/* Image */}
                    <img
                      src={item.image}
                      className="w-24 h-24 rounded-lg object-cover"
                      alt={item.name}
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.png";
                      }}
                    />

                    {/* Info */}
                    <div className="flex-1">
                      <h3
                        className="font-semibold text-lg mb-1"
                        style={{ color: COLORS.textLight }}
                      >
                        {item.name}
                      </h3>
                      <p
                        className="font-bold text-xl mb-2"
                        style={{ color: COLORS.primary }}
                      >
                        {formatPrice(item.price)}
                      </p>
                      <p className="text-sm text-gray-500 mb-3">
                        Còn lại: {item.stock} sản phẩm
                      </p>

                      {/* Quantity controls */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleUpdateQuantity(item, -1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: COLORS.bgGrayLight }}
                          disabled={item.quantity <= 1 || isUpdating}
                        >
                          <Minus size={16} />
                        </button>

                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleSetQuantity(item, e.target.value)}
                          className="font-semibold w-16 text-center border rounded-md px-2 py-1 disabled:bg-gray-100"
                          min={1}
                          max={item.stock}
                          disabled={isUpdating}
                        />

                        <button
                          onClick={() => handleUpdateQuantity(item, 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: COLORS.primary,
                            color: COLORS.white,
                          }}
                          disabled={item.quantity >= item.stock || isUpdating}
                        >
                          <Plus size={16} />
                        </button>

                        <div className="ml-4 text-sm text-gray-600">
                          Thành tiền:{" "}
                          <strong style={{ color: COLORS.primary }}>
                            {formatPrice(item.price * item.quantity)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemoveItem(item)}
                      className="self-start p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      style={{ color: COLORS.error }}
                      disabled={isUpdating}
                      aria-label={`Xóa ${item.name}`}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Summary */}
            <div>
              <div
                className="rounded-xl shadow-lg p-6 sticky top-4"
                style={{ backgroundColor: COLORS.bgLight }}
              >
                <h2 className="text-xl font-bold mb-4">Tóm Tắt Đơn Hàng</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span>Sản phẩm đã chọn:</span>
                    <span className="font-semibold">{selectedItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tổng số lượng:</span>
                    <span className="font-semibold">
                      {selectedItems.reduce((sum, it) => sum + it.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span className="font-semibold">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <div
                  className="border-t pt-4 mb-6"
                  style={{ borderColor: COLORS.borderLight }}
                >
                  <div className="flex justify-between text-xl font-bold">
                    <span>Tổng cộng:</span>
                    <span style={{ color: COLORS.primary }}>
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={selectedItems.length === 0}
                    className="w-full py-3 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.primaryGradientStart}, ${COLORS.primaryGradientEnd})`,
                      color: COLORS.white,
                    }}
                  >
                    Tiếp Tục Thanh Toán
                  </button>

                  <button
                    onClick={handleClearCart}
                    className="w-full py-3 rounded-xl font-semibold border hover:bg-gray-50 transition-colors"
                    style={{ borderColor: COLORS.borderLight }}
                  >
                    Xóa toàn bộ giỏ hàng
                  </button>

                  <button
                    onClick={handleSyncCart}
                    className="w-full py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: COLORS.textGray }}
                  >
                    🔄 Đồng bộ giỏ hàng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
