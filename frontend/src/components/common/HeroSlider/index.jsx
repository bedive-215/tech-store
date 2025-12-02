import React, { useState, useEffect } from "react";

const slides = [
  { title: "iPhone 15 Pro Max", desc: "Titan mạnh mẽ. Hiệu năng đỉnh cao.", gradient: "from-orange-500 to-orange-700" },
  { title: "MacBook Pro M3", desc: "Sức mạnh cho mọi công việc sáng tạo", gradient: "from-blue-500 to-blue-800" },
  { title: "Samsung Galaxy S24 Ultra", desc: "AI thông minh. Hiệu suất vượt trội.", gradient: "from-purple-600 to-purple-800" },
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
    <div className="relative h-96 md:h-[450px] mx-5 md:mx-10 mt-5 rounded-2xl overflow-hidden">
      {slides.map((slide, i) => (
        <div
          key={i}
          className={`absolute inset-0 bg-gradient-to-r ${slide.gradient} flex items-center justify-center text-white transition-opacity duration-700 ${current === i ? "opacity-100" : "opacity-0"}`}
        >
          <div className="text-center px-10">
            <h2 className="text-4xl md:text-6xl font-extrabold mb-5 drop-shadow-lg">{slide.title}</h2>
            <p className="text-lg md:text-2xl mb-8 drop-shadow">{slide.desc}</p>
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 px-10 rounded-full shadow-lg hover:shadow-xl transition transform hover:-translate-y-1">
              Mua Ngay
            </button>
          </div>
        </div>
      ))}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all ${current === i ? "bg-white w-8" : "bg-white/50 w-3 h-3"} h-3 rounded-full`}
          />
        ))}
      </div>
    </div>
  );
}