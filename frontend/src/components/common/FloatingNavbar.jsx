// FloatingNavbar.jsx - Premium Dark Theme Navbar with Auth Logic
import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "@/providers/CartProvider";

export default function FloatingNavbar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { getTotalQuantity } = useCart();
    const cartCount = getTotalQuantity();
    const isLoggedIn = !!localStorage.getItem("access_token");

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-black/70 backdrop-blur-xl border border-white/10 rounded-full px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-3 sm:gap-4 lg:gap-6 shadow-2xl transition-all duration-300 hover:bg-black/80">
            {/* Logo */}
            <Link to="/user/home" className="text-white font-semibold flex items-center gap-2 flex-shrink-0">
                <span className="text-lg sm:text-xl font-bold text-[#2997ff]">Group 7</span>
            </Link>

            {/* Divider */}
            <div className="h-4 w-px bg-white/20 hidden sm:block" />

            {/* Category Links - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-4">
                <Link
                    to="/user/category/dien-thoai"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors whitespace-nowrap"
                >
                    Điện thoại
                </Link>
                <Link
                    to="/user/category/laptop"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors whitespace-nowrap"
                >
                    Laptop
                </Link>
                <Link
                    to="/user/category/tai-nghe"
                    className="text-sm font-medium text-gray-300 hover:text-white transition-colors whitespace-nowrap"
                >
                    Phụ kiện
                </Link>
            </div>

            {/* Divider */}
            <div className="h-4 w-px bg-white/20" />

            {/* Auth State Icons/Buttons */}
            {isLoggedIn ? (
                // LOGGED IN: Show action icons
                <div className="flex items-center gap-3 sm:gap-4">
                    {/* Orders */}
                    <Link
                        to="/user/orders"
                        className={`transition-colors ${isActive('/user/orders') ? 'text-[#2997ff]' : 'text-gray-300 hover:text-white'}`}
                        title="Đơn hàng"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
                        </svg>
                    </Link>

                    {/* Cart */}
                    <Link
                        to="/user/cart"
                        className={`relative transition-colors ${isActive('/user/cart') ? 'text-[#2997ff]' : 'text-gray-300 hover:text-white'}`}
                        title="Giỏ hàng"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#2997ff] text-[10px] font-bold rounded-full flex items-center justify-center text-white">
                                {cartCount > 9 ? '9+' : cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Profile */}
                    <Link
                        to="/user/profile"
                        className={`transition-colors ${isActive('/user/profile') ? 'text-[#2997ff]' : 'text-gray-300 hover:text-white'}`}
                        title="Tài khoản"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </Link>

                    {/* Logout */}
                    <button
                        onClick={handleLogout}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        title="Đăng xuất"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                    </button>
                </div>
            ) : (
                // NOT LOGGED IN: Show Cart + Login | Register with enhanced styling
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Cart for Guests */}
                    <Link
                        to="/user/cart"
                        className={`relative transition-colors ${isActive('/user/cart') ? 'text-[#2997ff]' : 'text-gray-300 hover:text-white'}`}
                        title="Giỏ hàng"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        {cartCount > 0 && (
                            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#2997ff] text-[10px] font-bold rounded-full flex items-center justify-center text-white">
                                {cartCount > 9 ? '9+' : cartCount}
                            </span>
                        )}
                    </Link>

                    <div className="h-4 w-px bg-white/20" />

                    <Link
                        to="/login"
                        className="text-sm font-medium text-gray-300 hover:text-white transition-all duration-300 whitespace-nowrap px-2 py-1"
                    >
                        Đăng nhập
                    </Link>
                    <span className="text-white/20 hidden sm:inline">|</span>
                    <Link
                        to="/register"
                        className="relative group text-sm font-semibold text-white px-4 py-2 rounded-full transition-all duration-300 overflow-hidden whitespace-nowrap"
                    >
                        {/* Gradient background with glow effect */}
                        <span className="absolute inset-0 bg-gradient-to-r from-[#2997ff] to-[#5AC8FA] rounded-full transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(41,151,255,0.5)]" />
                        {/* Shine effect on hover */}
                        <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        <span className="relative z-10">Đăng ký</span>
                    </Link>
                </div>
            )}
        </nav>
    );
}
