// src/screens/cart/CartScreen.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useOrder } from '../../providers/OrderProvider';
import { useCart } from '../../providers/CartProvider';

const COLORS = {
  primary: '#F97316',
  primaryHover: '#EA580C',
  primaryGradientStart: '#F97316',
  primaryGradientEnd: '#C2410C',
  secondary: '#FCD34D',
  secondaryHover: '#FBBF24',
  bgLight: '#FFFFFF',
  bgDark: '#1F2937',
  bgGrayLight: '#F3F4F6',
  bgGrayDark: '#374151',
  textLight: '#111827',
  textDark: '#F9FAFB',
  textGray: '#6B7280',
  borderLight: '#E5E7EB',
  borderDark: '#4B5563',
  error: '#F87171',
  white: '#FFFFFF',
  black: '#000000',
};

export default function CartScreen() {
  const [localItems, setLocalItems] = useState([]);
  const [loadingLocal, setLoadingLocal] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const [refreshing, setRefreshing] = useState(false);
  const [initError, setInitError] = useState(null);

  const navigation = useNavigation();

  // CRITICAL: Check if providers are available
  const cartContext = useCart();
  const orderContext = useOrder();

  // Handle missing providers
  if (!cartContext) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.errorScreenContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Lỗi khởi tạo</Text>
          <Text style={styles.errorText}>
            CartProvider chưa được cấu hình. Vui lòng kiểm tra App.js
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const {
    cart,
    loading,
    error,
    fetchCart,
    updateQty,
    removeItem,
    clearCart,
    getTotalPrice,
  } = cartContext;

  const { createOrder } = orderContext ?? {};

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
    else if (
      cartResponse.items &&
      Array.isArray(cartResponse.items) &&
      cartResponse.items.length > 0
    ) {
      items = cartResponse.items;
    }
    // Case 4: Object với numeric keys {0: {...}, 1: {...}, 2: {...}}
    else if (typeof cartResponse === 'object' && !Array.isArray(cartResponse)) {
      const numericKeys = Object.keys(cartResponse)
        .filter((key) => !isNaN(parseInt(key, 10)))
        .sort((a, b) => parseInt(a, 10) - parseInt(b, 10));

      if (numericKeys.length > 0) {
        items = numericKeys.map((key) => cartResponse[key]);
      }
    }

    // Map items theo format chuẩn
    return items.map((item) => ({
      id: item.id ?? item.cart_id ?? item.rowId ?? null,
      product_id: item.product_id ?? item.productId ?? item.id ?? null,
      name: item.product_name || item.name || '—',
      price: parseFloat(item.price ?? 0) || 0,
      quantity: parseInt(item.quantity ?? 0, 10) || 0,
      image: item.image_url || item.image || 'https://via.placeholder.com/150',
      stock: parseInt(item.stock ?? 0, 10) || 0,
      selected: item.selected !== undefined ? item.selected : true,
    }));
  };

  // Show toast message
  const showToast = (message, type = 'success') => {
    Alert.alert(
      type === 'error' ? 'Lỗi' : type === 'warning' ? 'Cảnh báo' : 'Thông báo',
      message
    );
  };

  // Fetch cart khi component mount
  useEffect(() => {
    let mounted = true;

    const loadCart = async () => {
      setLoadingLocal(true);
      setInitError(null);
      try {
        console.log('Fetching cart...');
        const response = await fetchCart();
        console.log('Cart response:', response);
        
        if (!mounted) return;

        const normalized = normalizeItemsFromCart(response);
        console.log('Normalized items:', normalized);
        setLocalItems(normalized);
      } catch (err) {
        console.error('Error loading cart:', err);
        if (mounted) {
          setLocalItems([]);
          setInitError(err?.message || 'Không thể tải giỏ hàng');
        }
      } finally {
        if (mounted) setLoadingLocal(false);
      }
    };

    loadCart();

    return () => {
      mounted = false;
    };
  }, [fetchCart]);

  // Sync khi cart từ provider thay đổi
  useEffect(() => {
    if (cart && updatingItems.size === 0) {
      const normalized = normalizeItemsFromCart(cart);
      setLocalItems(normalized);
    }
  }, [cart, updatingItems.size]);

  // Pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    try {
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
      showToast('Đồng bộ giỏ hàng thành công');
    } catch (err) {
      showToast('Không thể đồng bộ giỏ hàng', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // Format giá tiền
  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
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

  // Cập nhật số lượng bằng nút +/-
  const handleUpdateQuantity = async (item, delta) => {
    const newQty = Math.max(1, item.quantity + delta);
    if (newQty === item.quantity) return;

    if (item.stock && newQty > item.stock) {
      showToast(`Chỉ còn ${item.stock} sản phẩm trong kho`, 'warning');
      return;
    }

    setUpdatingItems((prev) => {
      const s = new Set(prev);
      s.add(item.id);
      return s;
    });

    const oldQty = item.quantity;
    setLocalItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, quantity: newQty } : it))
    );

    try {
      await updateQty({ product_id: item.product_id, quantity: newQty });
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

      showToast('Cập nhật số lượng thành công');
    } catch (err) {
      setLocalItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, quantity: oldQty } : it))
      );
      const msg =
        err?.response?.data?.message || err?.message || 'Cập nhật thất bại';
      showToast(msg, 'error');
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // Cập nhật số lượng từ input
  const handleSetQuantity = async (item, value) => {
    const parsed = parseInt(value, 10) || 1;
    const qty = Math.max(1, parsed);

    if (qty === item.quantity) return;

    if (item.stock && qty > item.stock) {
      showToast(`Chỉ còn ${item.stock} sản phẩm trong kho`, 'warning');
      return;
    }

    setUpdatingItems((prev) => {
      const s = new Set(prev);
      s.add(item.id);
      return s;
    });

    const oldQty = item.quantity;
    setLocalItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, quantity: qty } : it))
    );

    try {
      await updateQty({ product_id: item.product_id, quantity: qty });
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

      showToast('Cập nhật số lượng thành công');
    } catch (err) {
      setLocalItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, quantity: oldQty } : it))
      );
      const msg =
        err?.response?.data?.message || err?.message || 'Cập nhật thất bại';
      showToast(msg, 'error');
    } finally {
      setUpdatingItems((prev) => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // Xóa sản phẩm
  const handleRemoveItem = async (item) => {
    Alert.alert('Xác nhận xóa', `Xóa "${item.name}" khỏi giỏ hàng?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          const oldItems = [...localItems];
          setLocalItems((prev) => prev.filter((it) => it.id !== item.id));

          try {
            await removeItem(item.product_id);
            const response = await fetchCart();
            const normalized = normalizeItemsFromCart(response);
            setLocalItems(normalized);
            showToast('Đã xóa sản phẩm khỏi giỏ hàng');
          } catch (err) {
            setLocalItems(oldItems);
            const msg =
              err?.response?.data?.message || err?.message || 'Xóa thất bại';
            showToast(msg, 'error');
          }
        },
      },
    ]);
  };

  // Xóa toàn bộ giỏ hàng
  const handleClearCart = async () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc chắn muốn xóa toàn bộ giỏ hàng?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa tất cả',
          style: 'destructive',
          onPress: async () => {
            const oldItems = [...localItems];
            setLocalItems([]);

            try {
              await clearCart();
              showToast('Đã xóa toàn bộ giỏ hàng');
            } catch (err) {
              setLocalItems(oldItems);
              const msg =
                err?.response?.data?.message ||
                err?.message ||
                'Xóa giỏ hàng thất bại';
              showToast(msg, 'error');
            }
          },
        },
      ]
    );
  };

  // Tiếp tục thanh toán
  const handleProceedToCheckout = () => {
    if (selectedItems.length === 0) {
      showToast('Vui lòng chọn ít nhất 1 sản phẩm', 'warning');
      return;
    }

    navigation.navigate('CustomerInfo', { preselected: selectedItems });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>🛒 Giỏ Hàng</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Init Error */}
        {initError ? (
          <View style={styles.errorScreenContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Lỗi tải giỏ hàng</Text>
            <Text style={styles.errorText}>{initError}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setInitError(null);
                setLoadingLocal(true);
                fetchCart()
                  .then((response) => {
                    const normalized = normalizeItemsFromCart(response);
                    setLocalItems(normalized);
                  })
                  .catch((err) => {
                    setInitError(err?.message || 'Không thể tải giỏ hàng');
                  })
                  .finally(() => {
                    setLoadingLocal(false);
                  });
              }}
            >
              <Text style={styles.retryButtonText}>Thử lại</Text>
            </TouchableOpacity>
          </View>
        ) : loading || loadingLocal ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Đang tải giỏ hàng...</Text>
          </View>
        ) : localItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyTitle}>Giỏ hàng trống</Text>
            <Text style={styles.emptyText}>
              Hãy thêm sản phẩm vào giỏ hàng để tiếp tục mua sắm
            </Text>
            <TouchableOpacity
              style={styles.shopButton}
              onPress={() => navigation.navigate('UserHome')}
            >
              <Text style={styles.shopButtonText}>Tiếp tục mua sắm</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <ScrollView
              style={styles.scrollView}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={onRefresh}
                  colors={[COLORS.primary]}
                  tintColor={COLORS.primary}
                />
              }
            >
              <View style={styles.itemsContainer}>
                {localItems.map((item) => {
                  const isUpdating = updatingItems.has(item.id);

                  return (
                    <View
                      key={item.id}
                      style={[
                        styles.cartItem,
                        {
                          borderColor: item.selected
                            ? COLORS.primary
                            : COLORS.borderLight,
                          opacity: isUpdating ? 0.7 : 1,
                        },
                      ]}
                    >
                      {isUpdating && (
                        <View style={styles.loadingOverlay}>
                          <ActivityIndicator size="small" color={COLORS.primary} />
                        </View>
                      )}

                      <TouchableOpacity
                        onPress={() => toggleSelect(item.id)}
                        disabled={isUpdating}
                        style={styles.checkbox}
                      >
                        <View
                          style={[
                            styles.checkboxBox,
                            item.selected && styles.checkboxBoxChecked,
                          ]}
                        >
                          {item.selected && (
                            <Text style={styles.checkboxCheck}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>

                      <Image
                        source={{ uri: item.image }}
                        style={styles.itemImage}
                        resizeMode="contain"
                      />

                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={2}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemPrice}>
                          {formatPrice(item.price)}
                        </Text>
                        <Text style={styles.itemStock}>
                          Còn lại: {item.stock} sản phẩm
                        </Text>

                        <View style={styles.quantityContainer}>
                          <TouchableOpacity
                            onPress={() => handleUpdateQuantity(item, -1)}
                            disabled={item.quantity <= 1 || isUpdating}
                            style={[
                              styles.quantityButton,
                              (item.quantity <= 1 || isUpdating) &&
                                styles.quantityButtonDisabled,
                            ]}
                          >
                            <Text style={styles.quantityButtonText}>−</Text>
                          </TouchableOpacity>

                          <TextInput
                            value={String(item.quantity)}
                            onChangeText={(text) =>
                              handleSetQuantity(item, text)
                            }
                            keyboardType="numeric"
                            style={styles.quantityInput}
                            editable={!isUpdating}
                          />

                          <TouchableOpacity
                            onPress={() => handleUpdateQuantity(item, 1)}
                            disabled={item.quantity >= item.stock || isUpdating}
                            style={[
                              styles.quantityButtonAdd,
                              (item.quantity >= item.stock || isUpdating) &&
                                styles.quantityButtonDisabled,
                            ]}
                          >
                            <Text style={styles.quantityButtonTextWhite}>+</Text>
                          </TouchableOpacity>
                        </View>

                        <Text style={styles.itemSubtotal}>
                          Thành tiền:{' '}
                          <Text style={styles.itemSubtotalPrice}>
                            {formatPrice(item.price * item.quantity)}
                          </Text>
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleRemoveItem(item)}
                        disabled={isUpdating}
                        style={styles.deleteButton}
                      >
                        <Text style={styles.deleteIcon}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearCart}
              >
                <Text style={styles.clearButtonText}>
                  Xóa toàn bộ giỏ hàng
                </Text>
              </TouchableOpacity>

              <View style={{ height: 200 }} />
            </ScrollView>

            <View style={styles.summaryContainer}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Đã chọn:</Text>
                <Text style={styles.summaryValue}>{selectedItems.length}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Số lượng:</Text>
                <Text style={styles.summaryValue}>
                  {selectedItems.reduce((sum, it) => sum + it.quantity, 0)}
                </Text>
              </View>
              <View style={styles.summaryTotal}>
                <Text style={styles.summaryTotalLabel}>Tổng cộng:</Text>
                <Text style={styles.summaryTotalPrice}>
                  {formatPrice(totalAmount)}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.checkoutButton,
                  selectedItems.length === 0 && styles.checkoutButtonDisabled,
                ]}
                onPress={handleProceedToCheckout}
                disabled={selectedItems.length === 0}
              >
                <Text style={styles.checkoutButtonText}>
                  Tiếp Tục Thanh Toán
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bgLight,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.bgGrayLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.bgLight,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: COLORS.textLight,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  errorScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: COLORS.bgLight,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.error,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    margin: 16,
    borderRadius: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: COLORS.textGray,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.bgLight,
    margin: 16,
    borderRadius: 16,
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textLight,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  shopButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  itemsContainer: {
    padding: 16,
  },
  cartItem: {
    backgroundColor: COLORS.bgLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 10,
  },
  checkbox: {
    marginRight: 8,
    paddingTop: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxBoxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkboxCheck: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  itemStock: {
    fontSize: 12,
    color: COLORS.textGray,
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.bgGrayLight,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonAdd: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    opacity: 0.5,
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  quantityButtonTextWhite: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  quantityInput: {
    width: 50,
    height: 32,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 6,
    textAlign: 'center',
    marginHorizontal: 8,
    fontSize: 14,
    fontWeight: '600',
  },
  itemSubtotal: {
    fontSize: 12,
    color: COLORS.textGray,
  },
  itemSubtotalPrice: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  deleteButton: {
    padding: 8,
  },
  deleteIcon: {
    fontSize: 20,
  },
  clearButton: {
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.bgLight,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  summaryContainer: {
    backgroundColor: COLORS.bgLight,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: COLORS.textGray,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  summaryTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    marginBottom: 16,
  },
  summaryTotalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textLight,
  },
  summaryTotalPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  checkoutButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  checkoutButtonDisabled: {
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});