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
    navigate(`/user/home?page=1&limit=20&category=${slug}`);
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6" data-aos="fade-up" data-aos-delay="100">
            {categories.map((cat, index) => {
              const IconComponent = cat.icon;
              const isActive = activeCategory === cat.slug;
              
              return (
                <div
                  key={cat.slug}
                  onClick={() => onCategoryClick(cat.slug)}
                  className={`
                    group relative p-6 md:p-8 rounded-2xl md:rounded-3xl cursor-pointer
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
                    relative z-10 w-14 h-14 md:w-16 md:h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center
                    transition-all duration-300
                    ${isActive 
                      ? 'bg-white/20 backdrop-blur-sm' 
                      : `${cat.bgColor} group-hover:bg-white/20`
                    }
                  `}>
                    <IconComponent className={`
                      w-7 h-7 md:w-8 md:h-8 transition-colors duration-300
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 md:mb-14 gap-4" data-aos="fade-up">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/10 to-red-500/10 text-orange-600 rounded-full text-sm font-medium mb-4">
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
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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

      {/* ================== FEATURES SECTION ================== */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-[#0a1628] via-[#1a365d] to-[#0a1628]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8" data-aos="fade-up">
            {[
              { icon: "🚚", title: "Giao hàng nhanh", desc: "Trong 2h nội thành" },
              { icon: "🛡️", title: "Bảo hành chính hãng", desc: "12 tháng toàn quốc" },
              { icon: "💳", title: "Thanh toán an toàn", desc: "Đa dạng phương thức" },
              { icon: "🔄", title: "Đổi trả miễn phí", desc: "Trong vòng 30 ngày" },
            ].map((feature, index) => (
              <div 
                key={index} 
                className="text-center group"
                data-aos="fade-up"
                data-aos-delay={index * 100}
              >
                <div className="w-14 h-14 md:w-16 md:h-16 mx-auto mb-3 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center text-2xl md:text-3xl group-hover:scale-110 group-hover:bg-white/20 transition-all duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-white font-semibold text-sm md:text-base mb-1">{feature.title}</h3>
                <p className="text-white/60 text-xs md:text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
