import React, { useEffect, useState } from "react";

/**
 * ProductCard:
 * - Trả về resolvedSrc được lưu trong state để tránh gán src liên tục gây vòng lặp.
 * - Nếu image load lỗi -> set một lần sang FALLBACK và không retry nữa.
 */
export default function ProductCard({ product }) {
  const FALLBACK = "/default-product.png"; // đảm bảo file này tồn tại trong /public

  // state để giữ src hiện thời và cờ đã lỗi
  const [resolvedSrc, setResolvedSrc] = useState(FALLBACK);
  const [errored, setErrored] = useState(false);

  // Normalize function (same as trước)
  const normalizeImage = (img) => {
    if (!img) return FALLBACK;

    if (Array.isArray(img) && img.length > 0) img = img[0];

    if (typeof img === "object" && img !== null) {
      img = img.url ?? img.path ?? img.src ?? null;
    }

    if (typeof img !== "string") return FALLBACK;

    const matches = img.match(/https?:\/\/[^\s,;"]+/g);
    if (matches && matches.length > 0) return matches[0];

    const protoRel = img.match(/\/\/[^\s,;"]+/);
    if (protoRel) return window.location.protocol + protoRel[0];

    if (img.startsWith("/")) return img;

    return img;
  };

  // Khi product.image thay đổi -> compute src một lần và set vào state (nếu khác)
  useEffect(() => {
    const img = normalizeImage(product?.image);
    // Nếu đã bị lỗi trước đó và resolvedSrc đang là FALLBACK thì không override lại
    if (errored && resolvedSrc === FALLBACK) return;

    if (img !== resolvedSrc) {
      setResolvedSrc(img);
      setErrored(false); // reset cờ lỗi vì đang cố tải nguồn mới
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.image]); // chỉ phụ thuộc image

  // onError: chỉ set fallback 1 lần
  const handleImgError = (e) => {
    // tránh set state nếu đã là fallback
    if (resolvedSrc === FALLBACK) return;
    setErrored(true);
    setResolvedSrc(FALLBACK);
  };

  // format price helper
  const formatPrice = (p) => {
    if (p === undefined || p === null || p === "") return "";
    const num = typeof p === "number" ? p : Number(String(p).replace(/[^\d.-]/g, ""));
    if (Number.isNaN(num)) return String(p);
    return num.toLocaleString("vi-VN") + " ₫";
  };

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fadeInUp">
      <div className="relative">
        {product?.badge && (
          <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10">
            {product.badge}
          </span>
        )}

        {/* Image area */}
        <div className="w-full h-60 bg-gray-200 flex items-center justify-center overflow-hidden rounded-t-xl">
          <img
            src={resolvedSrc}
            alt={product?.name ?? "product"}
            onError={handleImgError}
            loading="lazy"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <div className="p-5">
        <h3 className="text-gray-800 font-semibold text-base line-clamp-2 h-12">
          {product?.name}
        </h3>

        <div className="mt-3">
          <span className="text-2xl font-bold text-orange-500">{formatPrice(product?.price)}</span>
          {product?.oldPrice && (
            <span className="text-gray-500 line-through ml-2 text-sm">
              {formatPrice(product?.oldPrice)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 mt-3">
          <span className="text-yellow-400">⭐ {product?.rating ?? "-"}</span>
          <span className="text-gray-500 text-sm">({product?.reviews ?? 0})</span>
        </div>
      </div>
    </div>
  );
}
