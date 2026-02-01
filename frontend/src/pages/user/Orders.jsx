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

// ==== ProductItem (Stitch Design) ====
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
    <div className="bg-surface-light dark:bg-surface-dark rounded-xl p-4 flex items-start gap-4 border border-gray-100 dark:border-gray-700">
      <div className="flex-shrink-0 w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-600">
        {img ? (
          <img src={img} className="w-full h-full object-contain p-1" alt={p?.name} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <span className="material-icons-outlined text-2xl">inventory_2</span>
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-gray-900 dark:text-white truncate">{p?.name ?? item.product_name ?? "Sản phẩm"}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          <span>SL: x{item.quantity}</span>
          <span className="mx-2">•</span>
          <span>{formatPrice(item.price)}</span>
        </div>

        {/* Review Section for Completed Orders */}
        {String(orderStatus).toLowerCase() === "completed" && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            {existingReview ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">Đánh giá của bạn</span>
                    <span className="text-xs text-yellow-500">({existingReview.rating}★)</span>
                  </div>
                  <span className="text-xs text-gray-400">{existingReview.created_at ? safeDate(existingReview.created_at) : ""}</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">{existingReview.comment}</div>
                <button
                  onClick={() => onDeleteReview(pid)}
                  disabled={reviewLoading}
                  className="text-xs px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-medium"
                >
                  Xóa đánh giá
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Viết đánh giá</div>
                <div className="flex items-center gap-2">
                  <StarRating
                    id={`star-${pid}`}
                    value={reviewInputs[pid]?.rating ?? 5}
                    onChange={(n) => setReviewInput(pid, "rating", n)}
                    size={18}
                    disabled={reviewLoading}
                  />
                  <span className="text-sm text-gray-500">{reviewInputs[pid]?.rating ?? 5}★</span>
                </div>
                <textarea
                  value={reviewInputs[pid]?.comment ?? ""}
                  onChange={(e) => setReviewInput(pid, "comment", e.target.value)}
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  placeholder="Viết cảm nhận của bạn về sản phẩm..."
                  rows={2}
                  disabled={reviewLoading}
                />
                <button
                  onClick={() => onAddReview(pid)}
                  disabled={reviewLoading}
                  className="py-2 px-4 rounded-lg bg-primary text-white font-medium hover:bg-blue-600 transition-all text-sm disabled:opacity-60 shadow-md shadow-blue-500/20"
                >
                  {reviewLoading ? "Đang gửi..." : "Gửi đánh giá"}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="font-bold text-secondary whitespace-nowrap">{formatPrice(lineTotal)}</div>
    </div>
  );
});

// ==== OrderRow (Stitch Design) ====
const OrderRow = React.memo(function OrderRow({ order, onOpenDetail, onCancel }) {
  const item = (order.items && order.items[0]) || {};
  const product = item.productInfo;
  const avatar = product?.media?.find((m) => m.is_primary)?.url ?? product?.media?.[0]?.url ?? null;
  const remainingItems = (order.items?.length ?? 1) - 1;
  const hasDiscount = Number(order.discount_amount) > 0 && Number(order.total_price) > Number(order.final_price);
  const status = String(order.status).toLowerCase();

  const getStatusBadge = (status) => {
    switch (status) {
      case "confirmed":
        return { bg: "bg-yellow-50 dark:bg-yellow-900/30", text: "text-yellow-600 dark:text-yellow-300", border: "border-yellow-100 dark:border-yellow-800", dot: "bg-yellow-500" };
      case "paid":
        return { bg: "bg-blue-50 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-300", border: "border-blue-100 dark:border-blue-800", dot: "bg-blue-500" };
      case "shipping":
        return { bg: "bg-purple-50 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-300", border: "border-purple-100 dark:border-purple-800", dot: "bg-purple-500" };
      case "completed":
        return { bg: "bg-green-50 dark:bg-green-900/30", text: "text-green-600 dark:text-green-300", border: "border-green-100 dark:border-green-800", dot: "bg-green-500" };
      case "cancelled":
        return { bg: "bg-gray-100 dark:bg-gray-700", text: "text-gray-600 dark:text-gray-300", border: "border-gray-200 dark:border-gray-600", dot: "bg-gray-500" };
      default:
        return { bg: "bg-gray-50", text: "text-gray-600", border: "border-gray-200", dot: "bg-gray-400" };
    }
  };

  const badge = getStatusBadge(status);

  return (
    <div className={`bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 transition-all hover:shadow-md ${status === "cancelled" ? "opacity-75 hover:opacity-100" : ""}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-100 dark:border-gray-700 gap-4 sm:gap-0">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-900 dark:text-white">#{order.order_id}</span>
            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{safeDate(order.created_at)}</span>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badge.bg} ${badge.text} border ${badge.border} flex items-center gap-1`}>
          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
          {STATUS_LABEL[order.status] ?? order.status}
        </span>
      </div>

      {/* Product Info */}
      <div className="space-y-4 mb-6">
        <div className="flex gap-4">
          <div className="w-20 h-20 flex-shrink-0 bg-gray-50 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700 relative">
            {avatar ? (
              <img src={avatar} alt={product?.name} className="w-full h-full object-contain p-2" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <span className="material-icons-outlined text-3xl">inventory_2</span>
              </div>
            )}
            {remainingItems > 0 && (
              <div className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                +{remainingItems}
              </div>
            )}
          </div>
          <div className="flex-1 flex flex-col sm:flex-row justify-between gap-4">
            <div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">{product?.name ?? item.product_name ?? "Sản phẩm"}</h4>
              {product?.color && <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Màu: {product.color}</p>}
              <p className="text-xs text-gray-400">Số lượng: x{item?.quantity ?? 1}</p>
            </div>
            <div className="text-right">
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">{formatPrice(item?.price ?? (product?.price ?? 0))}</span>
              {hasDiscount && <span className="text-xs text-gray-400 line-through">{formatPrice(order.total_price)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Tổng tiền:</span>
          <span className="text-xl font-bold text-secondary">{formatPrice(order.final_price)}</span>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => onOpenDetail(order.order_id)}
            className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
          >
            Xem chi tiết
          </button>
          {status === "confirmed" && (
            <button
              onClick={() => onCancel(order.order_id)}
              className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 shadow-md shadow-red-500/20 transition-all text-sm"
            >
              Huỷ đơn
            </button>
          )}
          {status === "completed" && (
            <button
              onClick={() => onOpenDetail(order.order_id)}
              className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl bg-white dark:bg-gray-800 border border-primary text-primary font-medium hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors text-sm"
            >
              Đánh giá
            </button>
          )}
          {status === "cancelled" && (
            <button
              onClick={() => onOpenDetail(order.order_id)}
              className="flex-1 sm:flex-none py-2.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all text-sm"
            >
              Mua lại
            </button>
          )}
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
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'confirmed' | 'paid' | 'shipping' | 'completed' | 'cancelled'

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
          } catch (err) { }
        }));
      }
    } else {
      await Promise.all(missing.map(async (id) => {
        try {
          const r = await productService.getProductById(id);
          const p = r.data?.product ?? r.data?.data ?? r.data ?? null;
          if (p) productCache.current[id] = p;
        } catch (err) { }
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
              } catch (e) { }
            }
          }));
        }
      } catch (e) { }

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

  // Filter orders based on active tab
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const status = String(o.status ?? '').toLowerCase();
      switch (activeTab) {
        case 'all': return status !== 'cancelled';
        case 'confirmed': return status === 'confirmed';
        case 'paid': return status === 'paid';
        case 'shipping': return status === 'shipping';
        case 'completed': return status === 'completed';
        case 'cancelled': return status === 'cancelled';
        default: return true;
      }
    });
  }, [orders, activeTab]);

  // Count by status for tab badges
  const statusCounts = useMemo(() => {
    const counts = { all: 0, confirmed: 0, paid: 0, shipping: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => {
      const status = String(o.status ?? '').toLowerCase();
      if (status === 'cancelled') {
        counts.cancelled++;
      } else {
        counts.all++;
        if (counts[status] !== undefined) counts[status]++;
      }
    });
    return counts;
  }, [orders]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8 bg-background-light dark:bg-background-dark font-display transition-colors duration-300">
      <div className="max-w-5xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Đơn hàng của tôi</h1>
            <p className="text-gray-500 dark:text-gray-400">Quản lý và theo dõi đơn hàng của bạn</p>
          </div>
          <div className="hidden sm:block">
            <button onClick={() => navigate('/')} className="text-primary hover:text-blue-700 text-sm font-medium flex items-center gap-1">
              <span className="material-icons-outlined text-base">home</span>
              Tiếp tục mua sắm
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-8 overflow-hidden">
          <div className="flex overflow-x-auto scrollbar-hide">
            {[
              { key: 'all', label: 'Tất cả', count: statusCounts.all },
              { key: 'confirmed', label: 'Chờ xác nhận', count: statusCounts.confirmed },
              { key: 'paid', label: 'Đã thanh toán', count: statusCounts.paid },
              { key: 'shipping', label: 'Đang giao', count: statusCounts.shipping },
              { key: 'completed', label: 'Hoàn thành', count: statusCounts.completed },
              { key: 'cancelled', label: 'Đã hủy', count: statusCounts.cancelled },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-5 py-3.5 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary bg-blue-50/50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-primary'
                  }`}
              >
                {tab.label} {tab.count > 0 && <span className="ml-1 text-xs">({tab.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-6">
          {loading && (
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <div className="text-gray-500 dark:text-gray-400">Đang tải đơn hàng...</div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 text-red-700 dark:text-red-300 flex items-center gap-3">
              <span className="material-icons-outlined">error_outline</span>
              {error}
            </div>
          )}

          {!loading && !error && (
            filteredOrders.length === 0 ? (
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-12 text-center">
                <span className="material-icons-outlined text-5xl text-gray-300 dark:text-gray-600 mb-4">
                  {activeTab === 'cancelled' ? 'remove_shopping_cart' : 'shopping_bag'}
                </span>
                <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  {activeTab === 'all' && 'Chưa có đơn hàng'}
                  {activeTab === 'confirmed' && 'Không có đơn chờ xác nhận'}
                  {activeTab === 'paid' && 'Không có đơn đã thanh toán'}
                  {activeTab === 'shipping' && 'Không có đơn đang giao'}
                  {activeTab === 'completed' && 'Không có đơn hoàn thành'}
                  {activeTab === 'cancelled' && 'Không có đơn đã hủy'}
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6">
                  {activeTab === 'all' ? 'Hãy khám phá các sản phẩm tuyệt vời của chúng tôi' : 'Các đơn hàng phù hợp sẽ hiển thị tại đây'}
                </p>
                {activeTab === 'all' && (
                  <button
                    onClick={() => navigate('/')}
                    className="py-2.5 px-6 rounded-xl bg-primary text-white font-medium hover:bg-blue-600 shadow-md shadow-blue-500/20 transition-all text-sm"
                  >
                    Khám phá sản phẩm
                  </button>
                )}
              </div>
            ) : filteredOrders.map((o) => <OrderRow key={o.order_id} order={o} onOpenDetail={fetchOrderDetail} onCancel={handleCancelOrder} />)
          )}
        </div>

        {/* MODAL - Order Detail (Redesigned) */}
        {currentOrder && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-2xl w-full relative overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

              {/* Header - Gradient */}
              <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-6 py-6 relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">Chi tiết đơn hàng</h2>
                    <p className="text-white/70 text-sm font-mono">#{currentOrder.order_id?.slice(0, 8)}...</p>
                  </div>
                  <button
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all border border-white/20"
                    onClick={() => setCurrentOrder(null)}
                  >
                    <span className="material-icons-outlined text-xl">close</span>
                  </button>
                </div>

                {/* Order Info Row */}
                <div className="flex items-center gap-4 mt-4 text-sm">
                  <div className="flex items-center gap-2 text-white/80">
                    <span className="material-icons-outlined text-base">calendar_today</span>
                    {safeDate(currentOrder.created_at)}
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/40"></div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${currentOrder.status === "confirmed" ? "bg-yellow-400/20 text-yellow-200" :
                    currentOrder.status === "paid" ? "bg-blue-400/20 text-blue-200" :
                      currentOrder.status === "shipping" ? "bg-purple-400/20 text-purple-200" :
                        currentOrder.status === "completed" ? "bg-green-400/20 text-green-200" :
                          "bg-gray-400/20 text-gray-200"
                    }`}>
                    {STATUS_LABEL[currentOrder.status] ?? currentOrder.status}
                  </span>
                </div>
              </div>

              {/* Progress Steps - Horizontal */}
              {String(currentOrder.status).toLowerCase() !== "cancelled" && (
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    {PROGRESS_STEPS.map((step, i) => {
                      const idx = getProgressIndex(currentOrder.status);
                      const done = i < idx;
                      const active = i === idx;
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${done ? "bg-green-500 text-white" :
                              active ? "bg-indigo-600 text-white ring-4 ring-indigo-100 dark:ring-indigo-900" :
                                "bg-gray-200 dark:bg-gray-700 text-gray-400"
                              }`}>
                              {done ? <span className="material-icons-outlined text-sm">check</span> : i + 1}
                            </div>
                            <span className={`text-[10px] mt-1.5 font-medium ${done || active ? "text-gray-700 dark:text-gray-200" : "text-gray-400"}`}>
                              {STATUS_LABEL[step]?.split(' ')[0] ?? step}
                            </span>
                          </div>
                          {i < PROGRESS_STEPS.length - 1 && (
                            <div className={`flex-1 h-0.5 mx-2 ${done ? "bg-green-500" : "bg-gray-200 dark:bg-gray-700"}`}></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Cancelled Banner */}
              {String(currentOrder.status).toLowerCase() === "cancelled" && (
                <div className="px-6 py-3 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <span className="material-icons-outlined text-lg">block</span>
                    <span className="font-medium">Đơn hàng đã huỷ</span>
                  </div>
                  <button
                    onClick={() => handleReorder(currentOrder)}
                    disabled={loading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1.5"
                  >
                    <span className="material-icons-outlined text-base">refresh</span>
                    Mua lại
                  </button>
                </div>
              )}

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-5">

                {/* Shipping Address */}
                {currentOrder.shipping_address && (
                  <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                    <span className="material-icons-outlined text-blue-500 mt-0.5">location_on</span>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Địa chỉ giao hàng</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{currentOrder.shipping_address}</p>
                    </div>
                  </div>
                )}

                {/* Products */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="material-icons-outlined text-base">inventory_2</span>
                    Sản phẩm ({currentOrder.items.length})
                  </h3>
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

                {/* Payment Summary */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 space-y-2">
                  <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <span className="material-icons-outlined text-base">receipt_long</span>
                    Thanh toán
                  </h3>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Tạm tính</span>
                    <span className="text-gray-700 dark:text-gray-300">{formatPrice(currentOrder.total_price)}</span>
                  </div>
                  {Number(currentOrder.discount_amount) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Giảm giá</span>
                      <span className="text-green-600">-{formatPrice(currentOrder.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-semibold text-gray-900 dark:text-white">Thành tiền</span>
                      <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">{formatPrice(currentOrder.final_price)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer - Cancel Button */}
              {String(currentOrder.status).toLowerCase() === "confirmed" && (
                <div className="px-6 py-4 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                  <button
                    onClick={() => handleCancelOrder(currentOrder.order_id)}
                    className="w-full py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-xl font-semibold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-icons-outlined text-lg">cancel</span>
                    Huỷ đơn hàng
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div >
  );
}