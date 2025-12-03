import React, { useState } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";

const initialDiscounts = [
  { id: 1, code: "NEWYEAR2025", type: "Giảm %", value: 10, active: true },
  { id: 2, code: "SHIPFREE", type: "Miễn phí vận chuyển", value: 0, active: true },
];

export default function AdminDiscounts() {
  const [discounts, setDiscounts] = useState(initialDiscounts);
  const [newDiscount, setNewDiscount] = useState({ code: "", type: "Giảm %", value: 0, active: true });

  const handleAdd = () => {
    if (!newDiscount.code) {
      alert("Vui lòng nhập mã giảm giá!");
      return;
    }
    const id = discounts.length ? discounts[discounts.length - 1].id + 1 : 1;
    setDiscounts([...discounts, { ...newDiscount, id }]);
    setNewDiscount({ code: "", type: "Giảm %", value: 0, active: true });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa mã giảm giá này?")) {
      setDiscounts(discounts.filter(d => d.id !== id));
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Quản lý mã giảm giá</h1>

      {/* Form tạo mới */}
      <div className="mb-6 bg-white p-6 rounded-xl shadow-md">
        <h2 className="font-semibold mb-4">Thêm mã giảm giá mới</h2>
        <div className="flex gap-4 flex-wrap">
          <input
            type="text"
            placeholder="Mã giảm giá"
            className="px-4 py-2 border rounded-lg flex-1"
            value={newDiscount.code}
            onChange={e => setNewDiscount({ ...newDiscount, code: e.target.value })}
          />

          <select
            className="px-4 py-2 border rounded-lg"
            value={newDiscount.type}
            onChange={e => setNewDiscount({ ...newDiscount, type: e.target.value })}
          >
            <option>Giảm %</option>
            <option>Giảm tiền</option>
            <option>Miễn phí vận chuyển</option>
          </select>

          <input
            type="number"
            placeholder="Giá trị"
            className="px-4 py-2 border rounded-lg w-32"
            value={newDiscount.value}
            onChange={e => setNewDiscount({ ...newDiscount, value: parseInt(e.target.value) || 0 })}
          />

          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition"
          >
            <Plus size={18} /> Thêm
          </button>
        </div>
      </div>

      {/* Table danh sách */}
      <div className="bg-white p-6 rounded-xl shadow-md overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-2 text-left">Mã giảm giá</th>
              <th className="px-4 py-2 text-left">Loại</th>
              <th className="px-4 py-2 text-left">Giá trị</th>
              <th className="px-4 py-2 text-left">Trạng thái</th>
              <th className="px-4 py-2 text-left">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {discounts.map(d => (
              <tr key={d.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-4 py-2">{d.code}</td>
                <td className="px-4 py-2">{d.type}</td>
                <td className="px-4 py-2">{d.type === "Giảm %" ? `${d.value}%` : d.value}</td>
                <td className="px-4 py-2">{d.active ? "Hoạt động" : "Không hoạt động"}</td>
                <td className="px-4 py-2 flex gap-2">
                  <button className="text-blue-500 hover:text-blue-700 flex items-center gap-1">
                    <Edit size={16} /> Sửa
                  </button>
                  <button
                    className="text-red-500 hover:text-red-700 flex items-center gap-1"
                    onClick={() => handleDelete(d.id)}
                  >
                    <Trash2 size={16} /> Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
