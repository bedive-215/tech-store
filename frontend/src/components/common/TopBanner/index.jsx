import React from "react";
import { HiOutlineSparkles, HiOutlineTruck, HiOutlineShieldCheck } from "react-icons/hi2";

export default function TopBanner() {
  return (
    <div className="bg-gradient-to-r from-[#0a1628] via-[#1a365d] to-[#0a1628] text-white py-2.5 px-4 overflow-hidden">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-8 text-xs md:text-sm font-medium">
        {/* Promo Text with Animation */}
        <div className="flex items-center gap-2 animate-pulse">
          <HiOutlineSparkles className="w-4 h-4 text-yellow-400" />
          <span>GIẢM GIÁ ĐẾN <span className="text-yellow-400 font-bold">50%</span></span>
        </div>
        
        <div className="hidden md:flex items-center gap-2">
          <HiOutlineTruck className="w-4 h-4 text-emerald-400" />
          <span>Miễn phí vận chuyển đơn từ 500K</span>
        </div>
        
        <div className="hidden lg:flex items-center gap-2">
          <HiOutlineShieldCheck className="w-4 h-4 text-blue-400" />
          <span>Bảo hành chính hãng 12 tháng</span>
        </div>
      </div>
    </div>
  );
}