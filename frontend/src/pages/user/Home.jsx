import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import TopBanner from "../../components/common/TopBanner";
//import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";
import HeroSlider from "../../components/common/HeroSlider";
import ProductCard from "../../components/common/ProductCard";

const products = [
  { id: 1, name: "iPhone 15 Pro Max 256GB", price: "29.990.000đ", oldPrice: "34.990.000đ", badge: "Trả góp 0%", rating: 4.8, reviews: 234 },
  { id: 2, name: "Samsung Galaxy S24 Ultra 12GB", price: "27.990.000đ", oldPrice: "31.990.000đ", badge: "Giảm 12%", rating: 4.7, reviews: 189 },
  { id: 3, name: "MacBook Pro M3 14 inch", price: "42.990.000đ", oldPrice: "48.990.000đ", badge: "Mới về", rating: 4.9, reviews: 156 },
  { id: 4, name: "iPad Pro M2 11 inch 128GB", price: "19.990.000đ", oldPrice: "22.990.000đ", badge: "Hot", rating: 4.6, reviews: 312 },
  { id: 5, name: "AirPods Pro 2 USB-C", price: "5.990.000đ", oldPrice: "6.990.000đ", badge: "Bán chạy", rating: 4.8, reviews: 567 },
  { id: 6, name: "Apple Watch Series 9 GPS", price: "9.990.000đ", oldPrice: "11.990.000đ", badge: "Giảm sốc", rating: 4.7, reviews: 423 },
];

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <>
      <TopBanner />
      <HeroSlider />

      {/* Categories */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-5">
          <h2 
            className="text-3xl font-bold text-center mb-10"
            data-aos="fade-up"
          >
            Danh Mục Sản Phẩm
          </h2>

          <div 
            className="grid grid-cols-2 md:grid-cols-6 gap-6"
            data-aos="fade-up"
          >
            {["📱 Điện Thoại", "💻 Laptop", "⌚ Smartwatch", "🎧 Tai Nghe", "📷 Camera", "🖱️ Phụ Kiện"].map((cat) => (
              <div
                key={cat}
                className="bg-white p-8 rounded-xl text-center shadow hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer"
              >
                <div className="text-5xl mb-4">{cat.split(" ")[0]}</div>
                <p className="font-semibold">{cat.split(" ").slice(1).join(" ")}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-5">
          <h2 
            className="text-3xl font-bold text-center mb-10"
            data-aos="fade-up"
          >
            Sản Phẩm Nổi Bật
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.map((p, i) => (
              <div
                key={p.id}
                data-aos="fade-up"
                data-aos-delay={i * 100}
              >
                <div
                  onClick={() => navigate(`/product/${p.id}`)}
                  className="group relative cursor-pointer"
                >
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-20"></div>

                  {/* Xem chi tiết icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 z-30 transition-all duration-300">
                    <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium">
                      Xem chi tiết
                    </div>
                  </div>

                  {/* Product card itself */}
                  <div className="transform group-hover:-translate-y-2 group-hover:shadow-2xl transition-all duration-300">
                    <ProductCard product={p} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
