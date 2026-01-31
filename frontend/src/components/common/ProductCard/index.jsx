import React, { useEffect, useMemo, useState } from "react";
import { HiOutlineStar, HiStar, HiOutlineHeart, HiHeart } from "react-icons/hi2";

/**
 * ProductCard - Premium Design
 * - Glassmorphism hover effect
 * - Modern card layout
 * - Flash Sale ribbon with animation
 */
export default function ProductCard({ product, onWishlistToggle }) {
  const FALLBACK = "/default-product.png";

  const [resolvedSrc, setResolvedSrc] = useState(FALLBACK);
  const [errored, setErrored] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);

  /* ================= IMAGE ================= */
  const normalizeImage = (img) => {
    if (!img) return FALLBACK;
    if (Array.isArray(img) && img.length > 0) img = img[0];
    if (typeof img === "object" && img !== null) {
      img = img.url ?? img.path ?? img.src ?? null;
    }
    if (typeof img !== "string") return FALLBACK;

    const matches = img.match(/https?:\/\/[^\s,;"]+/g);
    if (matches?.length) return matches[0];
    if (img.startsWith("/")) return img;

    return img;
  };

  useEffect(() => {
    const img = normalizeImage(product?.image);
    if (errored && resolvedSrc === FALLBACK) return;
    if (img !== resolvedSrc) {
      setResolvedSrc(img);
      setErrored(false);
    }
    // eslint-disable-next-line
  }, [product?.image]);

  const handleImgError = () => {
    if (resolvedSrc === FALLBACK) return;
    setErrored(true);
    setResolvedSrc(FALLBACK);
  };

  /* ================= PRICE ================= */
  const formatPrice = (p) => {
    if (!p) return "";
    const num = Number(p);
    if (Number.isNaN(num)) return "";
    return num.toLocaleString("vi-VN") + " ₫";
  };

  /* ================= FLASH SALE ================= */
  const flashSaleActive = useMemo(() => {
    const fs = product?.flash_sale;
    if (!fs) return false;
    const salePrice = Number(fs.sale_price);
    return Number.isFinite(salePrice) && salePrice > 0;
  }, [product?.flash_sale]);

  const originalPrice = Number(product?.price ?? 0);
  const salePrice = flashSaleActive ? Number(product.flash_sale.sale_price) : null;
  const discountPercent = flashSaleActive
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;
  const flashSaleName = flashSaleActive
    ? product.flash_sale.flash_sale_name.split("-")[0].trim()
    : "";

  /* ================= RATING ================= */
  const rating = product?.rating ?? 4.5;
  const reviewCount = product?.reviews ?? 0;

  /* ================= WISHLIST ================= */
  const handleWishlistClick = (e) => {
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    onWishlistToggle?.(product);
  };

  /* ================= RENDER ================= */
  return (
    <div className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 h-full flex flex-col border border-gray-100 hover:border-[#137fec]/20">

      {/* FLASH SALE RIBBON - Animated */}
      {flashSaleActive && (
        <div className="absolute top-3 left-3 z-20">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg blur-sm opacity-75 animate-pulse" />
            <div className="relative bg-gradient-to-r from-red-600 to-orange-500 text-white text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-lg shadow-lg">
              🔥 {flashSaleName || "SALE"}
            </div>
          </div>
        </div>
      )}

      {/* DISCOUNT BADGE */}
      {flashSaleActive && discountPercent > 0 && (
        <div className="absolute top-3 right-3 z-20">
          <div className="bg-red-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg">
            -{discountPercent}%
          </div>
        </div>
      )}

      {/* WISHLIST BUTTON */}
      <button
        onClick={handleWishlistClick}
        className="absolute top-12 right-3 z-20 w-8 h-8 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-white"
      >
        {isWishlisted ? (
          <HiHeart className="w-4 h-4 text-red-500" />
        ) : (
          <HiOutlineHeart className="w-4 h-4 text-gray-600" />
        )}
      </button>

      {/* IMAGE SECTION */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#137fec]/5 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-blue-500/5 rounded-full" />

        <div className="aspect-square w-full flex items-center justify-center relative z-10 p-4">
          <img
            src={resolvedSrc}
            alt={product?.name}
            onError={handleImgError}
            loading="lazy"
            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
        </div>

        {/* Quick View Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
          <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-medium px-4 py-2 rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            Xem chi tiết →
          </span>
        </div>
      </div>

      {/* INFO SECTION */}
      <div className="p-4 flex flex-col flex-1">
        {/* PRODUCT NAME */}
        <h3 className="text-gray-800 font-semibold text-sm sm:text-base line-clamp-2 min-h-[40px] sm:min-h-[48px] group-hover:text-[#137fec] transition-colors duration-300">
          {product?.name}
        </h3>

        {/* RATING */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((star) => (
              star <= Math.floor(rating) ? (
                <HiStar key={star} className="w-3.5 h-3.5 text-yellow-400" />
              ) : (
                <HiOutlineStar key={star} className="w-3.5 h-3.5 text-yellow-400" />
              )
            ))}
          </div>
          <span className="text-xs text-gray-500">({reviewCount})</span>
        </div>

        {/* PRICE SECTION */}
        <div className="mt-3 min-h-[50px]">
          {flashSaleActive ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">
                  {formatPrice(salePrice)}
                </span>
              </div>
              <span className="text-gray-400 text-sm line-through">
                {formatPrice(originalPrice)}
              </span>
            </div>
          ) : (
            <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-[#137fec] to-[#0ea5e9] bg-clip-text text-transparent">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* TAGS/META */}
        <div className="mt-auto pt-3 flex items-center gap-2 flex-wrap">
          <span className="inline-flex items-center text-[10px] sm:text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            ✓ Chính hãng
          </span>
          <span className="inline-flex items-center text-[10px] sm:text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            🚚 Freeship
          </span>
        </div>
      </div>
    </div>
  );
}
