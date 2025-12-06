// src/components/common/Sidebar/index.jsx
import React from "react";
import { Home, Users, CreditCard, Box, Tag, Package } from "lucide-react"; 
import { useNavigate, useLocation } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";

export default function Sidebar({ active = true, mode = "admin" }) {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      label: "Dashboard",
      icon: <Home size={20} />,
      path: ROUTERS.ADMIN.DASHBOARD,
    },
    {
      label: "Quản lý người dùng",
      icon: <Users size={20} />,
      path: ROUTERS.ADMIN.USER_MANAGEMENT,
    },
    {
      label: "Gói đăng ký",
      icon: <CreditCard size={20} />,
      path: ROUTERS.ADMIN.SUBSCRIPTION_PLANS,
    },

    // 👉 THÊM MỤC QUẢN LÝ SẢN PHẨM
    {
      label: "Sản phẩm",
      icon: <Package size={20} />,
      path: ROUTERS.ADMIN.PRODUCTS,
    },

    {
      label: "Đơn hàng",
      icon: <Box size={20} />,
      path: "/admin/orders",
    },
    {
      label: "Mã giảm giá",
      icon: <Tag size={20} />,
      path: ROUTERS.ADMIN.DISCOUNTS,
    },
  ];

  return (
    <aside
      className={`bg-white h-screen shadow-md transition-all duration-300 flex flex-col ${
        active ? "w-64" : "w-20"
      }`}
    >
      {/* LOGO */}
      <div
        className={`flex items-center justify-center h-16 border-b ${
          active ? "px-4" : "px-0"
        }`}
      >
        <span
          className={`font-bold text-xl text-orange-500 transition-all duration-300 ${
            active ? "opacity-100" : "opacity-0"
          }`}
        >
          AdminPanel
        </span>
        {!active && <span className="text-orange-500 font-bold text-xl">A</span>}
      </div>

      {/* MENU */}
      <nav className="flex-1 mt-4">
        {menuItems.map((item, idx) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={idx}
              onClick={() => navigate(item.path)}
              className={`flex items-center gap-3 w-full px-4 py-3 transition-colors duration-200 rounded-r-lg ${
                isActive
                  ? "bg-orange-50 text-orange-500"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              {item.icon}
              {active && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <div className="px-4 py-4 border-t mt-auto">
        <button className="flex items-center gap-3 w-full px-4 py-3 transition-colors duration-200 rounded-lg text-gray-700 hover:bg-gray-100">
          <Users size={20} />
          {active && <span className="font-medium">Profile</span>}
        </button>
      </div>
    </aside>
  );
}
