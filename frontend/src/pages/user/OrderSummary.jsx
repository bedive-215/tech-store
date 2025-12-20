// File: src/pages/user/OrderSummary.jsx
import React from "react";
import { CheckCircle } from "lucide-react";

export default function OrderSummary({
  paymentOptions = [],
  paymentMethod = "cod",
  onSelectPayment = () => {},
  totalAmount = 0,
  computedSelected = [],
  formatPrice = (v) => v,
  loading = false,
  onSubmit = () => {},
  createdOrder = null,
  showSuccessModal = false,
  closeModal = () => {},
  viewOrder = () => {},
}) {
  return (
    <>
      <div>
        <h4 className="font-medium mb-2">Phương thức thanh toán</h4>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {paymentOptions.map(opt => (
            <button key={opt.key} type="button" onClick={() => onSelectPayment(opt.key)} className={`p-3 rounded border ${paymentMethod === opt.key ? "bg-orange-500 text-white" : "bg-white"}`}>
              <div className="flex items-center gap-2 justify-center">{opt.icon}<span>{opt.label}</span></div>
            </button>
          ))}
        </div>
      </div>

      {/* Summary & submit */}
      <div className="border-t pt-4">
        <div className="flex justify-between mb-3">
          <span>Sản phẩm ({computedSelected.length})</span>
          <span className="font-semibold">{formatPrice(totalAmount ?? (createdOrder?.final_price ?? 0))}</span>
        </div>

        <button onClick={onSubmit} disabled={loading} className="w-full py-3 rounded-xl font-semibold text-lg" style={{ background: "linear-gradient(135deg, #F97316, #C2410C)", color: "#FFF" }}>
          {loading ? "Đang xử lý..." : "Xác nhận & Đặt hàng"}
        </button>
      </div>

      {/* SUCCESS MODAL - HIỂN THỊ final_price */}
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
    </>
  );
}
