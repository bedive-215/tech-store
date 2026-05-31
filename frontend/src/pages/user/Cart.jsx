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
    primary: "#2997ff",
    primaryHover: "#40a9ff",
    primaryGradientStart: "#2997ff",
    primaryGradientEnd: "#5856d6",
    secondary: "#5856d6",
    orange: "#ff6b00",
    bgDark: "#000000",
    surfaceDark: "#1d1d1f",
    cardDark: "#121212",
    textLight: "#ffffff",
    textGray: "#8e8e93",
    borderDark: "rgba(255,255,255,0.1)",
    error: "#ff453a",
    success: "#30d158",
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
    isGuest,
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
    <div className="min-h-screen bg-black text-white pt-28 pb-12">
      {/* Background effects */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/10 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      <div className="w-full max-w-screen-2xl mx-auto px-4 md:px-8 lg:px-12">
        {/* Premium Header */}
        <div className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-2">Giỏ hàng</h1>
          <p className="text-gray-400">
            Kiểm tra lại các tuyệt tác công nghệ của bạn trước khi thanh toán.
          </p>
        </div>

        {/* Guest Banner - Show login suggestion for guests */}
        {isGuest() && localItems.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="text-white font-medium">Bạn đang mua với tư cách khách</p>
                <p className="text-gray-400 text-sm">Đăng nhập để lưu giỏ hàng và theo dõi đơn hàng dễ dàng hơn</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium transition-all border border-white/20"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* Loading state */}
        {(loading || loadingLocal) ? (
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-[#2997ff] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-xl text-gray-400">Đang tải giỏ hàng...</p>
          </div>
        ) : localItems.length === 0 ? (
          // Empty cart - Dark Premium Design
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl p-12 text-center">
            <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
              <Package size={48} className="text-[#2997ff]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Giỏ hàng trống
            </h2>
            <p className="text-gray-400 mb-6">
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </p>
            <button
              onClick={() => navigate('/user/home')}
              className="px-8 py-4 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 text-white font-semibold shadow-[0_10px_30px_-10px_rgba(41,151,255,0.5)] hover:from-blue-300 hover:to-blue-500 transition-all"
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
                    className="group relative bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl transition-all hover:bg-white/10"
                    style={{
                      borderColor: item.selected ? COLORS.primary : 'rgba(255,255,255,0.1)',
                      borderWidth: item.selected ? '2px' : '1px',
                      opacity: isUpdating ? 0.7 : 1,
                    }}
                  >
                    {/* Loading overlay */}
                    {isUpdating && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-3xl z-10 backdrop-blur-sm">
                        <div className="w-8 h-8 border-3 border-[#2997ff] border-t-transparent rounded-full animate-spin" />
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
                      <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden flex-shrink-0 bg-white/5 p-4 flex items-center justify-center">
                        <img
                          src={item.image}
                          className="max-w-full max-h-full object-contain"
                          alt={item.name}
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.png";
                          }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-grow space-y-2">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="text-[#2997ff] text-[10px] font-bold uppercase tracking-widest mb-1 block">Sản phẩm</span>
                            <h3 className="text-xl sm:text-2xl font-bold text-white line-clamp-2">
                              {item.name}
                            </h3>
                          </div>
                          {/* Price + Delete */}
                          <div className="text-right">
                            <p className="text-xl font-bold text-white">
                              {formatPrice(item.price)}
                            </p>
                            <button
                              onClick={() => handleRemoveItem(item)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity mt-2 flex items-center gap-2 text-red-500/80 hover:text-red-400"
                              disabled={isUpdating}
                            >
                              <HiOutlineTrash className="w-4 h-4" />
                              <span className="text-xs font-bold uppercase tracking-wider">Xóa</span>
                            </button>
                          </div>
                        </div>

                        <p className="text-sm text-gray-500 mt-2">Còn lại: <span className="font-semibold">{item.stock}</span> sản phẩm</p>

                        {/* Quantity controls - Dark Design */}
                        <div className="flex items-center justify-between mt-6">
                          <div className="flex items-center gap-2 bg-black/40 rounded-full border border-white/10 p-1">
                            <button
                              onClick={() => handleUpdateQuantity(item, -1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors disabled:opacity-50"
                              disabled={item.quantity <= 1 || isUpdating}
                            >
                              <Minus size={14} className="text-white" />
                            </button>
                            <span className="w-8 text-center font-semibold text-white">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item, 1)}
                              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-[#2997ff] disabled:opacity-50"
                              disabled={item.quantity >= item.stock || isUpdating}
                            >
                              <Plus size={14} className="font-bold" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary - Dark Glass Sidebar */}
            <div>
              <aside className="bg-white/5 backdrop-blur-2xl border border-white/20 rounded-3xl p-8 sticky top-32">
                <h2 className="text-2xl font-bold mb-8">Tổng đơn hàng</h2>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-gray-400 font-medium">
                    <span>Tạm tính</span>
                    <span>{formatPrice(totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-medium">
                    <span>Vận chuyển</span>
                    <span className="text-green-400">Miễn phí</span>
                  </div>
                  <div className="flex justify-between text-gray-400 font-medium">
                    <span>Giảm giá</span>
                    <span>-0₫</span>
                  </div>
                  <div className="h-px bg-white/10 my-6" />
                  <div className="flex justify-between items-end">
                    <span className="text-lg font-bold">Tổng cộng</span>
                    <span className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 via-orange-500 to-red-500">
                      {formatPrice(totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Promo Code */}
                <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-3 mb-6">
                  <HiOutlineTag className="text-[#2997ff] w-5 h-5" />
                  <input
                    className="bg-transparent border-none focus:ring-0 text-sm flex-grow placeholder:text-gray-500 text-white"
                    placeholder="Mã giảm giá"
                    type="text"
                  />
                  <button className="text-sm font-bold text-[#2997ff] px-2">Áp dụng</button>
                </div>

                {/* Checkout Button */}
                <button
                  onClick={handleProceedToCheckout}
                  disabled={selectedItems.length === 0}
                  className="w-full bg-gradient-to-b from-blue-400 to-blue-600 shadow-[0_10px_30px_-10px_rgba(41,151,255,0.5)] hover:from-blue-300 hover:to-blue-500 text-white py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Thanh toán ngay
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </button>

                <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest mt-6">
                  Đảm bảo thanh toán an toàn & bảo mật
                </p>

                {/* Links */}
                <div className="mt-8 flex flex-col gap-4">
                  <a href="/user/home" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors text-sm">
                    ← Tiếp tục mua sắm
                  </a>
                  <button
                    onClick={handleClearCart}
                    className="flex items-center gap-3 text-red-500/60 hover:text-red-400 transition-colors text-sm"
                  >
                    <HiOutlineTrash className="w-4 h-4" />
                    Xóa toàn bộ giỏ hàng
                  </button>
                </div>
              </aside>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
