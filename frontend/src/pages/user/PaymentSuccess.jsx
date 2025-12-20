// src/pages/PaymentSuccess.jsx
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { CheckCircle } from "lucide-react";

export default function PaymentSuccess() {
  const query = new URLSearchParams(useLocation().search);
  const orderId = query.get("order_id");

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
        <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />

        <h1 className="text-3xl font-bold text-green-700 mb-2">
          Thanh toán thành công!
        </h1>

        <p className="text-gray-700 mb-6">
          Đơn hàng của bạn đã được xử lý thành công.
          <br />
          <span className="font-semibold">Mã đơn hàng: {orderId}</span>
        </p>

        <div className="flex justify-center gap-4">
          <Link
            to="/"
            className="px-4 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition"
          >
            Về trang chủ
          </Link>
          <Link
            to={`/user/orders`}
            className="px-4 py-2 rounded-xl bg-green-600 text-white hover:bg-green-700 transition"
          >
            Xem đơn hàng
          </Link>
        </div>
      </div>
    </div>
  );
}
