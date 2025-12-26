import React, { useState, useEffect } from "react";

// Import các ảnh banner từ assets
import banner1 from "../../../assets/images/Black-Friday-2.jpg"; // hoặc .png tùy format
import banner2 from "../../../assets/images/77-discount-flash-sale-background-260nw-2648902255.webp";
import banner3 from "../../../assets/images/black-friday-dien-thoai-vui.webp";

const slides = [
  { image: banner1, alt: "iPhone 15 Pro Max - Titan mạnh mẽ. Hiệu năng đỉnh cao." },
  { image: banner2, alt: "MacBook Pro M3 - Sức mạnh cho mọi công việc sáng tạo" },
  { image: banner3, alt: "Samsung Galaxy S24 Ultra - AI thông minh. Hiệu suất vượt trội." },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-96 md:h-[450px] mx-5 md:mx-10 mt-5 rounded-2xl overflow-hidden shadow-2xl">
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 transition-opacity duration-700 ${
            current === i ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.alt}
            className="w-full h-full object-cover"
          />
          
          {/* Optional: Overlay gradient để text dễ đọc hơn nếu bạn muốn thêm text lên ảnh */}
          {/* <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" /> */}
        </div>
      ))}

      {/* Navigation Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-10">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all ${
              current === i ? "bg-white w-8" : "bg-white/50 w-3"
            } h-3 rounded-full hover:bg-white/80`}
            aria-label={`Chuyển đến slide ${i + 1}`}
          />
        ))}
      </div>

      {/* Previous Button */}
      <button
        onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white p-3 rounded-full transition z-10"
        aria-label="Slide trước"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>

      {/* Next Button */}
      <button
        onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/30 hover:bg-white/50 backdrop-blur-sm text-white p-3 rounded-full transition z-10"
        aria-label="Slide tiếp theo"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-6 h-6"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}