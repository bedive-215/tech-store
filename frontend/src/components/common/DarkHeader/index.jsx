// src/components/common/DarkHeader/index.jsx
// Floating dark header for Group 7 Tech Store
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/providers/CartProvider";

export default function DarkHeader() {
    const navigate = useNavigate();
    const { getTotalQuantity } = useCart();
    const cartCount = getTotalQuantity();
    const isLoggedIn = !!localStorage.getItem("access_token");

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center gap-6 shadow-2xl transition-all duration-300 hover:bg-black/80">
            <Link to="/user/home" className="text-white font-semibold flex items-center gap-2">
                <span className="text-xl font-bold text-[#2997ff]">Group 7</span>
            </Link>
            <div className="h-4 w-px bg-white/20" />
            <Link to="/user/category/dien-thoai" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Điện thoại</Link>
            <Link to="/user/category/laptop" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Laptop</Link>
            <Link to="/user/category/tai-nghe" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Phụ kiện</Link>
            <div className="h-4 w-px bg-white/20" />
            <Link to="/user/cart" className="text-gray-300 hover:text-white transition-colors relative">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
                {cartCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#2997ff] text-[10px] font-bold rounded-full flex items-center justify-center text-white">
                        {cartCount > 9 ? '9+' : cartCount}
                    </span>
                )}
            </Link>
            {isLoggedIn ? (
                <Link to="/user/profile" className="text-gray-300 hover:text-white transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                </Link>
            ) : (
                <Link to="/login" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                    Đăng nhập
                </Link>
            )}
        </nav>
    );
}
