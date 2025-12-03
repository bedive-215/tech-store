import React, { useState } from "react";
import { ShoppingCart, Trash2, Plus, Minus, Package } from "lucide-react";
import CustomerInfo from "./CustomerInfo";

export default function Cart() {
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

  const [step, setStep] = useState(1);
  const [cartItems, setCartItems] = useState([
    {
      id: 1,
      name: "iPhone 15 Pro Max 256GB",
      price: 29990000,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1592286927505-b0c4d0c5d6cc?w=200",
      selected: true,
    },
    {
      id: 2,
      name: "Samsung Galaxy S24 Ultra",
      price: 27990000,
      quantity: 1,
      image: "https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=200",
      selected: true,
    },
  ]);

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

  if (step === 2) {
    return (
      <CustomerInfo
        cartItems={cartItems}
        selectedItems={selectedItems}
        totalAmount={totalAmount}
        COLORS={COLORS}
        goBack={() => setStep(1)}
        goPayment={() => setStep(3)}
      />
    );
  }

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
          <div className="rounded-2xl shadow-lg p-12 text-center" style={{ backgroundColor: COLORS.bgLight }}>
            <Package size={64} style={{ color: COLORS.textGray, margin: "0 auto 1rem" }} />
            <p className="text-xl" style={{ color: COLORS.textGray }}>Giỏ hàng trống</p>
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

                  <img src={item.image} className="w-24 h-24 rounded-lg object-cover" />

                  <div className="flex-1">
                    <h3 className="font-semibold text-lg" style={{ color: COLORS.textLight }}>
                      {item.name}
                    </h3>
                    <p className="font-bold text-xl mb-3" style={{ color: COLORS.primary }}>
                      {formatPrice(item.price)}
                    </p>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: COLORS.bgGrayLight }}
                      >
                        <Minus size={16} />
                      </button>

                      <span className="font-semibold w-12 text-center">{item.quantity}</span>

                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: COLORS.primary, color: COLORS.white }}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    className="self-start p-2"
                    style={{ color: COLORS.error }}
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div>
              <div className="rounded-xl shadow-lg p-6 sticky top-4" style={{ backgroundColor: COLORS.bgLight }}>
                <h2 className="text-xl font-bold mb-4">Tóm Tắt Đơn Hàng</h2>

                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <span>Sản phẩm đã chọn:</span>
                    <span className="font-semibold">{selectedItems.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tạm tính:</span>
                    <span className="font-semibold">{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <div className="border-t pt-4 mb-6" style={{ borderColor: COLORS.borderLight }}>
                  <div className="flex justify-between text-xl font-bold">
                    <span>Tổng cộng:</span>
                    <span style={{ color: COLORS.primary }}>{formatPrice(totalAmount)}</span>
                  </div>
                </div>

                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3 rounded-xl font-semibold"
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
