// src/pages/user/Home.jsx
import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import TopBanner from "../../components/common/TopBanner";
import Footer from "../../components/common/Footer";
import HeroSlider from "../../components/common/HeroSlider";
import ProductCard from "../../components/common/ProductCard";

import { useProduct } from "@/providers/ProductProvider";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  const { products, loading, error, fetchProducts } = useProduct();

  /* ================== INIT AOS ================== */
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  /* ================== FETCH PRODUCTS BY QUERY ================== */
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    const params = {};

    params.page = Number(searchParams.get("page") ?? 1);
    params.limit = Number(searchParams.get("limit") ?? 20);

    const search = searchParams.get("search");
    if (search) params.search = search;

    const category = searchParams.get("category");
    if (category) params.category = category;

    const brand = searchParams.get("brand");
    if (brand) params.brand = brand;

    const min_price = searchParams.get("min_price");
    if (min_price) params.min_price = Number(min_price);

    const max_price = searchParams.get("max_price");
    if (max_price) params.max_price = Number(max_price);

    const sort = searchParams.get("sort");
    if (sort) params.sort = sort;

    fetchProducts(params);
  }, [location.search, fetchProducts]);

  /* ================== HELPERS ================== */
  const getProductId = (p) => p?.product_id ?? p?.id ?? p?._id ?? null;

  const normalizeImage = (img) => {
    const FALLBACK = "/default-product.png";
    if (!img) return FALLBACK;

    if (Array.isArray(img)) img = img[0];
    if (typeof img === "object") img = img?.url ?? img?.path;
    if (typeof img !== "string") return FALLBACK;

    const matches = img.match(/https?:\/\/[^\s,;"]+/g);
    if (matches) return matches[0];

    if (img.startsWith("/")) return img;

    return img;
  };
  

 const onProductClick = (p) => {
  const productId = getProductId(p);
  if (!productId) return;

  navigate(`/user/product/${productId}`, {
    state: {
      flash_sale: p.flash_sale ?? null,
    },
  });
};


  /* ================== CATEGORY CLICK ================== */
  const categories = [
    { icon: "📱", name: "Điện Thoại", slug: "dien-thoai" },
    { icon: "💻", name: "Laptop", slug: "laptop" },
    { icon: "🎧", name: "Tai Nghe", slug: "tai-nghe" },
    { icon: "🖱️", name: "Phụ Kiện", slug: "ban-phim-co" },
  ];

  const onCategoryClick = (slug) => {
    navigate(
      `/user/home?page=1&limit=20&category=${slug}`
    );
  };

  /* ================== RENDER ================== */
  return (
    <>
      <TopBanner />
      <HeroSlider />

      {/* ================== DANH MỤC ================== */}
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
            {categories.map((cat) => (
              <div
                key={cat.slug}
                onClick={() => onCategoryClick(cat.slug)}
                className="bg-white p-8 rounded-xl text-center shadow
                           hover:shadow-xl hover:-translate-y-2
                           transition-all cursor-pointer"
              >
                <div className="text-5xl mb-4">{cat.icon}</div>
                <p className="font-semibold">{cat.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================== SẢN PHẨM ================== */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-5">
          <h2
            className="text-3xl font-bold text-center mb-10"
            data-aos="fade-up"
          >
            Sản Phẩm Nổi Bật
          </h2>

          {loading && (
            <p className="text-center text-lg font-medium">
              Đang tải sản phẩm...
            </p>
          )}

          {error && (
            <p className="text-center text-red-500 font-medium">{error}</p>
          )}

          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products?.length > 0 ? (
                products.map((p, index) => {
                  const productId = getProductId(p);
                  const imageUrl = normalizeImage(p?.image);

                  return (
                    <div
                      key={productId ?? index}
                      data-aos="fade-up"
                      data-aos-delay={index * 100}
                    >
                      <button
                        onClick={() => onProductClick(p)}
                        className="group relative w-full text-left"
                      >
                        <div className="absolute inset-0 bg-black/10 rounded-xl opacity-0 group-hover:opacity-100 z-20" />
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 z-30">
                          <div className="bg-white px-4 py-2 rounded-full shadow">
                            Xem chi tiết
                          </div>
                        </div>

                        <div className="group-hover:-translate-y-2 group-hover:shadow-2xl transition-all">
                          <ProductCard
                            product={{ ...p, image: imageUrl }}
                          />
                        </div>
                      </button>
                    </div>
                  );
                })
              ) : (
                <p className="col-span-full text-center text-gray-500">
                  Không có sản phẩm
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
