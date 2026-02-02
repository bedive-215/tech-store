import React, { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useOrder } from "@/providers/OrderProvider";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";

export default function AdminCoupons() {
  const { listCoupons, createCoupon, removeCoupon } = useOrder();
  const { token } = useAuth();

  const [coupons, setCoupons] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // ===============================
  // Form state (frontend)
  // ===============================
  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "PERCENT", // PERCENT | FIXED
    discount_value: 0,
    max_discount: 0,
    min_order_value: 0,
    quantity: 0,
    end_at: "",
  });

  // ===============================
  // Load danh sách coupon
  // ===============================
  const fetchData = async () => {
    try {
      setLoadingList(true);
      const res = await listCoupons({}, token);

      const list =
        res?.items ??
        res?.data ??
        res?.coupons ??
        (Array.isArray(res) ? res : []);

      setCoupons(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách coupon");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ===============================
  // Thêm coupon
  // ===============================
  const handleAdd = async () => {
    if (!newCoupon.code.trim()) {
      toast.error("Vui lòng nhập mã giảm giá!");
      return;
    }

    if (!newCoupon.end_at) {
      toast.error("Vui lòng chọn ngày hết hạn!");
      return;
    }

    try {
      const payload = {
        code: newCoupon.code.trim().toUpperCase(),
        discount_type: newCoupon.discount_type, // PERCENT | FIXED
        discount_value: Number(newCoupon.discount_value),
        max_discount: Number(newCoupon.max_discount),
        min_order_value: Number(newCoupon.min_order_value),
        quantity: Number(newCoupon.quantity),
        start_at: new Date().toISOString().slice(0, 19).replace("T", " "),
        end_at: new Date(newCoupon.end_at)
          .toISOString()
          .slice(0, 19)
          .replace("T", " "),
      };

      await createCoupon(payload, token);

      toast.success("Tạo mã giảm giá thành công!");
      fetchData();

      setNewCoupon({
        code: "",
        discount_type: "PERCENT",
        discount_value: 0,
        max_discount: 0,
        min_order_value: 0,
        quantity: 0,
        end_at: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Không thể tạo mã giảm giá");
    }
  };

  // ===============================
  // Xóa coupon
  // ===============================
  const handleDelete = async (couponId) => {
    try {
      const ok = await removeCoupon(couponId, token);
      if (ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen text-gray-900">
      <h1 className="text-3xl font-bold mb-4 text-gray-900">Quản lý mã giảm giá</h1>

      {/* FORM */}
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-xl font-semibold mb-4 text-orange-600">
          Thêm mã giảm giá mới
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* CODE */}
          <div>
            <label className="font-medium">Mã giảm giá</label>
            <input
              className="w-full px-4 py-2 border rounded-lg"
              value={newCoupon.code}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, code: e.target.value })
              }
            />
          </div>

          {/* TYPE */}
          <div>
            <label className="font-medium">Loại giảm giá</label>
            <select
              className="w-full px-4 py-2 border rounded-lg"
              value={newCoupon.discount_type}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, discount_type: e.target.value })
              }
            >
              <option value="PERCENT">Giảm theo %</option>
              <option value="FIXED">Giảm số tiền</option>
            </select>
          </div>

          {/* VALUE */}
          <div>
            <label className="font-medium">Giá trị giảm</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg"
              value={newCoupon.discount_value}
              onChange={(e) =>
                setNewCoupon({
                  ...newCoupon,
                  discount_value: Number(e.target.value),
                })
              }
            />
          </div>

          {/* MAX */}
          <div>
            <label className="font-medium">Giảm tối đa</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg"
              value={newCoupon.max_discount}
              onChange={(e) =>
                setNewCoupon({
                  ...newCoupon,
                  max_discount: Number(e.target.value),
                })
              }
            />
          </div>

          {/* MIN ORDER */}
          <div>
            <label className="font-medium">Đơn tối thiểu</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg"
              value={newCoupon.min_order_value}
              onChange={(e) =>
                setNewCoupon({
                  ...newCoupon,
                  min_order_value: Number(e.target.value),
                })
              }
            />
          </div>

          {/* QUANTITY */}
          <div>
            <label className="font-medium">Số lượt sử dụng</label>
            <input
              type="number"
              className="w-full px-4 py-2 border rounded-lg"
              value={newCoupon.quantity}
              onChange={(e) =>
                setNewCoupon({
                  ...newCoupon,
                  quantity: Number(e.target.value),
                })
              }
            />
          </div>

          {/* END DATE */}
          <div>
            <label className="font-medium">Ngày hết hạn</label>
            <input
              type="datetime-local"
              className="w-full px-4 py-2 border rounded-lg"
              value={newCoupon.end_at}
              onChange={(e) =>
                setNewCoupon({ ...newCoupon, end_at: e.target.value })
              }
            />
          </div>
        </div>

        <button
          onClick={handleAdd}
          className="mt-5 flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600"
        >
          <Plus size={18} /> Thêm mã giảm giá
        </button>
      </div>

      {/* LIST */}
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-xl font-semibold mb-4 text-orange-600">
          Danh sách mã giảm giá
        </h2>

        {loadingList ? (
          <p>Đang tải...</p>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Mã</th>
                <th className="px-4 py-3">Loại</th>
                <th className="px-4 py-3">Giá trị</th>
                <th className="px-4 py-3">Hết hạn</th>
                <th className="px-4 py-3">Hành động</th>
              </tr>
            </thead>

            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-b">
                  <td className="px-4 py-3">{c.code}</td>
                  <td className="px-4 py-3">{c.discount_type}</td>
                  <td className="px-4 py-3">{c.discount_value}</td>
                  <td className="px-4 py-3">{c.end_at}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-red-500 flex items-center gap-1"
                    >
                      <Trash2 size={16} /> Xóa
                    </button>
                  </td>
                </tr>
              ))}

              {coupons.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-gray-500">
                    Không có mã giảm giá
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
