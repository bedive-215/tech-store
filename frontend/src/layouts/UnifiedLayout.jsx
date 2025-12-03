import React, { useState, memo } from "react";
import UserSidebar from "../components/common/Sidebar/index";
import AdminSidebar from "../components/admin/Navbar/index";
import UserNavbar from "../components/common/Header/index";
import AdminNavbar from "../components/admin/Sidebar/index";

const UnifiedLayout = ({ children, mode = "user" }) => {
  const [open, setOpen] = useState(true);

  const Navbar = mode === "admin" ? AdminNavbar : UserNavbar;
  const Sidebar = mode === "admin" ? AdminSidebar : UserSidebar;

  return (
    <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
      {/* NAVBAR */}
      <Navbar onToggle={() => setOpen((v) => !v)} />

      {/* BODY */}
      <div className="flex items-start gap-5 transition-all duration-300">
        <Sidebar active={open} />

        <main className="flex-1 px-6 py-6 transition-all duration-300 max-[900px]:px-4">
          <div className="max-w-[1100px] mx-auto w-full">
            <div className="bg-white p-6 rounded-xl shadow-[0_10px_30px_rgba(8,12,20,0.06)] dark:bg-gray-900 dark:text-white">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default memo(UnifiedLayout);
