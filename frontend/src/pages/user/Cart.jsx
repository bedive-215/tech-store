// src/components/Cart.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, Plus, Minus, Package, Tag } from "lucide-react";
import { HiOutlineShoppingCart, HiOutlineTrash, HiOutlineTag } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useOrder } from "@/providers/OrderProvider";
import { useCart } from "@/providers/CartProvider";

export default function Cart() {
  const COLORS = {
    primary: "#137fec",
    primaryHover: "#0ea5e9",
    primaryGradientStart: "#137fec",
    primaryGradientEnd: "#0ea5e9",
    secondary: "#60a5fa",
    secondaryHover: "#3b82f6",
    bgLight: "#FFFFFF",
    bgDark: "#1F2937",
    bgGrayLight: "#F3F4F6",
    bgGrayDark: "#374151",
    textLight: "#111827",
    textDark: "#F9FAFB",
    textGray: "#6B7280",
    borderLight: "#E5E7EB",
    borderDark: "#4B5563",
    error: "#EF4444",
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Premium Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#137fec] to-[#0ea5e9] flex items-center justify-center shadow-lg">
              <HiOutlineShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Giỏ Hàng Của Bạn
            </h1>
          </div>
          <p className="text-gray-600 ml-16">
            {localItems.length} sản phẩm trong giỏ hàng
          </p>
        </div>

        {/* Loading state */}
        {(loading || loadingLocal) ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xl text-gray-600">Đang tải giỏ hàng...</p>
          </div>
        ) : localItems.length === 0 ? (
          // Empty cart - Premium Design
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center mx-auto mb-6">
              <Package size={48} className="text-[#137fec]" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-600 mb-6">
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>
            <button
              onClick={() => navigate('/user/home')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#137fec] to-[#0ea5e9] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Khám phá sản phẩm
            </button>
          </div>
        ) : (
          // Cart with items - Premium Grid Layout
          <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
            {/* Cart items */}
            <div className="lg:col-span-2 space-y-4">
              {localItems.map((item) => {
                const isUpdating = updatingItems.has(item.id);

                return (
                  <div
                    key={item.id}
                    className="group relative bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md"
                    style={{
                      borderColor: item.selected ? COLORS.primary : COLORS.borderLight,
                      borderWidth: item.selected ? '2px' : '1px',
                      opacity: isUpdating ? 0.7 : 1,
                    }}
                  >
                    {/* Loading overlay */}
                    {isUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/50 rounded-2xl z-10 backdrop-blur-sm">
                        <div className="w-8 h-8 border-3 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}

                    <div className="p-4 sm:p-6 flex gap-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => toggleSelect(item.id)}
                        className="w-5 h-5 mt-2 cursor-pointer rounded"
                        style={{ accentColor: COLORS.primary }}
                        disabled={isUpdating}
                      />

                      {/* Image */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100">
                        <img
                          src={item.image}
                          className="w-full h-full object-contain"
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-3 mb-2">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-900 line-clamp-2">
                            {item.name}
                          </h3>

                          {/* Delete button */}
                          <button
                            onClick={() => handleRemoveItem(item)}
                            className="flex-shrink-0 p-2 hover:bg-red-50 rounded-lg transition-colors group"
                            style={{ color: COLORS.error }}
                            disabled={isUpdating}
                            aria-label={`Xóa ${item.name}`}
                          >
                            <HiOutlineTrash className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>

                        <p className="font-bold text-xl sm:text-2xl bg-gradient-to-r from-[#137fec] to-[#0ea5e9] bg-clip-text text-transparent mb-2">
                          {formatPrice(item.price)}
                        </p>

                        <p className="text-sm text-gray-500 mb-4">
                          Còn lại: <span className="font-semibold">{item.stock}</span> sản phẩm
                        </p>

                        {/* Quantity controls - Premium Design */}
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 border-2 border-gray-200 rounded-xl p-1">
                            <button
                              onClick={() => handleUpdateQuantity(item, -1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={item.quantity <= 1 || isUpdating}
                            >
                              <Minus size={16} className="text-gray-700" />
                            </button>

                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => handleSetQuantity(item, e.target.value)}
                              className="font-semibold w-12 text-center border-0 focus:outline-none disabled:bg-transparent"
                              min={1}
                              max={item.stock}
                              disabled={isUpdating}
                            />

                            <button
                              onClick={() => handleUpdateQuantity(item, 1)}
                              className="w-8 h-8 rounded-lg flex items-center justify-center bg-gradient-to-r from-[#137fec] to-[#0ea5e9] hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={item.quantity >= item.stock || isUpdating}
                            >
                              <Plus size={16} className="text-white" />
                            </button>
                          </div>

                          <div className="text-sm">
                            <span className="text-gray-600">Thành tiền: </span>
                            <strong className="text-lg bg-gradient-to-r from-[#137fec] to-[#0ea5e9] bg-clip-text text-transparent">
                              {formatPrice(item.price * item.quantity)}
                            </strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary - Premium Sidebar */}
            <div>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-4">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-1 h-6 bg-gradient-to-b from-[#137fec] to-[#0ea5e9] rounded-full" />
                  Tóm Tắt Đơn Hàng
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Sản phẩm đã chọn:</span>
                    <span className="font-bold text-gray-900">{selectedItems.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Tổng số lượng:</span>
                    <span className="font-bold text-gray-900">
                      {selectedItems.reduce((sum, it) => sum + it.quantity, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-gray-600">Tạm tính:</span>
                    <span className="font-bold text-gray-900">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                {/* Promo Code Section */}
                <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <HiOutlineTag className="w-5 h-5 text-[#137fec]" />
                    <span className="font-semibold text-gray-900">Mã giảm giá</span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Nhập mã giảm giá"
                      className="flex-1 px-4 py-2 rounded-lg border border-gray-200 focus:border-[#137fec] focus:outline-none text-sm"
                    />
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#137fec] to-[#0ea5e9] text-white font-medium hover:shadow-md transition-all">
                      Áp dụng
                    </button>
                  </div>
                </div>

                <div className="border-t-2 border-gray-100 pt-6 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Tổng cộng:</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-[#137fec] to-[#0ea5e9] bg-clip-text text-transparent">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleProceedToCheckout}
                    disabled={selectedItems.length === 0}
                    className="w-full py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.primaryGradientStart}, ${COLORS.primaryGradientEnd})`,
                    }}
                  >
                    Tiếp Tục Thanh Toán
                  </button>

                  <button
                    onClick={handleClearCart}
                    className="w-full py-3 rounded-xl font-medium border-2 border-gray-200 hover:bg-gray-50 hover:border-red-300 text-gray-700 hover:text-red-600 transition-all"
                  >
                    Xóa toàn bộ giỏ hàng
                  </button>

                  <button
                    onClick={handleSyncCart}
                    className="w-full py-2 rounded-lg text-sm text-gray-600 hover:text-[#137fec] hover:bg-blue-50 transition-colors"
                  >
                    🔄 Đồng bộ giỏ hàng
                  </button>
                </div>

                {/* Trust Badges */}
                <div className="mt-6 pt-6 border-t border-gray-100 space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-emerald-500">✓</span>
                    <span>Miễn phí vận chuyển</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-emerald-500">✓</span>
                    <span>Đổi trả trong 30 ngày</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-emerald-500">✓</span>
                    <span>Thanh toán an toàn</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
