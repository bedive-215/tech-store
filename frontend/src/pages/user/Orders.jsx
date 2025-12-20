// src/pages/user/Orders.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { orderService } from "@/services/orderService";
import { productService } from "@/services/productService";
import { userService } from "@/services/userService";
import { format, isValid } from "date-fns";
import { toast } from "react-toastify";

const STATUS_LABEL = {
  confirmed: "Đã xác nhận",
  paid: "Đã thanh toán",
  shipping: "Đang giao",
  completed: "Đã giao",
  cancelled: "Đã hủy",
  unknown: "Không xác định",
};

const PROGRESS_STEPS = ["confirmed", "paid", "shipping", "completed"];

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price ?? 0));

const safeDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (!isValid(d)) return "";
  return format(d, "dd/MM/yyyy HH:mm");
};

// ==== StarRating component ====
const Star = ({ filled, size = 20 }) => (
  <svg
    aria-hidden="true"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    className={filled ? "text-yellow-400" : "text-gray-300"}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 .587l3.668 7.431 8.2 1.192-5.934 5.787 1.402 8.168L12 18.896l-7.336 3.269 1.402-8.168L.132 9.21l8.2-1.192z" />
  </svg>
);

function StarRating({ value = 5, onChange, size = 20, disabled = false, id }) {
  const [hover, setHover] = useState(0);
  return (
    <div
      role="radiogroup"
      aria-labelledby={id ? `${id}-label` : undefined}
      className="inline-flex items-center gap-1"
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = hover ? n <= hover : n <= value;
        return (
          <button
            key={n}
            type="button"
            aria-checked={value === n}
            role="radio"
            tabIndex={0}
            disabled={disabled}
            onKeyDown={(e) => {
              if (disabled) return;
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange(n); }
              if (e.key === "ArrowLeft" && value > 1) onChange(value - 1);
              if (e.key === "ArrowRight" && value < 5) onChange(value + 1);
            }}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => !disabled && onChange(n)}
            className={`p-0.5 rounded focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-orange-300 ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
            title={`${n} sao`}
          >
            <Star filled={filled} size={size} />
          </button>
        );
      })}
    </div>
  );
}

// ==== Helpers ====
const getProgressIndex = (status) => {
  if (!status) return -1;
  return PROGRESS_STEPS.indexOf(String(status).toLowerCase());
};

const getStatusColor = (status) => {
  switch (String(status).toLowerCase()) {
    case "confirmed": return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "paid": return "bg-blue-100 text-blue-800 border-blue-300";
    case "shipping": return "bg-purple-100 text-purple-800 border-purple-300";
    case "completed": return "bg-green-100 text-green-800 border-green-300";
    case "cancelled": return "bg-red-100 text-red-800 border-red-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
};

// ==== ProductItem ====
const ProductItem = React.memo(function ProductItem({
  item,
  reviewInputs,
  setReviewInput,
  existingReview,
  onAddReview,
  onDeleteReview,
  reviewLoading,
  orderStatus,
}) {
  const p = item.productInfo;
  const img = p?.media?.find((m) => m.is_primary)?.url ?? p?.media?.[0]?.url ?? null;
  const lineTotal = Number(item.quantity) * Number(item.price);
  const pid = item.product_id;

  return (
    <div className="bg-white rounded-lg p-3 flex items-start gap-4 border">
      <div className="flex-shrink-0">
        {img ? <img src={img} className="w-20 h-20 rounded-lg object-cover" alt={p?.name} /> : <div className="w-20 h-20 bg-gray-200 rounded-lg" />}
      </div>
      <div className="flex-1">
        <div className="font-semibold truncate">{p?.name ?? item.product_name ?? "Sản phẩm"}</div>
        <div className="text-sm text-gray-500">SL: {item.quantity} × {formatPrice(item.price)}</div>

        <div className="mt-3">
          <div className="text-sm font-medium mb-2">Thành tiền: <span className="font-bold text-orange-600">{formatPrice(lineTotal)}</span></div>

          {String(orderStatus).toLowerCase() === "completed" && (
            <div className="mt-3 p-3 border rounded-lg bg-white">
              {existingReview ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold">Đánh giá của bạn</div>
                      <div className="text-sm text-gray-500">({existingReview.rating}★)</div>
                    </div>
                    <div className="text-xs text-gray-400">{existingReview.created_at ? safeDate(existingReview.created_at) : ""}</div>
                  </div>
                  <div className="text-sm text-gray-700">{existingReview.comment}</div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => onDeleteReview(pid)}
                      disabled={reviewLoading}
                      className="px-3 py-1 rounded-md bg-red-500 text-white text-sm font-semibold hover:opacity-90"
                    >
                      Xóa đánh giá
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600 font-medium">Viết đánh giá</div>

                  <div className="flex items-center gap-2">
                    <StarRating
                      id={`star-${pid}`}
                      value={reviewInputs[pid]?.rating ?? 5}
                      onChange={(n) => setReviewInput(pid, "rating", n)}
                      size={20}
                      disabled={reviewLoading}
                    />
                    <div className="text-sm text-gray-500 ml-2"> {reviewInputs[pid]?.rating ?? 5}★</div>
                  </div>

                  <textarea
                    value={reviewInputs[pid]?.comment ?? ""}
                    onChange={(e) => setReviewInput(pid, "comment", e.target.value)}
                    className="w-full border rounded p-2 text-sm"
                    placeholder="Viết cảm nhận của bạn về sản phẩm..."
                    rows={3}
                    disabled={reviewLoading}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => onAddReview(pid)}
                      disabled={reviewLoading}
                      className="px-4 py-2 rounded-md bg-gradient-to-r from-orange-500 to-pink-500 text-white font-semibold hover:opacity-95 disabled:opacity-60"
                    >
                      {reviewLoading ? "Đang gửi..." : "Gửi đánh giá"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="font-bold text-orange-600">{formatPrice(lineTotal)}</div>
    </div>
  );
});

// ==== OrderRow ====
const OrderRow = React.memo(function OrderRow({ order, onOpenDetail, onCancel }) {
  const item = (order.items && order.items[0]) || {};
  const product = item.productInfo;
  const avatar = product?.media?.find((m) => m.is_primary)?.url ?? product?.media?.[0]?.url ?? null;
  const remainingItems = (order.items?.length ?? 1) - 1;
  const hasDiscount = Number(order.discount_amount) > 0 && Number(order.total_price) > Number(order.final_price);

  return (
    <div className="bg-white rounded-xl p-5 border-2 border-gray-100 hover:border-orange-300 hover:shadow-xl transition-all duration-300 group">
      <div className="flex items-start gap-5">
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt="avatar" className="w-24 h-24 rounded-xl object-cover border-2 border-gray-200 group-hover:border-orange-400 transition-all shadow-md" />
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
            <h3 className="font-bold text-gray-900 text-lg truncate group-hover:text-orange-600 transition-colors">{product?.name ?? item.product_name ?? "Sản phẩm"}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${getStatusColor(order.status)}`}>
              {STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600"><span className="font-medium">Mã:</span><span className="font-mono text-gray-800">#{order.order_id}</span></div>
            <div className="flex items-center gap-2 text-sm text-gray-600"><span>SL: {item?.quantity ?? 1} × {formatPrice(item?.price ?? (product?.price ?? 0))}</span></div>
            <div className="text-sm text-gray-600">{safeDate(order.created_at)}</div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div>
              <div className="text-xs text-gray-500 mb-1">Tổng</div>
              <div className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent">{formatPrice(order.final_price)}</div>

              {hasDiscount && (<div className="text-sm text-gray-500 mt-1"><span className="line-through mr-2">{formatPrice(order.total_price)}</span><span className="text-red-600 font-semibold">-{formatPrice(order.discount_amount)}</span></div>)}
            </div>

            <div className="flex gap-2">
              <button onClick={() => onOpenDetail(order.order_id)} className="px-4 py-2 rounded-lg border-2 border-orange-500 text-orange-600 font-semibold hover:bg-orange-500 hover:text-white transition-all">Chi tiết</button>
              {String(order.status).toLowerCase() === "confirmed" && (<button onClick={() => onCancel(order.order_id)} className="px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all">Huỷ</button>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default function Orders() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCancelled, setShowCancelled] = useState(false);

  const [reviewInputs, setReviewInputs] = useState({});
  const [productReviews, setProductReviews] = useState({});
  const [reviewLoading, setReviewLoading] = useState(false);

  const productCache = React.useRef({});

  const normalizeOrder = useCallback((o) => {
    if (!o) return null;
    const total_price_raw = o.total_price ?? o.total_amount ?? 0;
    const discount_amount_raw = o.discount_amount ?? o.discount ?? 0;
    const final_price_raw = o.final_price ?? o.final_amount ?? (Number(total_price_raw) - Number(discount_amount_raw));

    const items = Array.isArray(o.items) ? o.items.map((it) => ({
      product_id: it.product_id ?? it.productId ?? it.id ?? null,
      product_name: it.product_name ?? it.name ?? null,
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
  }, []);

  const fetchProductsByIds = useCallback(async (ids = []) => {
    const missing = ids.filter((id) => !productCache.current[id]);
    if (missing.length === 0) return ids.map((id) => productCache.current[id]);

    if (typeof productService.getProductsByIds === "function") {
      try {
        const res = await productService.getProductsByIds(missing);
        const list = res.data?.data ?? res.data ?? res;
        (Array.isArray(list) ? list : []).forEach((prod) => {
          const pid = prod.id ?? prod._id ?? prod.product_id;
          if (pid) productCache.current[pid] = prod;
        });
      } catch (e) {
        await Promise.all(missing.map(async (id) => {
          try {
            const r = await productService.getProductById(id);
            const p = r.data?.product ?? r.data?.data ?? r.data ?? null;
            if (p) productCache.current[id] = p;
          } catch (err) {}
        }));
      }
    } else {
      await Promise.all(missing.map(async (id) => {
        try {
          const r = await productService.getProductById(id);
          const p = r.data?.product ?? r.data?.data ?? r.data ?? null;
          if (p) productCache.current[id] = p;
        } catch (err) {}
      }));
    }

    return ids.map((id) => productCache.current[id] ?? null);
  }, []);

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

      const allIds = Array.from(new Set(normalized.flatMap(o => (o.items ?? []).map(i => i.product_id)).filter(Boolean)));

      await fetchProductsByIds(allIds);

      const enriched = normalized.map((order) => ({
        ...order,
        items: (order.items ?? []).map((it) => ({ ...it, productInfo: productCache.current[it.product_id] ?? null })),
      }));

      setOrders(enriched);
    } catch (err) {
      const msg = err.response?.data?.message || "Lấy danh sách đơn thất bại";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [user, normalizeOrder, fetchProductsByIds]);

  const fetchOrderDetail = useCallback(async (orderId) => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.getOrderDetail(orderId);
      const serverOrder = res.data?.data ?? res.data ?? {};
      let normalized = normalizeOrder(serverOrder);

      const productIds = Array.from(new Set((normalized.items ?? []).map(i => i.product_id).filter(Boolean)));
      await fetchProductsByIds(productIds);

      const itemsWithProduct = (normalized.items ?? []).map((item) => ({ ...item, productInfo: productCache.current[item.product_id] ?? null }));
      const final = { ...normalized, items: itemsWithProduct };
      setCurrentOrder(final);

      setReviewInputs((prev) => {
        const copy = { ...prev };
        (final.items ?? []).forEach((it) => {
          if (!copy[it.product_id]) copy[it.product_id] = { rating: 5, comment: "" };
        });
        return copy;
      });

      const reviewsMap = {};
      try {
        if (typeof userService.getMyReviewsForProducts === "function") {
          const r = await userService.getMyReviewsForProducts(productIds);
          const list = r.data?.data ?? r.data ?? [];
          (Array.isArray(list) ? list : []).forEach((rev) => {
            const pid = rev.product_id ?? rev.productId ?? rev.product;
            if (pid) {
              reviewsMap[pid] = {
                review_id: rev.id ?? rev._id ?? rev.review_id,
                rating: rev.rating,
                comment: rev.comment,
                created_at: rev.created_at ?? rev.createdAt ?? null,
              };
            }
          });
        } else {
          await Promise.all(productIds.map(async (pid) => {
            if (typeof userService.getMyReview === "function") {
              try {
                const r2 = await userService.getMyReview(pid);
                const created = r2.data?.data ?? r2.data ?? null;
                if (created && (created.id || created._id)) {
                  reviewsMap[pid] = {
                    review_id: created.id ?? created._id ?? created.review_id,
                    rating: created.rating,
                    comment: created.comment,
                    created_at: created.created_at ?? created.createdAt ?? null,
                  };
                }
              } catch (e) {}
            }
          }));
        }
      } catch (e) {}

      if (Object.keys(reviewsMap).length) setProductReviews(reviewsMap);

    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy đơn hàng";
      toast.error(msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [normalizeOrder, fetchProductsByIds]);

  const handleCancelOrder = useCallback(async (orderId) => {
    const ok = window.confirm("Bạn có chắc chắn muốn huỷ đơn hàng này?");
    if (!ok) return;
    setLoading(true);
    try {
      const res = await orderService.cancelOrder(orderId, {});
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data ?? null;
      const normalized = normalizeOrder(serverOrder);

      setOrders((prev) => prev.map((o) => (o.order_id === normalized.order_id ? normalized : o)));
      if (currentOrder?.order_id === normalized.order_id) setCurrentOrder(normalized);
      toast.success("Huỷ đơn thành công");
    } catch (err) {
      const msg = err.response?.data?.message || "Huỷ đơn thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [normalizeOrder, currentOrder]);

  // Hàm xác nhận đơn hàng (chuyển từ cancelled sang confirmed)
  const confirmOrder = useCallback(async (orderId, body = {}) => {
    const ok = window.confirm("Xác nhận đặt lại đơn hàng này?");
    if (!ok) return false;

    setLoading(true);
    setError(null);
    try {
      const res = await orderService.setOrderConfirmed(orderId, body);
      const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
      const normalized = normalizeOrder(serverOrder);

      // Cập nhật vào danh sách orders
      setOrders((prev) =>
        prev.map((o) => (o.order_id === normalized.order_id ? normalized : o))
      );

      // Cập nhật currentOrder nếu đang xem đơn này
      if (currentOrder?.order_id === normalized.order_id) {
        setCurrentOrder(normalized);
      }

      toast.success("Đã xác nhận đơn hàng thành công! Đơn hàng đã được đặt lại.");
      return normalized;
    } catch (err) {
      const msg = err.response?.data?.message || "Xác nhận đơn thất bại";
      toast.error(msg);
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [normalizeOrder, currentOrder]);

  // Hàm đặt lại đơn hàng đã hủy (gọi confirmOrder)
  const handleReorder = useCallback(async (order) => {
    if (!order || !order.items || order.items.length === 0) {
      toast.error("Không thể đặt lại đơn hàng này");
      return;
    }

    try {
      // Gọi API để chuyển trạng thái từ cancelled sang confirmed
      await confirmOrder(order.order_id, {});
      
      // Đóng modal sau khi thành công
      setCurrentOrder(null);
      
      // Refresh danh sách đơn hàng
      await fetchOrders();
      
    } catch (err) {
      console.error("Reorder error:", err);
      // Toast error đã được xử lý trong confirmOrder
    }
  }, [confirmOrder, fetchOrders]);

  const handleAddReview = useCallback(async (productId) => {
    if (!user) {
      toast.error("Bạn cần đăng nhập để đánh giá.");
      return;
    }
    if (productReviews[productId]) {
      toast.info("Bạn đã đánh giá sản phẩm này rồi.");
      return;
    }
    const input = reviewInputs[productId] ?? { rating: 5, comment: "" };
    if (!productId) return;

    setReviewLoading(true);
    try {
      const payload = {
        product_id: productId,
        rating: Number(input.rating ?? 5),
        comment: input.comment ?? "",
      };

      const res = await userService.addReview(payload);
      const created = res.data?.data ?? res.data ?? res;
      const reviewId = created.id ?? created._id ?? created.review_id ?? created.reviewId;

      setProductReviews((prev) => ({
        ...prev,
        [productId]: {
          review_id: reviewId,
          rating: payload.rating,
          comment: payload.comment,
          created_at: created.created_at ?? created.createdAt ?? new Date().toISOString(),
        },
      }));
      toast.success("Đăng đánh giá thành công");
    } catch (err) {
      const msg = err.response?.data?.message || "Đăng đánh giá thất bại";
      toast.error(msg);
      console.error("addReview error:", err);
    } finally {
      setReviewLoading(false);
    }
  }, [productReviews, reviewInputs, user]);

  const handleDeleteReview = useCallback(async (productId) => {
    const existing = productReviews[productId];
    if (!existing || !existing.review_id) {
      toast.error("Không tìm thấy đánh giá để xóa.");
      return;
    }
    if (!window.confirm("Bạn có chắc chắn muốn xóa đánh giá này?")) return;
    setReviewLoading(true);
    try {
      await userService.deleteUserReview(existing.review_id);
      setProductReviews((prev) => {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      });
      toast.success("Xóa đánh giá thành công");
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa đánh giá thất bại";
      toast.error(msg);
      console.error("deleteReview error:", err);
    } finally {
      setReviewLoading(false);
    }
  }, [productReviews]);

  const setReviewInput = useCallback((productId, field, value) => {
    setReviewInputs((prev) => ({
      ...prev,
      [productId]: { ...(prev[productId] ?? { rating: 5, comment: "" }), [field]: value },
    }));
  }, []);

  const activeOrders = useMemo(() => orders.filter((o) => String(o.status ?? "").toLowerCase() !== "cancelled"), [orders]);
  const cancelledOrders = useMemo(() => orders.filter((o) => String(o.status ?? "").toLowerCase() === "cancelled"), [orders]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="min-h-screen py-8 bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-orange-200">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-500 to-pink-500 bg-clip-text text-transparent mb-2">Đơn hàng của tôi</h1>
                <p className="text-gray-600">Quản lý và theo dõi đơn hàng của bạn</p>
              </div>

              <div className="flex items-center gap-3 bg-gray-50 p-2 rounded-xl">
                <button onClick={() => setShowCancelled(false)} className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${!showCancelled ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-100"}`}>Đơn hàng ({activeOrders.length})</button>
                <button onClick={() => setShowCancelled(true)} className={`px-5 py-2.5 rounded-lg font-semibold transition-all ${showCancelled ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg" : "bg-white text-gray-600 hover:bg-gray-100"}`}>Đã hủy ({cancelledOrders.length})</button>
              </div>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-4">
          {loading && (<div className="bg-white rounded-2xl shadow-lg p-12 text-center"><div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div><div className="text-gray-600">Đang tải...</div></div>)}
          {error && (<div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6 text-red-700">{error}</div>)}

          {!loading && !error && (showCancelled ? (
            cancelledOrders.length === 0 ? (<div className="bg-white rounded-2xl shadow-lg p-12 text-center"><h3 className="text-xl font-semibold text-gray-700 mb-2">Không có đơn đã hủy</h3></div>) : cancelledOrders.map((o) => <OrderRow key={o.order_id} order={o} onOpenDetail={fetchOrderDetail} onCancel={handleCancelOrder} />)
          ) : (
            activeOrders.length === 0 ? (<div className="bg-white rounded-2xl shadow-lg p-12 text-center"><h3 className="text-xl font-semibold text-gray-700 mb-2">Chưa có đơn hàng</h3><button onClick={() => navigate('/')} className="mt-4 px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold">Khám phá sản phẩm</button></div>) : activeOrders.map((o) => <OrderRow key={o.order_id} order={o} onOpenDetail={fetchOrderDetail} onCancel={handleCancelOrder} />)
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
                <button className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all hover:rotate-90 duration-300" onClick={() => setCurrentOrder(null)}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="overflow-y-auto flex-1 px-6 py-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border"><div className="text-sm text-gray-500 mb-1">Trạng thái</div><div className={`text-lg font-bold ${currentOrder.status === "confirmed" ? "text-orange-500" : currentOrder.status === "cancelled" ? "text-red-500" : currentOrder.status === "completed" ? "text-green-500" : "text-blue-500"}`}>{STATUS_LABEL[currentOrder.status] ?? currentOrder.status}</div></div>
                  <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-xl p-4 border border-orange-200"><div className="text-sm text-gray-500 mb-1">Tổng cuối (Thanh toán)</div><div className="text-lg font-bold text-orange-600">{formatPrice(currentOrder.final_price)}</div></div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200"><div className="text-sm text-gray-600 mb-1">📅 Ngày đặt</div><div className="text-sm font-medium">{safeDate(currentOrder.created_at)}</div></div>
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200"><div className="text-sm text-gray-600 mb-1">📍 Địa chỉ</div><div className="text-sm font-medium line-clamp-2">{currentOrder.shipping_address || "Chưa có"}</div></div>
                </div>

                {String(currentOrder.status).toLowerCase() !== "cancelled" ? (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border border-green-200">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">🚚 Tiến trình</h3>
                    <div className="relative py-4">
                      <div className="flex items-start justify-between relative z-10">
                        {PROGRESS_STEPS.map((step, i) => {
                          const idx = getProgressIndex(currentOrder.status);
                          const done = i < idx;
                          const active = i === idx;
                          const label = STATUS_LABEL[step] ?? step;
                          return (
                            <div key={step} className="flex flex-col items-center flex-1">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 font-bold transition-all ${done || active ? "bg-green-500 text-white border-green-500 shadow-lg" : "bg-white text-gray-400 border-gray-300"} ${active ? "ring-4 ring-green-200 scale-110" : ""}`}>{done ? "✓" : i + 1}</div>
                              <div className={`text-xs mt-3 text-center font-medium ${done || active ? "text-gray-800" : "text-gray-400"}`}>{label}</div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="absolute top-9 left-0 right-0 h-0.5 bg-gray-200" style={{ marginLeft: '2.5rem', marginRight: '2.5rem' }} />
                      <div className="absolute top-9 left-0 h-0.5 bg-green-500 transition-all duration-500" style={{ marginLeft: '2.5rem', width: getProgressIndex(currentOrder.status) <= 0 ? "0%" : `calc(${(getProgressIndex(currentOrder.status) / (PROGRESS_STEPS.length - 1)) * 100}% - 2.5rem)` }} />
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border-2 border-red-300 bg-red-50 text-red-700 mb-6">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold">Đơn hàng đã bị huỷ</div>
                      <button
                        onClick={() => handleReorder(currentOrder)}
                        disabled={loading}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {loading ? "Đang xử lý..." : "Đặt lại"}
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-5 mb-6 border">
                  <h3 className="text-lg font-semibold mb-4">Sản phẩm ({currentOrder.items.length})</h3>
                  <div className="space-y-3">
                    {currentOrder.items.map((item, idx) => (
                      <ProductItem
                        key={item.product_id ?? idx}
                        item={item}
                        reviewInputs={reviewInputs}
                        setReviewInput={setReviewInput}
                        existingReview={productReviews[item.product_id]}
                        onAddReview={handleAddReview}
                        onDeleteReview={handleDeleteReview}
                        reviewLoading={reviewLoading}
                        orderStatus={currentOrder.status}
                      />
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-5 mb-6 border">
                  <h3 className="text-lg font-semibold mb-3">Tóm tắt thanh toán</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-gray-600">Tạm tính:</span><span className="font-medium">{formatPrice(currentOrder.total_price)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600">Giảm giá:</span><span className="font-medium text-red-600">-{formatPrice(currentOrder.discount_amount)}</span></div>
                    <div className="flex justify-between pt-2 border-t"><span className="text-gray-700 font-semibold">Thành tiền:</span><span className="font-semibold text-orange-600">{formatPrice(currentOrder.final_price)}</span></div>
                  </div>
                </div>
              </div>

              {String(currentOrder.status).toLowerCase() === "confirmed" && (
                <div className="px-6 py-4 bg-gray-50 border-t">
                  <button onClick={() => handleCancelOrder(currentOrder.order_id)} className="w-full py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700">Huỷ đơn hàng</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}