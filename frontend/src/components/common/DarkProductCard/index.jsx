// src/components/common/DarkProductCard/index.jsx
// Premium dark product card for Home page featured products
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useCart } from "@/providers/CartProvider";

export default function DarkProductCard({ product, onClick }) {
    const FALLBACK = "/default-product.png";
    const [resolvedSrc, setResolvedSrc] = useState(FALLBACK);
    const [errored, setErrored] = useState(false);

    // Normalize image
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
    }, [product?.image]);

    const handleImgError = () => {
        if (resolvedSrc === FALLBACK) return;
        setErrored(true);
        setResolvedSrc(FALLBACK);
    };

    // Format price
    const formatPrice = (p) => {
        if (!p) return "";
        const num = Number(p);
        if (Number.isNaN(num)) return "";
        return num.toLocaleString("vi-VN") + "đ";
    };

    const originalPrice = Number(product?.price ?? 0);
    const brand = product?.brand || "";

    return (
        <div
            onClick={onClick}
            className="group relative bg-[#1a1a1a] border border-white/10 rounded-2xl overflow-hidden cursor-pointer hover:border-white/20 transition-all duration-300"
        >
            {/* Image */}
            <div className="relative aspect-square w-full flex items-center justify-center p-6 bg-gradient-to-b from-white/5 to-transparent">
                <img
                    src={resolvedSrc}
                    alt={product?.name}
                    onError={handleImgError}
                    loading="lazy"
                    className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-110"
                />
            </div>

            {/* Info */}
            <div className="p-4 space-y-2">
                <h3 className="text-white font-medium text-sm leading-snug line-clamp-2 min-h-[40px] group-hover:text-[#2997ff] transition-colors">
                    {product?.name}
                </h3>
                <p className="text-gray-500 text-xs">{brand}</p>
                <p className="text-[#f5a623] font-semibold text-base">
                    {formatPrice(originalPrice)}
                </p>
            </div>
        </div>
    );
}
