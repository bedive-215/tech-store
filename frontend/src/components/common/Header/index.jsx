// src/components/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import categoryService from "@/services/categoryService";
import brandService from "@/services/brandService";

/**
 * Header (improved visuals, fixed repeated requests, added auth check)
 * - Kiểm tra token để hiển thị nút đăng nhập hoặc profile
 * - Yêu cầu đăng nhập khi truy cập giỏ hàng/đơn hàng mà chưa có token
 */
export default function Header({ onFilter = (f) => console.log("filter", f) }) {
  const navigate = useNavigate();

  const [showCategories, setShowCategories] = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("");

  // Auth state
// Check đăng nhập bằng access_token
const isLoggedIn = !!localStorage.getItem("access_token");


  const categoriesRef = useRef(null);
  const locationsRef = useRef(null);
  const headerRef = useRef(null);

  const locations = [
    { id: 1, name: "Hồ Chí Minh", districts: "50+ cửa hàng" },
    { id: 2, name: "Hà Nội", districts: "40+ cửa hàng" },
    { id: 3, name: "Đà Nẵng", districts: "15+ cửa hàng" },
  ];

  const miniMessages = [
    "📱 Thu cũ giá ngon - Lên đời tiết kiệm",
    "📦 Sản phẩm Chính hãng - Xuất VAT đầy đủ",
    "🚚 Giao nhanh - Miễn phí cho đơn 300k",
  ];

 

  // Function to check auth and show alert if not logged in
 const requireAuth = (
  callback,
  message = "Bạn cần đăng nhập để sử dụng tính năng này!"
) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    alert(message);
    navigate("/login");
    return false;
  }

  callback();
  return true;
};

  const CategoryIcon = ({ keyName }) => {
    const k = (keyName || "").toLowerCase();
    const match = (arr) => arr.some((s) => k.includes(s));

    if (match(["phone", "điện thoại", "mobile", "smartphone"])) {
      return (
        <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <circle cx="12" cy="18" r="0.6" />
        </svg>
      );
    }
    if (match(["laptop", "máy tính", "notebook", "pc"])) {
      return (
        <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="12" rx="1" />
          <path d="M2 20h20" />
        </svg>
      );
    }
    if (match(["watch", "đồng hồ", "đeo tay"])) {
      return (
        <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="6" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    }
    if (match(["accessory", "phụ kiện", "case", "cáp", "tai nghe", "sạc"])) {
      return (
        <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 6h18v12H3z" />
          <path d="M3 12h18" />
        </svg>
      );
    }
    if (match(["tv", "tivi", "màn hình", "monitor"])) {
      return (
        <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="5" width="20" height="12" rx="1" />
          <path d="M8 21h8" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
        <path d="M17 3l4 4" />
      </svg>
    );
  };

  useEffect(() => {
    function handleClickOutside(e) {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target)) {
        setShowCategories(false);
        setHoveredCategory(null);
      }
      if (locationsRef.current && !locationsRef.current.contains(e.target)) {
        setShowLocations(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!showCategories) return;
    if (categories.length > 0) return;
    (async () => {
      try {
        setLoadingCategories(true);
        const res = await categoryService.getCategories();
        const data = res.data;
        if (Array.isArray(data)) setCategories(data);
        else if (data.rows) setCategories(data.rows);
        else setCategories(data?.categories ?? []);
      } catch (err) {
        console.error("fetch categories error", err);
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, [showCategories, categories.length]);

  const fetchBrands = async (category) => {
    if (!category) return setBrands([]);
    try {
      setLoadingBrands(true);
      const res = await brandService.getBrands({ category_id: category.id });
      const data = res.data;
      if (Array.isArray(data)) setBrands(data);
      else if (data.rows) setBrands(data.rows);
      else setBrands(data?.brands ?? []);
    } catch (err) {
      console.error("fetch brands error", err);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  const buildAndNavigate = (overrides = {}) => {
    const category = overrides.category ?? selectedCategory;
    const brand = overrides.brand ?? selectedBrand;
    const search = overrides.searchText ?? searchText;
    const min = overrides.minPrice ?? minPrice;
    const max = overrides.maxPrice ?? maxPrice;
    const st = overrides.sort ?? sort;
    const page = overrides.page ?? 1;
    const limit = overrides.limit ?? 20;

    const params = new URLSearchParams();
    params.set("page", page);
    params.set("limit", limit);
    if (search && String(search).trim() !== "") params.set("search", String(search).trim());
    if (category) {
      const catVal = category.slug ?? category.code ?? category.name ?? category.id;
      params.set("category", String(catVal));
    }
    if (brand) {
      const brandVal = brand.slug ?? brand.code ?? brand.name ?? brand.id;
      params.set("brand", String(brandVal));
    }
    const minNum = String(min).replace(/[^\d]/g, "");
    const maxNum = String(max).replace(/[^\d]/g, "");
    if (minNum !== "") params.set("min_price", minNum);
    if (maxNum !== "") params.set("max_price", maxNum);
    if (st) params.set("sort", st);

    const qs = params.toString();
    navigate(`/user/home?${qs}`);
    onFilter({
      page,
      limit,
      search: search && String(search).trim(),
      category: category ? (category.slug ?? category.name ?? category.id) : null,
      brand: brand ? (brand.slug ?? brand.name ?? brand.id) : null,
      min_price: minNum || null,
      max_price: maxNum || null,
      sort: st || null,
    });
  };

  const handleSelectBrand = (brand) => {
    setSelectedBrand(brand);
    buildAndNavigate({ brand, page: 1 });
    setShowCategories(false);
  };

  const handleSelectCategoryOnly = async (category) => {
    setSelectedCategory(category);
    setSelectedBrand(null);
    setHoveredCategory(null);
    await fetchBrands(category);
    buildAndNavigate({ category, brand: null, page: 1 });
  };

  const BrandImage = ({ b, size = 84 }) => {
    const src = b?.logo || b?.image || b?.thumbnail || null;
    const FALLBACK = "/default-product.png";

    const handleImgError = (e) => {
      try {
        if (!e?.currentTarget) return;
        const cur = e.currentTarget;
        if (cur.dataset.fallback === "true") {
          cur.onerror = null;
          return;
        }
        cur.onerror = null;
        cur.dataset.fallback = "true";
        cur.src = FALLBACK;
      } catch (err) {
        if (e?.currentTarget) e.currentTarget.onerror = null;
      }
    };

    return (
      <div className="flex items-center justify-center w-full">
        {src ? (
          <img
            src={src}
            alt={b?.name || "brand"}
            loading="lazy"
            className={`block object-contain rounded-md shadow-sm bg-white`}
            style={{ width: size, height: size }}
            onError={handleImgError}
          />
        ) : (
          <div
            className="flex items-center justify-center rounded-md bg-gray-100"
            style={{ width: size, height: size }}
          >
            <span className="text-xs text-gray-600">
              {b?.name?.slice(0, 2)?.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    );
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setMinPrice("");
    setMaxPrice("");
    setSort("");
    setSearchText("");
    navigate(`/user/home?page=1&limit=20`);
    onFilter({});
    setShowCategories(false);
  };

  return (
    <header ref={headerRef} className="w-full sticky top-0 z-[999] font-sans">
      <div className="w-full text-white text-xs py-2" style={{ background: "linear-gradient(90deg, #F97316, #C2410C)" }}>
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
                  <span key={'dup-'+i} className="mx-6">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="py-4 shadow relative" style={{ background: "linear-gradient(90deg, #F97316, #C2410C)" }}>
        <div className="max-w-[1280px] mx-auto flex items-center gap-4 px-4">

          <div className="flex items-center">
            <div onClick={() => navigate("/user/home")} className="cursor-pointer text-white font-extrabold text-2xl tracking-wide px-3 py-1 rounded-lg shadow-sm" style={{ background: "rgba(255,255,255,.08)", border: "2px solid rgba(255,255,255,.18)" }}>
              Store
            </div>
          </div>

          <div className="relative" ref={categoriesRef}>
            <button
              aria-expanded={showCategories}
              onClick={() => { setShowCategories(prev => !prev); setShowLocations(false); setSelectedCategory(null); setSelectedBrand(null); setHoveredCategory(null); setBrands([]); }}
              className="flex items-center gap-2 bg-white/20 px-4 py-2.5 rounded-lg text-white text-sm hover:bg-white/30 border border-white/30 transition-all"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              Danh mục
              <svg className={`h-4 w-4 transition-transform ${showCategories ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showCategories && (
              <>
                <div className="fixed inset-0 z-40 bg-black/20" onClick={() => { setShowCategories(false); setHoveredCategory(null); setBrands([]); }} />

                <div className="absolute top-full mt-2 left-0 flex shadow-2xl rounded-lg overflow-hidden z-50" style={{ minWidth: 920 }}>
                  <div className="bg-white" style={{ width: 320, borderRight: "1px solid #E5E7EB" }}>
                    {loadingCategories ? (
                      <div className="p-4">Loading...</div>
                    ) : categories.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">Chưa có danh mục</div>
                    ) : (
                      categories.map((category) => {
                        const isSelected = selectedCategory?.id === category.id;
                        const isHovered = hoveredCategory?.id === category.id;
                        return (
                          <button
                            key={category.id}
                            onMouseEnter={() => setHoveredCategory(category)}
                            onMouseLeave={() => setHoveredCategory(prev => prev?.id === category.id ? null : prev)}
                            onClick={() => handleSelectCategoryOnly(category)}
                            className={`w-full px-4 py-3 flex items-center gap-3 text-left transition ${isSelected ? "bg-orange-50" : isHovered ? "bg-gray-50" : "hover:bg-gray-50"}`}
                            style={{ borderLeft: isSelected ? "4px solid #F97316" : "4px solid transparent" }}
                            aria-pressed={isSelected}
                          >
                            <div className="flex items-center gap-3 text-gray-800">
                              <div className="flex items-center justify-center w-8 h-8 bg-orange-50 rounded-md">
                                <CategoryIcon keyName={category.slug || category.name} />
                              </div>
                              <span className="text-sm font-medium truncate">{category.name}</span>
                            </div>
                            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 6l6 6-6 6" />
                            </svg>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="bg-white p-6" style={{ width: 600, maxHeight: 520, overflowY: "auto" }}>
                    {!selectedCategory ? (
                      <div className="text-sm text-gray-500">Di chuột lên danh mục để xem tên, click để load thương hiệu</div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-bold text-gray-800">{selectedCategory.name}</h3>
                          <div>
                            <button onClick={() => { setSelectedCategory(null); setBrands([]); }} className="text-xs text-gray-500 hover:underline">Bỏ chọn</button>
                          </div>
                        </div>

                        <div className="mb-4">
                          {loadingBrands ? (
                            <div>Loading brands...</div>
                          ) : brands.length === 0 ? (
                            <div className="text-sm text-gray-500">Không tìm thấy thương hiệu cho danh mục này</div>
                          ) : (
                            <div className="grid grid-cols-4 gap-4">
                              {brands.map((b) => {
                                const isActive = selectedBrand?.id === b.id;
                                return (
                                  <button
                                    key={b.id}
                                    onClick={() => handleSelectBrand(b)}
                                    className={`flex flex-col items-center p-4 rounded-lg border transition transform ${isActive ? "ring-2 ring-orange-300 scale-105 bg-orange-50" : "hover:scale-105 hover:shadow-lg"}`}
                                    title={b.name}
                                  >
                                    <BrandImage b={b} size={84} />
                                    <div className="text-sm text-center text-gray-700 truncate mt-2 w-full">{b.name}</div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        <div className="mt-4">
                          <h4 className="font-semibold text-sm mb-2">Lọc theo giá</h4>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ""))}
                              placeholder="Từ (₫)"
                              className="px-3 py-2 border rounded w-1/2 text-sm"
                            />
                            <input
                              type="text"
                              inputMode="numeric"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
                              placeholder="Đến (₫)"
                              className="px-3 py-2 border rounded w-1/2 text-sm"
                            />
                          </div>

                          <div className="mt-3">
                            <label className="text-sm font-medium">Sắp xếp</label>
                            <div className="flex items-center gap-2 mt-2">
                              <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 border rounded text-sm">
                                <option value="">Mặc định</option>
                                <option value="price_asc">Giá: Thấp → Cao</option>
                                <option value="price_desc">Giá: Cao → Thấp</option>
                                <option value="newest">Mới nhất</option>
                              </select>
                              <div className="ml-auto flex items-center gap-2">
                                <button onClick={() => buildAndNavigate({ page: 1 })} className="px-3 py-2 bg-orange-500 text-white rounded text-sm">Áp dụng</button>
                                <button onClick={resetFilters} className="px-3 py-2 border rounded text-sm">Đặt lại</button>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 p-3 bg-gray-50 rounded">
                            <div className="text-xs text-gray-600">Hiển thị: {selectedCategory ? selectedCategory.name : "Tất cả danh mục"} {selectedBrand ? ` • ${selectedBrand.name}` : ""} {minPrice || maxPrice ? ` • Giá ${minPrice ? formatPrice(minPrice) : "0"} - ${maxPrice ? formatPrice(maxPrice) : "∞"}` : ""}</div>
                          </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <h4 className="font-bold text-sm mb-3">Mẹo</h4>
                          <p className="text-sm text-gray-600">Chọn thương hiệu hoặc đặt khoảng giá để lọc sản phẩm trong danh mục này — trang sẽ chuyển sang trang Home với query tương ứng.</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="relative" ref={locationsRef}>
            <button onClick={() => { setShowLocations(prev => !prev); setShowCategories(false); }} className="flex items-center gap-2 bg-white/20 px-4 py-2.5 rounded-lg text-white text-sm hover:bg-white/30 border border-white/30 transition-all">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
                <circle cx="12" cy="9" r="2" />
              </svg>
              Hồ Chí Minh
              <svg className={`h-4 w-4 transition-transform ${showLocations ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showLocations && (
              <div className="absolute top-full mt-2 left-0 bg-white rounded-lg shadow-2xl overflow-hidden w-72 z-50">
                <div className="py-2">
                  {locations.map((location) => (
                    <button key={location.id} className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 text-left transition">
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

          <div className="flex-1 min-w-[220px] relative flex items-center">
            <input
              type="text"
              placeholder="Bạn muốn mua gì hôm nay?"
              className="w-full h-10 pl-4 pr-40 bg-white rounded-full text-sm text-gray-700 shadow-md border border-gray-200"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") buildAndNavigate({ searchText, page: 1 });
              }}
            />
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2"
              onClick={() => buildAndNavigate({ page: 1 })}
              aria-label="Tìm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
          </div>

          <button 
            onClick={() => requireAuth(() => navigate("/user/orders"), "Vui lòng đăng nhập để xem đơn hàng của bạn!")} 
            className="text-white text-sm font-medium px-3 py-2 rounded-lg hover:bg-white/10 transition border border-white/20" 
            style={{ background: "transparent" }}
          >
            Đơn hàng của tôi
          </button>

          <button 
            onClick={() => requireAuth(() => navigate("/user/cart"), "Vui lòng đăng nhập để xem giỏ hàng của bạn!")} 
            className="flex items-center justify-center text-white font-medium px-3 py-2 rounded-lg hover:bg-white/20 transition border border-white/10"
          >
            <svg className="h-5 w-5 mx-auto" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
          </button>

          {isLoggedIn ? (
            <button 
              onClick={() => navigate("/user/profile")} 
              className="flex items-center bg-white p-2 w-10 h-10 rounded-full justify-center hover:bg-gray-100 shadow-md" 
              style={{ color: "#F97316" }}
              title="Trang cá nhân"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
              </svg>
            </button>
          ) : (
            <button 
              onClick={() => navigate("/login")} 
              className="flex items-center gap-2 bg-white text-orange-500 font-medium px-4 py-2 rounded-lg hover:bg-gray-100 shadow-md transition-all"
              title="Đăng nhập"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              <span className="text-sm">Đăng nhập</span>
            </button>
          )}

        </div>
      </div>

      <style>{`
        .marquee-track { height: 28px; align-items: center; animation: marquee 18s linear infinite; }
        .marquee-track:hover { animation-play-state: paused; }
        .marquee-group { display: inline-flex; flex-shrink: 0; }
        @keyframes marquee { from { transform: translateX(0%); } to { transform: translateX(-50%); } }
      `}</style>
    </header>
  );
}

function formatPrice(num) {
  if (!num) return "";
  const n = String(num).replace(/[^\d]/g, "");
  if (n === "") return "";
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}