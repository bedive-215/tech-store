// src/components/Header.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import categoryService from "@/services/categoryService";
import brandService from "@/services/brandService";
import { useCart } from "@/providers/CartProvider";

/**
 * Cart Badge Component - Shows item count (max 99+)
 */
function CartBadge() {
  const { cart, fetchCart, getTotalQuantity } = useCart();
  const isLoggedIn = !!localStorage.getItem("access_token");

  // Fetch cart on mount if logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetchCart().catch(() => { });
    }
  }, [isLoggedIn]);

  // Calculate total quantity using provider helper or fallback
  const totalQty = React.useMemo(() => {
    if (typeof getTotalQuantity === 'function') {
      return getTotalQuantity();
    }
    if (!cart?.items || !Array.isArray(cart.items)) return 0;
    return cart.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);
  }, [cart, getTotalQuantity]);

  // Debug log
  console.log("🛒 CartBadge:", { isLoggedIn, totalQty, cartItems: cart?.items?.length });

  if (!isLoggedIn || totalQty === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-lg animate-pulse">
      {totalQty > 99 ? "99+" : totalQty}
    </span>
  );
}

/**
 * Premium Header with Blue Gradient Theme
 */
export default function Header({ onFilter = (f) => console.log("filter", f) }) {
  const navigate = useNavigate();

  const [showCategories, setShowCategories] = useState(false);
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
  const isLoggedIn = !!localStorage.getItem("access_token");

  const categoriesRef = useRef(null);
  const headerRef = useRef(null);

  const miniMessages = [
    "Thu cũ đổi mới",
    "Chính hãng 100%",
    "Freeship từ 300k",
    "Bảo hành 12-24 tháng",
    "Hỗ trợ trả góp 0%",
  ];

  // Function to check auth and show toast if not logged in
  const requireAuth = (callback, message = "Bạn cần đăng nhập để sử dụng tính năng này!") => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      toast.warning(message, { position: "top-center", autoClose: 3000 });
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
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <circle cx="12" cy="18" r="0.6" />
        </svg>
      );
    }
    if (match(["laptop", "máy tính", "notebook", "pc"])) {
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="4" width="18" height="12" rx="1" />
          <path d="M2 20h20" />
        </svg>
      );
    }
    if (match(["watch", "đồng hồ", "đeo tay"])) {
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="6" />
          <path d="M12 8v5l3 2" />
        </svg>
      );
    }
    if (match(["accessory", "phụ kiện", "case", "cáp", "tai nghe", "sạc"])) {
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 6h18v12H3z" />
          <path d="M3 12h18" />
        </svg>
      );
    }
    if (match(["tv", "tivi", "màn hình", "monitor"])) {
      return (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="5" width="20" height="12" rx="1" />
          <path d="M8 21h8" />
        </svg>
      );
    }
    return (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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
            className="block object-contain rounded-md shadow-sm bg-white"
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
      {/* Top Bar - Modern Clean Style */}
      <div className="w-full bg-slate-900 text-white/90 text-[11px]" style={{ height: "32px" }}>
        <div className="max-w-[1280px] mx-auto px-4 h-full flex items-center justify-between">
          {/* Static Messages with Dots - Hide on small screens, show progressively */}
          <div className="flex items-center gap-2 overflow-hidden">
            {/* Always show first 2 on mobile */}
            <span className="font-medium whitespace-nowrap">{miniMessages[0]}</span>
            <span className="w-1 h-1 rounded-full bg-white/30 hidden xs:block"></span>
            <span className="font-medium whitespace-nowrap hidden xs:block">{miniMessages[1]}</span>
            {/* Show rest on md+ */}
            {miniMessages.slice(2).map((m, i) => (
              <span key={i} className="hidden md:flex items-center gap-2 whitespace-nowrap">
                <span className="w-1 h-1 rounded-full bg-white/30"></span>
                <span className="font-medium">{m}</span>
              </span>
            ))}
          </div>

          {/* Warranty Link */}
          <button
            onClick={() => requireAuth(() => navigate("/user/warranties"), "Vui lòng đăng nhập để xem bảo hành!")}
            className="flex items-center gap-1.5 text-white/80 hover:text-white transition-colors font-medium flex-shrink-0"
          >
            <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span className="hidden sm:inline">Tra cứu bảo hành</span>
          </button>
        </div>
      </div>

      {/* Main Header - Premium Blue Gradient */}
      <div className="py-4 shadow-lg relative bg-gradient-to-r from-[#137fec] to-[#0ea5e9]">
        <div className="max-w-[1280px] mx-auto flex items-center gap-4 px-4">
          {/* Logo */}
          <div className="flex items-center">
            <div
              onClick={() => navigate("/user/home")}
              className="cursor-pointer flex items-center gap-2 group"
            >
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all">
                <svg className="w-6 h-6 text-[#137fec]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-white font-bold text-xl tracking-wide hidden sm:inline">TechStore</span>
            </div>
          </div>

          {/* Categories Dropdown */}
          <div className="relative" ref={categoriesRef}>
            <button
              aria-expanded={showCategories}
              onClick={() => {
                setShowCategories(prev => !prev);
                setShowLocations(false);
                setSelectedCategory(null);
                setSelectedBrand(null);
                setHoveredCategory(null);
                setBrands([]);
              }}
              className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2.5 rounded-xl text-white text-sm font-medium hover:bg-white/30 border border-white/30 transition-all"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="hidden sm:inline">Danh mục</span>
              <svg className={`h-4 w-4 transition-transform ${showCategories ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showCategories && (
              <>
                <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => { setShowCategories(false); setHoveredCategory(null); setBrands([]); }} />

                <div className="absolute top-full mt-2 left-0 flex shadow-2xl rounded-2xl overflow-hidden z-50 border border-gray-100" style={{ minWidth: 920 }}>
                  {/* Categories List */}
                  <div className="bg-white" style={{ width: 320, borderRight: "1px solid #E5E7EB" }}>
                    {loadingCategories ? (
                      <div className="p-4 flex items-center gap-2 text-gray-500">
                        <div className="w-5 h-5 border-2 border-[#137fec] border-t-transparent rounded-full animate-spin" />
                        Đang tải...
                      </div>
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
                            className={`w-full px-4 py-3 flex items-center gap-3 text-left transition ${isSelected ? "bg-blue-50" : isHovered ? "bg-gray-50" : "hover:bg-gray-50"
                              }`}
                            style={{ borderLeft: isSelected ? "4px solid #137fec" : "4px solid transparent" }}
                            aria-pressed={isSelected}
                          >
                            <div className="flex items-center gap-3 text-gray-800">
                              <div className={`flex items-center justify-center w-8 h-8 rounded-lg ${isSelected ? 'bg-[#137fec] text-white' : 'bg-blue-50 text-[#137fec]'}`}>
                                <CategoryIcon keyName={category.slug || category.name} />
                              </div>
                              <span className="text-sm font-medium truncate">{category.name}</span>
                            </div>
                            <svg className="h-4 w-4 text-gray-400 ml-auto" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 6l6 6-6 6" />
                            </svg>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Brands Panel */}
                  <div className="bg-white p-6" style={{ width: 600, maxHeight: 520, overflowY: "auto" }}>
                    {!selectedCategory ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
                          <path d="M8 16l2.879-2.879m0 0a3 3 0 104.243-4.242 3 3 0 00-4.243 4.242zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div className="text-sm">Chọn danh mục để xem thương hiệu</div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                            <div className="w-1 h-5 bg-gradient-to-b from-[#137fec] to-[#0ea5e9] rounded-full" />
                            {selectedCategory.name}
                          </h3>
                          <button onClick={() => { setSelectedCategory(null); setBrands([]); }} className="text-xs text-gray-500 hover:text-[#137fec] transition-colors">
                            Bỏ chọn
                          </button>
                        </div>

                        <div className="mb-4">
                          {loadingBrands ? (
                            <div className="flex items-center gap-2 text-gray-500">
                              <div className="w-5 h-5 border-2 border-[#137fec] border-t-transparent rounded-full animate-spin" />
                              Đang tải thương hiệu...
                            </div>
                          ) : brands.length === 0 ? (
                            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg">Không tìm thấy thương hiệu cho danh mục này</div>
                          ) : (
                            <div className="grid grid-cols-4 gap-4">
                              {brands.map((b) => {
                                const isActive = selectedBrand?.id === b.id;
                                return (
                                  <button
                                    key={b.id}
                                    onClick={() => handleSelectBrand(b)}
                                    className={`flex flex-col items-center p-4 rounded-xl border-2 transition transform ${isActive
                                      ? "ring-2 ring-[#137fec]/30 border-[#137fec] scale-105 bg-blue-50"
                                      : "border-gray-100 hover:border-[#137fec]/50 hover:scale-105 hover:shadow-lg"
                                      }`}
                                    title={b.name}
                                  >
                                    <BrandImage b={b} size={84} />
                                    <div className="text-sm text-center text-gray-700 truncate mt-2 w-full font-medium">{b.name}</div>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Price Filter */}
                        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-[#137fec]" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Lọc theo giá
                          </h4>
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ""))}
                              placeholder="Từ (₫)"
                              className="px-3 py-2 border border-gray-200 rounded-lg w-1/2 text-sm focus:border-[#137fec] focus:outline-none transition-colors"
                            />
                            <span className="text-gray-400">-</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
                              placeholder="Đến (₫)"
                              className="px-3 py-2 border border-gray-200 rounded-lg w-1/2 text-sm focus:border-[#137fec] focus:outline-none transition-colors"
                            />
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <select
                              value={sort}
                              onChange={(e) => setSort(e.target.value)}
                              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#137fec] focus:outline-none transition-colors"
                            >
                              <option value="">Sắp xếp</option>
                              <option value="price_asc">Giá: Thấp → Cao</option>
                              <option value="price_desc">Giá: Cao → Thấp</option>
                              <option value="newest">Mới nhất</option>
                            </select>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => buildAndNavigate({ page: 1 })}
                                className="px-4 py-2 bg-gradient-to-r from-[#137fec] to-[#0ea5e9] text-white rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                              >
                                Áp dụng
                              </button>
                              <button
                                onClick={resetFilters}
                                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-100 transition-colors"
                              >
                                Đặt lại
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Location Badge (Static - Ho Chi Minh only) */}
          <div className="hidden md:flex items-center gap-2 bg-white/10 px-3 py-2 rounded-xl text-white/80 text-sm">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2a7 7 0 017 7c0 5-7 13-7 13S5 14 5 9a7 7 0 017-7z" />
              <circle cx="12" cy="9" r="2" />
            </svg>
            <span className="hidden lg:inline">Hồ Chí Minh</span>
          </div>

          {/* Search Bar */}
          <div className="flex-1 min-w-[180px] relative">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                className="w-full h-11 pl-5 pr-12 bg-white rounded-xl text-sm text-gray-700 shadow-lg border-2 border-transparent focus:border-white/50 focus:outline-none transition-all"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") buildAndNavigate({ searchText, page: 1 });
                }}
              />
              <button
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gradient-to-r from-[#137fec] to-[#0ea5e9] rounded-lg flex items-center justify-center hover:shadow-lg transition-all"
                onClick={() => buildAndNavigate({ page: 1 })}
                aria-label="Tìm"
              >
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </div>
          </div>

          {/* Orders Button */}
          <button
            onClick={() => requireAuth(() => navigate("/user/orders"), "Vui lòng đăng nhập để xem đơn hàng!")}
            className="hidden lg:flex items-center gap-2 text-white text-sm font-medium px-4 py-2.5 rounded-xl hover:bg-white/20 transition-all border border-white/20"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>Đơn hàng</span>
          </button>

          {/* Cart Button with Badge */}
          <button
            onClick={() => requireAuth(() => navigate("/user/cart"), "Vui lòng đăng nhập để xem giỏ hàng!")}
            className="relative flex items-center justify-center text-white font-medium w-11 h-11 rounded-xl hover:bg-white/20 transition-all border border-white/20"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            {/* Cart Count Badge */}
            <CartBadge />
          </button>

          {/* Profile / Login Button */}
          {isLoggedIn ? (
            <button
              onClick={() => navigate("/user/profile")}
              className="flex items-center justify-center bg-white w-11 h-11 rounded-xl shadow-lg hover:shadow-xl transition-all"
              title="Trang cá nhân"
            >
              <svg className="h-5 w-5 text-[#137fec]" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" />
              </svg>
            </button>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="flex items-center gap-2 bg-white text-[#137fec] font-semibold px-4 py-2.5 rounded-xl hover:shadow-lg transition-all"
              title="Đăng nhập"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              <span className="text-sm hidden sm:inline">Đăng nhập</span>
            </button>
          )}
        </div>
      </div>

      <style>{`
        .marquee-track { height: 100%; align-items: center; animation: marquee 20s linear infinite; }
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
