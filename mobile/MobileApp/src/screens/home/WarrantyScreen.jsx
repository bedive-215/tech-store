import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { useAuth } from "../../providers/AuthProvider";
import { useWarranty } from "../../providers/WarrantyProvider";
import { useOrder } from "../../providers/OrderProvider";
import { launchImageLibrary } from 'react-native-image-picker';
import Toast from "react-native-toast-message";
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  primary: "#F97316",
  primaryHover: "#EA580C",
  bgGrayLight: "#F3F4F6",
  textGray: "#6B7280",
  borderLight: "#E5E7EB",
  error: "#F87171",
  white: "#FFFFFF",
  black: "#000000",
};

export default function WarrantyPage() {
  const { accessToken } = useAuth();
  const {
    warranties,
    loading: warrantyLoading,
    createWarranty,
    fetchMyWarranties,
  } = useWarranty();
  const { fetchOrders } = useOrder();

  const [form, setForm] = useState({
    order_id: "",
    product_id: "",
    serial: "",
    issue_description: "",
  });

  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderInfo, setSelectedOrderInfo] = useState(null);
  const [selectedProductInfo, setSelectedProductInfo] = useState(null);

  // Load danh sách đơn hàng hoàn thành
useEffect(() => {
  // Chỉ chạy khi đã có accessToken
  if (!accessToken) return;

  const loadInitialData = async () => {
    setLoadingOrders(true);
    try {
      // Gọi cả 2 API cùng lúc
      const [orderRes] = await Promise.all([
        fetchOrders({}, accessToken),
        fetchMyWarranties(accessToken)
      ]);

      // Xử lý dữ liệu đơn hàng
      const orderData = orderRes?.data || orderRes || [];
      const completed = orderData.filter(
        (order) => order.status?.toLowerCase() === "completed"
      );
      setCompletedOrders(completed);
    } catch (err) {
      console.error("Lỗi khởi tạo dữ liệu:", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  loadInitialData();
}, [accessToken]); // Bỏ các hàm khác ra khỏi dependency để tránh loop

  const handleSelectProduct = (order, product) => {
    setForm({
      ...form,
      order_id: order.order_id,
      product_id: product.product_id,
    });
    setSelectedOrderInfo(order);
    setSelectedProductInfo(product);
    setShowOrderModal(false);
  };

  const handleRemoveSelection = () => {
    setForm({
      ...form,
      order_id: "",
      product_id: "",
    });
    setSelectedOrderInfo(null);
    setSelectedProductInfo(null);
  };

  const handleChange = (name, value) => {
    setForm({ ...form, [name]: value });
  };

 const pickImage = () => {
  const options = {
    mediaType: 'photo',
    quality: 0.8,
    includeBase64: false,
  };

  // Thư viện này dùng callback, không dùng async/await như Expo
  launchImageLibrary(options, (response) => {
    if (response.didCancel) {
      console.log('Người dùng hủy chọn ảnh');
    } else if (response.errorCode) {
      Alert.alert('Lỗi Picker', response.errorMessage);
    } else if (response.assets && response.assets.length > 0) {
      const asset = response.assets[0];
      
      setFile({
        // Quan trọng: Android cần prefix 'file://' hoặc xử lý đường dẫn chuẩn
        uri: Platform.OS === 'android' ? asset.uri : asset.uri.replace('file://', ''),
        name: asset.fileName || `image_${Date.now()}.jpg`,
        type: asset.type || 'image/jpeg',
      });
    }
  });
};

const handleSubmit = async () => {
  if (!form.order_id || !form.product_id || !form.issue_description) {
    Toast.show({ type: "error", text1: "Vui lòng nhập đầy đủ thông tin" });
    return;
  }

  setSubmitting(true);
  try {
    const payload = {
      order_id: form.order_id,
      product_id: form.product_id,
      serial: form.serial || "",
      issue_description: form.issue_description,
      file: file || null, // 👈 QUAN TRỌNG
    };

    await createWarranty(payload, accessToken);

    Toast.show({ type: "success", text1: "Gửi yêu cầu thành công" });
  } catch (err) {
  console.log("❌ ERROR FULL:", err);
  console.log("❌ ERROR MESSAGE:", err.message);
  console.log("❌ ERROR RESPONSE:", err.response);
  console.log("❌ ERROR DATA:", err.response?.data);

    Toast.show({
      type: "error",
      text1: err?.response?.data?.reason || "Gửi yêu cầu thất bại",
    });
  } finally {
    setSubmitting(false);
  }
};


  const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "APPROVED":
        return { bg: "#D1FAE5", text: "#065F46" };
      case "REJECTED":
        return { bg: "#FEE2E2", text: "#991B1B" };
      case "COMPLETED":
        return { bg: "#DBEAFE", text: "#1E40AF" };
      default:
        return { bg: COLORS.bgGrayLight, text: COLORS.textGray };
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: "Chờ xử lý",
      APPROVED: "Đã duyệt",
      REJECTED: "Từ chối",
      COMPLETED: "Hoàn thành",
    };
    return statusMap[status?.toUpperCase()] || status || "Chờ xử lý";
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          {/* FORM TẠO BẢO HÀNH */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Tạo yêu cầu bảo hành</Text>

            {loadingOrders ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải đơn hàng...</Text>
              </View>
            ) : completedOrders.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  Bạn chưa có đơn hàng nào đã hoàn thành.
                </Text>
                <Text style={styles.emptySubText}>
                  Chỉ có thể tạo bảo hành cho đơn hàng đã hoàn thành.
                </Text>
              </View>
            ) : (
              <View style={styles.formContent}>
                {/* Chọn đơn hàng và sản phẩm */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Chọn đơn hàng và sản phẩm *</Text>

                  {selectedOrderInfo && selectedProductInfo ? (
                    <View style={styles.selectedCard}>
                      <View style={styles.selectedHeader}>
                        <View style={styles.selectedInfo}>
                          <Text style={styles.selectedLabel}>Đơn hàng</Text>
                          <Text style={styles.selectedOrderId}>
                            #{selectedOrderInfo.order_id.slice(0, 8)}...
                          </Text>
                          <Text style={styles.selectedDate}>
                            {new Date(
                              selectedOrderInfo.created_at
                            ).toLocaleDateString("vi-VN")}
                          </Text>
                        </View>
                        <TouchableOpacity onPress={handleRemoveSelection}>
                          <Text style={styles.removeButton}>✕</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.selectedDivider} />
                      <View style={styles.selectedProduct}>
                        <Text style={styles.selectedLabel}>Sản phẩm</Text>
                        <Text style={styles.selectedProductName}>
                          {selectedProductInfo.product_name}
                        </Text>
                        <View style={styles.selectedProductDetails}>
                          <Text style={styles.selectedQuantity}>
                            Số lượng: {selectedProductInfo.quantity}
                          </Text>
                          <Text style={styles.selectedPrice}>
                            {formatCurrency(selectedProductInfo.price)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.selectButton}
                      onPress={() => setShowOrderModal(true)}
                    >
                      <Text style={styles.selectButtonText}>
                        📦 Chọn đơn hàng...
                      </Text>
                      <Text style={styles.selectButtonIcon}>▼</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Serial */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Serial (tùy chọn)</Text>
                  <TextInput
                    style={styles.input}
                    value={form.serial}
                    onChangeText={(value) => handleChange("serial", value)}
                    placeholder="Nhập serial sản phẩm"
                    placeholderTextColor={COLORS.textGray}
                  />
                </View>

                {/* Mô tả lỗi */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Mô tả lỗi *</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={form.issue_description}
                    onChangeText={(value) =>
                      handleChange("issue_description", value)
                    }
                    placeholder="Mô tả chi tiết vấn đề của sản phẩm..."
                    placeholderTextColor={COLORS.textGray}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                  />
                </View>

                {/* Hình ảnh */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Hình ảnh đính kèm (tùy chọn)</Text>
                  <TouchableOpacity
                    style={styles.imageButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.imageButtonText}>
                      {file ? `✓ ${file.name}` : "📷 Chọn ảnh"}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
  style={[
    styles.submitButton,
    submitting && styles.submitButtonDisabled,
  ]}
  onPress={handleSubmit}
  disabled={submitting}
  
>

                  <Text style={styles.submitButtonText}>
                    {submitting ? "Đang gửi..." : "Gửi yêu cầu bảo hành"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* DANH SÁCH BẢO HÀNH */}
          <View style={styles.listCard}>
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Yêu cầu bảo hành của tôi</Text>
              <TouchableOpacity
                onPress={() => accessToken && fetchMyWarranties(accessToken)}
                disabled={warrantyLoading}
              >
                <Text
                  style={[
                    styles.refreshButton,
                    warrantyLoading && styles.refreshButtonDisabled,
                  ]}
                >
                  {warrantyLoading ? "Đang tải..." : "🔄 Làm mới"}
                </Text>
              </TouchableOpacity>
            </View>

            {warrantyLoading && !warranties?.length ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
              </View>
            ) : !warranties?.length ? (
              <View style={styles.emptyListContainer}>
                <Text style={styles.emptyText}>
                  Bạn chưa có yêu cầu bảo hành nào.
                </Text>
                <Text style={styles.emptySubText}>
                  Hãy tạo yêu cầu bảo hành đầu tiên của bạn!
                </Text>
              </View>
            ) : (
              <View style={styles.warrantyList}>
                {warranties.map((w) => {
                  const statusColors = getStatusColor(w.status);
                  return (
                    <View key={w.id || w._id} style={styles.warrantyItem}>
                      <View style={styles.warrantyHeader}>
                        <View>
                          <Text style={styles.warrantyOrderText}>
                            Đơn hàng:{" "}
                            <Text style={styles.warrantyOrderId}>
                              {w.order_id}
                            </Text>
                          </Text>
                          <Text style={styles.warrantyId}>
                            ID: {w.id || w._id}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: statusColors.bg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { color: statusColors.text },
                            ]}
                          >
                            {getStatusLabel(w.status)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.warrantyDetails}>
                        <Text style={styles.warrantyDetailText}>
                          <Text style={styles.warrantyDetailLabel}>
                            Sản phẩm:{" "}
                          </Text>
                          {w.product_id}
                        </Text>

                        {w.serial && (
                          <Text style={styles.warrantyDetailText}>
                            <Text style={styles.warrantyDetailLabel}>
                              Serial:{" "}
                            </Text>
                            {w.serial}
                          </Text>
                        )}

                        <View style={styles.warrantyDivider} />
                        <Text style={styles.warrantyDetailLabel}>Mô tả lỗi:</Text>
                        <Text style={styles.warrantyDescription}>
                          {w.issue_description}
                        </Text>
                      </View>

                      <View style={styles.warrantyFooter}>
                        <Text style={styles.warrantyDate}>
                          Ngày tạo:{" "}
                          {new Date(
                            w.created_at || w.createdAt
                          ).toLocaleString("vi-VN")}
                        </Text>
                        {w.updated_at && w.updated_at !== w.created_at && (
                          <Text style={styles.warrantyDate}>
                            Cập nhật:{" "}
                            {new Date(w.updated_at).toLocaleString("vi-VN")}
                          </Text>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* MODAL CHỌN ĐƠN HÀNG */}
      <Modal
        visible={showOrderModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowOrderModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chọn đơn hàng và sản phẩm</Text>
              <TouchableOpacity onPress={() => setShowOrderModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {completedOrders.map((order) => (
                <View key={order.order_id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderTitle}>
                        📦 Đơn hàng #{order.order_id.slice(0, 12)}...
                      </Text>
                      <View style={styles.orderMeta}>
                        <Text style={styles.orderMetaText}>
                          📅{" "}
                          {new Date(order.created_at).toLocaleDateString(
                            "vi-VN"
                          )}
                        </Text>
                        <Text style={styles.orderPrice}>
                          💰 {formatCurrency(order.final_price)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.orderStatusBadge}>
                      <Text style={styles.orderStatusText}>Hoàn thành</Text>
                    </View>
                  </View>

                  {order.shipping_address && (
                    <Text style={styles.orderAddress}>
                      📍 {order.shipping_address}
                    </Text>
                  )}

                  <View style={styles.productList}>
                    {order.items && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <TouchableOpacity
                          key={idx}
                          style={styles.productItem}
                          onPress={() => handleSelectProduct(order, item)}
                        >
                          <View style={styles.productInfo}>
                            <Text style={styles.productName}>
                              {item.product_name}
                            </Text>
                            <View style={styles.productMeta}>
                              <Text style={styles.productQuantity}>
                                SL: {item.quantity}
                              </Text>
                              <Text style={styles.productPrice}>
                                {formatCurrency(item.price)}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.selectProductButton}>
                            <Text style={styles.selectProductButtonText}>
                              Chọn
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text style={styles.noProductText}>
                        Không có sản phẩm
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setShowOrderModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Toast />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgGrayLight,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  formTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
    marginBottom: 16,
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.textGray,
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
  },
  emptySubText: {
    fontSize: 12,
    color: COLORS.textGray,
    textAlign: "center",
    marginTop: 8,
  },
  formContent: {
    gap: 16,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: "#FED7AA",
    borderRadius: 8,
    padding: 16,
    backgroundColor: "#FFF7ED",
  },
  selectedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  selectedInfo: {
    flex: 1,
  },
  selectedLabel: {
    fontSize: 11,
    color: COLORS.textGray,
    marginBottom: 4,
  },
  selectedOrderId: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
  },
  selectedDate: {
    fontSize: 11,
    color: COLORS.textGray,
    marginTop: 4,
  },
  removeButton: {
    fontSize: 20,
    color: COLORS.textGray,
  },
  selectedDivider: {
    height: 1,
    backgroundColor: "#FED7AA",
    marginVertical: 12,
  },
  selectedProduct: {
    marginTop: 4,
  },
  selectedProductName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    marginTop: 4,
  },
  selectedProductDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  selectedQuantity: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  selectedPrice: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  selectButton: {
    borderWidth: 2,
    borderColor: "#D1D5DB",
    borderStyle: "dashed",
    borderRadius: 8,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  selectButtonText: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  selectButtonIcon: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1F2937",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  imageButton: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#FFF7ED",
  },
  imageButtonText: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
  listCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  listTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.primary,
  },
  refreshButton: {
    fontSize: 14,
    color: COLORS.primary,
  },
  refreshButtonDisabled: {
    opacity: 0.5,
  },
  emptyListContainer: {
    paddingVertical: 48,
    alignItems: "center",
  },
  warrantyList: {
    gap: 16,
  },
  warrantyItem: {
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  warrantyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  warrantyOrderText: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  warrantyOrderId: {
    fontWeight: "500",
  },
  warrantyId: {
    fontSize: 11,
    color: COLORS.textGray,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "500",
  },
  warrantyDetails: {
    gap: 8,
  },
  warrantyDetailText: {
    fontSize: 14,
    color: "#4B5563",
  },
  warrantyDetailLabel: {
    fontWeight: "600",
    color: "#374151",
  },
  warrantyDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
    marginVertical: 8,
  },
  warrantyDescription: {
    fontSize: 14,
    color: "#4B5563",
    marginTop: 4,
  },
  warrantyFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  warrantyDate: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  modalClose: {
    fontSize: 24,
    color: COLORS.textGray,
  },
  modalScroll: {
    padding: 16,
  },
  orderCard: {
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
  },
  orderHeader: {
    backgroundColor: "#FFF7ED",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  orderMeta: {
    flexDirection: "row",
    gap: 16,
  },
  orderMetaText: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  orderPrice: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
  orderStatusBadge: {
    backgroundColor: "#D1FAE5",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  orderStatusText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#065F46",
  },
  orderAddress: {
    fontSize: 11,
    color: COLORS.textGray,
    padding: 16,
    paddingTop: 0,
  },
  productList: {
    padding: 16,
    gap: 12,
  },
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: COLORS.bgGrayLight,
    padding: 12,
    borderRadius: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 8,
  },
  productMeta: {
    flexDirection: "row",
    gap: 16,
  },
  productQuantity: {
    fontSize: 11,
    color: COLORS.textGray,
  },
  productPrice: {
    fontSize: 11,
    fontWeight: "600",
    color: COLORS.primary,
  },
  selectProductButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 12,
  },
  selectProductButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "500",
  },
  noProductText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: "center",
    paddingVertical: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    backgroundColor: COLORS.bgGrayLight,
  },
  modalCloseButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 12,
    alignItems: "center",
  },
  modalCloseButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
});