// src/pages/user/PaymentPage.jsx
// Redirect to CustomerInfo (checkout) since payment is handled through checkout flow
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function PaymentPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to checkout/cart - payment is handled through checkout flow
    navigate("/user/cart", { replace: true });
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Đang chuyển hướng...</p>
      </div>
    </div>
  );
}
