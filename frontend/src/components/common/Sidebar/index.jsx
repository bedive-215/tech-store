import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";

// Icons
import {
  Home,
  CreditCard,
  Coins,
  Users,
  Settings,
} from "lucide-react";

export default function Sidebar({ active = true, mode = "staff" }) {
  const [expanded, setExpanded] = useState(active);

  // USER (staff)
  const STAFF_ITEMS = [
    { key: "dashboard", label: "Trang Chủ", to: ROUTERS.USER.DASHBOARD, icon: <Home size={20} /> },
    { key: "payments", label: "Thanh toán", to: ROUTERS.USER.PAYMENTS, icon: <CreditCard size={20} /> },
  ];

  // ADMIN
  const ADMIN_ITEMS = [
    { key: "dashboard", label: "Trang chủ", to: ROUTERS.ADMIN.DASHBOARD, icon: <Home size={20} /> },
    { key: "subscriptions", label: "Quản lý dịch vụ", to: ROUTERS.ADMIN.SUBSCRIPTION_PLANS, icon: <Coins size={20} /> },
    { key: "users", label: "Người dùng", to: ROUTERS.ADMIN.USER_MANAGEMENT, icon: <Users size={20} /> },
  ];

  const items = mode === "admin" ? ADMIN_ITEMS : STAFF_ITEMS;
  const titleLabel = mode === "admin" ? "Admin" : "Staff";

  return (
    <aside
      className={`
        ${expanded ? "w-[260px]" : "w-[80px]"}
        bg-[rgba(6,16,37,0.95)] text-white
        flex flex-col justify-between
        py-4 px-3
        h-screen gap-3
        transition-all duration-300
        sticky top-0
      `}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 select-none">
          <div className="text-2xl w-11 h-11 grid place-items-center rounded-xl bg-[rgba(255,255,255,0.05)]">
            <Home size={22} />
          </div>

          {expanded && (
            <div className="font-bold text-[16px]">
              EV <span className="text-[#0f62fe] font-extrabold">{titleLabel}</span>
            </div>
          )}
        </div>

        {/* Collapse button */}
        <button
          onClick={() => setExpanded((v) => !v)}
          aria-label="Toggle sidebar"
          className={`
            ${expanded
              ? "w-9 h-9 text-[rgba(255,255,255,0.65)]"
              : "absolute right-[-18px] top-3 w-12 h-12 bg-[#0f62fe] text-white shadow-[0_8px_30px_rgba(15,98,254,0.18)] rounded-xl z-50"
            }
            grid place-items-center rounded-lg
            transition-all duration-200 hover:scale-105
          `}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            className={`${!expanded ? "rotate-180" : ""} transition-transform`}
          >
            <path
              d="M9 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* NAVIGATION */}
      <nav className="flex flex-col gap-1 mt-2">
        {items.map((i) => (
          <NavLink
            key={i.key}
            to={i.to}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200
              ${isActive
                ? "bg-[rgba(15,98,254,0.18)] text-white shadow-[inset_4px_0_0_#0f62fe]"
                : "text-white/60 hover:text-white hover:bg-[rgba(255,255,255,0.05)] hover:translate-x-[2px]"
              }`
            }
          >
            <span className="w-9 h-9 grid place-items-center text-white">{i.icon}</span>
            {expanded && <span className="text-[14px] font-semibold text-white">{i.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* FOOTER */}
      <div className="flex items-center justify-between pt-2 border-t border-dashed border-[rgba(255,255,255,0.03)]">
        <div className="text-[12px] text-white/45">{expanded ? "v1.0.0" : ""}</div>
        <div className="opacity-90 text-lg cursor-pointer">
          <Settings size={20} />
        </div>
      </div>
    </aside>
  );
}
