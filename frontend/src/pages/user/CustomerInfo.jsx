// src/pages/user/CustomerInfo.jsx
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Store, MapPin, CreditCard, Wallet, Landmark } from "lucide-react";
import { toast } from "react-toastify";
import { useOrder } from "@/providers/OrderProvider";
import { orderService } from "@/services/orderService";

/**
 * CustomerInfo (updated)
 * - Cho phép edit product_id / quantity / price trên UI
 * - Có nút "Áp payload mẫu" để fill nhanh payload ví dụ
 * - Cho phép nhập shipping_address dạng chuỗi (ưu tiên)
 */
export default function CustomerInfo({
  cartItems = [],
  selectedItems = [],
  totalAmount = 0,
  goBack = () => {},
  goPayment = () => {},
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const preselectedFromState = location?.state?.preselected ?? null;

  // initial cart
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

  // form state (thêm shippingAddress trực tiếp)
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    receiveEmail: false,
    deliveryMethod: "store",
    province: "",
    district: "",
    store: "",
    shippingAddress: "", // <-- thêm: chuỗi địa chỉ tùy ý (ưu tiên)
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

  // Try to get createOrder from context; fallback to orderService if provider missing
  let createOrderFromContext = null;
  try {
    createOrderFromContext = useOrder()?.createOrder;
  } catch (e) {
    createOrderFromContext = null;
  }

  const normalizeOrder = (serverOrder) => {
    if (!serverOrder) return null;
    return {
      order_id: serverOrder.order_id ?? serverOrder.id ?? serverOrder._id ?? null,
      status: serverOrder.status ?? serverOrder.order_status ?? "",
      total_amount: serverOrder.total_amount ?? serverOrder.total ?? 0,
      currency: serverOrder.currency ?? "VND",
      created_at: serverOrder.created_at ?? serverOrder.createdAt ?? serverOrder.date ?? null,
      updated_at: serverOrder.updated_at ?? serverOrder.updatedAt ?? null,
      items: serverOrder.items ?? serverOrder.order_items ?? [],
      shipping: serverOrder.shipping ?? serverOrder.shipping_info ?? {},
      payment: serverOrder.payment ?? serverOrder.payment_info ?? {},
      customer: serverOrder.customer ?? serverOrder.user ?? null,
      raw: serverOrder,
    };
  };

  const fallbackCreateOrder = async (payload) => {
    const res = await orderService.createOrder(payload);
    const serverOrder = res.data?.data ?? res.data?.order ?? res.data;
    return normalizeOrder(serverOrder) ?? serverOrder;
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

  const formatPrice = (price) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

  // cart helpers (cho phép edit product_id, quantity, price)
  const updateItem = (id, patch) => {
    setLocalCartItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  };

  const updateQuantity = (id, delta) => {
    updateItem(id, { quantity: Math.max(1, (localCartItems.find(i => i.id === id)?.quantity || 1) + delta) });
  };

  const toggleSelect = (id) => updateItem(id, { selected: !localCartItems.find(i => i.id === id)?.selected });

  const removeItem = (id) => setLocalCartItems(prev => prev.filter(i => i.id !== id));

  // Shipping address builder: nếu form.shippingAddress (chuỗi) tồn tại -> ưu tiên dùng nó
  const buildShippingAddress = () => {
    if (form.shippingAddress && form.shippingAddress.trim()) return form.shippingAddress.trim();
    if (form.deliveryMethod === "home") {
      const parts = [];
      if (form.province) parts.push(form.province);
      if (form.district) parts.push(form.district);
      return parts.join(", ") || "Giao hàng tận nơi";
    } else {
      return form.store || "Nhận tại cửa hàng";
    }
  };

  const buildPayload = () => {
    const currentSelected = localCartItems.filter(i => i.selected);
    const items = currentSelected.map(it => ({
      product_id: String(it.product_id ?? it.id),
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
    }));

    const payload = {
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
    if (!form.name?.trim()) { toast.error("Vui lòng nhập họ và tên."); return false; }
    if (!form.phone?.trim()) { toast.error("Vui lòng nhập số điện thoại."); return false; }
    if (!form.email?.trim()) { toast.error("Vui lòng nhập email."); return false; }
    if (!Array.isArray(localCartItems) || localCartItems.filter(i => i.selected).length === 0) {
      toast.error("Bạn chưa chọn sản phẩm nào để đặt hàng."); return false;
    }
    if (!form.paymentMethod) { toast.error("Vui lòng chọn phương thức thanh toán."); return false; }
    // nếu shippingAddress rỗng và deliveryMethod=home thì require province/district
    if (!form.shippingAddress && form.deliveryMethod === "home") {
      if (!form.province || !form.district) { toast.error("Vui lòng chọn tỉnh/quận hoặc nhập địa chỉ giao hàng."); return false; }
    }
    if (form.needInvoice === "yes") {
      if (!form.companyName || !form.companyTax || !form.companyAddress) {
        toast.error("Vui lòng điền đầy đủ thông tin hóa đơn công ty."); return false;
      }
    }
    return true;
  };

  // Nút hỗ trợ: áp payload mẫu (bạn cung cấp)
  const applyExamplePayload = () => {
    const example = {
      items: [{ product_id: "P123", quantity: 2, price: 500000 }],
      coupon_code: "NEWYEAR2024",
      shipping_address: "123 Nguyen Trai, Q1, HCMC",
      payment_method: "momo"
    };

    // set items into localCartItems (gán id = product_id để giữ nhất quán)
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

    toast.success("Đã áp dụng payload mẫu. Kiểm tra lại rồi bấm xác nhận.");
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    const payload = buildPayload();
    setLoading(true);
    try {
      const order = await createOrder(payload);
      const orderId = order?.order_id ?? order?.id ?? order?._id ?? null;
      setCreatedOrder(order);
      toast.success("Đặt hàng thành công!");
      if (typeof goPayment === "function") {
        try { goPayment(order); } catch (e) { console.warn(e); }
      }
      // optionally navigate or keep on page
      if (orderId) {
        console.log("Order id:", orderId);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err.message || "Đặt hàng thất bại";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // compute totals
  const computedSelected = localCartItems.filter(i => i.selected);
  const safeTotal = computedSelected.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);

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

          {createdOrder && (
            <div className="mb-4 p-4 rounded bg-green-50 border">
              <div className="font-semibold">Đặt hàng thành công</div>
              <div>Mã: <strong>{createdOrder.order_id ?? createdOrder.id ?? createdOrder._id ?? "—"}</strong></div>
              <div>Tổng: <strong style={{ color: "#F97316" }}>{formatPrice(createdOrder.total_amount ?? safeTotal)}</strong></div>
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
              <span className="font-semibold">{formatPrice(safeTotal)}</span>
            </div>

            <button onClick={handleSubmit} disabled={loading} className="w-full py-3 rounded-xl font-semibold text-lg" style={{ background: "linear-gradient(135deg, #F97316, #C2410C)", color: "#FFF" }}>
              {loading ? "Đang xử lý..." : "Xác nhận & Đặt hàng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
