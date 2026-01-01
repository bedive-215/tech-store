import React, { useEffect, useMemo, useState } from "react";

/**
 * ProductCard
 * - Tất cả card cao bằng nhau
 * - UI gọn, giống Cellphones
 * - Flash Sale chỉ là phần bổ sung
 */
export default function ProductCard({ product }) {
  const FALLBACK = "/default-product.png";

  const [resolvedSrc, setResolvedSrc] = useState(FALLBACK);
  const [errored, setErrored] = useState(false);

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
  const salePrice = flashSaleActive
    ? Number(product.flash_sale.sale_price)
    : null;

  const discountPercent = flashSaleActive
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;

  const flashSaleName = flashSaleActive
    ? product.flash_sale.flash_sale_name.split("-")[0].trim()
    : "";

  /* ================= RENDER ================= */
  return (
    <div
      className="
        relative bg-white rounded-2xl overflow-hidden
        shadow-sm hover:shadow-xl hover:-translate-y-1
        transition-all duration-300
        h-full flex flex-col
      "
    >
      {/* FLASH SALE RIBBON */}
      {flashSaleActive && (
        <div className="absolute top-0 right-0 z-20 pointer-events-none">
          <div
            className="
              bg-red-600 text-white text-[11px] font-semibold
              px-14 py-1 rotate-45 translate-x-10 translate-y-4
              shadow-md text-center
            "
          >
            {flashSaleName}
          </div>
        </div>
      )}

      {/* IMAGE (CỐ ĐỊNH TỶ LỆ) */}
      <div className="bg-gray-50 p-4">
        <div className="aspect-square flex items-center justify-center">
          <img
            src={resolvedSrc}
            alt={product?.name}
            onError={handleImgError}
            loading="lazy"
            className="
              max-h-full max-w-full object-contain
              transition-transform duration-300 hover:scale-105
            "
          />
        </div>
      </div>

      {/* INFO (CỐ ĐỊNH CHIỀU CAO) */}
      <div className="p-4 flex flex-col flex-1">
        {/* NAME – 2 dòng */}
        <h3 className="text-gray-800 font-medium text-sm line-clamp-2 min-h-[40px]">
          {product?.name}
        </h3>

        {/* PRICE – luôn chiếm chỗ */}
        <div className="mt-2 min-h-[56px]">
          {flashSaleActive ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-red-600 text-lg font-bold">
                  {formatPrice(salePrice)}
                </span>
                <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded">
                  -{discountPercent}%
                </span>
              </div>
              <span className="text-gray-400 text-sm line-through">
                {formatPrice(originalPrice)}
              </span>
            </>
          ) : (
            <span className="text-orange-500 text-lg font-bold">
              {formatPrice(originalPrice)}
            </span>
          )}
        </div>

        {/* META – đẩy xuống đáy */}
        <div className="mt-auto pt-2 text-xs text-gray-500 flex items-center gap-2">
          <span>⭐ {product?.rating ?? "-"}</span>
          <span>({product?.reviews ?? 0} đánh giá)</span>
        </div>
      </div>
    </div>
  );
}
