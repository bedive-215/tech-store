import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import TopBanner from "../../components/common/TopBanner";
import Footer from "../../components/common/Footer";
import HeroSlider from "../../components/common/HeroSlider";
import ProductCard from "../../components/common/ProductCard";

import { useProduct } from "@/providers/ProductProvider";

export default function Home() {
  const navigate = useNavigate();

  const {
    products,
    loading,
    error,
    fetchProducts,
  } = useProduct();

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
    fetchProducts();
  }, [fetchProducts]);

  // helper: lấy id ưu tiên product_id -> id -> _id
  const getProductId = (p) => p?.product_id ?? p?.id ?? p?._id ?? null;

  // helper: normalize image (deal with null / array / concatenated urls / relative urls)
  const normalizeImage = (img) => {
    const FALLBACK = "/default-product.png"; // đặt file fallback trong public/
    if (!img) return FALLBACK;

    // nếu backend trả mảng
    if (Array.isArray(img) && img.length > 0) {
      img = img[0];
    }

    // nếu là object có url property
    if (typeof img === "object" && img !== null) {
      img = img.url ?? img.path ?? null;
    }

    if (typeof img !== "string") return FALLBACK;

    // nếu chuỗi chứa nhiều url (vd: "url1http...url2" hoặc cách nhau bằng space/comma)
    // -> tách bằng space/comma hoặc "http" boundary
    // tìm tất cả http(s) occurrences
    const matches = img.match(/https?:\/\/[^\s,;"]+/g);
    if (matches && matches.length > 0) return matches[0];

    // nếu không có http nhưng có kí tự '//' (protocol relative)
    const protoRel = img.match(/\/\/[^\s,;"]+/);
    if (protoRel) return `${window.location.protocol}${protoRel[0]}`;

    // nếu là đường dẫn relative (vd: /uploads/...)
    if (img.startsWith("/")) {
      // Nếu API host khác, bạn có thể thêm base url: process.env.REACT_APP_API_URL
      // return `${process.env.REACT_APP_API_URL ?? ""}${img}`;
      return img;
    }

    // nếu đến đây thì trả chuỗi nguyên trạng (có thể là full url)
    return img;
  };

  const onProductClick = (p) => {
    const productId = getProductId(p);
    if (!productId) {
      console.warn("Product missing id:", p);
      return;
    }
    navigate(`/user/product/${productId}`);
  };

  return (
    <>
      <TopBanner />
      <HeroSlider />

      {/* DANH MỤC */}
      <section className="py-16 bg-gray-100">
        <div className="max-w-7xl mx-auto px-5">
          <h2 className="text-3xl font-bold text-center mb-10" data-aos="fade-up">
            Danh Mục Sản Phẩm
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-6" data-aos="fade-up">
            {[
              { icon: "📱", name: "Điện Thoại" },
              { icon: "💻", name: "Laptop" },
              { icon: "⌚", name: "Smartwatch" },
              { icon: "🎧", name: "Tai Nghe" },
              { icon: "📷", name: "Camera" },
              { icon: "🖱️", name: "Phụ Kiện" },
            ].map((cat) => (
              <div
                key={cat.name}
                className="bg-white p-8 rounded-xl text-center shadow hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer"
              >
                <div className="text-5xl mb-4">{cat.icon}</div>
                <p className="font-semibold">{cat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SẢN PHẨM NỔI BẬT */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-5">
          <h2 className="text-3xl font-bold text-center mb-10" data-aos="fade-up">
            Sản Phẩm Nổi Bật
          </h2>

          {loading && (
            <p className="text-center text-lg font-medium">Đang tải sản phẩm...</p>
          )}

          {error && (
            <p className="text-center text-red-500 font-medium">{error}</p>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {Array.isArray(products) && products.length > 0 ? (
                products.map((p, index) => {
                  const productId = getProductId(p);
                  const key = productId ?? `product-${index}`;

                  // chuẩn hoá ảnh trước khi pass vào ProductCard
                  const imageUrl = normalizeImage(p?.image);

                  return (
                    <div
                      key={key}
                      data-aos="fade-up"
                      data-aos-delay={index * 100}
                    >
                      <button
                        type="button"
                        onClick={() => onProductClick(p)}
                        className="group relative cursor-pointer w-full text-left p-0 border-0 bg-transparent"
                        aria-label={`Xem chi tiết ${p?.name ?? "sản phẩm"}`}
                      >
                        <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 z-20" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 z-30 transition-all duration-300">
                          <div className="bg-white px-4 py-2 rounded-full shadow-md text-sm font-medium">
                            Xem chi tiết
                          </div>
                        </div>

                        <div className="transform group-hover:-translate-y-2 group-hover:shadow-2xl transition-all duration-300">
                          <ProductCard product={{ ...p, image: imageUrl }} />
                        </div>
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 col-span-full">
                  Không có sản phẩm để hiển thị
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  );
}
