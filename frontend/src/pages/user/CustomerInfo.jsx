// src/pages/user/CustomerInfo.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Store, MapPin, CreditCard, Wallet, Landmark, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useOrder } from "@/providers/OrderProvider";
import { orderService } from "@/services/orderService";
import { useAuth } from "@/hooks/useAuth";

export default function CustomerInfo({
  cartItems = [],
  selectedItems = [],
  totalAmount = 0,
  goBack = () => {},
  goPayment = () => {},
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const { user } = useAuth();

  const preselectedFromState = location?.state?.preselected ?? null;

  const initialCart = Array.isArray(preselectedFromState) && preselectedFromState.length > 0
    ? preselectedFromState.map((it) => ({
        id: it.id ?? it.product_id ?? String(it.id),
        product_id: it.product_id ?? it.id ?? String(it.id),
        name: it.name ?? "Sản phẩm",
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        image: it.image ?? "/placeholder.png",
        selected: it.selected ?? true,
      }))
    : Array.isArray(cartItems) ? cartItems.map(it => ({
        id: it.id ?? it.product_id ?? String(it.id),
        product_id: it.product_id ?? it.id ?? String(it.id),
        name: it.name ?? "Sản phẩm",
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        image: it.image ?? "/placeholder.png",
        selected: it.selected ?? true,
      })) : [];

  const [localCartItems, setLocalCartItems] = useState(initialCart);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    receiveEmail: false,
    deliveryMethod: "store",
    province: "",
    district: "",
    store: "",
    shippingAddress: "",
    note: "",
    couponCode: "",
    needInvoice: "no",
    companyName: "",
    companyTax: "",
    companyAddress: "",
    paymentMethod: "cod",
  });

  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  let createOrderFromContext = null;
  try {
    createOrderFromContext = useOrder()?.createOrder;
  } catch (e) {
    createOrderFromContext = null;
  }

  // helper lấy số từ value (trả về Number hoặc null)
  const toNumberOrNull = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") {
      return Number.isFinite(v) ? v : null;
    }
    if (typeof v === "string") {
      // remove non-digit except - and .
      const cleaned = v.replace(/[^\d.-]/g, "");
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

  // helper: thu thập candidate numeric fields from an object (shallow)
  const collectCandidates = (obj) => {
    const keys = ["final_price", "finalPrice", "finalprice", "total_amount", "totalAmount", "totalamount", "total_price", "totalPrice", "totalprice"];
    const res = [];
    if (!obj || typeof obj !== "object") return res;
    for (const k of keys) {
      if (k in obj) {
        const n = toNumberOrNull(obj[k]);
        if (n !== null) res.push(n);
      }
    }
    return res;
  };

  // 🔥 NORMALIZE ORDER - LẤY ĐÚNG final_price (ưu tiên giá > 0 ở các vị trí nested)
  const normalizeOrder = (serverOrder) => {
    if (!serverOrder) return null;

    // candidates from top level
    const topCandidates = collectCandidates(serverOrder);

    // candidates from nested likely places
    const nestedPlaces = [serverOrder.raw, serverOrder.data, serverOrder.order, serverOrder.result];
    const nestedCandidates = nestedPlaces.reduce((acc, place) => {
      if (place && typeof place === "object") {
        acc.push(...collectCandidates(place));
      }
      return acc;
    }, []);

    // merge candidates preserving order: topCandidates then nestedCandidates
    const allCandidates = [...topCandidates, ...nestedCandidates];

    // pick first >0 if exists, otherwise first finite (including 0)
    let final_price = null;
    for (const c of allCandidates) {
      if (Number.isFinite(c) && c > 0) {
        final_price = c;
        break;
      }
    }
    if (final_price === null) {
      for (const c of allCandidates) {
        if (Number.isFinite(c)) {
          final_price = c;
          break;
        }
      }
    }
    if (final_price === null) {
      // fallback to specific fields if still null
      final_price = toNumberOrNull(serverOrder.final_price) ?? toNumberOrNull(serverOrder.total_amount) ?? 0;
    }

    // total_price / discount similar strategy
    let total_price = toNumberOrNull(serverOrder.total_price);
    if (total_price === null) {
      total_price = toNumberOrNull(serverOrder.raw?.total_price) ?? toNumberOrNull(serverOrder.data?.total_price) ?? toNumberOrNull(serverOrder.order?.total_price) ?? 0;
    }

    let discount = toNumberOrNull(serverOrder.discount);
    if (discount === null) {
      discount = toNumberOrNull(serverOrder.raw?.discount) ?? toNumberOrNull(serverOrder.data?.discount) ?? toNumberOrNull(serverOrder.order?.discount) ?? 0;
    }

    const items = serverOrder.items ?? serverOrder.order_items ?? serverOrder.raw?.items ?? [];

    return {
      order_id: serverOrder.order_id ?? serverOrder.id ?? serverOrder._id ?? null,
      status: serverOrder.status ?? serverOrder.raw?.status ?? null,
      total_price: total_price,
      discount: discount,
      final_price: final_price,
      currency: serverOrder.currency ?? serverOrder.raw?.currency ?? "VND",
      created_at: serverOrder.created_at ?? serverOrder.createdAt ?? serverOrder.raw?.created_at ?? null,
      coupon: serverOrder.coupon ?? serverOrder.raw?.coupon ?? null,
      items,
      raw: serverOrder,
    };
  };

  const fallbackCreateOrder = async (payload) => {
    const res = await orderService.createOrder(payload);
    const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
    return normalizeOrder(serverOrder);
  };

  const createOrder = createOrderFromContext ?? fallbackCreateOrder;

  const paymentOptions = [
    { key: "cod", label: "Thanh toán khi nhận hàng", icon: <Wallet size={22} /> },
    { key: "bank", label: "Chuyển khoản ngân hàng", icon: <Landmark size={22} /> },
    { key: "momo", label: "Ví MoMo", icon: <CreditCard size={22} /> },
    { key: "vnpay", label: "VNPay", icon: <CreditCard size={22} /> },
    { key: "zalopay", label: "ZaloPay", icon: <CreditCard size={22} /> },
  ];

  const updateForm = (patch) => setForm((s) => ({ ...s, ...patch }));

  const formatPrice = (price) => {
    const n = Number(price);
    const safe = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(safe);
  };

  const updateItem = (id, patch) => {
    setLocalCartItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  };

  const updateQuantity = (id, delta) => {
    updateItem(id, { quantity: Math.max(1, (localCartItems.find(i => i.id === id)?.quantity || 1) + delta) });
  };

  const toggleSelect = (id) => updateItem(id, { selected: !localCartItems.find(i => i.id === id)?.selected });

  const removeItem = (id) => setLocalCartItems(prev => prev.filter(i => i.id !== id));

  const buildShippingAddress = () => {
    if (form.shippingAddress && form.shippingAddress.trim()) return form.shippingAddress.trim();
    if (form.deliveryMethod === "home") {
      const parts = [];
      if (form.province) parts.push(form.province);
      if (form.district) parts.push(form.district);
      return parts.join(", ") || "Giao hàng tận nơi";
    }
    return form.store || "Nhận tại cửa hàng";
  };

  const buildPayload = () => {
    const currentSelected = localCartItems.filter(i => i.selected);

    const items = currentSelected.map(it => ({
      product_id: String(it.product_id),
      quantity: Number(it.quantity),
      price: Number(it.price),
    }));

    const payload = {
      user_id: user?.user_id || user?.id || user?._id || null,
      items,
      coupon_code: form.couponCode || undefined,
      shipping_address: buildShippingAddress(),
      payment_method: form.paymentMethod,
      note: form.note || undefined,
      customer_name: form.name || undefined,
      customer_phone: form.phone || undefined,
      customer_email: form.email || undefined,
      invoice:
        form.needInvoice === "yes"
          ? {
              need: "yes",
              company_name: form.companyName,
              company_tax: form.companyTax,
              company_address: form.companyAddress,
            }
          : { need: "no" },
    };

    Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);
    return payload;
  };

  const validate = () => {
    if (!form.name.trim()) return toast.error("Vui lòng nhập họ và tên.");
    if (!form.phone.trim()) return toast.error("Vui lòng nhập số điện thoại.");
    if (!form.email.trim()) return toast.error("Vui lòng nhập email.");
    if (localCartItems.filter(i => i.selected).length === 0)
      return toast.error("Bạn chưa chọn sản phẩm nào.");
    return true;
  };

  const applyExamplePayload = () => {
    const example = {
      items: [{ product_id: "P123", quantity: 2, price: 500000 }],
      coupon_code: "NEWYEAR2024",
      shipping_address: "123 Nguyen Trai, Q1, HCMC",
      payment_method: "momo"
    };

    const items = example.items.map((it, idx) => ({
      id: it.product_id + "-" + idx,
      product_id: it.product_id,
      name: it.product_id,
      price: it.price,
      quantity: it.quantity,
      image: "/placeholder.png",
      selected: true,
    }));
    setLocalCartItems(items);

    updateForm({
      couponCode: example.coupon_code,
      shippingAddress: example.shipping_address,
      paymentMethod: example.payment_method,
    });

    toast.success("Đã áp payload mẫu.");
  };

  // handleSubmit là async - chỉ dùng await ở trong hàm async
  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = buildPayload();

    console.log("🔥 PAYLOAD GỬI LÊN:", payload);

    setLoading(true);
    try {
      // createOrder có thể trả về object đã normalized (nếu dùng context) hoặc raw server response
      const orderRes = await createOrder(payload);
      console.log("✅ ORDER TRẢ VỀ (raw):", orderRes);

      // Normalize - dùng normalizeOrder cho orderRes chính và các vị trí nested
      let normalized = normalizeOrder(orderRes);
      if (!normalized || !Number.isFinite(Number(normalized.final_price)) || Number(normalized.final_price) === 0) {
        // try other nested places just in case (take first non-zero if possible)
        normalized = normalizeOrder(orderRes?.raw) || normalizeOrder(orderRes?.data) || normalizeOrder(orderRes?.order) || normalizeOrder({ ...orderRes });
      }

      // ensure numbers
      const finalNormalized = {
        ...normalized,
        total_price: Number.isFinite(Number(normalized?.total_price)) ? Number(normalized.total_price) : (Number(orderRes?.total_price) || 0),
        discount: Number.isFinite(Number(normalized?.discount)) ? Number(normalized.discount) : (Number(orderRes?.discount) || 0),
        final_price: Number.isFinite(Number(normalized?.final_price)) ? Number(normalized.final_price) : (Number(orderRes?.final_price ?? orderRes?.total_amount) || 0),
        raw: orderRes,
      };

      console.log("🔎 ORDER NORMALIZED:", finalNormalized);

      setCreatedOrder(finalNormalized);
      setShowSuccessModal(true);
      toast.success("Đặt hàng thành công!");

      if (typeof goPayment === "function") goPayment(finalNormalized);
    } catch (err) {
      console.error("❌ LỖI ĐẶT HÀNG:", err);
      toast.error(err?.response?.data?.message || "Đặt hàng thất bại");
    } finally {
      setLoading(false);
    }
  };

  const computedSelected = localCartItems.filter(i => i.selected);

  const closeModal = () => {
    setShowSuccessModal(false);
  };

  const viewOrder = () => {
    if (!createdOrder) return;
    const id = createdOrder.order_id ?? createdOrder.id ?? createdOrder._id;
    if (id) {
      navigate(`/orders/${id}`);
    } else {
      closeModal();
    }
  };

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#F3F4F6" }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={goBack}
            className="px-4 py-2 rounded-lg"
            style={{ backgroundColor: "#FFFFFF", color: "#F97316", border: `1px solid #F97316` }}
          >
            ← Quay lại
          </button>

          <div className="flex gap-3">
            <button
              onClick={applyExamplePayload}
              className="px-4 py-2 rounded-lg"
              style={{ backgroundColor: "#10B981", color: "#FFF" }}
            >
              Áp payload mẫu
            </button>
          </div>
        </div>

        <div className="rounded-2xl shadow-lg p-8 bg-white">
          <h2 className="text-2xl font-bold mb-4">Thông Tin Đặt Hàng</h2>

          {/* 🔥 HIỂN THỊ THÔNG TIN ĐƠN HÀNG ĐÃ TẠO */}
          {createdOrder && (
            <div className="mb-4 p-4 rounded bg-green-50 border border-green-200">
              <div className="font-semibold text-green-800 mb-2">✅ Đặt hàng thành công</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Mã đơn:</span>
                  <span className="ml-2 font-medium">{createdOrder.order_id ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Trạng thái:</span>
                  <span className="ml-2 font-medium">{createdOrder.status ?? "—"}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tổng tiền:</span>
                  <span className="ml-2 font-medium">{formatPrice(createdOrder.total_price ?? 0)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Giảm giá:</span>
                  <span className="ml-2 font-medium text-red-600">-{formatPrice(createdOrder.discount ?? 0)}</span>
                </div>
                {createdOrder.coupon && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Mã giảm giá:</span>
                    <span className="ml-2 font-medium">{createdOrder.coupon.code}</span>
                  </div>
                )}
                <div className="col-span-2 pt-2 border-t border-green-300">
                  <span className="text-gray-600">Thành tiền:</span>
                  <span className="ml-2 font-bold text-lg" style={{ color: "#F97316" }}>
                    {formatPrice(createdOrder.final_price)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Sản phẩm</h3>
            {localCartItems.length === 0 && <div className="text-gray-500">Không có sản phẩm nào.</div>}
            <div className="space-y-3">
              {localCartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <input type="checkbox" checked={!!item.selected} onChange={() => toggleSelect(item.id)} style={{ accentColor: "#F97316" }} />
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <div className="mb-1">
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        className="w-full px-2 py-1 border rounded"
                      />
                    </div>

                    <div className="flex gap-2 items-center">
                      <div>
                        <label className="text-xs text-gray-500">product_id</label>
                        <input
                          value={item.product_id}
                          onChange={(e) => updateItem(item.id, { product_id: e.target.value })}
                          className="px-2 py-1 border rounded w-40"
                        />
                      </div>

                      <div>
                        <label className="text-xs text-gray-500">Số lượng</label>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1 border rounded">-</button>
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })}
                            className="w-16 text-center px-2 py-1 border rounded"
                          />
                          <button onClick={() => updateQuantity(item.id, +1)} className="px-2 py-1 border rounded">+</button>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-gray-500">Giá (VND)</label>
                        <input
                          type="number"
                          min={0}
                          value={item.price}
                          onChange={(e) => updateItem(item.id, { price: Number(e.target.value) || 0 })}
                          className="px-2 py-1 border rounded w-32"
                        />
                      </div>
                    </div>
                  </div>

                  <button onClick={() => removeItem(item.id)} className="text-red-500">Xóa</button>
                </div>
              ))}
            </div>
          </div>

          {/* Customer info */}
          <div className="mb-4">
            <h3 className="font-semibold mb-3">Thông tin khách hàng</h3>
            <div className="grid grid-cols-1 gap-3">
              <input type="text" placeholder="Họ và tên" value={form.name} onChange={(e) => updateForm({ name: e.target.value })} className="px-4 py-2 border rounded" />
              <input type="tel" placeholder="Số điện thoại" value={form.phone} onChange={(e) => updateForm({ phone: e.target.value })} className="px-4 py-2 border rounded" />
              <input type="email" placeholder="Email" value={form.email} onChange={(e) => updateForm({ email: e.target.value })} className="px-4 py-2 border rounded" />
            </div>
          </div>

          {/* Shipping */}
          <div className="mb-4">
            <h3 className="font-semibold mb-3">Thông tin nhận hàng</h3>

            <div className="mb-3">
              <label className="text-sm text-gray-600">Địa chỉ giao hàng (nhập chuỗi nếu muốn, sẽ ưu tiên)</label>
              <input type="text" placeholder="123 Nguyen Trai, Q1, HCMC" value={form.shippingAddress} onChange={(e) => updateForm({ shippingAddress: e.target.value })} className="w-full px-4 py-2 border rounded" />
            </div>

            <div className="flex gap-3 mb-3">
              <button onClick={() => updateForm({ deliveryMethod: "store" })} className={`flex-1 py-2 rounded ${form.deliveryMethod === "store" ? "bg-orange-500 text-white" : "bg-white border"}`}>Nhận tại cửa hàng</button>
              <button onClick={() => updateForm({ deliveryMethod: "home" })} className={`flex-1 py-2 rounded ${form.deliveryMethod === "home" ? "bg-orange-500 text-white" : "bg-white border"}`}>Giao tận nơi</button>
            </div>

            {form.deliveryMethod === "home" && !form.shippingAddress && (
              <div className="flex gap-3">
                <select value={form.province} onChange={(e) => updateForm({ province: e.target.value })} className="px-3 py-2 border rounded w-1/2">
                  <option value="">Chọn Tỉnh / Thành</option>
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Hà Nội">Hà Nội</option>
                </select>
                <select value={form.district} onChange={(e) => updateForm({ district: e.target.value })} className="px-3 py-2 border rounded w-1/2">
                  <option value="">Chọn Quận / Huyện</option>
                  <option value="Quận 1">Quận 1</option>
                  <option value="Quận 2">Quận 2</option>
                </select>
              </div>
            )}

            {form.deliveryMethod === "store" && !form.shippingAddress && (
              <select value={form.store} onChange={(e) => updateForm({ store: e.target.value })} className="w-full px-3 py-2 border rounded">
                <option value="">Chọn cửa hàng</option>
                <option value="CellphoneS - Nguyễn Huệ">CellphoneS - Nguyễn Huệ</option>
                <option value="CellphoneS - Lê Lợi">CellphoneS - Lê Lợi</option>
              </select>
            )}

            <textarea placeholder="Ghi chú" value={form.note} onChange={(e) => updateForm({ note: e.target.value })} className="w-full px-4 py-2 border rounded mt-3" />
          </div>

          {/* Voucher & invoice & payment */}
          <div className="mb-4">
            <div className="flex gap-3 mb-3">
              <input type="text" placeholder="Mã giảm giá" value={form.couponCode} onChange={(e) => updateForm({ couponCode: e.target.value })} className="flex-1 px-4 py-2 border rounded" />
              <button onClick={() => toast.info("Kiểm tra voucher chưa implement")} className="px-4 py-2 rounded bg-orange-500 text-white">Áp mã</button>
            </div>

            <div className="mb-3">
              <div className="flex gap-3">
                <label><input type="radio" name="invoice" value="no" checked={form.needInvoice === "no"} onChange={(e) => updateForm({ needInvoice: e.target.value })} /> Không cần hóa đơn</label>
                <label><input type="radio" name="invoice" value="yes" checked={form.needInvoice === "yes"} onChange={(e) => updateForm({ needInvoice: e.target.value })} /> Cần hóa đơn</label>
              </div>

              {form.needInvoice === "yes" && (
                <div className="mt-2 grid grid-cols-1 gap-2">
                  <input value={form.companyName} onChange={(e) => updateForm({ companyName: e.target.value })} placeholder="Tên công ty" className="px-3 py-2 border rounded" />
                  <input value={form.companyTax} onChange={(e) => updateForm({ companyTax: e.target.value })} placeholder="Mã số thuế" className="px-3 py-2 border rounded" />
                  <input value={form.companyAddress} onChange={(e) => updateForm({ companyAddress: e.target.value })} placeholder="Địa chỉ công ty" className="px-3 py-2 border rounded" />
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Phương thức thanh toán</h4>
              <div className="grid grid-cols-2 gap-3">
                {paymentOptions.map(opt => (
                  <button key={opt.key} type="button" onClick={() => updateForm({ paymentMethod: opt.key })} className={`p-3 rounded border ${form.paymentMethod === opt.key ? "bg-orange-500 text-white" : "bg-white"}`}>
                    <div className="flex items-center gap-2 justify-center">{opt.icon}<span>{opt.label}</span></div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary & submit */}
          <div className="border-t pt-4">
            <div className="flex justify-between mb-3">
              <span>Sản phẩm ({computedSelected.length})</span>
              <span className="font-semibold">{formatPrice(totalAmount ?? (createdOrder?.final_price ?? 0))}</span>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl font-semibold text-lg" style={{ background: "linear-gradient(135deg, #F97316, #C2410C)", color: "#FFF" }}>
              {loading ? "Đang xử lý..." : "Xác nhận & Đặt hàng"}
            </button>
          </div>
        </div>
      </div>

      {/* 🔥 SUCCESS MODAL - HIỂN THỊ final_price */}
      {showSuccessModal && createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />

          <div className="relative bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="bg-green-100 rounded-full p-3">
                <CheckCircle size={48} className="text-green-600" />
              </div>
              <h3 className="text-xl font-semibold">Đặt hàng thành công!</h3>
              
              <div className="text-center">
                <div className="text-sm text-gray-600">Mã đơn hàng</div>
                <div className="font-medium">{createdOrder.order_id ?? "—"}</div>
              </div>

              {/* Hiển thị chi tiết giá */}
              <div className="w-full bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tổng tiền hàng:</span>
                  <span>{formatPrice(createdOrder.total_price ?? 0)}</span>
                </div>
                {createdOrder.discount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Giảm giá:</span>
                      <span className="text-red-600">-{formatPrice(createdOrder.discount)}</span>
                    </div>
                    {createdOrder.coupon && (
                      <div className="text-xs text-gray-500 text-center">
                        Mã: {createdOrder.coupon.code}
                      </div>
                    )}
                  </>
                )}
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Thành tiền:</span>
                  <span className="text-orange-500 font-bold text-lg">
                    {formatPrice(createdOrder.final_price)}
                  </span>
                </div>
              </div>

              <div className="w-full flex gap-3 mt-2">
                <button onClick={viewOrder} className="flex-1 py-2 rounded-lg bg-white border hover:bg-gray-50">
                  Xem đơn hàng
                </button>
                <button onClick={closeModal} className="flex-1 py-2 rounded-lg" style={{ background: "linear-gradient(135deg, #F97316, #C2410C)", color: "#FFF" }}>
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
