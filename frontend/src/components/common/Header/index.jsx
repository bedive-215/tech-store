import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Header() {
  const navigate = useNavigate();

  const [showCategories, setShowCategories] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const categories = [
    { 
      id: 1, 
      name: "Điện thoại, Tablet",
      subcategories: [
        { name: "Apple", logo: true },
        { name: "Samsung", logo: true },
        { name: "Xiaomi", logo: true },
        { name: "OPPO", logo: true },
        { name: "TECNO", logo: true },
        { name: "HONOR", logo: true },
        { name: "ZTE | nubia", logo: true },
        { name: "SONY", logo: true },
        { name: "NOKIA", logo: true },
        { name: "Infinix", logo: true },
        { name: "NOTHING", logo: true },
        { name: "Masstel", logo: true },
        { name: "realme", logo: true },
        { name: "itel", logo: true },
        { name: "vivo", logo: true },
        { name: "Điện thoại phổ thông" },
      ]
    },
    { id: 2, name: "Laptop", subcategories: [] },
    { id: 3, name: "Âm thanh, Mic thu âm", subcategories: [] },
    { id: 4, name: "Đồng hồ, Camera", subcategories: [] },
    { id: 5, name: "Đồ gia dụng, Làm đẹp", subcategories: [] },
    { id: 6, name: "Phụ kiện", subcategories: [] },
    { id: 7, name: "PC, Màn hình, Máy in", subcategories: [] },
    { id: 8, name: "Tivi, Điện máy", subcategories: [] },
    { id: 9, name: "Thu cũ đổi mới", subcategories: [] },
    { id: 10, name: "Hàng cũ", subcategories: [] },
    { id: 11, name: "Khuyến mãi", subcategories: [] },
    { id: 12, name: "Tin công nghệ", subcategories: [] },
  ];

  const locations = [
    { id: 1, name: "Hồ Chí Minh", districts: "50+ cửa hàng" },
    { id: 2, name: "Hà Nội", districts: "40+ cửa hàng" },
    { id: 3, name: "Đà Nẵng", districts: "15+ cửa hàng" },
    { id: 4, name: "Cần Thơ", districts: "10+ cửa hàng" },
    { id: 5, name: "Biên Hòa", districts: "8+ cửa hàng" },
    { id: 6, name: "Nha Trang", districts: "6+ cửa hàng" },
    { id: 7, name: "Hải Phòng", districts: "12+ cửa hàng" },
    { id: 8, name: "Vũng Tàu", districts: "5+ cửa hàng" },
  ];

  const miniMessages = [
    "📱 Thu cũ giá ngon - Lên đời tiết kiệm",
    "📦 Sản phẩm Chính hãng - Xuất VAT đầy đủ",
    "🚚 Giao nhanh - Miễn phí cho đơn 300k",
    "🔄 Đổi trả trong 7 ngày - Bảo hành chính hãng",
    "🏬 200+ cửa hàng trên toàn quốc"
  ];

  return (
    <header className="w-full sticky top-0 z-[999] font-sans">

      {/* ========== TOP MINI BAR ========== */}
      <div
        className="w-full text-white text-xs py-2"
        style={{ background: "linear-gradient(90deg, #F97316, #C2410C)" }}
      >
        <div className="max-w-[1280px] mx-auto px-4">
          <div className="relative overflow-hidden">
            <div className="marquee-track flex items-center">
              <div className="marquee-group flex items-center whitespace-nowrap">
                {miniMessages.map((m, i) => (
                  <span key={i} className="mx-6">{m}</span>
                ))}
              </div>

              <div className="marquee-group flex items-center whitespace-nowrap">
                {miniMessages.map((m, i) => (
                  <span key={"dup-" + i} className="mx-6">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========== MAIN HEADER ========== */}
      <div
        className="py-4 shadow-lg relative"
        style={{ background: "linear-gradient(90deg, #F97316, #C2410C)" }}
      >
        <div className="max-w-[1280px] mx-auto flex items-center gap-5 px-4">

          {/* LOGO */}
          <div className="flex items-center">
            <div 
              className="cursor-pointer text-white font-bold text-2xl tracking-wide px-3 py-1 rounded"
              style={{ background: "rgba(255,255,255,.1)", border: "2px solid rgba(255,255,255,.3)" }}
            >
              Store
            </div>
          </div>

          {/* DANH MỤC */}
          <div className="relative">
          <button
              onClick={() => {
                setShowCategories(!showCategories);
                setShowLocations(false);
                setSelectedCategory(null);
              }}
            className="flex items-center gap-2 bg-white/20 px-4 py-2.5 rounded-lg text-white text-sm hover:bg-white/30 border border-white/30"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            Danh mục
              <svg className={`h-4 w-4 transition-transform ${showCategories ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
          </button>

            {/* DROPDOWN DANH MỤC */}
            {showCategories && (
              <div className="absolute top-full mt-2 left-0 flex shadow-2xl rounded-lg overflow-hidden">

                {/* MENU CHÍNH */}
                <div className="bg-white" style={{ width: 280, borderRight: "1px solid #E5E7EB" }}>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onMouseEnter={() => setSelectedCategory(category)}
                      className={`w-full px-4 py-3 flex items-center justify-between text-left transition ${
                        selectedCategory?.id === category.id ? "bg-red-50" : "hover:bg-gray-50"
                      }`}
                      style={{
                        borderLeft: selectedCategory?.id === category.id ? "3px solid #F97316" : "3px solid transparent"
                      }}
                    >
                      <div className="flex items-center gap-3 text-gray-800">
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="7" height="7" />
                          <rect x="14" y="3" width="7" height="7" />
                          <rect x="14" y="14" width="7" height="7" />
                          <rect x="3" y="14" width="7" height="7" />
                        </svg>
                        <span className="text-sm font-medium">{category.name}</span>
                      </div>

                      {category.subcategories.length > 0 && (
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 6l6 6-6 6" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>

                {/* SUB MENU */}
                {selectedCategory && selectedCategory.subcategories.length > 0 && (
                  <div className="bg-white" style={{ width: 620, maxHeight: 500, overflowY: "auto" }}>
                    <div className="p-6">
                      <h3 className="text-base font-bold mb-4">{selectedCategory.name}</h3>

                      <div className="grid grid-cols-3 gap-3">
                        {selectedCategory.subcategories.map((sub, i) => (
                          <button
                            key={i}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-sm text-left"
                          >
                            {sub.name}
                          </button>
                        ))}
                      </div>

                      {/* MỨC GIÁ ĐIỆN THOẠI */}
                      {selectedCategory.id === 1 && (
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="font-bold text-sm mb-3">Mức giá điện thoại</h4>
                          <div className="grid grid-cols-3 gap-3">
                            {[
                              "Dưới 2 triệu", "Từ 2 - 4 triệu", "Từ 4 - 7 triệu",
                              "Từ 7 - 13 triệu", "Từ 13 - 20 triệu", "Trên 20 triệu"
                            ].map((p) => (
                              <button key={p} className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition text-sm">
                                {p}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* VỊ TRÍ */}
          <div className="relative">
            <button 
              onClick={() => setShowLocations(!showLocations)}
              className="flex items-center gap-2 bg-white/20 px-4 py-2.5 rounded-lg text-white text-sm hover:bg-white/30 border border-white/30"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
                <circle cx="12" cy="9" r="2" />
              </svg>
              Hồ Chí Minh

              <svg
                className={`h-4 w-4 transition-transform ${showLocations ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" strokeWidth="2"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showLocations && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-2xl overflow-hidden w-72">
                <div className="py-2">
                  {locations.map((location) => (
                    <button
                      key={location.id}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="#F97316" strokeWidth="2">
                        <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
                        <circle cx="12" cy="9" r="2" />
                      </svg>

                      <div>
                        <div className="text-sm font-medium">{location.name}</div>
                        <div className="text-xs text-gray-500">{location.districts}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SEARCH BAR */}
          <div className="flex-1 relative flex items-center">
            <input
              type="text"
              placeholder="Bạn muốn mua gì hôm nay?"
              className="w-full h-11 pl-4 pr-12 bg-white rounded-full text-sm text-gray-700 shadow-md border border-gray-200"
            />

            <button className="absolute right-4 top-1/2 -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>

          {/* CART */}
          <button
            onClick={() => navigate("/user/cart")}
            className="flex items-center gap-2 text-white font-medium px-4 py-2 rounded-lg hover:bg-white/20 transition"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
          </button>

          {/* USER ICON */}
         {/* ĐĂNG NHẬP → icon và điều hướng sang trang Profile */}
<button
  onClick={() => navigate("/user/profile")}
  className="flex items-center bg-white p-2 w-10 h-10 rounded-full justify-center hover:bg-gray-100 shadow-md"
  style={{ color: "#F97316" }}
>
  <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" />
    <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
  </svg>
</button>

        </div>
      </div>

      {/* CLICK OUTSIDE TO CLOSE */}
      {showLocations && (
        <div
          className="fixed inset-0 z-[1]"
          onClick={() => setShowLocations(false)}
        />
      )}

      {/* CSS MARQUEE */}
      <style>{`
        .marquee-track {
          height: 28px;
          align-items: center;
          animation: marquee 18s linear infinite;
        }
        .marquee-track:hover { animation-play-state: paused; }
        .marquee-group { display: inline-flex; flex-shrink: 0; }
        @keyframes marquee {
          from { transform: translateX(0%); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </header>
  );
}
