// src/components/common/AdminNavbar/index.jsx
import React, { useState } from "react";
import { Bell, User, Menu } from "lucide-react";

export default function AdminNavbar({ onToggle }) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">

        {/* Left: Hamburger + Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-gray-100 transition"
          >
            <Menu size={24} />
          </button>

          <div className="text-xl font-bold text-orange-500 cursor-pointer">
            AdminPanel
          </div>
        </div>

        {/* Right: Notifications + User */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button className="relative p-2 rounded-md hover:bg-gray-100 transition">
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* User profile */}
          <div className="relative">
            <button
              onClick={() => setShowProfile(!showProfile)}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition"
            >
              <User size={20} />
              <span className="font-medium text-gray-700">Admin</span>
            </button>

            {showProfile && (
              <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden z-50">
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 transition">
                  Profile
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 transition">
                  Settings
                </button>
                <button className="w-full text-left px-4 py-2 hover:bg-gray-100 transition">
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
