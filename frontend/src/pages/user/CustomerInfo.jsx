// File: src/pages/user/CustomerInfo.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Store, MapPin, CheckCircle } from "lucide-react";
import { toast } from "react-toastify";
import { useOrder } from "@/providers/OrderProvider";
import { orderService } from "@/services/orderService";
import { paymentService } from "@/services/paymentService";
import { useAuth } from "@/hooks/useAuth";
import OrderSummary from "./OrderSummary"; // <- new

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

  const toNumberOrNull = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === "number") {
      return Number.isFinite(v) ? v : null;
    }
    if (typeof v === "string") {
      const cleaned = v.replace(/[^\d.-]/g, "");
      const n = Number(cleaned);
      return Number.isFinite(n) ? n : null;
    }
    return null;
  };

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

  const normalizeOrder = (serverOrder) => {
    if (!serverOrder) return null;

    const topCandidates = collectCandidates(serverOrder);
    const nestedPlaces = [serverOrder.raw, serverOrder.data, serverOrder.order, serverOrder.result];
    const nestedCandidates = nestedPlaces.reduce((acc, place) => {
      if (place && typeof place === "object") {
        acc.push(...collectCandidates(place));
      }
      return acc;
    }, []);

    const allCandidates = [...topCandidates, ...nestedCandidates];

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
      final_price = toNumberOrNull(serverOrder.final_price) ?? toNumberOrNull(serverOrder.total_amount) ?? 0;
    }

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
    return normalizeOrder(serverOrder) ?? serverOrder;
  };

  const createOrder = createOrderFromContext ?? fallbackCreateOrder;

  // Chỉ giữ lại 3 phương thức thanh toán
  const paymentOptions = [
    { key: "cod", label: "Thanh toán khi nhận hàng", icon: <WalletIcon /> },
    { key: "bank", label: "Chuyển khoản ngân hàng", icon: <BankIcon /> },
    { key: "momo", label: "Ví MoMo", icon: <CardIcon /> },
  ];

  // small in-file icon components to avoid extra imports in the extracted file
  function WalletIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7H21V17H3V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
  function BankIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11L12 3L21 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M5 11V19H19V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }
  function CardIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M2 10H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>; }

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

  items,
  coupon_code: form.couponCode || undefined,
  shipping_address: buildShippingAddress(),
  note: form.note || undefined,
  customer_name: form.name || undefined,
  customer_phone: form.phone || undefined,
  customer_email: form.email || undefined,
  payment_method: form.paymentMethod || undefined,
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
      shipping_address: "123 Nguyen Trai, Q1, HCMC"
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
    });

    toast.success("Đã áp payload mẫu.");
  };

  const getAuthToken = () => {
    return (
      user?.token ||
      user?.access_token ||
      user?.accessToken ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      null
    );
  };

  const extractVnpayUrlFromResponse = (res) => {
    if (!res) return null;
    const d = res.data ?? res;
    return (
      (d && (d.vnpayUrl || d.vnpayURL || d.vnpay_url || d.vnpayUrl || d.vnpayUrl)) ||
      (d && d.data && (d.data.vnpayUrl || d.data.vnpay_url)) ||
      (d && d.vnpayurl) ||
      (d && d.payment_url) ||
      (d && d.vnpay_url) ||
      null
    );
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = buildPayload();

    console.log("🔥 PAYLOAD GỬI LÊN:", payload);

    setLoading(true);
    try {
      const orderRes = await createOrder(payload);
      console.log("✅ ORDER TRẢ VỀ (raw):", orderRes);

      let normalized = normalizeOrder(orderRes);
      if (!normalized || !Number.isFinite(Number(normalized.final_price)) || Number(normalized.final_price) === 0) {
        normalized = normalizeOrder(orderRes?.raw) || normalizeOrder(orderRes?.data) || normalizeOrder(orderRes?.order) || normalizeOrder({ ...orderRes }) || normalized;
      }

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
      if (form.paymentMethod === "cod") {
        setLoading(false);
        return;
      }
      if (typeof goPayment === "function") {
        try {
          const handled = await goPayment(finalNormalized);
          if (handled) {
            setLoading(false);
            return;
          }
        } catch (e) {
          console.warn("goPayment threw, fallback to default payment flow", e);
        }
      }
      const orderId = finalNormalized.order_id ?? finalNormalized.id ?? finalNormalized._id;
      const amount = Number(finalNormalized.final_price ?? finalNormalized.total_price ?? finalNormalized.amount ?? 0);

      if (!orderId || !Number.isFinite(amount) || amount <= 0) {
        toast.error("Không có order_id hoặc amount hợp lệ để thanh toán.");
        setLoading(false);
        return;
      }

      try {
        const token = getAuthToken();
        const payRes = await paymentService.createPayment(
          { 
              platform: "web",
            order_id: String(orderId), 
            amount: amount,
            payment_method: form.paymentMethod 
          },
          token
        );
        let paymentUrl = null;
        paymentUrl = extractVnpayUrlFromResponse(payRes) || extractVnpayUrlFromResponse(payRes?.data) || extractVnpayUrlFromResponse(payRes?.data?.data);
        if (!paymentUrl && payRes?.data && (payRes.data.vnpayUrl || payRes.data.vnpayURL || payRes.data.vnpay_url || payRes.data.payment_url)) {
          paymentUrl = payRes.data.vnpayUrl || payRes.data.vnpay_url || payRes.data.vnpayURL || payRes.data.payment_url;
        }
        if (!paymentUrl && typeof payRes === "object") {
          // search naive
          const tryFind = (obj) => {
            if (!obj || typeof obj !== "object") return null;
            if (obj.vnpayUrl || obj.vnpay_url || obj.payment_url || obj.vnpayURL || obj.momoUrl || obj.momo_url) 
              return obj.vnpayUrl || obj.vnpay_url || obj.payment_url || obj.vnpayURL || obj.momoUrl || obj.momo_url;
            for (const k of Object.keys(obj)) {
              if (typeof obj[k] === "object") {
                const found = tryFind(obj[k]);
                if (found) return found;
              }
            }
            return null;
          };
          paymentUrl = paymentUrl || tryFind(payRes);
        }

        if (paymentUrl) {
          // Redirect to payment gateway
          window.location.href = paymentUrl;
          return;
        } else {
          toast.error("Không lấy được URL thanh toán từ server.");
          console.warn("payment create response:", payRes);
        }
      } catch (e) {
        toast.error(e?.response?.data?.message || "Tạo thanh toán thất bại");
      }

    } catch (err) {
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
      navigate(`/user/orders`);
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

          {/* HIỂN THỊ THÔNG TIN ĐƠN HÀNG ĐÃ TẠO */}
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

          {/* Items - Chỉ hiển thị thông tin, không cho chỉnh sửa */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3">Sản phẩm</h3>
            {localCartItems.length === 0 && <div className="text-gray-500">Không có sản phẩm nào.</div>}
            <div className="space-y-3">
              {localCartItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50">
                  <input 
                    type="checkbox" 
                    checked={!!item.selected} 
                    onChange={() => toggleSelect(item.id)} 
                    style={{ accentColor: "#F97316" }} 
                  />
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 mb-2">{item.name}</div>
                    
                    <div className="flex gap-4 items-center text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-600">Số lượng:</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => updateQuantity(item.id, -1)} 
                            className="px-2 py-1 border rounded hover:bg-gray-100"
                            disabled={item.quantity <= 1}
                          >
                            -
                          </button>
                          <span className="w-12 text-center font-medium">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.id, +1)} 
                            className="px-2 py-1 border rounded hover:bg-gray-100"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-gray-600">Đơn giá:</span>
                        <span className="ml-2 font-medium text-orange-600">{formatPrice(item.price)}</span>
                      </div>

                      <div>
                        <span className="text-gray-600">Thành tiền:</span>
                        <span className="ml-2 font-semibold text-orange-600">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
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

          {/* Voucher & invoice */}
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

            {/* Payment & Order summary moved to OrderSummary component */}
            <OrderSummary
              paymentOptions={paymentOptions}
              paymentMethod={form.paymentMethod}
              onSelectPayment={(pm) => updateForm({ paymentMethod: pm })}
              totalAmount={totalAmount}
              computedSelected={computedSelected}
              formatPrice={formatPrice}
              loading={loading}
              onSubmit={handleSubmit}
              createdOrder={createdOrder}
              showSuccessModal={showSuccessModal}
              closeModal={closeModal}
              viewOrder={viewOrder}
            />

          </div>

        </div>
      </div>
    </div>
  );
}