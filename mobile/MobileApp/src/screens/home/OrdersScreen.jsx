// src/screens/home/OrdersScreen.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../../providers/AuthProvider";
import { useOrder } from "../../providers/OrderProvider";
import { productService } from "../../services/productService";
import { userService } from "../../services/userService";

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
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(Number(price ?? 0));

const safeDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// ==== StarRating component ====
const StarRating = ({ value = 5, onChange, disabled = false }) => {
  return (
    <View style={styles.starContainer}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity
          key={n}
          onPress={() => !disabled && onChange(n)}
          disabled={disabled}
          style={styles.starButton}
        >
          <Text style={n <= value ? styles.starFilled : styles.starEmpty}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
      <Text style={styles.ratingText}>{value}★</Text>
    </View>
  );
};

// ==== Helpers ====
const getProgressIndex = (status) => {
  if (!status) return -1;
  return PROGRESS_STEPS.indexOf(String(status).toLowerCase());
};
const normalizeOrder = (o) => {
  if (!o) {
    return {
      total_price: 0,
      discount_amount: 0,
      final_price: 0,
      items: [],
    };
  }

  // 🔥 ƯU TIÊN RAW (BACKEND ĐÃ TÍNH)
  const raw = o.raw ?? {};

  const total =
    Number(
      raw.total_price ??
      o.total_price ??
      o.total_amount ??
      0
    );

  const discount =
    Number(
      raw.discount_amount ??
      o.discount_amount ??
      o.discount ??
      0
    );

  const final =
    Number(
      raw.final_price ??
      o.final_price ??
      (total - discount)
    );

  return {
    ...o,
    total_price: total,
    discount_amount: discount,
    final_price: final,
  };
};




