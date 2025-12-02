import React, { useState } from "react";
import { ShoppingCart, Trash2, Plus, Minus, Package, CreditCard, MapPin, Store } from "lucide-react";

const COLORS = {
  primary: "#F97316",
  primaryHover: "#EA580C",
  primaryGradientStart: "#F97316",
  primaryGradientEnd: "#C2410C",
  secondary: "#FCD34D",
  secondaryHover: "#FBBF24",
  bgLight: "#FFFFFF",
  bgDark: "#1F2937",
  bgGrayLight: "#F3F4F6",
  bgGrayDark: "#374151",
  textLight: "#111827",
  textDark: "#F9FAFB",
  textGray: "#6B7280",
  borderLight: "#E5E7EB",
  borderDark: "#4B5563",
  error: "#F87171",
  white: "#FFFFFF",
  black: "#000000",
};

export default function Cart() {
  const [step, setStep] = useState(1); // 1: Cart, 2: Info, 3: Payment
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "iPhone 15 Pro Max 256GB",
      price: 29990000,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1592286927505-b0c4d0c5d6cc?w=200&h=200&fit=crop",
      selected: true,
    },
    {
      id: 2,
      name: "Samsung Galaxy S24 Ultra",
      price: 27990000,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200&h=200&fit=crop",
      selected: true,
    },
  ]);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    receiveEmail: false,
    deliveryMethod: "store", // store or home
    province: "",
    district: "",
    store: "",
    note: "",
    needInvoice: "no",
    companyName: "",
    companyTax: "",
    companyAddress: "",
  });

  const updateQuantity = (id, delta) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const toggleSelect = (id) => {
    setCartItems(
      cartItems.map((item) =>
        item.id === id ? { ...item, selected: !item.selected } : item
      )
    );
  };

  const removeItem = (id) => {
    setCartItems(cartItems.filter((item) => item.id !== id));
  };

  const selectedItems = cartItems.filter((item) => item.selected);
  const totalAmount = selectedItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  const handleProceedToInfo = () => {
    if (selectedItems.length === 0) {
      alert("Vui lòng chọn ít nhất một sản phẩm!");
      return;
    }
    setStep(2);
  };

  const handleProceedToPayment = () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.email) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (customerInfo.deliveryMethod === "home" && (!customerInfo.province || !customerInfo.district)) {
      alert("Vui lòng chọn địa chỉ giao hàng!");
      return;
    }
    if (customerInfo.deliveryMethod === "store" && !customerInfo.store) {
      alert("Vui lòng chọn cửa hàng!");
      return;
    }
    setStep(3);
  };

  // Step 1: Cart
  if (step === 1) {
    return (
      <div className="min-h-screen py-8" style={{ backgroundColor: COLORS.bgGrayLight }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-3 mb-8">
            <ShoppingCart size={32} style={{ color: COLORS.primary }} />
            <h1 className="text-3xl font-bold" style={{ color: COLORS.textLight }}>
              Giỏ Hàng Của Bạn
            </h1>
          </div>

          {cartItems.length === 0 ? (
            <div
              className="rounded-2xl shadow-lg p-12 text-center"
              style={{ backgroundColor: COLORS.bgLight }}
            >
              <Package size={64} style={{ color: COLORS.textGray, margin: "0 auto 1rem" }} />
              <p className="text-xl" style={{ color: COLORS.textGray }}>
                Giỏ hàng trống
              </p>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl shadow-md p-4 flex gap-4"
                    style={{
                      backgroundColor: COLORS.bgLight,
                      border: `2px solid ${item.selected ? COLORS.primary : COLORS.borderLight}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={() => toggleSelect(item.id)}
                      className="w-5 h-5 mt-2 cursor-pointer"
                      style={{ accentColor: COLORS.primary }}
                    />
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2" style={{ color: COLORS.textLight }}>
                        {item.name}
                      </h3>
                      <p className="font-bold text-xl mb-3" style={{ color: COLORS.primary }}>
                        {formatPrice(item.price)}
                      </p>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: COLORS.bgGrayLight,
                            color: COLORS.textLight,
                          }}
                        >
                          <Minus size={16} />
                        </button>
                        <span className="font-semibold w-12 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                          style={{
                            backgroundColor: COLORS.primary,
                            color: COLORS.white,
                          }}
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="self-start p-2 rounded-lg hover:opacity-80 transition-opacity"
                      style={{ color: COLORS.error }}
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              <div className="lg:col-span-1">
                <div
                  className="rounded-xl shadow-lg p-6 sticky top-4"
                  style={{ backgroundColor: COLORS.bgLight }}
                >
                  <h2 className="text-xl font-bold mb-4" style={{ color: COLORS.textLight }}>
                    Tóm Tắt Đơn Hàng
                  </h2>
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.textGray }}>
                        Sản phẩm đã chọn:
                      </span>
                      <span className="font-semibold">{selectedItems.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: COLORS.textGray }}>Tạm tính:</span>
                      <span className="font-semibold">{formatPrice(totalAmount)}</span>
                    </div>
                  </div>
                  <div
                    className="border-t pt-4 mb-6"
                    style={{ borderColor: COLORS.borderLight }}
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold">Tổng cộng:</span>
                      <span className="text-2xl font-bold" style={{ color: COLORS.primary }}>
                        {formatPrice(totalAmount)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={handleProceedToInfo}
                    className="w-full py-3 rounded-xl font-semibold text-lg transition-all hover:shadow-lg"
                    style={{
                      background: `linear-gradient(135deg, ${COLORS.primaryGradientStart}, ${COLORS.primaryGradientEnd})`,
                      color: COLORS.white,
                    }}
                  >
                    Tiếp Tục Mua Hàng
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Step 2: Customer Info
  if (step === 2) {
    return (
      <div className="min-h-screen py-8" style={{ backgroundColor: COLORS.bgGrayLight }}>
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => setStep(1)}
            className="mb-6 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: COLORS.bgLight,
              color: COLORS.primary,
              border: `1px solid ${COLORS.primary}`,
            }}
          >
            ← Quay lại giỏ hàng
          </button>

          <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: COLORS.bgLight }}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: COLORS.textLight }}>
              Thông Tin Đặt Hàng
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4 text-lg" style={{ color: COLORS.primary }}>
                  THÔNG TIN KHÁCH HÀNG
                </h3>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="Họ và tên"
                    value={customerInfo.name}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border outline-none focus:border-2 transition-colors"
                    style={{
                      backgroundColor: COLORS.bgLight,
                      borderColor: COLORS.borderLight,
                      color: COLORS.textLight,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                    onBlur={(e) => (e.target.style.borderColor = COLORS.borderLight)}
                  />
                  <input
                    type="tel"
                    placeholder="Số điện thoại"
                    value={customerInfo.phone}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border outline-none focus:border-2 transition-colors"
                    style={{
                      backgroundColor: COLORS.bgLight,
                      borderColor: COLORS.borderLight,
                      color: COLORS.textLight,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                    onBlur={(e) => (e.target.style.borderColor = COLORS.borderLight)}
                  />
                  <input
                    type="email"
                    placeholder="Email (*) Hóa đơn VAT sẽ được gửi qua email này"
                    value={customerInfo.email}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, email: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border outline-none focus:border-2 transition-colors"
                    style={{
                      backgroundColor: COLORS.bgLight,
                      borderColor: COLORS.borderLight,
                      color: COLORS.textLight,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = COLORS.primary)}
                    onBlur={(e) => (e.target.style.borderColor = COLORS.borderLight)}
                  />
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={customerInfo.receiveEmail}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, receiveEmail: e.target.checked })
                      }
                      style={{ accentColor: COLORS.primary }}
                    />
                    <span style={{ color: COLORS.textGray }}>
                      Nhận email thông báo và ưu đãi
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-lg" style={{ color: COLORS.primary }}>
                  THÔNG TIN NHẬN HÀNG
                </h3>
                <div className="flex gap-4 mb-4">
                  <button
                    onClick={() =>
                      setCustomerInfo({ ...customerInfo, deliveryMethod: "store" })
                    }
                    className="flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor:
                        customerInfo.deliveryMethod === "store"
                          ? COLORS.primary
                          : COLORS.bgLight,
                      color:
                        customerInfo.deliveryMethod === "store"
                          ? COLORS.white
                          : COLORS.textGray,
                      border: `2px solid ${
                        customerInfo.deliveryMethod === "store"
                          ? COLORS.primary
                          : COLORS.borderLight
                      }`,
                    }}
                  >
                    <Store size={20} />
                    Nhận tại cửa hàng
                  </button>
                  <button
                    onClick={() =>
                      setCustomerInfo({ ...customerInfo, deliveryMethod: "home" })
                    }
                    className="flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2"
                    style={{
                      backgroundColor:
                        customerInfo.deliveryMethod === "home"
                          ? COLORS.primary
                          : COLORS.bgLight,
                      color:
                        customerInfo.deliveryMethod === "home"
                          ? COLORS.white
                          : COLORS.textGray,
                      border: `2px solid ${
                        customerInfo.deliveryMethod === "home"
                          ? COLORS.primary
                          : COLORS.borderLight
                      }`,
                    }}
                  >
                    <MapPin size={20} />
                    Giao hàng tận nơi
                  </button>
                </div>

                {customerInfo.deliveryMethod === "home" ? (
                  <div className="space-y-4">
                    <select
                      value={customerInfo.province}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, province: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border outline-none"
                      style={{
                        backgroundColor: COLORS.bgLight,
                        borderColor: COLORS.borderLight,
                        color: COLORS.textLight,
                      }}
                    >
                      <option value="">Chọn Tỉnh / Thành phố</option>
                      <option value="hcm">TP. Hồ Chí Minh</option>
                      <option value="hn">Hà Nội</option>
                    </select>
                    <select
                      value={customerInfo.district}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, district: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border outline-none"
                      style={{
                        backgroundColor: COLORS.bgLight,
                        borderColor: COLORS.borderLight,
                        color: COLORS.textLight,
                      }}
                    >
                      <option value="">Chọn Quận / Huyện</option>
                      <option value="q1">Quận 1</option>
                      <option value="q2">Quận 2</option>
                    </select>
                  </div>
                ) : (
                  <select
                    value={customerInfo.store}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, store: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border outline-none"
                    style={{
                      backgroundColor: COLORS.bgLight,
                      borderColor: COLORS.borderLight,
                      color: COLORS.textLight,
                    }}
                  >
                    <option value="">Chọn cửa hàng</option>
                    <option value="store1">CellphoneS - Nguyễn Huệ</option>
                    <option value="store2">CellphoneS - Lê Lợi</option>
                  </select>
                )}

                <textarea
                  placeholder="Ghi chú"
                  value={customerInfo.note}
                  onChange={(e) =>
                    setCustomerInfo({ ...customerInfo, note: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border outline-none mt-4"
                  style={{
                    backgroundColor: COLORS.bgLight,
                    borderColor: COLORS.borderLight,
                    color: COLORS.textLight,
                  }}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-4" style={{ color: COLORS.textLight }}>
                  Quý khách có muốn xuất hóa đơn công ty không?
                </h3>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoice"
                      value="yes"
                      checked={customerInfo.needInvoice === "yes"}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, needInvoice: e.target.value })
                      }
                      style={{ accentColor: COLORS.primary }}
                    />
                    <span>Có</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="invoice"
                      value="no"
                      checked={customerInfo.needInvoice === "no"}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, needInvoice: e.target.value })
                      }
                      style={{ accentColor: COLORS.primary }}
                    />
                    <span>Không</span>
                  </label>
                </div>

                {customerInfo.needInvoice === "yes" && (
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Tên công ty"
                      value={customerInfo.companyName}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, companyName: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border outline-none"
                      style={{
                        backgroundColor: COLORS.bgLight,
                        borderColor: COLORS.borderLight,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Mã số thuế"
                      value={customerInfo.companyTax}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, companyTax: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border outline-none"
                      style={{
                        backgroundColor: COLORS.bgLight,
                        borderColor: COLORS.borderLight,
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Địa chỉ công ty"
                      value={customerInfo.companyAddress}
                      onChange={(e) =>
                        setCustomerInfo({ ...customerInfo, companyAddress: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-lg border outline-none"
                      style={{
                        backgroundColor: COLORS.bgLight,
                        borderColor: COLORS.borderLight,
                      }}
                    />
                  </div>
                )}
              </div>

              <button
                onClick={handleProceedToPayment}
                className="w-full py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${COLORS.primaryGradientStart}, ${COLORS.primaryGradientEnd})`,
                  color: COLORS.white,
                }}
              >
                Tiếp Tục Thanh Toán
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Payment
  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: COLORS.bgGrayLight }}>
      <div className="max-w-4xl mx-auto px-4">
        <button
          onClick={() => setStep(2)}
          className="mb-6 px-4 py-2 rounded-lg transition-colors"
          style={{
            backgroundColor: COLORS.bgLight,
            color: COLORS.primary,
            border: `1px solid ${COLORS.primary}`,
          }}
        >
          ← Quay lại thông tin
        </button>

        <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: COLORS.bgLight }}>
          <div className="flex items-center gap-3 mb-6">
            <CreditCard size={32} style={{ color: COLORS.primary }} />
            <h2 className="text-2xl font-bold" style={{ color: COLORS.textLight }}>
              Thanh Toán
            </h2>
          </div>

          <div className="space-y-6">
            <div className="p-6 rounded-lg" style={{ backgroundColor: COLORS.bgGrayLight }}>
              <h3 className="font-semibold mb-4">Thông tin đơn hàng</h3>
              <div className="space-y-2">
                {selectedItems.map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.name} x{item.quantity}
                    </span>
                    <span className="font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className="border-t mt-4 pt-4"
                style={{ borderColor: COLORS.borderLight }}
              >
                <div className="flex justify-between text-xl font-bold">
                  <span>Tổng cộng:</span>
                  <span style={{ color: COLORS.primary }}>{formatPrice(totalAmount)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Phương thức thanh toán</h3>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer hover:border-opacity-60 transition-colors"
                  style={{ borderColor: COLORS.borderLight }}>
                  <input type="radio" name="payment" style={{ accentColor: COLORS.primary }} />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer hover:border-opacity-60 transition-colors"
                  style={{ borderColor: COLORS.borderLight }}>
                  <input type="radio" name="payment" style={{ accentColor: COLORS.primary }} />
                  <span>Chuyển khoản ngân hàng</span>
                </label>
                <label className="flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer hover:border-opacity-60 transition-colors"
                  style={{ borderColor: COLORS.borderLight }}>
                  <input type="radio" name="payment" style={{ accentColor: COLORS.primary }} />
                  <span>Thanh toán qua ví điện tử</span>
                </label>
              </div>
            </div>

            <button
              onClick={() => alert("Đặt hàng thành công!")}
              className="w-full py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${COLORS.primaryGradientStart}, ${COLORS.primaryGradientEnd})`,
                color: COLORS.white,
              }}
            >
              Hoàn Tất Đặt Hàng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}