// File: src/screens/CustomerInfo.jsx - EXTREME DEBUG VERSION
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Modal,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

// Import contexts
import { Linking } from 'react-native';
import paymentService from '../../services/paymentService';

import { useOrder } from '../../providers/OrderProvider';
import { useAuth } from '../../providers/AuthProvider';

const CustomerInfo = () => {
  const navigation = useNavigation();
  const route = useRoute();
  
  const orderContext = useOrder();
  const authContext = useAuth();
  
  const { 
    createOrder, 
    validateCoupon, 
    loading: orderLoading 
  } = orderContext || {};
  
  const { 
    accessToken, 
    user,
    loading: authLoading
  } = authContext || {};

  const preselected = route.params?.preselected || [];
  const fromBuyNow = route.params?.fromBuyNow || false;
  const buyNowProduct = route.params?.product || null;

  const initialCart = fromBuyNow && buyNowProduct
    ? [{
        id: buyNowProduct.id || buyNowProduct.product_id,
        product_id: buyNowProduct.id || buyNowProduct.product_id,
        name: buyNowProduct.name,
        price: Number(buyNowProduct.price),
        quantity: buyNowProduct.quantity || 1,
        image: buyNowProduct.image,
        selected: true,
      }]
    : preselected.map(item => ({
        id: item.id || item.product_id,
        product_id: item.product_id || item.id,
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity),
        image: item.image,
        selected: true,
      }));

  const [localCartItems, setLocalCartItems] = useState(initialCart);
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [couponData, setCouponData] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    deliveryMethod: 'store',
    province: '',
    district: '',
    store: '',
    shippingAddress: '',
    note: '',
    couponCode: '',
    needInvoice: 'no',
    companyName: '',
    companyTax: '',
    companyAddress: '',
    paymentMethod: 'cod',
  });

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: prev.name || user?.name || user?.full_name || '',
        phone: prev.phone || user?.phone || '',
        email: prev.email || user?.email || '',
      }));
    }
  }, [user]);

  const paymentOptions = [
    { key: 'cod', label: 'Thanh toán khi nhận hàng', icon: '💳' },
    { key: 'bank', label: 'Chuyển khoản ngân hàng', icon: '🏦' },
    { key: 'momo', label: 'Ví MoMo', icon: '📱' },
    { key: 'vnpay', label: 'VNPay', icon: '💰' },
  ];

  const updateForm = (patch) => setForm(prev => ({ ...prev, ...patch }));

  const formatPrice = (price) => {
    const n = Number(price);
    const safe = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(safe);
  };

  const updateQuantity = (id, delta) => {
    setLocalCartItems(prev => prev.map(item => 
      item.id === id 
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    ));
  };

  const toggleSelect = (id) => {
    setLocalCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  };

  const computedSelected = localCartItems.filter(i => i.selected);
  const subtotal = computedSelected.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = couponData?.discount_value || 0;
  const total = Math.max(0, subtotal - discount);

  const validate = () => {
    if (!form.name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ và tên');
      return false;
    }
    if (!form.phone.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại');
      return false;
    }
    if (!form.email.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ');
      return false;
    }
    if (!/^[0-9]{10,11}$/.test(form.phone.replace(/\s/g, ''))) {
      Alert.alert('Lỗi', 'Số điện thoại không hợp lệ');
      return false;
    }
    if (computedSelected.length === 0) {
      Alert.alert('Lỗi', 'Bạn chưa chọn sản phẩm nào');
      return false;
    }
    if (form.deliveryMethod === 'home' && !form.shippingAddress.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập địa chỉ giao hàng');
      return false;
    }
    if (form.needInvoice === 'yes') {
      if (!form.companyName.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập tên công ty');
        return false;
      }
      if (!form.companyTax.trim()) {
        Alert.alert('Lỗi', 'Vui lòng nhập mã số thuế');
        return false;
      }
    }
    return true;
  };

  const toNumberOrNull = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const normalizeOrder = (serverOrder) => {
    if (!serverOrder || typeof serverOrder !== "object") return null;

    const sources = [
      serverOrder,
      serverOrder.raw,
      serverOrder.data,
      serverOrder.order,
      serverOrder.result,
    ].filter(Boolean);

    const priceKeys = [
      "final_price", "finalPrice", "finalprice",
      "total_amount", "totalAmount", "totalamount",
      "total_price", "totalPrice", "totalprice",
    ];

    let final_price = null;
    let candidates = [];

    sources.forEach(src => {
      priceKeys.forEach(k => {
        if (src[k] !== undefined) {
          const n = toNumberOrNull(src[k]);
          if (n !== null) candidates.push(n);
        }
      });
    });

    final_price = candidates.find(n => n > 0) ?? candidates[0] ?? 0;

    let total_price =
      toNumberOrNull(serverOrder.total_price) ??
      toNumberOrNull(serverOrder.raw?.total_price) ??
      toNumberOrNull(serverOrder.data?.total_price) ??
      toNumberOrNull(serverOrder.order?.total_price) ??
      final_price;

    let discount =
      toNumberOrNull(serverOrder.discount) ??
      toNumberOrNull(serverOrder.raw?.discount) ??
      toNumberOrNull(serverOrder.data?.discount) ??
      toNumberOrNull(serverOrder.order?.discount) ??
      0;

    return {
      order_id: serverOrder.order_id ?? serverOrder.id ?? serverOrder._id ?? null,
      status: serverOrder.status ?? serverOrder.raw?.status ?? "pending",
      total_price,
      discount,
      final_price,
      raw: serverOrder,
    };
  };

  const buildShippingAddress = () => {
    if (form.shippingAddress && form.shippingAddress.trim()) {
      return form.shippingAddress.trim();
    }
    if (form.deliveryMethod === 'home') {
      const parts = [];
      if (form.province) parts.push(form.province);
      if (form.district) parts.push(form.district);
      return parts.join(', ') || 'Giao hàng tận nơi';
    }
    return form.store || 'Nhận tại cửa hàng';
  };

  const handleApplyCoupon = async () => {
    console.log('\n\n🟢🟢🟢 ===== APPLY COUPON START ===== 🟢🟢🟢');
    console.log('📝 Coupon code input:', form.couponCode);
    console.log('📝 Coupon code trimmed:', form.couponCode.trim());
    console.log('📝 Coupon code uppercase:', form.couponCode.toUpperCase());
    console.log('💰 Subtotal:', subtotal);
    
    if (!form.couponCode.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã giảm giá');
      return;
    }

    if (!validateCoupon) {
      Alert.alert('Lỗi', 'Chức năng coupon chưa sẵn sàng');
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Calling validateCoupon API...');
      const result = await validateCoupon({
        code: form.couponCode.toUpperCase(),
        total_amount: subtotal,
      });

      console.log('✅ validateCoupon response:', result);
      console.log('✅ result.data:', result?.data);

      if (result?.data) {
        console.log('💾 Setting couponData:', result.data);
        setCouponData(result.data);
        
        console.log('🎯 Setting appliedCoupon = TRUE');
        setAppliedCoupon(true);
        
        console.log('📊 Coupon discount value:', result.data.discount_value);
        Alert.alert('Thành công', `Đã áp dụng mã giảm giá: ${formatPrice(result.data.discount_value || 0)}`);
      } else {
        console.log('❌ No data in result');
      }
    } catch (error) {
      setCouponData(null);
      setAppliedCoupon(false);
      Alert.alert('Lỗi', 'Mã giảm giá không hợp lệ hoặc đã hết hạn');
    } finally {
      setLoading(false);
    }
    
    console.log('🟢🟢🟢 ===== APPLY COUPON END ===== 🟢🟢🟢\n\n');
  };

  const handleRemoveCoupon = () => {
    console.log('\n🔴 REMOVING COUPON');
    setCouponData(null);
    setAppliedCoupon(false);
    updateForm({ couponCode: '' });
    Alert.alert('Thông báo', 'Đã xóa mã giảm giá');
    console.log('🔴 COUPON REMOVED\n');
  };

 const handleSubmit = async () => {
  console.log('\n🔥 ===== SUBMIT ORDER =====');

  if (!createOrder) {
    Alert.alert('Lỗi', 'Chức năng đặt hàng chưa sẵn sàng');
    return;
  }

  if (!accessToken) {
    Alert.alert('Lỗi', 'Bạn chưa đăng nhập');
    return;
  }

  if (!validate()) return;

  const items = computedSelected.map(item => ({
    product_id: String(item.product_id),
    quantity: Number(item.quantity),
    price: Number(item.price),
  }));

  // ✅ BUILD ORDER PAYLOAD
  const payload = {
    items,
    shipping_address: buildShippingAddress(),
    payment_method: form.paymentMethod,
    note: form.note || undefined,
  };

  // coupon
  if (form.couponCode?.trim()) {
    payload.coupon_code = form.couponCode.trim().toUpperCase();
  }

  // invoice
  if (form.needInvoice === 'yes') {
    payload.invoice = {
      need: 'yes',
      company_name: form.companyName,
      company_tax: form.companyTax,
      company_address: form.companyAddress,
    };
  } else {
    payload.invoice = { need: 'no' };
  }

  setLoading(true);

  try {
    console.log('📦 Creating order...', payload);

    // 1️⃣ CREATE ORDER
    const orderRes = await createOrder(payload);
    const order = normalizeOrder(orderRes);

    if (!order?.order_id) {
      throw new Error('Không lấy được order_id');
    }

    console.log('✅ Order created:', order);

    // 2️⃣ COD → DONE
    if (form.paymentMethod === 'cod') {
      setCreatedOrder(order);
      setShowSuccessModal(true);
      return;
    }

    // 3️⃣ ONLINE PAYMENT
    console.log('💳 Creating payment...');

    const payRes = await paymentService.createPayment(
      {
        order_id: String(order.order_id),
        amount: Number(order.final_price),
        payment_method: form.paymentMethod,
        platform: 'app',
      },
      accessToken
    );

    console.log('💰 Payment response:', payRes);

const payUrl =
  payRes?.data?.vnpayUrl ||  // dùng data.vnpayUrl
  payRes?.data?.pay_url ||
  payRes?.data?.url;

if (!payUrl) {
  throw new Error('Không nhận được link thanh toán');
}

console.log('💳 Opening payment URL:', payUrl);
await Linking.openURL(payUrl);



    // 4️⃣ OPEN PAYMENT URL
    await Linking.openURL(payUrl);

    // optional: vẫn lưu order để hiển thị
    setCreatedOrder(order);

  } catch (err) {
    console.error('❌ Submit error:', err);
    Alert.alert(
      'Lỗi',
      err?.response?.data?.message || err.message || 'Đặt hàng thất bại'
    );
  } finally {
    setLoading(false);
  }
};


  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('UserHome');
              }
            }}
            style={styles.backButton}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thông Tin Đặt Hàng</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Created Order Info */}
        {createdOrder && (
          <View style={styles.orderSuccessBox}>
            <View style={styles.orderSuccessHeader}>
              <Text style={styles.checkIcon}>✓</Text>
              <Text style={styles.orderSuccessTitle}>Đặt hàng thành công</Text>
            </View>
            <View style={styles.orderSuccessContent}>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Mã đơn:</Text>
                <Text style={styles.orderInfoValue}>{createdOrder.order_id}</Text>
              </View>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Trạng thái:</Text>
                <Text style={styles.orderInfoValue}>{createdOrder.status}</Text>
              </View>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Tổng tiền:</Text>
                <Text style={styles.orderInfoValue}>{formatPrice(createdOrder.final_price)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Products */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sản phẩm</Text>
          {localCartItems.map(item => (
            <View key={item.id} style={styles.productCard}>
              <TouchableOpacity 
                onPress={() => toggleSelect(item.id)}
                style={styles.checkbox}
              >
                <Text style={styles.checkboxIcon}>
                  {item.selected ? '☑' : '☐'}
                </Text>
              </TouchableOpacity>
              
              <Image source={{ uri: item.image }} style={styles.productImage} />
              
              <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.productPrice}>{formatPrice(item.price)}</Text>
                
                <View style={styles.quantityControl}>
                  <TouchableOpacity 
                    onPress={() => updateQuantity(item.id, -1)}
                    style={[styles.quantityButton, item.quantity <= 1 && styles.quantityButtonDisabled]}
                    disabled={item.quantity <= 1}
                  >
                    <Text style={[styles.quantityButtonText, item.quantity <= 1 && styles.quantityButtonTextDisabled]}>−</Text>
                  </TouchableOpacity>
                  
                  <Text style={styles.quantityText}>{item.quantity}</Text>
                  
                  <TouchableOpacity 
                    onPress={() => updateQuantity(item.id, 1)}
                    style={styles.quantityButton}
                  >
                    <Text style={styles.quantityButtonText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
          <TextInput
            style={styles.input}
            placeholder="Họ và tên *"
            value={form.name}
            onChangeText={(text) => updateForm({ name: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Số điện thoại *"
            value={form.phone}
            onChangeText={(text) => updateForm({ phone: text })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="Email *"
            value={form.email}
            onChangeText={(text) => updateForm({ email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {/* Delivery Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức nhận hàng</Text>
          <View style={styles.deliveryButtons}>
            <TouchableOpacity
              style={[
                styles.deliveryButton,
                form.deliveryMethod === 'store' && styles.deliveryButtonActive
              ]}
              onPress={() => updateForm({ deliveryMethod: 'store' })}
            >
              <Text style={styles.deliveryIcon}>🏪</Text>
              <Text style={[
                styles.deliveryButtonText,
                form.deliveryMethod === 'store' && styles.deliveryButtonTextActive
              ]}>
                Nhận tại cửa hàng
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.deliveryButton,
                form.deliveryMethod === 'home' && styles.deliveryButtonActive
              ]}
              onPress={() => updateForm({ deliveryMethod: 'home' })}
            >
              <Text style={styles.deliveryIcon}>🚚</Text>
              <Text style={[
                styles.deliveryButtonText,
                form.deliveryMethod === 'home' && styles.deliveryButtonTextActive
              ]}>
                Giao tận nơi
              </Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={`Địa chỉ giao hàng ${form.deliveryMethod === 'home' ? '*' : ''}`}
            value={form.shippingAddress}
            onChangeText={(text) => updateForm({ shippingAddress: text })}
            multiline
            numberOfLines={2}
          />

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ghi chú đơn hàng"
            value={form.note}
            onChangeText={(text) => updateForm({ note: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
          {paymentOptions.map(option => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.paymentOption,
                form.paymentMethod === option.key && styles.paymentOptionActive
              ]}
              onPress={() => updateForm({ paymentMethod: option.key })}
            >
              <View style={styles.paymentOptionContent}>
                <Text style={styles.paymentIcon}>{option.icon}</Text>
                <Text style={[
                  styles.paymentOptionText,
                  form.paymentMethod === option.key && styles.paymentOptionTextActive
                ]}>
                  {option.label}
                </Text>
              </View>
              <View style={[
                styles.radioOuter,
                form.paymentMethod === option.key && styles.radioOuterActive
              ]}>
                {form.paymentMethod === option.key && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coupon */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mã giảm giá</Text>

          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Nhập mã giảm giá"
              value={form.couponCode}
              onChangeText={(text) => updateForm({ couponCode: text.toUpperCase() })}
              autoCapitalize="characters"
              editable={!appliedCoupon}
            />

            {!appliedCoupon ? (
              <TouchableOpacity
                style={styles.couponButton}
                onPress={handleApplyCoupon}
                disabled={loading || orderLoading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={styles.couponButtonText}>Áp dụng</Text>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.couponButton, { backgroundColor: '#EF4444' }]}
                onPress={handleRemoveCoupon}
              >
                <Text style={styles.couponButtonText}>Xóa</Text>
              </TouchableOpacity>
            )}
          </View>

          {appliedCoupon && couponData && (
            <View style={styles.couponAppliedBox}>
              <Text style={styles.checkIconSmall}>✓</Text>
              <Text style={styles.couponAppliedText}>
                Đã áp dụng mã: {form.couponCode} (Giảm {formatPrice(couponData.discount_value || 0)})
              </Text>
            </View>
          )}
        </View>

        {/* Invoice */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Xuất hóa đơn</Text>
          <View style={styles.deliveryButtons}>
            <TouchableOpacity
              style={[
                styles.deliveryButton,
                form.needInvoice === 'no' && styles.deliveryButtonActive
              ]}
              onPress={() => updateForm({ needInvoice: 'no' })}
            >
              <Text style={[
                styles.deliveryButtonText,
                form.needInvoice === 'no' && styles.deliveryButtonTextActive
              ]}>
                Không
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.deliveryButton,
                form.needInvoice === 'yes' && styles.deliveryButtonActive
              ]}
              onPress={() => updateForm({ needInvoice: 'yes' })}
            >
              <Text style={[
                styles.deliveryButtonText,
                form.needInvoice === 'yes' && styles.deliveryButtonTextActive
              ]}>
                Có
              </Text>
            </TouchableOpacity>
          </View>

          {form.needInvoice === 'yes' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Tên công ty *"
                value={form.companyName}
                onChangeText={(text) => updateForm({ companyName: text })}
              />
              <TextInput
                style={styles.input}
                placeholder="Mã số thuế *"
                value={form.companyTax}
                onChangeText={(text) => updateForm({ companyTax: text })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Địa chỉ công ty"
                value={form.companyAddress}
                onChangeText={(text) => updateForm({ companyAddress: text })}
                multiline
                numberOfLines={2}
              />
            </>
          )}
        </View>

        {/* Order Summary */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tạm tính:</Text>
            <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
          </View>
          
          {appliedCoupon && discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Giảm giá:</Text>
              <Text style={[styles.summaryValue, styles.discountValue]}>
                -{formatPrice(discount)}
              </Text>
            </View>
          )}

          <View style={[styles.summaryRow, styles.summaryTotal]}>
            <Text style={styles.summaryTotalLabel}>Tổng cộng:</Text>
            <Text style={styles.summaryTotalValue}>{formatPrice(total)}</Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, (loading || orderLoading) && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading || orderLoading}
        >
          {(loading || orderLoading) ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Text style={styles.submitIcon}>🛍️</Text>
              <Text style={styles.submitButtonText}>Đặt hàng ngay</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Success Modal */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <Text style={styles.modalSuccessIcon}>✓</Text>
            </View>
            <Text style={styles.modalTitle}>Đặt hàng thành công!</Text>
            <Text style={styles.modalMessage}>
              Đơn hàng của bạn đã được ghi nhận. Chúng tôi sẽ liên hệ với bạn sớm nhất.
            </Text>
            {createdOrder && (
              <View style={styles.modalOrderInfo}>
                <Text style={styles.modalOrderId}>Mã đơn: {createdOrder.order_id}</Text>
                <Text style={styles.modalOrderTotal}>
                  Tổng tiền: {formatPrice(createdOrder.final_price)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('Orders');
              }}
            >
              <Text style={styles.modalButtonText}>Xem đơn hàng</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalButtonSecondary}
              onPress={() => {
                setShowSuccessModal(false);
                navigation.navigate('UserHome');
              }}
            >
              <Text style={styles.modalButtonSecondaryText}>Về trang chủ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    fontSize: 24,
    color: '#F97316',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  orderSuccessBox: {
    margin: 16,
    padding: 16,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  orderSuccessHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkIcon: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: 'bold',
    marginRight: 8,
  },
  orderSuccessTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#047857',
  },
  orderSuccessContent: {
    gap: 8,
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderInfoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  section: {
    backgroundColor: '#FFF',
    margin: 16,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  productCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  checkbox: {
    marginRight: 12,
    paddingTop: 4,
  },
  checkboxIcon: {
    fontSize: 24,
    color: '#F97316',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F97316',
    marginBottom: 8,
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#FFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityButtonDisabled: {
    backgroundColor: '#F3F4F6',
  },
  quantityButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  quantityButtonTextDisabled: {
    color: '#D1D5DB',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    minWidth: 30,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#111827',
    marginBottom: 12,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  deliveryButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  deliveryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F97316',
    backgroundColor: '#FFF',
  },
  deliveryButtonActive: {
    backgroundColor: '#F97316',
  },
  deliveryIcon: {
    fontSize: 18,
  },
  deliveryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F97316',
  },
  deliveryButtonTextActive: {
    color: '#FFF',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
    marginBottom: 12,
  },
  paymentOptionActive: {
    borderColor: '#F97316',
    backgroundColor: '#FFF5F0',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentIcon: {
    fontSize: 22,
  },
  paymentOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  paymentOptionTextActive: {
    color: '#111827',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#F97316',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F97316',
  },
  couponRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  couponButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F97316',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  couponButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  couponAppliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    padding: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  checkIconSmall: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: 'bold',
  },
  couponAppliedText: {
    fontSize: 13,
    color: '#047857',
    fontWeight: '500',
    flex: 1,
  },
  summarySection: {
    backgroundColor: '#FFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  discountValue: {
    color: '#EF4444',
  },
  summaryTotal: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  summaryTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F97316',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F97316',
    marginHorizontal: 16,
    marginTop: 8,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitIcon: {
    fontSize: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalSuccessIcon: {
    fontSize: 48,
    color: '#10B981',
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  modalOrderInfo: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
  },
  modalOrderId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalOrderTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F97316',
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#F97316',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  modalButtonSecondary: {
    width: '100%',
    backgroundColor: '#FFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonSecondaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default CustomerInfo;