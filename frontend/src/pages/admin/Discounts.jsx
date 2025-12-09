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

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    discount_type: "percent",
    discount_value: 0,
    max_discount: 0,
    min_order: 0,
    usage_limit: 0,
    expires_at: "",
  });

  // =======================================
  // Load danh sách coupon
  // =======================================
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

  // =======================================
  // Thêm coupon
  // =======================================
  const handleAdd = async () => {
    if (!newCoupon.code.trim()) {
      toast.error("Vui lòng nhập mã giảm giá!");
      return;
    }
    if (!newCoupon.expires_at) {
      toast.error("Vui lòng chọn ngày hết hạn!");
      return;
    }

    try {
      const payload = {
        ...newCoupon,
        expires_at: new Date(newCoupon.expires_at).toISOString(),
      };

      await createCoupon(payload, token);
      toast.success("Tạo mã giảm giá thành công!");

      fetchData();
      setNewCoupon({
        code: "",
        discount_type: "percent",
        discount_value: 0,
        max_discount: 0,
        min_order: 0,
        usage_limit: 0,
        expires_at: "",
      });
    } catch (err) {
      console.error(err);
      toast.error("Không thể tạo mã giảm giá");
    }
  };

  // =======================================
  // Xoá coupon
  // =======================================
const handleDelete = async (coupon_id) => {
  try {
    const ok = await removeCoupon(coupon_id, token); // <-- truyền ID trực tiếp
    if (ok) fetchData();
  } catch (err) {
    console.error(err);
  }
};



 return (
  <div className="p-6 space-y-6">
    <h1 className="text-3xl font-bold mb-4">Quản lý mã giảm giá</h1>

    {/* FORM TẠO MÃ GIẢM GIÁ */}
    <div className="bg-white p-6 rounded-xl shadow-md border">
      <h2 className="text-xl font-semibold mb-4 text-orange-600">
        Thêm mã giảm giá mới
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* CODE */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Mã giảm giá</label>
          <input
            type="text"
            className="px-4 py-2 border rounded-lg"
            value={newCoupon.code}
            onChange={(e) =>
              setNewCoupon({
                ...newCoupon,
                code: e.target.value.toUpperCase(),
              })
            }
          />
        </div>

        {/* TYPE */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Loại giảm giá</label>
          <select
            className="px-4 py-2 border rounded-lg"
            value={newCoupon.discount_type}
            onChange={(e) =>
              setNewCoupon({ ...newCoupon, discount_type: e.target.value })
            }
          >
            <option value="percent">Giảm theo %</option>
            <option value="amount">Giảm số tiền</option>
          </select>
        </div>

        {/* VALUE */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Giá trị giảm</label>
          <input
            type="number"
            placeholder={
              newCoupon.discount_type === "percent"
                ? "VD: 10 (%)"
                : "VD: 100000 (đ)"
            }
            className="px-4 py-2 border rounded-lg"
            value={newCoupon.discount_value}
            onChange={(e) =>
              setNewCoupon({
                ...newCoupon,
                discount_value: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        {/* MAX DISCOUNT */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Giảm tối đa</label>
          <input
            type="number"
            placeholder="VD: 100000"
            className="px-4 py-2 border rounded-lg"
            value={newCoupon.max_discount}
            onChange={(e) =>
              setNewCoupon({
                ...newCoupon,
                max_discount: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        {/* MIN ORDER */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Giá trị đơn hàng tối thiểu</label>
          <input
            type="number"
            placeholder="VD: 200000"
            className="px-4 py-2 border rounded-lg"
            value={newCoupon.min_order}
            onChange={(e) =>
              setNewCoupon({
                ...newCoupon,
                min_order: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        {/* USAGE LIMIT */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Giới hạn lượt sử dụng</label>
          <input
            type="number"
            placeholder="VD: 50 lượt"
            className="px-4 py-2 border rounded-lg"
            value={newCoupon.usage_limit}
            onChange={(e) =>
              setNewCoupon({
                ...newCoupon,
                usage_limit: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        {/* EXPIRED AT */}
        <div className="flex flex-col">
          <label className="mb-1 font-medium">Ngày hết hạn</label>
          <input
            type="datetime-local"
            className="px-4 py-2 border rounded-lg"
            value={newCoupon.expires_at}
            onChange={(e) =>
              setNewCoupon({
                ...newCoupon,
                expires_at: e.target.value,
              })
            }
          />
        </div>
      </div>

      <button
        onClick={handleAdd}
        className="mt-5 flex items-center gap-2 bg-orange-500 text-white px-5 py-2 rounded-lg hover:bg-orange-600 transition"
      >
        <Plus size={18} /> Thêm mã giảm giá
      </button>
    </div>

    {/* DANH SÁCH COUPON */}
    <div className="bg-white p-6 rounded-xl shadow-md border overflow-x-auto">
      <h2 className="text-xl font-semibold mb-4 text-orange-600">Danh sách mã giảm giá</h2>

      {loadingList ? (
        <p>Đang tải...</p>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-gray-700">
              <th className="px-4 py-3 text-left">Mã</th>
              <th className="px-4 py-3 text-left">Loại</th>
              <th className="px-4 py-3 text-left">Giá trị</th>
              <th className="px-4 py-3 text-left">Giảm tối đa</th>
              <th className="px-4 py-3 text-left">Đơn tối thiểu</th>
              <th className="px-4 py-3 text-left">Giới hạn</th>
              <th className="px-4 py-3 text-left">Hết hạn</th>
              <th className="px-4 py-3 text-left">Hành động</th>
            </tr>
          </thead>

          <tbody>
            {coupons.map((c, index) => (
              <tr
                key={c.id || c.code || index}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="px-4 py-3">{c.code}</td>

                <td className="px-4 py-3">
                  {c.discount_type === "percent" ? "Giảm %" : "Giảm tiền"}
                </td>

                <td className="px-4 py-3">
                  {c.discount_type === "percent"
                    ? `${c.discount_value}%`
                    : c.discount_value.toLocaleString() + "đ"}
                </td>

                <td className="px-4 py-3">
                  {c.max_discount?.toLocaleString()}đ
                </td>

                <td className="px-4 py-3">
                  {c.min_order?.toLocaleString()}đ
                </td>

                <td className="px-4 py-3">{c.usage_limit}</td>

                <td className="px-4 py-3">
                  {c.expires_at?.split("T")[0]}
                </td>

                <td className="px-4 py-3">
                  <button
                    className="text-red-500 hover:text-red-700 flex items-center gap-1"
                    onClick={() => handleDelete(c.id || c.coupon_id)}
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </td>
              </tr>
            ))}

            {coupons.length === 0 && (
              <tr>
                <td colSpan="8" className="text-center py-4 text-gray-500">
                  Không có mã giảm giá nào
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
