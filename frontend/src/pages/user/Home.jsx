// src/pages/user/Home.jsx
// Premium Scrollytelling Homepage based on Stitch Design
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Footer from "../../components/common/Footer";
import ProductCard from "../../components/common/ProductCard";
import FloatingNavbar from "../../components/common/FloatingNavbar";
import { useProduct } from "@/providers/ProductProvider";
import { useCart } from "@/providers/CartProvider";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("all");
  const { products, loading, fetchProducts } = useProduct();
  const { getTotalQuantity, addToCart } = useCart();

  /* ================== INIT AOS ================== */
  useEffect(() => {
    AOS.init({ duration: 800, once: true, easing: 'ease-out-cubic' });
  }, []);

  /* ================== FETCH PRODUCTS ================== */
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const params = {
      page: Number(searchParams.get("page") ?? 1),
      limit: Number(searchParams.get("limit") ?? 20),
    };
    const category = searchParams.get("category");
    if (category) params.category = category;
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
    return matches ? matches[0] : (img.startsWith("/") ? img : FALLBACK);
  };

  const onProductClick = (p) => {
    const productId = getProductId(p);
    if (!productId) return;
    navigate(`/user/product/${productId}`, { state: { flash_sale: p.flash_sale ?? null } });
  };

  const cartCount = getTotalQuantity();

  /* ================== RENDER ================== */
  return (
    <div className="min-h-screen bg-black text-white font-['Inter',sans-serif] antialiased">

      {/* ================== FLOATING NAVBAR ================== */}
      <FloatingNavbar />

      {/* ================== HERO SECTION ================== */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto flex flex-col items-center" data-aos="fade-up">
          <span className="text-[#2997ff] font-medium tracking-widest text-sm uppercase mb-4">Bộ Sưu Tập 2024</span>
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-bold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
            Tuyệt tác<br />Công nghệ.
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-12">
            Khám phá sự hoàn hảo trong từng điểm ảnh, từng đường nét thiết kế. Nơi công nghệ chạm đến đỉnh cao nghệ thuật.
          </p>

          {/* Floating Products */}
          <div className="relative w-full h-[300px] md:h-[400px] mt-10 flex items-center justify-center">
            {/* Phone - Center */}
            <div className="absolute z-30 w-40 md:w-56 animate-[float_6s_ease-in-out_infinite]">
              <img
                alt="Phone"
                className="w-full h-auto drop-shadow-2xl rounded-2xl grayscale-[30%] hover:grayscale-0 transition-all duration-500"
                src="/images/categories/phone.jpeg"
              />
            </div>
            {/* Laptop - Right Back */}
            <div className="absolute z-20 translate-x-24 md:translate-x-40 -translate-y-10 opacity-60 blur-[1px] w-48 md:w-72 animate-[float_6s_ease-in-out_3s_infinite]">
              <img
                alt="Laptop"
                className="w-full h-auto drop-shadow-2xl rounded-2xl"
                src="/images/categories/laptop.jpeg"
              />
            </div>
            {/* Headphones - Left Back */}
            <div className="absolute z-20 -translate-x-20 md:-translate-x-32 translate-y-10 opacity-60 blur-[1px] w-32 md:w-48 animate-[float_6s_ease-in-out_infinite]">
              <img
                alt="Headphones"
                className="w-full h-auto drop-shadow-2xl rounded-2xl"
                src="/images/categories/accessories.png"
              />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce text-gray-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>
      </section>

      {/* ================== VIDEO TRANSITION: hello.mp4 → LAPTOP ================== */}
      <section className="relative z-20 bg-black py-16 overflow-hidden">
        <div className="relative w-full max-w-6xl mx-auto px-4">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto rounded-3xl shadow-2xl"
            src="/videos/hello.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none rounded-3xl" />
        </div>
      </section>

      {/* ================== LAPTOP SECTION ================== */}
      <section id="section-laptop" className="min-h-screen flex items-center justify-center relative z-20 bg-[#050505] py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black to-[#0a0a0a]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-12 md:mb-16" data-aos="fade-up">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight mb-6">
              MacBook.<br />
              <span className="bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">Sức mạnh không giới hạn.</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl">
              Mỏng nhẹ không tưởng. Mạnh mẽ phi thường với chip Apple M3 Series. Thời lượng pin cả ngày dài cho mọi tác vụ sáng tạo.
            </p>
          </div>

          {/* Image with floating cards */}
          <div className="relative" data-aos="fade-up" data-aos-delay="200">
            <div className="relative z-10 w-full max-w-4xl mx-auto transform transition-transform hover:scale-[1.02] duration-700">
              <img
                alt="MacBook Pro"
                className="w-full h-auto drop-shadow-2xl rounded-2xl"
                src="/images/categories/laptop.jpeg"
              />
            </div>
          </div>

          {/* CTA */}
          <div className="flex justify-center mt-12">
            <button
              onClick={() => navigate('/user/category/laptop')}
              className="bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2 group"
            >
              Khám phá MacBook
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ================== VIDEO TRANSITION: phone.mp4 → PHONE ================== */}
      <section className="relative z-20 bg-black py-16 overflow-hidden">
        <div className="relative w-full max-w-6xl mx-auto px-4">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto rounded-3xl shadow-2xl"
            src="/videos/phone.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none rounded-3xl" />
        </div>
      </section>

      {/* ================== IPHONE SECTION ================== */}
      <section id="section-phone" className="min-h-screen flex items-center justify-center relative z-20 bg-black py-20 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-12 items-center w-full">
          {/* Text Content */}
          <div className="order-2 md:order-1 space-y-8" data-aos="fade-right">
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-tight">
              <span className="text-white">iPhone Series.</span><br />
              <span className="text-gray-500">Đẳng cấp dẫn đầu.</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed">
              Khung viền Titan bền bỉ. Chip A17 Pro mạnh mẽ chưa từng có. Trải nghiệm camera vượt qua mọi giới hạn nhiếp ảnh di động.
            </p>

            {/* Specs */}
            <div className="flex items-center gap-6 pt-4">
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-bold text-white">48MP</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Camera Chính</span>
              </div>
              <div className="w-px h-12 bg-gray-800" />
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-bold text-white">A17 Pro</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Chipset</span>
              </div>
              <div className="w-px h-12 bg-gray-800" />
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl font-bold text-white">29h</span>
                <span className="text-xs text-gray-500 uppercase tracking-wider">Xem Video</span>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/user/category/dien-thoai')}
              className="mt-8 bg-white text-black px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-colors flex items-center gap-2 group"
            >
              Khám phá iPhone
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>

          {/* Image */}
          <div className="order-1 md:order-2 relative h-[400px] md:h-[600px] flex items-center justify-center" data-aos="fade-left">
            <div className="relative w-full max-w-sm mx-auto transform transition-all duration-1000 hover:scale-105">
              <img
                alt="iPhone Detail"
                className="w-full h-auto drop-shadow-[0_20px_50px_rgba(41,151,255,0.3)] rounded-2xl"
                src="/images/categories/phone.jpeg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================== VIDEO TRANSITION: accessories.mp4 → ACCESSORIES ================== */}
      <section className="relative z-20 bg-black py-16 overflow-hidden">
        <div className="relative w-full max-w-6xl mx-auto px-4">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-auto rounded-3xl shadow-2xl"
            src="/videos/accessories.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent pointer-events-none rounded-3xl" />
        </div>
      </section>

      {/* ================== ACCESSORIES SECTION ================== */}
      <section id="section-accessories" className="min-h-screen flex items-center justify-center relative z-20 bg-[#0a0a0a] py-20 overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-bl from-gray-900 via-black to-black opacity-80" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Floating products */}
          <div className="relative h-[400px] md:h-[600px] w-full flex items-center justify-center" data-aos="fade-right">
            <div className="absolute z-20 w-48 md:w-72 animate-[float_6s_ease-in-out_infinite]">
              <img
                alt="AirPods"
                className="w-full h-auto drop-shadow-[0_35px_35px_rgba(255,255,255,0.1)] rounded-2xl"
                src="/images/categories/accessories.png"
              />
            </div>
          </div>

          {/* Text content */}
          <div className="space-y-8" data-aos="fade-left">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-tight">
              Âm thanh & Phụ kiện.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-300 to-emerald-500">Hoàn hảo từng chi tiết.</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-400 font-light leading-relaxed border-l-2 border-green-500/50 pl-6">
              Nâng tầm trải nghiệm với hệ sinh thái phụ kiện cao cấp. Âm thanh không gian cá nhân hóa, kết nối liền mạch và thiết kế tinh tế.
            </p>

            {/* Category cards */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <button
                onClick={() => navigate('/user/category/tai-nghe')}
                className="group bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex justify-between items-start mb-4">
                  <svg className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-1">Âm thanh</h3>
                <p className="text-xs text-gray-500">AirPods, Sony, JBL</p>
              </button>

              <button
                onClick={() => navigate('/user/category/ban-phim-co')}
                className="group bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-2xl hover:bg-white/5 transition-colors text-left"
              >
                <div className="flex justify-between items-start mb-4">
                  <svg className="w-8 h-8 text-gray-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                  </svg>
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
                </div>
                <h3 className="font-bold text-lg mb-1">Phụ kiện Mac</h3>
                <p className="text-xs text-gray-500">Chuột, Phím, Trackpad</p>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ================== FEATURED PRODUCTS ================== */}
      <section className="bg-black py-20 md:py-32 px-4 relative z-20">
        <div className="max-w-[1280px] mx-auto">
          {/* Header with tabs */}
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-12 md:mb-16 gap-6" data-aos="fade-up">
            <div>
              <span className="text-[#2997ff] font-bold tracking-widest text-xs uppercase mb-2 block">Mua sắm ngay</span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">Sản phẩm nổi bật</h2>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
              {[
                { key: 'all', label: 'Tất cả' },
                { key: 'dien-thoai', label: 'Điện thoại' },
                { key: 'laptop', label: 'Laptop' },
                { key: 'tai-nghe', label: 'Tai nghe' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => {
                    setActiveTab(tab.key);
                    if (tab.key === 'all') {
                      navigate('/user/home');
                    } else {
                      navigate(`/user/home?category=${tab.key}`);
                    }
                  }}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.key
                    ? 'bg-white text-black'
                    : 'bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-4 border-gray-800" />
                <div className="absolute inset-0 rounded-full border-4 border-[#2997ff] border-t-transparent animate-spin" />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" data-aos="fade-up" data-aos-delay="100">
              {[...(products || [])]
                .sort((a, b) => (b.flash_sale ? 1 : 0) - (a.flash_sale ? 1 : 0))
                .slice(0, 8)
                .map((p, index) => {
                  const productId = getProductId(p);
                  const imageUrl = normalizeImage(p?.image);

                  return (
                    <div
                      key={productId ?? index}
                      onClick={() => onProductClick(p)}
                      className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-200 hover:border-blue-300 cursor-pointer"
                    >
                      {/* Wishlist button */}
                      <button
                        className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50"
                        onClick={(e) => { e.stopPropagation(); }}
                      >
                        <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z" />
                        </svg>
                      </button>

                      {/* Sale badge */}
                      {p.flash_sale && (
                        <div className="absolute top-2 left-2 z-20">
                          <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow">
                            🔥 {p.flash_sale.flash_sale_name || 'Tết 2026'} -{Math.round((1 - p.flash_sale.sale_price / p.price) * 100)}%
                          </div>
                        </div>
                      )}

                      {/* Image */}
                      <div className="relative bg-white border-b border-gray-100">
                        <div className="aspect-[4/3] w-full flex items-center justify-center p-4">
                          <img
                            alt={p.name}
                            loading="lazy"
                            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                            src={imageUrl}
                            onError={(e) => { e.target.src = '/default-product.png'; }}
                          />
                        </div>
                      </div>

                      {/* Product info */}
                      <div className="p-3 flex flex-col flex-1 gap-2">
                        <h3 className="text-gray-900 font-medium text-[15px] leading-snug line-clamp-2 min-h-[42px] group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </h3>

                        {/* Ratings */}
                        <div className="flex items-center gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg key={star} className="w-3 h-3 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                                <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-[11px] text-gray-400">({p.review_count || 0})</span>
                        </div>

                        {/* Price and Cart */}
                        <div className="mt-auto pt-2 flex items-center justify-between gap-2">
                          <div>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className={`text-lg font-bold ${p.flash_sale ? 'text-red-600' : 'text-blue-600'}`}>
                                {new Intl.NumberFormat('vi-VN').format(p.flash_sale ? p.flash_sale.sale_price : p.price)} ₫
                              </span>
                              {(p.flash_sale || (p.original_price && p.original_price > p.price)) && (
                                <span className="text-xs text-gray-400 line-through">
                                  {new Intl.NumberFormat('vi-VN').format(p.price)} ₫
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className="w-10 h-10 flex-shrink-0 flex items-center justify-center bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 transition-all duration-200"
                            title="Thêm vào giỏ hàng"
                            onClick={(e) => {
                              e.stopPropagation();
                              addToCart({
                                product_id: productId,
                                quantity: 1,
                                product_name: p.name,
                                image_url: imageUrl,
                                stock: p.stock || 999,
                                price: p.price,
                              });
                            }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </button>
                        </div>

                        {/* Badges */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">✓ Chính hãng</span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Freeship</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* View all link */}
          <div className="mt-12 md:mt-16 text-center">
            <button
              onClick={() => navigate('/user/home?limit=40')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1"
            >
              Xem tất cả sản phẩm
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* ================== DARK FOOTER ================== */}
      <footer className="bg-black border-t border-white/10 pt-16 pb-12 text-sm text-gray-400">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
            <div className="flex items-center gap-3">
              <svg className="w-10 h-10 text-[#2997ff]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
              <span className="text-2xl font-bold text-white tracking-tight">TechStore</span>
            </div>

            <div className="flex gap-8">
              <Link to="/user/profile" className="hover:text-white transition-colors">Tài khoản</Link>
              <Link to="/user/orders" className="hover:text-white transition-colors">Đơn hàng</Link>
              <Link to="/user/cart" className="hover:text-white transition-colors">Giỏ hàng</Link>
            </div>

            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <span className="font-bold text-sm">fb</span>
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                <span className="font-bold text-sm">ig</span>
              </a>
            </div>
          </div>

          <div className="text-center md:text-left border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p>© 2024 TechStore Premium. Designed for excellence.</p>
            <p className="mt-2 md:mt-0 text-gray-600">Vietnam • Tiếng Việt</p>
          </div>
        </div>
      </footer>

      {/* Custom animations */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
