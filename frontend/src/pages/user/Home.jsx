// src/pages/user/Home.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import {
  HiOutlineDevicePhoneMobile,
  HiOutlineComputerDesktop,
  HiOutlineSpeakerWave,
  HiOutlineCpuChip,
  HiOutlineSparkles,
  HiArrowRight
} from "react-icons/hi2";

import TopBanner from "../../components/common/TopBanner";
import Footer from "../../components/common/Footer";
import HeroSlider from "../../components/common/HeroSlider";
import ProductCard from "../../components/common/ProductCard";

import { useProduct } from "@/providers/ProductProvider";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState(null);

  const { products, loading, error, fetchProducts } = useProduct();

  /* ================== INIT AOS ================== */
  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });
  }, []);

  /* ================== FETCH PRODUCTS BY QUERY ================== */
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const params = {};

    params.page = Number(searchParams.get("page") ?? 1);
    params.limit = Number(searchParams.get("limit") ?? 20);

    const search = searchParams.get("search");
    if (search) params.search = search;

    const category = searchParams.get("category");
    if (category) {
      params.category = category;
      setActiveCategory(category);
    } else {
      setActiveCategory(null);
    }

    const brand = searchParams.get("brand");
    if (brand) params.brand = brand;

    const min_price = searchParams.get("min_price");
    if (min_price) params.min_price = Number(min_price);

    const max_price = searchParams.get("max_price");
    if (max_price) params.max_price = Number(max_price);

    const sort = searchParams.get("sort");
    if (sort) params.sort = sort;

    fetchProducts(params);
  }, [location.search, fetchProducts]);

  /* ================== HELPERS ================== */
  const getProductId = (p) => p?.product_id ?? p?.id ?? p?._id ?? null;

  const normalizeImage = (img) => {
    const FALLBACK = "/default-product.png";
    if (!img) return FALLBACK;

    if (Array.isArray(img)) img = img[0];
    if (typeof img === "object") img = img?.url ?? img?.path;
    if (typeof img !== "string") return FALLBACK;

    const matches = img.match(/https?:\/\/[^\s,;"]+/g);
    if (matches) return matches[0];

    if (img.startsWith("/")) return img;

    return img;
  };


  const onProductClick = (p) => {
    const productId = getProductId(p);
    if (!productId) return;

    navigate(`/user/product/${productId}`, {
      state: {
        flash_sale: p.flash_sale ?? null,
      },
    });
  };


  /* ================== CATEGORIES ================== */
  const categories = [
    {
      icon: HiOutlineDevicePhoneMobile,
      name: "Điện Thoại",
      slug: "dien-thoai",
      color: "from-blue-500 to-cyan-400",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600"
    },
    {
      icon: HiOutlineComputerDesktop,
      name: "Laptop",
      slug: "laptop",
      color: "from-purple-500 to-pink-400",
      bgColor: "bg-purple-50",
      iconColor: "text-purple-600"
    },
    {
      icon: HiOutlineSpeakerWave,
      name: "Tai Nghe",
      slug: "tai-nghe",
      color: "from-orange-500 to-amber-400",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600"
    },
    {
      icon: HiOutlineCpuChip,
      name: "Phụ Kiện",
      slug: "ban-phim-co",
      color: "from-emerald-500 to-teal-400",
      bgColor: "bg-emerald-50",
      iconColor: "text-emerald-600"
    },
  ];

  const onCategoryClick = (slug) => {
    navigate(`/user/category/${slug}`);
  };

  /* ================== RENDER ================== */
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <TopBanner />
      <HeroSlider />

      {/* ================== DANH MỤC - Premium Design ================== */}
      <section className="py-12 md:py-20 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-30 translate-x-1/2 translate-y-1/2" />

        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
          {/* Section Header */}
          <div className="text-center mb-10 md:mb-14" data-aos="fade-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#137fec]/10 text-[#137fec] rounded-full text-sm font-medium mb-4">
              <HiOutlineSparkles className="w-4 h-4" />
              Khám phá ngay
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              Danh Mục Sản Phẩm
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-sm sm:text-base">
              Khám phá các sản phẩm công nghệ hàng đầu với giá ưu đãi
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8" data-aos="fade-up" data-aos-delay="100">
            {categories.map((cat, index) => {
              const IconComponent = cat.icon;
              const isActive = activeCategory === cat.slug;

              return (
                <div
                  key={cat.slug}
                  onClick={() => onCategoryClick(cat.slug)}
                  className={`
                    group relative p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-3xl cursor-pointer
                    transition-all duration-500 ease-out
                    ${isActive
                      ? `bg-gradient-to-br ${cat.color} shadow-xl scale-[1.02]`
                      : 'bg-white/80 backdrop-blur-sm border border-gray-100 hover:border-transparent shadow-sm hover:shadow-xl'
                    }
                  `}
                  style={{ transitionDelay: `${index * 50}ms` }}
                >
                  {/* Glassmorphism overlay on hover */}
                  <div className={`absolute inset-0 rounded-2xl md:rounded-3xl bg-gradient-to-br ${cat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                  {/* Icon Container */}
                  <div className={`
                    relative z-10 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 mx-auto mb-3 sm:mb-4 rounded-xl sm:rounded-2xl flex items-center justify-center
                    transition-all duration-300
                    ${isActive
                      ? 'bg-white/20 backdrop-blur-sm'
                      : `${cat.bgColor} group-hover:bg-white/20`
                    }
                  `}>
                    <IconComponent className={`
                      w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 transition-colors duration-300
                      ${isActive ? 'text-white' : `${cat.iconColor} group-hover:text-white`}
                    `} />
                  </div>

                  {/* Category Name */}
                  <p className={`
                    relative z-10 font-semibold text-center text-sm md:text-base
                    transition-colors duration-300
                    ${isActive ? 'text-white' : 'text-gray-800 group-hover:text-white'}
                  `}>
                    {cat.name}
                  </p>

                  {/* Arrow indicator */}
                  <div className={`
                    absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 
                    transform translate-x-2 group-hover:translate-x-0
                    transition-all duration-300
                    ${isActive ? 'opacity-100 translate-x-0' : ''}
                  `}>
                    <HiArrowRight className={`w-5 h-5 ${isActive ? 'text-white/70' : 'text-white/70'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================== SẢN PHẨM NỔI BẬT ================== */}
      <section className="py-12 md:py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 md:mb-14 gap-4" data-aos="fade-up">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#137fec]/10 to-[#0ea5e9]/10 text-[#137fec] rounded-full text-sm font-medium mb-4">
                🔥 Hot Deal
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900">
                Sản Phẩm Nổi Bật
              </h2>
            </div>
            <button
              onClick={() => navigate('/user/home?page=1&limit=40')}
              className="group inline-flex items-center gap-2 text-[#137fec] font-medium hover:gap-3 transition-all"
            >
              Xem tất cả
              <HiArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-20" data-aos="fade-up">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-4 border-[#137fec] border-t-transparent animate-spin" />
              </div>
              <p className="mt-4 text-gray-600 font-medium">Đang tải sản phẩm...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex flex-col items-center justify-center py-20 text-center" data-aos="fade-up">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl">❌</span>
              </div>
              <p className="text-red-500 font-medium mb-2">Đã xảy ra lỗi</p>
              <p className="text-gray-500 text-sm">{error}</p>
            </div>
          )}

          {/* Product Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6">
              {products?.length > 0 ? (
                products.map((p, index) => {
                  const productId = getProductId(p);
                  const imageUrl = normalizeImage(p?.image);

                  return (
                    <div
                      key={productId ?? index}
                      data-aos="fade-up"
                      data-aos-delay={Math.min(index * 50, 300)}
                      className="transform transition-transform duration-300"
                    >
                      <button
                        onClick={() => onProductClick(p)}
                        className="w-full text-left focus:outline-none focus:ring-2 focus:ring-[#137fec] focus:ring-offset-2 rounded-2xl"
                      >
                        <ProductCard product={{ ...p, image: imageUrl }} />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-full flex flex-col items-center justify-center py-20">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <span className="text-4xl">📦</span>
                  </div>
                  <p className="text-gray-500 font-medium">Không có sản phẩm</p>
                  <p className="text-gray-400 text-sm mt-1">Thử tìm kiếm với từ khóa khác</p>
                </div>
              )}
            </div>
          )}

          {/* Load More Button */}
          {!loading && !error && products?.length > 0 && (
            <div className="text-center mt-12" data-aos="fade-up">
              <button
                onClick={() => navigate('/user/home?page=1&limit=40')}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#137fec] to-[#0ea5e9] text-white font-semibold rounded-full hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                Xem thêm sản phẩm
                <HiArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ================== FEATURES SECTION - Clean Design ================== */}
      <section className="py-10 sm:py-14 md:py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" data-aos="fade-up">
            {/* Feature 1 - Giao hàng nhanh */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm md:text-base mb-1">Giao hàng nhanh</h3>
                  <p className="text-white/50 text-xs md:text-sm">Trong 2h nội thành</p>
                </div>
              </div>
            </div>

            {/* Feature 2 - Bảo hành */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm md:text-base mb-1">Bảo hành chính hãng</h3>
                  <p className="text-white/50 text-xs md:text-sm">12 tháng toàn quốc</p>
                </div>
              </div>
            </div>

            {/* Feature 3 - Thanh toán */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm md:text-base mb-1">Thanh toán an toàn</h3>
                  <p className="text-white/50 text-xs md:text-sm">Đa dạng phương thức</p>
                </div>
              </div>
            </div>

            {/* Feature 4 - Đổi trả */}
            <div className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-5 md:p-6 border border-white/10 hover:border-white/20 transition-all duration-300 hover:bg-white/10">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm md:text-base mb-1">Đổi trả miễn phí</h3>
                  <p className="text-white/50 text-xs md:text-sm">Trong vòng 30 ngày</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
