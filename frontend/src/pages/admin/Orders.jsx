// src/pages/admin/Orders.jsx
import React, { useState, useEffect } from "react";

// Giả lập dữ liệu đơn hàng
const mockOrders = [
  {
    id: "ORD001",
    customer: "Nguyễn Văn A",
    total: 1200000,
    status: "Chưa xử lý",
    date: "2025-12-01",
  },
  {
    id: "ORD002",
    customer: "Trần Thị B",
    total: 2500000,
    status: "Đang giao",
    date: "2025-12-02",
  },
  {
    id: "ORD003",
    customer: "Lê Văn C",
    total: 980000,
    status: "Đã giao",
    date: "2025-12-03",
  },
];

export default function Orders() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    setOrders(mockOrders);
  }, []);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Quản lý Đơn hàng</h1>

      {/* Filter đơn giản */}
      <div className="flex gap-4 mb-4">
        <select className="px-4 py-2 border rounded-lg">
          <option value="">Tất cả trạng thái</option>
          <option value="pending">Chưa xử lý</option>
          <option value="shipping">Đang giao</option>
          <option value="completed">Đã giao</option>
        </select>
        <input
          type="text"
          placeholder="Tìm kiếm theo khách hàng hoặc mã đơn"
          className="px-4 py-2 border rounded-lg flex-1"
        />
      </div>

      {/* Table đơn hàng */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Mã đơn</th>
              <th className="px-4 py-2 border">Khách hàng</th>
              <th className="px-4 py-2 border">Tổng tiền</th>
              <th className="px-4 py-2 border">Trạng thái</th>
              <th className="px-4 py-2 border">Ngày đặt</th>
              <th className="px-4 py-2 border">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50">
                <td className="px-4 py-2 border">{order.id}</td>
                <td className="px-4 py-2 border">{order.customer}</td>
                <td className="px-4 py-2 border">{order.total.toLocaleString()}₫</td>
                <td className="px-4 py-2 border">{order.status}</td>
                <td className="px-4 py-2 border">{order.date}</td>
                <td className="px-4 py-2 border">
                  <button className="px-3 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
                    Xem chi tiết
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
