// src/components/common/Header/index.jsx
import React, { useState } from "react";
import Logo from "@/assets/images/logo.png";

export default function Navbar({ onToggle }) {
  const [showProfile, setShowProfile] = useState(false);

  const toggleProfile = () => setShowProfile((prev) => !prev);

  // Tạo viết tắt tên tạm
  const initials = "??";

  return (
    <header className="h-[68px] sticky top-0 z-40 flex items-center justify-between px-6 bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
      {/* LEFT: Logo + Tên */}
      <div className="flex items-center gap-3 select-none cursor-pointer">
        <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md flex items-center justify-center bg-white">
          <img
            src={Logo}
            alt="Logo"
            className="max-w-full max-h-full object-contain"
          />
        </div>

        <div className="font-bold text-[18px] tracking-wide text-[#0f172a]">
          EV Charging
        </div>
      </div>

      {/* RIGHT: Avatar */}
      <div className="relative">
        <button
          onClick={toggleProfile}
          className="
            w-11 h-11 rounded-full 
            bg-gradient-to-br from-[#1e293b] to-[#0f172a] 
            flex items-center justify-center
            text-white font-bold text-[15px]
          "
          title="Profile"
        >
          {initials}
        </button>

        {/* POPUP tạm */}
        {showProfile && (
          <div
            className="
              absolute right-0 mt-4 w-64 bg-white rounded-xl 
              shadow-lg border border-gray-100 p-4
            "
          >
            <p className="text-center text-gray-700 text-sm">
              Profile popup (tạm)
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
