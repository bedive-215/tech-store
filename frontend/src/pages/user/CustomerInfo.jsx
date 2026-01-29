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
  goBack = () => { },
  goPayment = () => { },
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  const { user } = useAuth();
  const [showCouponModal, setShowCouponModal] = useState(false);

  const preselectedFromState = location?.state?.preselected ?? null;

  // Khởi tạo localCartItems ban đầu
  const initialCart = Array.isArray(preselectedFromState) && preselectedFromState.length > 0
    ? preselectedFromState.map((it) => ({
      id: it.id ?? it.product_id ?? String(it.id),
      product_id: it.product_id ?? it.id ?? String(it.id),
      name: it.name ?? "Sản phẩm",
      price: Number(it.price) || 0,   // ban đầu dùng giá gốc
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
  const computedTotalAmount = localCartItems
    .filter(item => item.selected)
    .reduce((sum, item) => {
      return sum + item.price * item.quantity;
    }, 0);
  const discountAmount = appliedCoupon
    ? (typeof appliedCoupon.discount === "number"
      ? appliedCoupon.discount
      : (typeof appliedCoupon.final_amount === "number"
        ? Math.max(0, computedTotalAmount - appliedCoupon.final_amount)
        : 0))
    : 0;


  const finalAmount =
    appliedCoupon?.valid && typeof appliedCoupon?.final_amount === "number"
      ? appliedCoupon.final_amount
      : computedTotalAmount;

  useEffect(() => {
    fetchCoupons();
  }, []);


  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const token = getAuthToken();
      const res = await orderService.coupon.list(
        { status: "active" },
        token
      );

      // ✅ LẤY ĐÚNG coupons
      const list = Array.isArray(res?.data?.coupons)
        ? res.data.coupons
        : [];

      setCoupons(list);
    } catch (e) {
      toast.error("Không lấy được danh sách mã giảm giá");
      setCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };


  const now = new Date();
  const formatPrice = (price) => {
    const n = Number(price);
    const safe = Number.isFinite(n) ? n : 0;
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(safe);
  };

  const validCoupons = React.useMemo(() => {
    const now = new Date();

    return coupons.map(c => {
      const minOk = computedTotalAmount >= Number(c.min_order_value || 0);
      const notExpired = !c.expires_at || new Date(c.expires_at) > now;

      return {
        ...c,
        id: c.coupon_id,
        disabled: !(minOk && notExpired),
        reason: !minOk
          ? `Đơn tối thiểu ${formatPrice(c.min_order_value || 0)}`
          : !notExpired
            ? "Đã hết hạn"
            : null,
      };
    });
  }, [coupons, computedTotalAmount]);



  const applyCoupon = async () => {
    if (!form.couponCode.trim()) {
      toast.error("Vui lòng nhập mã giảm giá");
      return;
    }

    const payload = {
      code: form.couponCode.trim(),
      total_amount: computedTotalAmount
    };

    const token = getAuthToken(); // lấy token nếu cần

    setLoading(true);
    try {
      const res = await orderService.coupon.validate(payload, token);

      // Lưu coupon trả về
      setAppliedCoupon(res.data);

      toast.success("Mã giảm giá hợp lệ!");
    } catch (err) {
      const msg = err.response?.data?.message || "Mã giảm giá không hợp lệ";
      toast.error(msg);
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };
  const applyCouponFromSelect = async (coupon) => {
    updateForm({ couponCode: coupon.code }); // ✅ THÊM DÒNG NÀY

    const payload = {
      code: coupon.code,
      total_amount: computedTotalAmount,
    };

    const token = getAuthToken();
    setLoading(true);

    try {
      const res = await orderService.coupon.validate(payload, token);
      setAppliedCoupon(res.data);
      toast.success(`Đã áp mã ${coupon.code}`);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Không áp dụng được mã");
      setAppliedCoupon(null);
    } finally {
      setLoading(false);
    }
  };



  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    receiveEmail: false,
    deliveryMethod: "store",

    province: "",
    provinceCode: "",
    ward: "",
    wardCode: "",

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


  // ===== PROVINCE / WARD (API v2) =====
  const [provinces, setProvinces] = useState([]);
  const [wards, setWards] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  // Lấy danh sách tỉnh/thành
  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const res = await fetch(
        "https://provinces.open-api.vn/api/v2/p"
      );
      const data = await res.json();
      setProvinces(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Không tải được danh sách tỉnh/thành");
      setProvinces([]);
    } finally {
      setLoadingProvinces(false);
    }
  };


  // Lấy xã/phường theo tỉnh
  const fetchWards = async (provinceCode) => {
    if (!provinceCode) return;

    setLoadingWards(true);
    try {
      const res = await fetch(
        `https://provinces.open-api.vn/api/v2/p/${provinceCode}?depth=2`
      );
      const data = await res.json();

      // ✅ API v2: wards nằm trực tiếp trong province
      setWards(Array.isArray(data?.wards) ? data.wards : []);
    } catch (e) {
      toast.error("Không tải được danh sách xã/phường");
      setWards([]);
    } finally {
      setLoadingWards(false);
    }
  };


  useEffect(() => {
    if (form.deliveryMethod === "home") {
      fetchProvinces();
    }
  }, [form.deliveryMethod]);
  useEffect(() => {
    if (form.provinceCode) {
      fetchWards(form.provinceCode);
    } else {
      setWards([]);
    }
  }, [form.provinceCode]);

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
  function WalletIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 7H21V17H3V7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
  function BankIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 11L12 3L21 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 11V19H19V11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }
  function CardIcon() { return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="5" width="20" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" /><path d="M2 10H22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>; }

  const updateForm = (patch) => setForm((s) => ({ ...s, ...patch }));

  const updateItem = (id, patch) => {
    setLocalCartItems(prev => prev.map(it => it.id === id ? { ...it, ...patch } : it));
  };

  const updateQuantity = (id, delta) => {
    updateItem(id, { quantity: Math.max(1, (localCartItems.find(i => i.id === id)?.quantity || 1) + delta) });
  };

  const toggleSelect = (id) => updateItem(id, { selected: !localCartItems.find(i => i.id === id)?.selected });

  const buildShippingAddress = () => {
    if (form.shippingAddress && form.shippingAddress.trim())
      return form.shippingAddress.trim();

    if (form.deliveryMethod === "home") {
      return [form.ward, form.province].filter(Boolean).join(", ");
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
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display text-gray-800 dark:text-gray-100 py-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Stepper */}
        <div className="mb-10 w-full max-w-4xl mx-auto">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 top-1/2 w-full h-0.5 bg-gray-200 dark:bg-gray-700 -z-10"></div>
            <div className="absolute left-0 top-1/2 w-1/2 h-0.5 bg-primary -z-10"></div>

            {/* Step 1: Cart - Completed */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-background-light dark:ring-background-dark">
                <span className="material-icons-outlined text-sm">check</span>
              </div>
              <span className="text-xs font-semibold text-primary hidden sm:block">Giỏ hàng</span>
            </div>

            {/* Step 2: Info - Current */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md ring-4 ring-background-light dark:ring-background-dark">
                2
              </div>
              <span className="text-xs font-semibold text-primary hidden sm:block">Thông tin</span>
            </div>

            {/* Step 3: Payment - Pending */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center font-bold text-sm ring-4 ring-background-light dark:ring-background-dark">
                3
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">Thanh toán</span>
            </div>

            {/* Step 4: Complete - Pending */}
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 flex items-center justify-center font-bold text-sm ring-4 ring-background-light dark:ring-background-dark">
                4
              </div>
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 hidden sm:block">Hoàn tất</span>
            </div>
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column - Forms */}
          <div className="lg:col-span-8 space-y-6">

            {/* Order Success Banner */}
            {createdOrder && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6">
                <div className="flex items-center gap-2 text-green-700 dark:text-green-400 font-semibold mb-3">
                  <span className="material-icons-outlined">check_circle</span>
                  Đặt hàng thành công
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Mã đơn:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{createdOrder.order_id ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Trạng thái:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{createdOrder.status ?? "—"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Tổng tiền:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">{formatPrice(createdOrder.total_price ?? 0)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Giảm giá:</span>
                    <span className="ml-2 font-medium text-red-600">-{formatPrice(createdOrder.discount ?? 0)}</span>
                  </div>
                  <div className="col-span-2 pt-3 border-t border-green-300 dark:border-green-700">
                    <span className="text-gray-600 dark:text-gray-400">Thành tiền:</span>
                    <span className="ml-2 font-bold text-lg text-secondary">{formatPrice(createdOrder.final_price)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Customer Info Section */}
            <section className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-icons-outlined text-primary">person</span>
                Thông tin khách hàng
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Họ và tên</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => updateForm({ name: e.target.value })}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-2.5 px-4"
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Số điện thoại</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm({ phone: e.target.value })}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-2.5 px-4"
                    placeholder="0901234567"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateForm({ email: e.target.value })}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-2.5 px-4"
                    placeholder="example@email.com"
                  />
                </div>
              </div>
            </section>

            {/* Shipping Section */}
            <section className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-icons-outlined text-primary">local_shipping</span>
                Thông tin nhận hàng
              </h2>

              {/* Delivery Method Toggle */}
              <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex mb-6">
                <button
                  onClick={() => updateForm({ deliveryMethod: "store" })}
                  className={`flex-1 py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${form.deliveryMethod === "store"
                      ? "bg-white dark:bg-gray-700 text-primary font-semibold shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                  <span className="material-icons-outlined text-sm">store</span>
                  Nhận tại cửa hàng
                </button>
                <button
                  onClick={() => updateForm({ deliveryMethod: "home" })}
                  className={`flex-1 py-2.5 px-4 rounded-lg transition-all flex items-center justify-center gap-2 ${form.deliveryMethod === "home"
                      ? "bg-white dark:bg-gray-700 text-primary font-semibold shadow-sm"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                >
                  <span className="material-icons-outlined text-sm">local_shipping</span>
                  Giao tận nơi
                </button>
              </div>

              <div className="space-y-4">
                {/* Store Selection */}
                {form.deliveryMethod === "store" && !form.shippingAddress && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Chọn cửa hàng</label>
                    <div className="relative">
                      <select
                        value={form.store}
                        onChange={(e) => updateForm({ store: e.target.value })}
                        className="w-full appearance-none rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-3 px-4 pr-10"
                      >
                        <option value="">Chọn cửa hàng</option>
                        <option value="TechStore Q1 - 123 Lê Lợi, TP.HCM">TechStore Q1 - 123 Lê Lợi, TP.HCM</option>
                        <option value="TechStore Q3 - 456 CMT8, TP.HCM">TechStore Q3 - 456 CMT8, TP.HCM</option>
                        <option value="TechStore Q7 - 789 Nguyễn Văn Linh, TP.HCM">TechStore Q7 - 789 Nguyễn Văn Linh, TP.HCM</option>
                      </select>
                      <span className="material-icons-outlined absolute right-3 top-3 text-gray-500 pointer-events-none">expand_more</span>
                    </div>
                  </div>
                )}

                {/* Home Delivery Address */}
                {form.deliveryMethod === "home" && !form.shippingAddress && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tỉnh/Thành phố</label>
                      <div className="relative">
                        <select
                          value={form.provinceCode}
                          onChange={(e) => {
                            const code = e.target.value;
                            const selected = provinces.find(p => String(p.code) === code);
                            updateForm({
                              provinceCode: code,
                              province: selected?.name || "",
                              ward: "",
                              wardCode: "",
                            });
                          }}
                          className="w-full appearance-none rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-3 px-4 pr-10"
                        >
                          <option value="">{loadingProvinces ? "Đang tải..." : "Chọn Tỉnh/Thành"}</option>
                          {provinces.map(p => (
                            <option key={p.code} value={p.code}>{p.name}</option>
                          ))}
                        </select>
                        <span className="material-icons-outlined absolute right-3 top-3 text-gray-500 pointer-events-none">expand_more</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Quận/Huyện/Phường</label>
                      <div className="relative">
                        <select
                          value={form.wardCode}
                          disabled={!form.provinceCode || loadingWards}
                          onChange={(e) => {
                            const code = e.target.value;
                            const selected = wards.find(w => String(w.code) === code);
                            updateForm({
                              wardCode: code,
                              ward: selected?.name || "",
                            });
                          }}
                          className="w-full appearance-none rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-3 px-4 pr-10 disabled:opacity-50"
                        >
                          <option value="">{loadingWards ? "Đang tải..." : "Chọn Quận/Huyện/Phường"}</option>
                          {wards.map(w => (
                            <option key={w.code} value={w.code}>{w.name}</option>
                          ))}
                        </select>
                        <span className="material-icons-outlined absolute right-3 top-3 text-gray-500 pointer-events-none">expand_more</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Note */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ghi chú</label>
                  <textarea
                    value={form.note}
                    onChange={(e) => updateForm({ note: e.target.value })}
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-2.5 px-4"
                    placeholder="Ghi chú thêm (Tùy chọn)"
                    rows="3"
                  />
                </div>
              </div>
            </section>

            {/* Payment Methods Section */}
            <section className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-icons-outlined text-primary">payments</span>
                Phương thức thanh toán
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* COD Payment */}
                <div
                  onClick={() => updateForm({ paymentMethod: "cod" })}
                  className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all hover:shadow-md ${form.paymentMethod === "cod"
                      ? "border-primary bg-blue-50/50 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50"
                    }`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`p-2 rounded-full shadow-sm ${form.paymentMethod === "cod"
                        ? "bg-white dark:bg-gray-800 text-primary"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}>
                      <span className="material-icons-outlined text-2xl">storefront</span>
                    </div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">Thanh toán khi nhận hàng</span>
                  </div>
                  {form.paymentMethod === "cod" && (
                    <div className="absolute top-2 right-2 text-primary">
                      <span className="material-icons-outlined text-lg">check_circle</span>
                    </div>
                  )}
                </div>

                {/* Bank Transfer */}
                <div
                  onClick={() => updateForm({ paymentMethod: "bank" })}
                  className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all hover:shadow-md ${form.paymentMethod === "bank"
                      ? "border-primary bg-blue-50/50 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50"
                    }`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`p-2 rounded-full shadow-sm ${form.paymentMethod === "bank"
                        ? "bg-white dark:bg-gray-800 text-primary"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                      }`}>
                      <span className="material-icons-outlined text-2xl">account_balance</span>
                    </div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">Chuyển khoản ngân hàng</span>
                  </div>
                  {form.paymentMethod === "bank" && (
                    <div className="absolute top-2 right-2 text-primary">
                      <span className="material-icons-outlined text-lg">check_circle</span>
                    </div>
                  )}
                </div>

                {/* MoMo */}
                <div
                  onClick={() => updateForm({ paymentMethod: "momo" })}
                  className={`relative cursor-pointer p-4 rounded-xl border-2 transition-all hover:shadow-md ${form.paymentMethod === "momo"
                      ? "border-primary bg-blue-50/50 dark:bg-primary/10"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50"
                    }`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div className={`p-2 rounded-full ${form.paymentMethod === "momo"
                        ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600"
                        : "bg-pink-100 dark:bg-pink-900/30 text-pink-600"
                      }`}>
                      <span className="material-icons-outlined text-2xl">account_balance_wallet</span>
                    </div>
                    <span className="font-semibold text-sm text-gray-900 dark:text-white">Ví MoMo</span>
                  </div>
                  {form.paymentMethod === "momo" && (
                    <div className="absolute top-2 right-2 text-primary">
                      <span className="material-icons-outlined text-lg">check_circle</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Invoice Section */}
            <section className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="material-icons-outlined text-primary">receipt_long</span>
                Xuất hóa đơn
              </h2>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="invoice"
                    value="no"
                    checked={form.needInvoice === "no"}
                    onChange={(e) => updateForm({ needInvoice: e.target.value })}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Không cần hóa đơn</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="invoice"
                    value="yes"
                    checked={form.needInvoice === "yes"}
                    onChange={(e) => updateForm({ needInvoice: e.target.value })}
                    className="w-4 h-4 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Cần xuất hóa đơn</span>
                </label>
              </div>

              {form.needInvoice === "yes" && (
                <div className="grid grid-cols-1 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <input
                    value={form.companyName}
                    onChange={(e) => updateForm({ companyName: e.target.value })}
                    placeholder="Tên công ty"
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-2.5 px-4"
                  />
                  <input
                    value={form.companyTax}
                    onChange={(e) => updateForm({ companyTax: e.target.value })}
                    placeholder="Mã số thuế"
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-2.5 px-4"
                  />
                  <input
                    value={form.companyAddress}
                    onChange={(e) => updateForm({ companyAddress: e.target.value })}
                    placeholder="Địa chỉ công ty"
                    className="w-full rounded-xl border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm py-2.5 px-4"
                  />
                </div>
              )}
            </section>

            {/* Back Button */}
            <div className="flex items-center justify-start">
              <button
                onClick={goBack}
                className="flex items-center gap-2 text-gray-500 hover:text-primary transition-colors font-medium"
              >
                <span className="material-icons-outlined text-sm">arrow_back</span>
                Quay lại giỏ hàng
              </button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-24 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 backdrop-blur-sm">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                  Đơn hàng ({computedSelected.length})
                </h3>

                {/* Cart Items */}
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {localCartItems.filter(item => item.selected).map(item => (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative w-16 h-16 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img
                          alt={item.name}
                          className="w-full h-full object-contain p-1"
                          src={item.image}
                        />
                        <span className="absolute bottom-0 right-0 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md font-bold">
                          x{item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white leading-tight mb-1 truncate">{item.name}</h4>
                        <p className="text-sm font-bold text-secondary">{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                  {localCartItems.filter(item => item.selected).length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Chưa có sản phẩm nào được chọn
                    </div>
                  )}
                </div>

                {/* Coupon */}
                <div className="mb-6">
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Mã giảm giá</label>
                  <div
                    onClick={() => setShowCouponModal(true)}
                    className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:border-primary/50 transition-all"
                  >
                    <span className="material-icons-outlined text-gray-400 text-lg">local_offer</span>
                    <div className="flex-1">
                      {appliedCoupon ? (
                        <span className="text-primary font-medium text-sm">{appliedCoupon.code}</span>
                      ) : (
                        <span className="text-gray-500 text-sm">Chọn hoặc nhập mã</span>
                      )}
                    </div>
                    <span className="text-secondary text-sm font-medium">Chọn ›</span>
                  </div>
                  {appliedCoupon && (
                    <div className="mt-2 text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                      <span className="material-icons-outlined text-sm">check_circle</span>
                      Giảm {formatPrice(discountAmount)}
                    </div>
                  )}
                </div>

                {/* Price Summary */}
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Tạm tính</span>
                    <span className="font-medium text-gray-900 dark:text-white">{formatPrice(computedTotalAmount)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Giảm giá</span>
                      <span className="font-medium text-green-600 dark:text-green-400">-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Phí vận chuyển</span>
                    <span className="font-medium text-green-600 dark:text-green-400">Miễn phí</span>
                  </div>
                  <div className="flex justify-between items-end pt-4 border-t border-dashed border-gray-200 dark:border-gray-700 mt-4">
                    <span className="text-base font-bold text-gray-900 dark:text-white">Tổng cộng</span>
                    <div className="text-right">
                      <span className="block text-2xl font-extrabold text-secondary">{formatPrice(finalAmount)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">(Đã bao gồm VAT)</span>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="w-full bg-primary hover:bg-blue-600 disabled:bg-gray-400 text-white font-bold text-lg py-4 rounded-xl shadow-lg shadow-blue-500/30 mt-8 transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <span className="material-icons-outlined animate-spin">sync</span>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      Xác nhận & Đặt hàng
                      <span className="material-icons-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </>
                  )}
                </button>

                {/* Security Badge */}
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400">
                  <span className="material-icons-outlined text-sm">verified_user</span>
                  Bảo mật thanh toán 100%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coupon Modal */}
      {showCouponModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-20 px-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl p-6 relative">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="material-icons-outlined text-primary">local_offer</span>
              Chọn mã giảm giá
            </h3>

            {loadingCoupons && (
              <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <span className="material-icons-outlined animate-spin text-sm">sync</span>
                Đang tải mã giảm giá...
              </div>
            )}

            <div className="space-y-3 max-h-[60vh] overflow-y-auto">
              {validCoupons.map(coupon => {
                const selected = appliedCoupon?.code === coupon.code;
                return (
                  <div
                    key={coupon.id}
                    onClick={() => {
                      if (coupon.disabled) return;
                      if (appliedCoupon?.code === coupon.code) {
                        setAppliedCoupon(null);
                        updateForm({ couponCode: "" });
                        toast.info(`Đã bỏ mã ${coupon.code}`);
                      } else {
                        updateForm({ couponCode: coupon.code });
                        applyCouponFromSelect(coupon);
                      }
                      setShowCouponModal(false);
                    }}
                    className={`
                      border rounded-xl p-4 cursor-pointer transition-all
                      ${selected ? "border-primary bg-blue-50 dark:bg-primary/10" : "border-gray-200 dark:border-gray-700"}
                      ${coupon.disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50 hover:shadow-sm"}
                    `}
                  >
                    <div className="flex justify-between items-center">
                      <div className="font-semibold text-primary">{coupon.code}</div>
                      {selected && <CheckCircle className="w-5 h-5 text-primary" />}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {coupon.discount_type === "PERCENT"
                        ? `Giảm ${coupon.discount_value}% (tối đa ${formatPrice(coupon.max_discount)})`
                        : `Giảm ${formatPrice(coupon.discount_value)}`}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      Đơn tối thiểu: {formatPrice(coupon.min_order_value || 0)}
                    </div>
                    {coupon.disabled && (
                      <div className="text-xs text-red-500 mt-1 flex items-center gap-1">
                        <span className="material-icons-outlined text-xs">error_outline</span>
                        {coupon.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowCouponModal(false)}
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccessModal && createdOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-8 text-center">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-icons-outlined text-4xl text-green-600">check_circle</span>
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Đặt hàng thành công!</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Mã đơn hàng: <span className="font-semibold text-primary">{createdOrder.order_id}</span></p>
            <div className="flex gap-3">
              <button
                onClick={closeModal}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
              >
                Đóng
              </button>
              <button
                onClick={viewOrder}
                className="flex-1 px-4 py-3 rounded-xl bg-primary hover:bg-blue-600 text-white font-medium transition-colors"
              >
                Xem đơn hàng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}