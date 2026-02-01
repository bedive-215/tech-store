// src/layouts/HomeLayout.jsx
// Layout đặc biệt cho trang Home - full-width, không có container wrapper
import React, { memo } from "react";
import UserNavbar from "../components/common/Header/index";

const HomeLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-[#f6f9fc] flex flex-col">
            {/* NAVBAR - same as UserLayout */}
            <UserNavbar />

            {/* CONTENT - Full width, no wrapper box */}
            <main className="flex-1 w-full">
                {children}
            </main>
        </div>
    );
};

export default memo(HomeLayout);