const getStatusColor = (status) => {
  switch (String(status).toLowerCase()) {
    case "confirmed":
      return { bg: "#FEF3C7", text: "#92400E", border: "#FCD34D" };
    case "paid":
      return { bg: "#DBEAFE", text: "#1E40AF", border: "#93C5FD" };
    case "shipping":
      return { bg: "#E9D5FF", text: "#6B21A8", border: "#C084FC" };
    case "completed":
      return { bg: "#D1FAE5", text: "#065F46", border: "#6EE7B7" };
    case "cancelled":
      return { bg: "#FEE2E2", text: "#991B1B", border: "#FCA5A5" };
    default:
      return { bg: "#F3F4F6", text: "#1F2937", border: "#D1D5DB" };
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
  const img =
    p?.media?.find((m) => m.is_primary)?.url ?? p?.media?.[0]?.url ?? null;
  const lineTotal = Number(item.quantity) * Number(item.price);
  const pid = item.product_id;

  return (
    <View style={styles.productItem}>
      <View style={styles.productRow}>
        <View style={styles.productImageContainer}>
          {img ? (
            <Image source={{ uri: img }} style={styles.productImage} />
          ) : (
            <View style={styles.productImagePlaceholder}>
              <Text style={styles.productImagePlaceholderText}>📦</Text>
            </View>
          )}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {p?.name ?? item.product_name ?? "Sản phẩm"}
          </Text>
          <Text style={styles.productQuantity}>
            Số lượng: {item.quantity}
          </Text>
          <Text style={styles.productPrice}>
            Đơn giá: {formatPrice(item.price)}
          </Text>
          <Text style={styles.productTotal}>
            Thành tiền: <Text style={styles.productTotalPrice}>{formatPrice(lineTotal)}</Text>
          </Text>
        </View>
      </View>

      {String(orderStatus).toLowerCase() === "completed" && (
        <View style={styles.reviewContainer}>
          {existingReview ? (
            <View style={styles.existingReview}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewTitle}>Đánh giá của bạn</Text>
                <Text style={styles.reviewRating}>({existingReview.rating}★)</Text>
              </View>
              <Text style={styles.reviewDate}>
                {existingReview.created_at ? safeDate(existingReview.created_at) : ""}
              </Text>
              <Text style={styles.reviewComment}>{existingReview.comment}</Text>
              <TouchableOpacity
                onPress={() => onDeleteReview(pid)}
                disabled={reviewLoading}
                style={styles.deleteReviewButton}
              >
                <Text style={styles.deleteReviewText}>Xóa đánh giá</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.addReview}>
              <Text style={styles.addReviewTitle}>Viết đánh giá</Text>

              <StarRating
                value={reviewInputs[pid]?.rating ?? 5}
                onChange={(n) => setReviewInput(pid, "rating", n)}
                disabled={reviewLoading}
              />

              <TextInput
                value={reviewInputs[pid]?.comment ?? ""}
                onChangeText={(text) => setReviewInput(pid, "comment", text)}
                style={styles.reviewInput}
                placeholder="Viết cảm nhận của bạn về sản phẩm..."
                multiline
                numberOfLines={3}
                editable={!reviewLoading}
              />

              <TouchableOpacity
                onPress={() => onAddReview(pid)}
                disabled={reviewLoading}
                style={[styles.submitReviewButton, reviewLoading && styles.disabledButton]}
              >
                <Text style={styles.submitReviewText}>
                  {reviewLoading ? "Đang gửi..." : "Gửi đánh giá"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

// ==== OrderRow ====
const OrderRow = React.memo(function OrderRow({ order, onOpenDetail, onCancel }) {
  const item = (order.items && order.items[0]) || {};
  const product = item.productInfo;
  const avatar =
    product?.media?.find((m) => m.is_primary)?.url ??
    product?.media?.[0]?.url ??
    null;
  const remainingItems = (order.items?.length ?? 1) - 1;
  
 const finalPrice =
  Number(order.final_price ?? order.total_price ?? 0);

const totalPrice =
  Number(order.total_price ?? order.total_amount ?? 0);

const discountAmount =
  Number(order.discount_amount ?? 0);

const hasDiscount = discountAmount > 0;

  
  const statusColors = getStatusColor(order.status);

  return (
    <TouchableOpacity
      style={styles.orderCard}
      onPress={() => onOpenDetail(order.order_id)}
    >
      <View style={styles.orderContent}>
        <View style={styles.orderImageContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.orderImage} />
          ) : (
            <View style={styles.orderImagePlaceholder}>
              <Text style={styles.orderImagePlaceholderText}>📦</Text>
            </View>
          )}
          {remainingItems > 0 && (
            <View style={styles.remainingBadge}>
              <Text style={styles.remainingBadgeText}>+{remainingItems}</Text>
            </View>
          )}
        </View>

        <View style={styles.orderDetails}>
          <View style={styles.orderHeader}>
            <Text style={styles.orderName} numberOfLines={1}>
              {product?.name ?? item.product_name ?? "Sản phẩm"}
            </Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusColors.bg, borderColor: statusColors.border },
              ]}
            >
              <Text style={[styles.statusText, { color: statusColors.text }]}>
                {STATUS_LABEL[order.status] ?? order.status}
              </Text>
            </View>
          </View>

          <Text style={styles.orderId}>Mã: #{order.order_id}</Text>
          <Text style={styles.orderQuantity}>
            SL: {item?.quantity ?? 1} × {formatPrice(item?.price ?? 0)}
          </Text>
          <Text style={styles.orderDate}>{safeDate(order.created_at)}</Text>

          <View style={styles.orderFooter}>
            <View>
              <Text style={styles.totalLabel}>Tổng thanh toán</Text>
              <Text style={styles.totalPrice}>{formatPrice(finalPrice)}</Text>
              {hasDiscount && (
                <View style={styles.discountContainer}>
                  <Text style={styles.originalPrice}>
                    {formatPrice(totalPrice)}
                  </Text>
                  <Text style={styles.discountAmount}>
                    -{formatPrice(discountAmount)}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.orderActions}>
              {String(order.status).toLowerCase() === "confirmed" && (
                <TouchableOpacity
                  onPress={(e) => {
                    e.stopPropagation();
                    onCancel(order.order_id);
                  }}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>Huỷ</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
});

export default function OrdersScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  
  const {
    orders: providerOrders,
    loading,
    error,
    fetchOrders,
    fetchOrderDetail,
    cancelOrder,
    confirmOrder,
  } = useOrder();

  const [refreshing, setRefreshing] = useState(false);
  const [showCancelled, setShowCancelled] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [detailOrder, setDetailOrder] = useState(null);

  const [reviewInputs, setReviewInputs] = useState({});
  const [productReviews, setProductReviews] = useState({});
  const [reviewLoading, setReviewLoading] = useState(false);

  const productCache = React.useRef({});

  const fetchProductsByIds = useCallback(async (ids = []) => {
    const missing = ids.filter((id) => !productCache.current[id]);
    if (missing.length === 0) return;

    await Promise.all(
      missing.map(async (id) => {
        try {
          const r = await productService.getProductById(id);
          const p = r.data?.product ?? r.data?.data ?? r.data ?? null;
          if (p) productCache.current[id] = p;
        } catch (err) {
          console.error(`Error fetching product ${id}:`, err);
        }
      })
    );
  }, []);

  // Enrich orders with product info
const enrichedOrders = useMemo(() => {
  return providerOrders
    .map(normalizeOrder)
    .map((order) => ({
      ...order,
      items: (order.items ?? []).map((it) => ({
        ...it,
        productInfo: productCache.current[it.product_id] ?? null,
      })),
    }));
    
}, [providerOrders]);

useEffect(() => {
  console.log("🧾 PROVIDER ORDERS RAW:", providerOrders);
  console.log("🧾 ENRICHED ORDERS:", enrichedOrders);
}, [providerOrders, enrichedOrders]);



  const handleOpenDetail = useCallback(
    async (orderId) => {
      if (!orderId) return;
      
      try {
        const orderDetail = await fetchOrderDetail(orderId);
        
        const productIds = Array.from(
          new Set(
            (orderDetail.items ?? []).map((i) => i.product_id).filter(Boolean)
          )
        );
        await fetchProductsByIds(productIds);

        const itemsWithProduct = (orderDetail.items ?? []).map((item) => ({
          ...item,
          productInfo: productCache.current[item.product_id] ?? null,
        }));
        
        const normalizedDetail = normalizeOrder(orderDetail);

const enrichedDetail = {
  ...normalizedDetail,
  items: itemsWithProduct,
};

setDetailOrder(enrichedDetail);

        setModalVisible(true);

        setReviewInputs((prev) => {
          const copy = { ...prev };
          (enrichedDetail.items ?? []).forEach((it) => {
            if (!copy[it.product_id])
              copy[it.product_id] = { rating: 5, comment: "" };
          });
          return copy;
        });

        const reviewsMap = {};
        try {
          await Promise.all(
            productIds.map(async (pid) => {
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
            })
          );
        } catch (e) {}

        if (Object.keys(reviewsMap).length) setProductReviews(reviewsMap);
      } catch (err) {
        console.error("Error fetching order detail:", err);
      }
    },
    [fetchOrderDetail, fetchProductsByIds]
  );

  const handleCancelOrder = useCallback(
    async (orderId) => {
      try {
        await cancelOrder(orderId);
        if (detailOrder?.order_id === orderId) {
          setModalVisible(false);
          setDetailOrder(null);
        }
      } catch (err) {
        console.error("Cancel order error:", err);
      }
    },
    [cancelOrder, detailOrder]
  );

  const handleReorder = useCallback(
    async (order) => {
      if (!order || !order.items || order.items.length === 0) {
        Alert.alert("Lỗi", "Không thể đặt lại đơn hàng này");
        return;
      }

      try {
        await confirmOrder(order.order_id, {});
        setModalVisible(false);
        setDetailOrder(null);
        
        const userId = user?.user_id ?? user?.id ?? user?._id;
        if (userId) {
          await fetchOrders(userId);
        }
      } catch (err) {
        console.error("Reorder error:", err);
      }
    },
    [confirmOrder, fetchOrders, user]
  );

  const handleAddReview = useCallback(
    async (productId) => {
      if (!user) {
        Alert.alert("Thông báo", "Bạn cần đăng nhập để đánh giá.");
        return;
      }
      if (productReviews[productId]) {
        Alert.alert("Thông báo", "Bạn đã đánh giá sản phẩm này rồi.");
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
        const reviewId =
          created.id ?? created._id ?? created.review_id ?? created.reviewId;

        setProductReviews((prev) => ({
          ...prev,
          [productId]: {
            review_id: reviewId,
            rating: payload.rating,
            comment: payload.comment,
            created_at:
              created.created_at ?? created.createdAt ?? new Date().toISOString(),
          },
        }));
        Alert.alert("Thành công", "Đăng đánh giá thành công");
      } catch (err) {
        const msg = err.response?.data?.message || "Đăng đánh giá thất bại";
        Alert.alert("Lỗi", msg);
        console.error("addReview error:", err);
      } finally {
        setReviewLoading(false);
      }
    },
    [productReviews, reviewInputs, user]
  );

  const handleDeleteReview = useCallback(
    async (productId) => {
      const existing = productReviews[productId];
      if (!existing || !existing.review_id) {
        Alert.alert("Lỗi", "Không tìm thấy đánh giá để xóa.");
        return;
      }

      Alert.alert(
        "Xác nhận",
        "Bạn có chắc chắn muốn xóa đánh giá này?",
        [
          { text: "Không", style: "cancel" },
          {
            text: "Có",
            style: "destructive",
            onPress: async () => {
              setReviewLoading(true);
              try {
                await userService.deleteUserReview(existing.review_id);
                setProductReviews((prev) => {
                  const copy = { ...prev };
                  delete copy[productId];
                  return copy;
                });
                Alert.alert("Thành công", "Xóa đánh giá thành công");
              } catch (err) {
                const msg =
                  err.response?.data?.message || "Xóa đánh giá thất bại";
                Alert.alert("Lỗi", msg);
                console.error("deleteReview error:", err);
              } finally {
                setReviewLoading(false);
              }
            },
          },
        ]
      );
    },
    [productReviews]
  );

  const setReviewInput = useCallback((productId, field, value) => {
    setReviewInputs((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] ?? { rating: 5, comment: "" }),
        [field]: value,
      },
    }));
  }, []);

  const activeOrders = useMemo(
    () =>
      enrichedOrders.filter(
        (o) => String(o.status ?? "").toLowerCase() !== "cancelled"
      ),
    [enrichedOrders]
  );
  
  const cancelledOrders = useMemo(
    () =>
      enrichedOrders.filter(
        (o) => String(o.status ?? "").toLowerCase() === "cancelled"
      ),
    [enrichedOrders]
  );

  const onRefresh = useCallback(async () => {
    const userId = user?.user_id ?? user?.id ?? user?._id;
    if (!userId) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để xem đơn hàng.");
      return;
    }

    setRefreshing(true);
    try {
      await fetchOrders(userId);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  }, [fetchOrders, user]);

  // Initial fetch
  useEffect(() => {
    const userId = user?.user_id ?? user?.id ?? user?._id;
    if (userId) {
      fetchOrders(userId);
    } else {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để xem đơn hàng.");
    }
  }, []);

  // Fetch products when orders change
  useEffect(() => {
    const allProductIds = Array.from(
      new Set(
        providerOrders
          .flatMap((o) => (o.items ?? []).map((i) => i.product_id))
          .filter(Boolean)
      )
    );
    if (allProductIds.length > 0) {
      fetchProductsByIds(allProductIds);
    }
  }, [providerOrders, fetchProductsByIds]);

const detailFinalPrice = detailOrder?.final_price ?? 0;
const detailTotalPrice = detailOrder?.total_price ?? 0;
const detailDiscountAmount = detailOrder?.discount_amount ?? 0;



  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Đơn hàng của tôi</Text>
        <Text style={styles.headerSubtitle}>
          Quản lý và theo dõi đơn hàng của bạn
        </Text>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setShowCancelled(false)}
            style={[styles.tab, !showCancelled && styles.tabActive]}
          >
            <Text style={[styles.tabText, !showCancelled && styles.tabTextActive]}>
              Đơn hàng ({activeOrders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowCancelled(true)}
            style={[styles.tab, showCancelled && styles.tabActive]}
          >
            <Text style={[styles.tabText, showCancelled && styles.tabTextActive]}>
              Đã hủy ({cancelledOrders.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading && !refreshing && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!loading && !error && (
          showCancelled ? (
            cancelledOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Không có đơn đã hủy</Text>
              </View>
            ) : (
              cancelledOrders.map((o) => (
                <OrderRow
                  key={o.order_id}
                  order={o}
                  onOpenDetail={handleOpenDetail}
                  onCancel={handleCancelOrder}
                />
              ))
            )
          ) : activeOrders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Chưa có đơn hàng</Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("Home")}
                style={styles.exploreButton}
              >
                <Text style={styles.exploreButtonText}>
                  Khám phá sản phẩm
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            activeOrders.map((o) => (
              <OrderRow
                key={o.order_id}
                order={o}
                onOpenDetail={handleOpenDetail}
                onCancel={handleCancelOrder}
              />
            ))
          )
        )}
      </ScrollView>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => {
          setModalVisible(false);
          setDetailOrder(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderLeft}>
                <Text style={styles.modalTitle}>Chi tiết đơn hàng</Text>
                <Text style={styles.modalSubtitle}>
                  Mã đơn: #{detailOrder?.order_id?.slice(0, 8)}...
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setDetailOrder(null);
                }}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {detailOrder && (
                <>
                  {/* Thông tin chính */}
                  <View style={styles.mainInfoSection}>
  <View style={styles.infoRow}>
    <View style={styles.infoIconContainer}>
      <Text style={styles.infoIcon}>🧾</Text>
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>Mã đơn hàng</Text>
      <Text style={styles.infoValue}>
        #{detailOrder.order_id}
      </Text>
    </View>
  </View>

  <View style={styles.infoDivider} />

  <View style={styles.infoRow}>
    <View style={styles.infoIconContainer}>
      <Text style={styles.infoIcon}>📅</Text>
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>Ngày đặt hàng</Text>
      <Text style={styles.infoValue}>
        {safeDate(detailOrder.created_at)}
      </Text>
    </View>
  </View>

  <View style={styles.infoDivider} />

  <View style={styles.infoRow}>
    <View style={styles.infoIconContainer}>
      <Text style={styles.infoIcon}>🚚</Text>
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>Địa chỉ giao hàng</Text>
      <Text style={styles.infoValue}>
        {detailOrder.shipping_address || "Nhận tại cửa hàng"}
      </Text>
    </View>
  </View>

  <View style={styles.infoDivider} />

  <View style={styles.infoRow}>
    <View style={styles.infoIconContainer}>
      <Text style={styles.infoIcon}>📦</Text>
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>Trạng thái đơn hàng</Text>
      <View
        style={[
          styles.statusBadgeLarge,
          {
            backgroundColor: getStatusColor(detailOrder.status).bg,
            borderColor: getStatusColor(detailOrder.status).border,
          },
        ]}
      >
        <Text
          style={[
            styles.statusTextLarge,
            { color: getStatusColor(detailOrder.status).text },
          ]}
        >
          {STATUS_LABEL[detailOrder.status]}
        </Text>
      </View>
    </View>
  </View>
</View>


                  {/* Tiến trình đơn hàng */}
                  {String(detailOrder.status).toLowerCase() !== "cancelled" ? (
                    <View style={styles.progressContainer}>
                      <Text style={styles.sectionTitle}>🚚 Tiến trình đơn hàng</Text>
                      <View style={styles.progressSteps}>
                        {PROGRESS_STEPS.map((step, i) => {
                          const idx = getProgressIndex(detailOrder.status);
                          const done = i < idx;
                          const active = i === idx;
                          const label = STATUS_LABEL[step] ?? step;
                          return (
                            <View key={step} style={styles.progressStep}>
                              <View
                                style={[
                                  styles.progressCircle,
                                  (done || active) && styles.progressCircleActive,
                                  active && styles.progressCircleCurrent,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.progressNumber,
                                    (done || active) && styles.progressNumberActive,
                                  ]}
                                >
                                  {done ? "✓" : i + 1}
                                </Text>
                              </View>
                              <Text
                                style={[
                                  styles.progressLabel,
                                  (done || active) && styles.progressLabelActive,
                                ]}
                              >
                                {label}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.cancelledContainer}>
                      <View style={styles.cancelledContent}>
                        <Text style={styles.cancelledText}>
                          ❌ Đơn hàng đã bị huỷ
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleReorder(detailOrder)}
                          disabled={loading}
                          style={[
                            styles.reorderButton,
                            loading && styles.disabledButton,
                          ]}
                        >
                          <Text style={styles.reorderButtonText}>
                            {loading ? "Đang xử lý..." : "🔄 Đặt lại"}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* Danh sách sản phẩm */}
                  <View style={styles.productsSection}>
                    <Text style={styles.sectionTitle}>
                      📦 Sản phẩm đã đặt ({detailOrder.items.length})
                    </Text>
                    {detailOrder.items.map((item, idx) => (
                      <ProductItem
                        key={item.product_id ?? idx}
                        item={item}
                        reviewInputs={reviewInputs}
                        setReviewInput={setReviewInput}
                        existingReview={productReviews[item.product_id]}
                        onAddReview={handleAddReview}
                        onDeleteReview={handleDeleteReview}
                        reviewLoading={reviewLoading}
                        orderStatus={detailOrder.status}
                      />
                    ))}
                  </View>

                  {/* Tóm tắt thanh toán */}
          <View style={styles.summarySection}>
  <Text style={styles.sectionTitle}>💳 Tóm tắt thanh toán</Text>

  {/* Giá ban đầu */}
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>Giá ban đầu:</Text>
    <Text style={styles.summaryValue}>
      {formatPrice(detailTotalPrice)}
    </Text>
  </View>

  {/* Giảm giá */}
  {detailDiscountAmount > 0 && (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>Giảm giá:</Text>
      <Text style={styles.summaryDiscount}>
        -{formatPrice(detailDiscountAmount)}
      </Text>
    </View>
  )}

  <View style={styles.summaryDivider} />

  {/* Giá cuối cùng */}
  <View style={[styles.summaryRow, styles.summaryTotal]}>
    <Text style={styles.summaryTotalLabel}>Thành tiền:</Text>
    <Text style={styles.summaryTotalValue}>
      {formatPrice(detailFinalPrice)}
    </Text>
  </View>
</View>




                  {/* Nút hành động */}
                  {String(detailOrder.status).toLowerCase() === "confirmed" && (
                    <TouchableOpacity
                      onPress={() => handleCancelOrder(detailOrder.order_id)}
                      style={styles.cancelOrderButton}
                    >
                      <Text style={styles.cancelOrderButtonText}>
                        ❌ Huỷ đơn hàng
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFF7ED" },
  header: { backgroundColor: "#fff", padding: 20, paddingTop: 50, borderBottomWidth: 2, borderBottomColor: "#FED7AA" },
  headerTitle: { fontSize: 28, fontWeight: "bold", color: "#f97316", marginBottom: 4 },
  headerSubtitle: { fontSize: 14, color: "#6b7280", marginBottom: 16 },
  tabContainer: { flexDirection: "row", backgroundColor: "#f9fafb", borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 8 },
  tabActive: { backgroundColor: "#f97316", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  tabTextActive: { color: "#fff" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  loadingContainer: { padding: 40, alignItems: "center" },
  loadingText: { marginTop: 12, color: "#6b7280" },
  errorContainer: { padding: 20, backgroundColor: "#FEE2E2", borderRadius: 12, borderWidth: 2, borderColor: "#FCA5A5" },
  errorText: { color: "#991B1B", textAlign: "center" },
  emptyContainer: { padding: 40, alignItems: "center", backgroundColor: "#fff", borderRadius: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  emptyText: { fontSize: 18, fontWeight: "600", color: "#374151", marginBottom: 16 },
  exploreButton: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#f97316", borderRadius: 12 },
  exploreButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  orderCard: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 2, borderColor: "#f3f4f6", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  orderContent: { flexDirection: "row", gap: 16 },
  orderImageContainer: { position: "relative" },
  orderImage: { width: 80, height: 80, borderRadius: 12, borderWidth: 2, borderColor: "#e5e7eb" },
  orderImagePlaceholder: { width: 80, height: 80, borderRadius: 12, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  orderImagePlaceholderText: { fontSize: 32 },
  remainingBadge: { position: "absolute", bottom: -8, right: -8, backgroundColor: "#f97316", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  remainingBadgeText: { color: "#fff", fontSize: 10, fontWeight: "bold" },
  orderDetails: { flex: 1 },
  orderHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8, gap: 8 },
  orderName: { flex: 1, fontSize: 16, fontWeight: "bold", color: "#111827" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: "600" },
  orderId: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  orderQuantity: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  orderDate: { fontSize: 13, color: "#6b7280", marginBottom: 12 },
  orderFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", borderTopWidth: 1, borderTopColor: "#f3f4f6", paddingTop: 12 },
  totalLabel: { fontSize: 12, color: "#6b7280", marginBottom: 4, fontWeight: "500" },
  totalPrice: { fontSize: 20, fontWeight: "bold", color: "#f97316" },
  discountContainer: { flexDirection: "row", alignItems: "center", marginTop: 4, gap: 8 },
  originalPrice: { fontSize: 13, color: "#9ca3af", textDecorationLine: "line-through" },
  discountAmount: { fontSize: 13, color: "#dc2626", fontWeight: "600" },
  orderActions: { flexDirection: "row", gap: 8 },
  cancelButton: { backgroundColor: "#dc2626", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  cancelButtonText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  
  // Modal styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "92%", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 20, paddingTop: 24, backgroundColor: "#f97316", borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  modalHeaderLeft: { flex: 1 },
  modalTitle: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 4 },
  modalSubtitle: { fontSize: 13, color: "rgba(255, 255, 255, 0.9)" },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255, 255, 255, 0.2)", justifyContent: "center", alignItems: "center" },
  closeButtonText: { fontSize: 22, color: "#fff", fontWeight: "bold" },
  modalBody: { padding: 20 },
  
  // Main info section
  mainInfoSection: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  infoRow: { flexDirection: "row", alignItems: "center" },
  infoIconContainer: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#FFF7ED", justifyContent: "center", alignItems: "center", marginRight: 16 },
  infoIcon: { fontSize: 24 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 13, color: "#6b7280", marginBottom: 4, fontWeight: "500" },
  infoValue: { fontSize: 15, color: "#111827", fontWeight: "600" },
  infoValueMoney: { fontSize: 22, color: "#f97316", fontWeight: "bold" },
  statusBadgeLarge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1.5, alignSelf: "flex-start", marginTop: 4 },
  statusTextLarge: { fontSize: 14, fontWeight: "700" },
  infoDivider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 16 },
  
  // Section styles
  sectionTitle: { fontSize: 18, fontWeight: "bold", color: "#111827", marginBottom: 16 },
  
  // Progress
  progressContainer: { backgroundColor: "#F0FDF4", padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: "#BBF7D0" },
  progressSteps: { flexDirection: "row", justifyContent: "space-between" },
  progressStep: { alignItems: "center", flex: 1 },
  progressCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#fff", borderWidth: 2, borderColor: "#d1d5db", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  progressCircleActive: { backgroundColor: "#10b981", borderColor: "#10b981" },
  progressCircleCurrent: { borderWidth: 4, borderColor: "#86efac" },
  progressNumber: { fontSize: 16, fontWeight: "bold", color: "#9ca3af" },
  progressNumberActive: { color: "#fff" },
  progressLabel: { fontSize: 11, textAlign: "center", color: "#9ca3af", fontWeight: "600" },
  progressLabelActive: { color: "#374151", fontWeight: "700" },
  
  // Cancelled
  cancelledContainer: { padding: 20, borderRadius: 16, borderWidth: 2, borderColor: "#FCA5A5", backgroundColor: "#FEE2E2", marginBottom: 16 },
  cancelledContent: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cancelledText: { fontSize: 16, fontWeight: "700", color: "#991B1B", flex: 1 },
  reorderButton: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "#f97316", borderRadius: 12 },
  reorderButtonText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  disabledButton: { opacity: 0.6 },
  
  // Products
  productsSection: { backgroundColor: "#f9fafb", padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  productItem: { backgroundColor: "#fff", borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  productRow: { flexDirection: "row", gap: 12 },
  productImageContainer: { width: 72, height: 72 },
  productImage: { width: 72, height: 72, borderRadius: 10 },
  productImagePlaceholder: { width: 72, height: 72, borderRadius: 10, backgroundColor: "#e5e7eb", justifyContent: "center", alignItems: "center" },
  productImagePlaceholderText: { fontSize: 32 },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: "700", marginBottom: 6, color: "#111827" },
  productQuantity: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  productPrice: { fontSize: 13, color: "#6b7280", marginBottom: 4 },
  productTotal: { fontSize: 14, color: "#374151", marginTop: 4, fontWeight: "600" },
  productTotalPrice: { fontWeight: "bold", color: "#f97316" },
  
  // Reviews
  reviewContainer: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, backgroundColor: "#fff" },
  existingReview: { gap: 8 },
  reviewHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  reviewTitle: { fontSize: 14, fontWeight: "600", color: "#111827" },
  reviewRating: { fontSize: 12, color: "#6b7280" },
  reviewDate: { fontSize: 11, color: "#9ca3af" },
  reviewComment: { fontSize: 13, color: "#374151", lineHeight: 18 },
  deleteReviewButton: { backgroundColor: "#dc2626", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, marginTop: 8, alignSelf: "flex-start" },
  deleteReviewText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  addReview: { gap: 12 },
  addReviewTitle: { fontSize: 14, fontWeight: "600", color: "#6b7280" },
  starContainer: { flexDirection: "row", alignItems: "center", gap: 4 },
  starButton: { padding: 4 },
  starFilled: { fontSize: 20, color: "#FBBF24" },
  starEmpty: { fontSize: 20, color: "#D1D5DB" },
  ratingText: { fontSize: 13, color: "#6b7280", marginLeft: 8 },
  reviewInput: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, padding: 12, fontSize: 14, textAlignVertical: "top", minHeight: 80 },
  submitReviewButton: { backgroundColor: "#f97316", paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: "center" },
  submitReviewText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  
  // Summary
  summarySection: { backgroundColor: "#fff", padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: "#e5e7eb" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  summaryLabel: { fontSize: 14, color: "#6b7280", fontWeight: "500" },
  summaryValue: { fontSize: 14, fontWeight: "600", color: "#111827" },
  summaryDiscount: { fontSize: 14, fontWeight: "600", color: "#dc2626" },
  summaryDivider: { height: 1, backgroundColor: "#e5e7eb", marginVertical: 12 },
  summaryTotal: { marginTop: 4 },
  summaryTotalLabel: { fontSize: 16, fontWeight: "700", color: "#374151" },
  summaryTotalValue: { fontSize: 20, fontWeight: "bold", color: "#f97316" },
  
  // Cancel button
  cancelOrderButton: { backgroundColor: "#dc2626", paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 8 },
  cancelOrderButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});