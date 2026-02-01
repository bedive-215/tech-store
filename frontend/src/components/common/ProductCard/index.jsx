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
    <div className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 h-full flex flex-col border border-gray-200 hover:border-blue-300">

      {/* FLASH SALE RIBBON */}
      {flashSaleActive && (
        <div className="absolute top-2 left-2 z-20">
          <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow">
            🔥 {flashSaleName || "SALE"} -{discountPercent}%
          </div>
        </div>
      )}

      {/* WISHLIST BUTTON */}
      <button
        onClick={handleWishlistClick}
        className="absolute top-2 right-2 z-20 w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-gray-50"
      >
        {isWishlisted ? (
          <HiHeart className="w-4 h-4 text-red-500" />
        ) : (
          <HiOutlineHeart className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* IMAGE SECTION - Clean white background */}
      <div className="relative bg-white border-b border-gray-100">
        <div className="aspect-[4/3] w-full flex items-center justify-center p-4">
          <img
            src={resolvedSrc}
            alt={product?.name}
            onError={handleImgError}
            loading="lazy"
            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      </div>

      {/* INFO SECTION */}
      <div className="p-3 flex flex-col flex-1 gap-2">
        {/* PRODUCT NAME - Bigger, cleaner */}
        <h3 className="text-gray-900 font-medium text-[15px] leading-snug line-clamp-2 min-h-[42px] group-hover:text-blue-600 transition-colors">
          {product?.name}
        </h3>

        {/* RATING - Compact */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              star <= Math.floor(rating) ? (
                <HiStar key={star} className="w-3 h-3 text-amber-400" />
              ) : (
                <HiOutlineStar key={star} className="w-3 h-3 text-amber-400" />
              )
            ))}
          </div>
          <span className="text-[11px] text-gray-400">({reviewCount})</span>
        </div>

        {/* PRICE SECTION - Prominent */}
        <div className="mt-auto pt-2">
          {flashSaleActive ? (
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-lg font-bold text-red-600">
                {formatPrice(salePrice)}
              </span>
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(originalPrice)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-blue-600">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* TAGS - Simple */}
        <div className="flex items-center gap-1.5 pt-1">
          <span className="text-[10px] text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
            ✓ Chính hãng
          </span>
          <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
            Freeship
          </span>
        </div>
      </div>
    </div>
  );
}
