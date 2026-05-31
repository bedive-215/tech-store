import React, { useState, memo } from "react";
import AdminSidebar from "../components/admin/Navbar/index";
import AdminNavbar from "../components/admin/Sidebar/index";
import FloatingNavbar from "../components/common/FloatingNavbar";

const UnifiedLayout = ({ children, mode = "user" }) => {
  const [open, setOpen] = useState(true);

  // Admin mode uses old sidebar/navbar layout
  if (mode === "admin") {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col">
        <AdminNavbar onToggle={() => setOpen((v) => !v)} />
        <div className="flex items-start gap-5 transition-all duration-300">
          <AdminSidebar active={open} />
          <main className="flex-1 px-6 py-6 transition-all duration-300 max-[900px]:px-4">
            <div className="max-w-[1100px] mx-auto w-full">
              <div className="bg-[#1a1a1a] border border-white/10 p-6 rounded-xl text-white">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // User mode uses floating navbar with full dark layout
  return (
    <div className="min-h-screen bg-black flex flex-col">
      <FloatingNavbar />

      {/* Content with top padding for floating navbar */}
      <main className="flex-1 pt-24 px-4 md:px-8 lg:px-12 pb-8">
        {children}
      </main>
    </div>
  );
};

export default memo(UnifiedLayout);
