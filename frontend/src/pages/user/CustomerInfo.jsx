import React, { useState } from "react";
import { Store, MapPin, CreditCard, Wallet, Landmark } from "lucide-react";

export default function CustomerInfo({ cartItems, selectedItems, totalAmount, goBack, goPayment }) {
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    phone: "",
    email: "",
    receiveEmail: false,
    deliveryMethod: "store",
    province: "",
    district: "",
    store: "",
    note: "",
    needInvoice: "no",
    companyName: "",
    companyTax: "",
    companyAddress: "",
    paymentMethod: "cod",
  });

  const handleProceed = () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.email) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (
      customerInfo.deliveryMethod === "home" &&
      (!customerInfo.province || !customerInfo.district)
    ) {
      alert("Vui lòng chọn địa chỉ giao hàng!");
      return;
    }
    if (customerInfo.deliveryMethod === "store" && !customerInfo.store) {
      alert("Vui lòng chọn cửa hàng!");
      return;
    }
    if (!customerInfo.paymentMethod) {
      alert("Vui lòng chọn phương thức thanh toán!");
      return;
    }

    goPayment(customerInfo);
  };

  const paymentOptions = [
    { key: "cod", label: "Thanh toán khi nhận hàng", icon: <Wallet size={22} /> },
    { key: "bank", label: "Chuyển khoản ngân hàng", icon: <Landmark size={22} /> },
    { key: "momo", label: "Ví MoMo", icon: <CreditCard size={22} /> },
    { key: "vnpay", label: "VNPay", icon: <CreditCard size={22} /> },
    { key: "zalopay", label: "ZaloPay", icon: <CreditCard size={22} /> },
  ];

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#F3F4F6" }}>
      <div className="max-w-4xl mx-auto px-4">

        {/* Back button */}
        <button
          onClick={goBack}
          className="mb-6 px-4 py-2 rounded-lg"
          style={{
            backgroundColor: "#FFFFFF",
            color: "#F97316",
            border: `1px solid #F97316`,
          }}
        >
          ← Quay lại giỏ hàng
        </button>

        <div className="rounded-2xl shadow-lg p-8" style={{ backgroundColor: "#FFFFFF" }}>
          <h2 className="text-2xl font-bold mb-6">Thông Tin Đặt Hàng</h2>

          <div className="space-y-8">
            {/* Thông tin khách hàng */}
            <div>
              <h3 className="font-semibold mb-4 text-lg" style={{ color: "#F97316" }}>
                THÔNG TIN KHÁCH HÀNG
              </h3>

              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Họ và tên"
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{ borderColor: "#E5E7EB" }}
                />
                <input
                  type="tel"
                  placeholder="Số điện thoại"
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{ borderColor: "#E5E7EB" }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{ borderColor: "#E5E7EB" }}
                />

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={customerInfo.receiveEmail}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, receiveEmail: e.target.checked })
                    }
                    style={{ accentColor: "#F97316" }}
                  />
                  Nhận email ưu đãi
                </label>
              </div>
            </div>

            {/* Thông tin nhận hàng */}
            <div>
              <h3 className="font-semibold mb-4 text-lg" style={{ color: "#F97316" }}>
                THÔNG TIN NHẬN HÀNG
              </h3>

              <div className="flex gap-4 mb-4">
                <button
                  onClick={() => setCustomerInfo({ ...customerInfo, deliveryMethod: "store" })}
                  className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2"
                  style={{
                    backgroundColor:
                      customerInfo.deliveryMethod === "store" ? "#F97316" : "#FFFFFF",
                    color: customerInfo.deliveryMethod === "store" ? "#FFFFFF" : "#6B7280",
                    border: `2px solid ${
                      customerInfo.deliveryMethod === "store" ? "#F97316" : "#E5E7EB"
                    }`,
                  }}
                >
                  <Store size={20} />
                  Nhận tại cửa hàng
                </button>

                <button
                  onClick={() => setCustomerInfo({ ...customerInfo, deliveryMethod: "home" })}
                  className="flex-1 py-3 rounded-lg flex items-center justify-center gap-2"
                  style={{
                    backgroundColor:
                      customerInfo.deliveryMethod === "home" ? "#F97316" : "#FFFFFF",
                    color: customerInfo.deliveryMethod === "home" ? "#FFFFFF" : "#6B7280",
                    border: `2px solid ${
                      customerInfo.deliveryMethod === "home" ? "#F97316" : "#E5E7EB"
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
                    onChange={(e) => setCustomerInfo({ ...customerInfo, province: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <option value="">Chọn Tỉnh / Thành phố</option>
                    <option value="hcm">TP. Hồ Chí Minh</option>
                    <option value="hn">Hà Nội</option>
                  </select>
                  <select
                    value={customerInfo.district}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, district: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <option value="">Chọn Quận / Huyện</option>
                    <option value="q1">Quận 1</option>
                    <option value="q2">Quận 2</option>
                  </select>
                </div>
              ) : (
                <select
                  value={customerInfo.store}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, store: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border"
                  style={{ borderColor: "#E5E7EB" }}
                >
                  <option value="">Chọn cửa hàng</option>
                  <option value="store1">CellphoneS - Nguyễn Huệ</option>
                  <option value="store2">CellphoneS - Lê Lợi</option>
                </select>
              )}

              <textarea
                placeholder="Ghi chú"
                rows={3}
                value={customerInfo.note}
                onChange={(e) => setCustomerInfo({ ...customerInfo, note: e.target.value })}
                className="w-full px-4 py-3 rounded-lg border mt-4"
                style={{ borderColor: "#E5E7EB" }}
              />
            </div>

            {/* Hóa đơn */}
            <div>
              <h3 className="font-semibold mb-4">Xuất hóa đơn công ty?</h3>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="invoice"
                    value="yes"
                    checked={customerInfo.needInvoice === "yes"}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, needInvoice: e.target.value })
                    }
                    style={{ accentColor: "#F97316" }}
                  />
                  Có
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
                    style={{ accentColor: "#F97316" }}
                  />
                  Không
                </label>
              </div>

              {customerInfo.needInvoice === "yes" && (
                <div className="space-y-4 mt-4">
                  <input
                    type="text"
                    placeholder="Tên công ty"
                    value={customerInfo.companyName}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, companyName: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                  <input
                    type="text"
                    placeholder="Mã số thuế"
                    value={customerInfo.companyTax}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, companyTax: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                  <input
                    type="text"
                    placeholder="Địa chỉ công ty"
                    value={customerInfo.companyAddress}
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, companyAddress: e.target.value })
                    }
                    className="w-full px-4 py-3 rounded-lg border"
                    style={{ borderColor: "#E5E7EB" }}
                  />
                </div>
              )}
            </div>

            {/* Phương thức thanh toán */}
            <div>
              <h3 className="font-semibold mb-4 text-lg" style={{ color: "#F97316" }}>
                PHƯƠNG THỨC THANH TOÁN
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {paymentOptions.map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => setCustomerInfo({ ...customerInfo, paymentMethod: opt.key })}
                    className="p-4 rounded-xl border flex flex-col items-center gap-2"
                    style={{
                      backgroundColor:
                        customerInfo.paymentMethod === opt.key ? "#F97316" : "#FFFFFF",
                      color: customerInfo.paymentMethod === opt.key ? "#FFFFFF" : "#6B7280",
                      border: `2px solid ${
                        customerInfo.paymentMethod === opt.key ? "#F97316" : "#E5E7EB"
                      }`,
                    }}
                  >
                    {opt.icon}
                    <span className="font-medium text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              onClick={handleProceed}
              className="w-full py-4 rounded-xl font-semibold text-lg"
              style={{
                background: "linear-gradient(135deg, #F97316, #C2410C)",
                color: "#FFFFFF",
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
