import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";

// Fake data - bạn có thể thay bằng API
const revenueData = [
  { month: "Jan", revenue: 12000000 },
  { month: "Feb", revenue: 15000000 },
  { month: "Mar", revenue: 18000000 },
  { month: "Apr", revenue: 9000000 },
  { month: "May", revenue: 22000000 },
  { month: "Jun", revenue: 20000000 },
];

const ordersData = [
  { id: 1, customer: "Nguyen Van A", amount: 29990000, status: "Đang xử lý" },
  { id: 2, customer: "Tran Thi B", amount: 15990000, status: "Hoàn tất" },
  { id: 3, customer: "Le Van C", amount: 23990000, status: "Đang giao" },
  { id: 4, customer: "Pham Thi D", amount: 12000000, status: "Hoàn tất" },
];

export default function DashboardAdmin() {
  const [revenue, setRevenue] = useState([]);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    // Giả lập lấy dữ liệu từ API
    setRevenue(revenueData);
    setOrders(ordersData);
  }, []);

  const totalRevenue = revenue.reduce((sum, item) => sum + item.revenue, 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "Đang xử lý").length;

  return (
    <div style={{ padding: "20px", backgroundColor: "#F3F4F6", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
        Admin Dashboard
      </h1>

      {/* Cards thống kê */}
      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", marginBottom: "30px" }}>
        <div style={{
          flex: "1",
          minWidth: "200px",
          backgroundColor: "#FFFFFF",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}>
          <h3 style={{ fontSize: "16px", color: "#6B7280", marginBottom: "10px" }}>Doanh thu tổng</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#F97316" }}>
            {totalRevenue.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
          </p>
        </div>

        <div style={{
          flex: "1",
          minWidth: "200px",
          backgroundColor: "#FFFFFF",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}>
          <h3 style={{ fontSize: "16px", color: "#6B7280", marginBottom: "10px" }}>Tổng đơn hàng</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#F97316" }}>
            {totalOrders}
          </p>
        </div>

        <div style={{
          flex: "1",
          minWidth: "200px",
          backgroundColor: "#FFFFFF",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}>
          <h3 style={{ fontSize: "16px", color: "#6B7280", marginBottom: "10px" }}>Đơn đang xử lý</h3>
          <p style={{ fontSize: "24px", fontWeight: "bold", color: "#F97316" }}>
            {pendingOrders}
          </p>
        </div>
      </div>

      {/* Biểu đồ doanh thu */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        marginBottom: "30px",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>Doanh thu theo tháng</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={revenue}>
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => value.toLocaleString("vi-VN", { style: "currency", currency: "VND" })} />
            <Legend />
            <Bar dataKey="revenue" fill="#F97316" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Bảng đơn hàng */}
      <div style={{
        backgroundColor: "#FFFFFF",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: "bold", marginBottom: "20px" }}>Đơn hàng mới</h2>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#F3F4F6" }}>
              <th style={{ padding: "10px", borderBottom: "1px solid #E5E7EB" }}>ID</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #E5E7EB" }}>Khách hàng</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #E5E7EB" }}>Số tiền</th>
              <th style={{ padding: "10px", borderBottom: "1px solid #E5E7EB" }}>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td style={{ padding: "10px", borderBottom: "1px solid #E5E7EB" }}>{order.id}</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #E5E7EB" }}>{order.customer}</td>
                <td style={{ padding: "10px", borderBottom: "1px solid #E5E7EB" }}>
                  {order.amount.toLocaleString("vi-VN", { style: "currency", currency: "VND" })}
                </td>
                <td style={{ padding: "10px", borderBottom: "1px solid #E5E7EB" }}>{order.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
