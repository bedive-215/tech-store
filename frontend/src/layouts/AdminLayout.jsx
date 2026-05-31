// src/layouts/AdminLayout.jsx
import React, { useState } from "react";
import Sidebar from "@/components/admin/Sidebar/index";
import AdminNavbar from "@/components/admin/Navbar/index";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden admin-light">
      {/* SIDEBAR */}
      <Sidebar active={sidebarOpen} mode="admin" />

      {/* MAIN AREA */}
      <div className="flex-1 flex flex-col overflow-auto">
        {/* NAVBAR: fixed top, full width */}
        <div className="fixed top-0 left-0 right-0 z-50">
          <AdminNavbar onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>

        {/* SPACER: để content không bị navbar che */}
        <div className="h-[64px]" /> {/* chiều cao navbar */}

        {/* CONTENT */}
        <main className="p-6 flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
