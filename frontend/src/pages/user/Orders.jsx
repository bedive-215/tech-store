// src/pages/user/Orders.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { format, isValid } from "date-fns";
import { toast } from "react-toastify";

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const productCache = React.useRef({});

  // ======= Utils =======
  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price ?? 0));

  const safeDate = (value) => {
    if (!value) return "";
    const d = new Date(value);
    if (!isValid(d)) return "";
    return format(d, "dd/MM/yyyy HH:mm");
  };

  const STATUS_LABEL = {
    pending: "Chờ xác nhận",
    paid: "Đã thanh toán",
    shipping: "Đang giao",
    completed: "Đã giao",
    cancelled: "Đã hủy",
    unknown: "Không xác định",
  };

  const PROGRESS_STEPS = ["pending", "paid", "shipping", "completed"];

  const getProgressIndex = (status) => {
    if (!status) return -1;
    return PROGRESS_STEPS.indexOf(String(status).toLowerCase());
  };

  // ======= Fetch product =======
  const fetchProductById = useCallback(async (productId) => {
    if (!productId) return null;
    if (productCache.current[productId]) return productCache.current[productId];

    try {
      const res = await productService.getProductById(productId);
      const item = res.data?.product ?? res.data?.data ?? res.data ?? null;
      productCache.current[productId] = item;
      return item;
    } catch (err) {
      console.error("fetchProductById error:", err);
      return null;
    }
  }, []);

  // ======= Normalize order =======
  const normalizeOrder = (o) => {
    if (!o) return null;
    const total_price_raw = o.total_price ?? o.total_amount ?? 0;
    const discount_amount_raw = o.discount_amount ?? o.discount ?? 0;
    const final_price_raw = o.final_price ?? o.final_amount ?? (Number(total_price_raw) - Number(discount_amount_raw));

    const items = Array.isArray(o.items) ? o.items.map((it) => ({
      product_id: it.product_id ?? it.productId ?? it.id ?? null,
      product_name: it.product_name ?? it.product_name ?? it.name ?? null,
      quantity: Number(it.quantity ?? it.qty ?? 1),
      price: Number(it.price ?? it.unit_price ?? 0),
      raw: it,
    })) : [];

    return {
      order_id: o.order_id ?? o.id ?? o._id ?? null,
      status: o.status ?? "unknown",
      total_price: Number(total_price_raw ?? 0),
      discount_amount: Number(discount_amount_raw ?? 0),
      final_price: Number(final_price_raw ?? 0),
      created_at: o.created_at ?? o.createdAt ?? o.date ?? null,
      items,
      shipping_address: o.shipping_address ?? o.shippingAddress ?? "",
      payment: o.payment ?? {},
      raw: o,
    };
  };

  // ======= Fetch orders =======
  const fetchOrders = useCallback(async () => {
    if (!user) {
      setError("Bạn cần đăng nhập để xem đơn hàng.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await orderService.listOrders({
        user_id: user.user_id ?? user.id ?? user._id,
      });

      const raw = res.data?.data ?? res.data ?? {};
      let list = Array.isArray(raw.orders) ? raw.orders : [];
      const normalized = list.map(normalizeOrder);

      const enriched = await Promise.all(
        normalized.map(async (order) => {
          const itemsWithProduct = await Promise.all(
            (order.items ?? []).map(async (item) => {
              const productInfo = await fetchProductById(item.product_id);
              return { ...item, productInfo };
            })
          );
          return { ...order, items: itemsWithProduct };
        })
      );

      setOrders(enriched);
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy danh sách đơn thất bại";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, fetchProductById]);

  // ======= Fetch detail =======
  const fetchOrderDetail = async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);

    try {
      const res = await orderService.getOrderDetail(orderId);
      const serverOrder = res.data?.data ?? res.data ?? {};
      let normalized = normalizeOrder(serverOrder);

      const itemsWithProduct = await Promise.all(
        (normalized.items ?? []).map(async (item) => {
          const productInfo = await fetchProductById(item.product_id);
          return { ...item, productInfo };
        })
      );

      setCurrentOrder({ ...normalized, items: itemsWithProduct });
    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy đơn hàng";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ======= Cancel order =======
  const handleCancelOrder = async (orderId) => {
    const ok = window.confirm("Bạn có chắc chắn muốn huỷ đơn hàng này?");
    if (!ok) return;

    setLoading(true);
    try {
      const res = await orderService.cancelOrder(orderId, {});
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data ?? null;
      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) =>
        prev.map((o) => (o.order_id === normalized.order_id ? normalized : o))
      );

      if (currentOrder?.order_id === normalized.order_id) {
        setCurrentOrder(normalized);
      }

      toast.success("Huỷ đơn thành công");
    } catch (err) {
      const msg = err.response?.data?.message || "Huỷ đơn thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ======= Filtered lists =======
  const activeOrders = useMemo(
    () => orders.filter((o) => (String(o.status ?? "").toLowerCase() !== "cancelled")),
    [orders]
  );

  const cancelledOrders = useMemo(
    () => orders.filter((o) => (String(o.status ?? "").toLowerCase() === "cancelled")),
    [orders]
  );

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ======= Status color =======
  const getStatusColor = (status) => {
    switch(String(status).toLowerCase()) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "paid": return "bg-blue-100 text-blue-800 border-blue-300";
      case "shipping": return "bg-purple-100 text-purple-800 border-purple-300";
      case "completed": return "bg-green-100 text-green-800 border-green-300";
      case "cancelled": return "bg-red-100 text-red-800 border-red-300";
      default: return "bg-gray-100 text-gray-800 border-gray-300";
    }
  };

  // ======= Render order card =======
  const renderOrderRow = (order) => {
    const item = (order.items && order.items[0]) || {};
    const product = item.productInfo;
    const avatar = product?.media?.find((m) => m.is_primary)?.url ?? product?.media?.[0]?.url ?? null;
    const remainingItems = (order.items?.length ?? 1) - 1;

    const hasDiscount = Number(order.discount_amount) > 0 && Number(order.total_price) > Number(order.final_price);

    return (
      <div
        key={order.order_id ?? Math.random()}
        className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300 group"
      >
        <div className="flex items-start gap-5">
          <div className="relative flex-shrink-0">
            {avatar ? (
              <img 
                src={avatar} 
                alt="avatar" 
                className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200 group-hover:border-orange-400 transition-all shadow-md" 
              />
            ) : (
              <div className="w-24 h-24 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {remainingItems > 0 && (
              <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                +{remainingItems}
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-orange-600 transition-colors">
                {product?.name ?? item.product_name ?? "Sản phẩm"}
              </h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusColor(order.status)}`}>
                {STATUS_LABEL[order.status] ?? order.status}
              </span>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="font-medium">Mã:</span>
                <span className="font-mono text-gray-800">#{order.order_id}</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>SL: {item?.quantity ?? 1} × {formatPrice(item?.price ?? (product?.price ?? 0))}</span>
              </div>

              <div className="text-sm text-gray-600">
                {safeDate(order.created_at)}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <div className="text-xs text-gray-500 mb-1">Tổng</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">
                  {formatPrice(order.final_price)}
                </div>

                {hasDiscount && (
                  <div className="text-sm text-gray-500 mt-1">
                    <span className="line-through mr-2">{formatPrice(order.total_price)}</span>
                    <span className="text-red-600 font-semibold">-{formatPrice(order.discount_amount)}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => fetchOrderDetail(order.order_id)}
                  className="px-4 py-2 rounded-lg border-2 border-orange-500 text-orange-600 font-semibold hover:bg-orange-500 hover:text-white transition-all"
                >
                  Chi tiết
                </button>

                {String(order.status).toLowerCase() === "pending" && (
                  <button
                    onClick={() => handleCancelOrder(order.order_id)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all"
                  >
                    Huỷ
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ======= Progress tracker =======
  const ProgressTracker = ({ status }) => {
    const idx = getProgressIndex(status);
    return (
      <div className="relative py-4">
        <div className="flex items-start justify-between relative z-10">
          {PROGRESS_STEPS.map((step, i) => {
            const done = i < idx;
            const active = i === idx;
            const label = STATUS_LABEL[step] ?? step;
            return (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all ${
                    done || active 
                      ? "bg-green-500 text-white border-green-500 shadow-lg" 
                      : "bg-white text-gray-400 border-gray-300"
                  } ${active ? "ring-4 ring-green-200 scale-110" : ""}`}
                >
                  {done ? "✓" : i + 1}
                </div>
                <div className={`text-xs mt-3 text-center font-medium ${done || active ? "text-gray-800" : "text-gray-400"}`}>
                  {label}
                </div>
              </div>
            );
          })}
        </div>

        <div className="absolute top-9 left-0 right-0 h-0.5 bg-gray-200" style={{marginLeft: '2.5rem', marginRight: '2.5rem'}} />
        <div
          className="absolute top-9 left-0 h-0.5 bg-green-500 transition-all duration-500"
          style={{
            marginLeft: '2.5rem',
            width: idx <= 0 ? "0%" : `calc(${(idx / (PROGRESS_STEPS.length - 1)) * 100}% - 2.5rem)`,
          }}
        />
      </div>
    );
  };

  const translateStatus = (s) => {
    if (!s) return STATUS_LABEL.unknown;
    return STATUS_LABEL[String(s).toLowerCase()] ?? s;
  };

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-orange-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">
                  Đơn hàng của tôi
                </h1>
                <p className="text-gray-600">Quản lý và theo dõi đơn hàng của bạn</p>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl">
                <button
                  onClick={() => setShowCancelled(false)}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                    !showCancelled 
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg" 
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Đơn hàng ({activeOrders.length})
                </button>
                <button
                  onClick={() => setShowCancelled(true)}
                  className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${
                    showCancelled 
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg" 
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Đã hủy ({cancelledOrders.length})
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
              <div className="text-gray-600">Đang tải...</div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-red-700">{error}</div>
          )}

          {!loading && !error && (showCancelled ? (
            cancelledOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Không có đơn đã hủy</h3>
              </div>
            ) : cancelledOrders.map((o) => renderOrderRow(o))
          ) : (
            activeOrders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có đơn hàng</h3>
                <button 
                  onClick={() => navigate('/')}
                  className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold"
                >
                  Khám phá sản phẩm
                </button>
              </div>
            ) : activeOrders.map((o) => renderOrderRow(o))
          ))}
        </div>

        {/* MODAL */}
        {currentOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 pt-24">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full relative overflow-hidden max-h-[85vh] flex flex-col">
              <div className="bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-5 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">Chi tiết đơn hàng</h2>
                  <p className="text-white/90 text-sm mt-1">Mã: #{currentOrder.order_id}</p>
                </div>
                <button
                  className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:rotate-90 duration-300"
                  onClick={() => setCurrentOrder(null)}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border">
                    <div className="text-sm text-gray-500 mb-1">Trạng thái</div>
                    <div className={`text-lg font-bold ${
                      currentOrder.status === "pending" ? "text-orange-500" :
                      currentOrder.status === "cancelled" ? "text-red-500" : 
                      currentOrder.status === "completed" ? "text-green-500" : "text-blue-500"
                    }`}>
                      {translateStatus(currentOrder.status)}
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-200">
                    <div className="text-sm text-gray-500 mb-1">Tổng cuối (Thanh toán)</div>
                    <div className="text-lg font-bold text-orange-600">{formatPrice(currentOrder.final_price)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="text-sm text-gray-600 mb-1">📅 Ngày đặt</div>
                    <div className="text-sm font-medium">{safeDate(currentOrder.created_at)}</div>
                  </div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <div className="text-sm text-gray-600 mb-1">📍 Địa chỉ</div>
                    <div className="text-sm font-medium line-clamp-2">{currentOrder.shipping_address || "Chưa có"}</div>
                  </div>
                </div>

                {String(currentOrder.status).toLowerCase() !== "cancelled" ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border border-green-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">🚚 Tiến trình</h3>
                    <ProgressTracker status={currentOrder.status} />
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 mb-6">
                    <div className="font-semibold">Đơn hàng đã bị huỷ</div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-5 mb-6 border">
                  <h3 className="text-lg font-semibold mb-4">Sản phẩm ({currentOrder.items.length})</h3>
                  <div className="space-y-3">
                    {currentOrder.items.map((item, idx) => {
                      const p = item.productInfo;
                      const img = p?.media?.find((m) => m.is_primary)?.url ?? p?.media?.[0]?.url ?? null;
                      const lineTotal = Number(item.quantity) * Number(item.price);
                      return (
                        <div key={idx} className="bg-white rounded-lg p-3 flex items-center gap-4 border">
                          {img ? (
                            <img src={img} className="w-20 h-20 rounded-lg object-cover" alt={p?.name} />
                          ) : (
                            <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                          )}
                          <div className="flex-1">
                            <div className="font-semibold truncate">{p?.name ?? item.product_name ?? "Sản phẩm"}</div>
                            <div className="text-sm text-gray-500">SL: {item.quantity} × {formatPrice(item.price)}</div>
                          </div>
                          <div className="font-bold text-orange-600">{formatPrice(lineTotal)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 mb-6 border">
                  <h3 className="text-lg font-semibold mb-3">Tóm tắt thanh toán</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tạm tính:</span>
                      <span className="font-medium">{formatPrice(currentOrder.total_price)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Giảm giá:</span>
                      <span className="font-medium text-red-600">-{formatPrice(currentOrder.discount_amount)}</span>
                    </div>
                    {/* If you have shipping/cod fee, show here. */}
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-700 font-semibold">Thành tiền:</span>
                      <span className="font-semibold text-orange-600">{formatPrice(currentOrder.final_price)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-purple-50 rounded-xl p-5 border border-purple-200">
                  <h3 className="text-lg font-semibold mb-3">Thanh toán</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phương thức:</span>
                      <span className="font-semibold">{currentOrder.payment?.method ?? "—"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Trạng thái:</span>
                      <span className="font-semibold">{currentOrder.payment?.status ?? "—"}</span>
                    </div>
                  </div>
                </div>
              </div>

              {String(currentOrder.status).toLowerCase() === "pending" && (
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <button
                    onClick={() => handleCancelOrder(currentOrder.order_id)}
                    className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700"
                  >
                    Huỷ đơn hàng
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
