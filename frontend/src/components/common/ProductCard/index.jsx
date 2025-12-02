import React from "react";

export default function ProductCard({ product }) {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-fadeInUp">
      <div className="relative">
        <span className="absolute top-3 left-3 bg-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-full z-10">
          {product.badge}
        </span>
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-full h-60" />
      </div>
      <div className="p-5">
        <h3 className="text-gray-800 font-semibold text-base line-clamp-2 h-12">
          {product.name}
        </h3>
        <div className="mt-3">
          <span className="text-2xl font-bold text-orange-500">{product.price}</span>
          <span className="text-gray-500 line-through ml-2 text-sm">{product.oldPrice}</span>
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className="text-yellow-400">⭐ {product.rating}</span>
          <span className="text-gray-500 text-sm">({product.reviews})</span>
        </div>
      </div>
    </div>
  );
}