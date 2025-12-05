import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";

import Footer from "../../components/common/Footer";
import { useProduct } from "@/providers/ProductProvider";

export default function Product() {
  const { id } = useParams(); // id = product_id được truyền từ Home
  const navigate = useNavigate();

  const {
    productDetail,
    loading,
    error,
    fetchProductById,
  } = useProduct();

  const [currentImg, setCurrentImg] = useState(0);

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
    fetchProductById(id); // gọi API lấy chi tiết theo product_id
  }, [id, fetchProductById]);

  const product = productDetail;

  if (loading)
    return <div className="text-center py-20 text-xl font-semibold">Đang tải thông tin sản phẩm...</div>;

  if (error || !product)
    return <div className="text-center py-20 text-xl font-semibold">Không tìm thấy sản phẩm!</div>;

  // ẢNH SẢN PHẨM
  const images = product.media?.length > 0
    ? product.media.map((m) => m.url)
    : ["/placeholder.png"];

  const nextImage = () => setCurrentImg((prev) => (prev + 1) % images.length);
  const prevImage = () => setCurrentImg((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  const goToBuy = () => {
    navigate(`/user/customer-info/${product.product_id}`);
  };

  return (
    <>
      <div className="max-w-7xl mx-auto px-5 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* LEFT IMAGE GALLERY */}
          <div className="flex flex-col items-center" data-aos="fade-right">
            <div className="relative w-full flex items-center justify-center">
              <button
                onClick={prevImage}
                className="absolute left-0 text-3xl px-3 py-2 bg-white/80 rounded-full shadow hover:bg-gray-200"
              >
                ‹
              </button>

              <img
                src={images[currentImg]}
                alt={product.name}
                className="rounded-xl shadow-lg w-4/5 transition duration-300"
              />

              <button
                onClick={nextImage}
                className="absolute right-0 text-3xl px-3 py-2 bg-white/80 rounded-full shadow hover:bg-gray-200"
              >
                ›
              </button>
            </div>

            {/* Thumbnails */}
            <div className="flex gap-4 mt-4">
              {images.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt="thumb"
                  onClick={() => setCurrentImg(index)}
                  className={`w-20 h-20 object-cover rounded-lg cursor-pointer border-2 ${
                    currentImg === index ? "border-orange-500" : "border-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT INFO */}
          <div className="flex flex-col gap-6" data-aos="fade-left">
            <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>

            {/* Giá */}
            <div className="text-3xl font-bold text-orange-500">
              {Number(product.price).toLocaleString()}₫
            </div>

            {/* Thương hiệu & danh mục */}
            <div className="text-gray-700 text-lg">
              <p><strong>Thương hiệu:</strong> {product.brand?.name}</p>
              <p><strong>Danh mục:</strong> {product.category?.name}</p>
              <p><strong>Tồn kho:</strong> {product.stock}</p>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 mt-5">
              <button className="w-full py-3 rounded-xl text-white text-lg font-semibold shadow-lg bg-orange-500 hover:opacity-90">
                Thêm vào giỏ hàng
              </button>

              <button
                onClick={goToBuy}
                className="w-full py-3 rounded-xl text-white text-lg font-semibold shadow-lg bg-gradient-to-r from-orange-500 to-orange-700 hover:opacity-90"
              >
                Mua ngay
              </button>
            </div>
          </div>
        </div>

        {/* DESCRIPTION */}
        <section className="mt-16" data-aos="fade-up">
          <h2 className="text-2xl font-bold mb-4">Mô tả sản phẩm</h2>
          <p className="text-gray-700 leading-7">{product.description}</p>
        </section>

        {/* SPECIFICATIONS (nếu có) */}
        {product.specs && (
          <section className="mt-12" data-aos="fade-up">
            <h2 className="text-2xl font-bold mb-4">Thông số kỹ thuật</h2>

            <div className="bg-white rounded-xl shadow p-6">
              {Object.entries(product.specs).map(([key, value]) => (
                <div
                  key={key}
                  className="flex justify-between py-3 border-b last:border-none"
                >
                  <span className="text-gray-600">{key.replace("_", " ")}</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* REVIEWS */}
        <section className="mt-12" data-aos="fade-up">
          <h2 className="text-2xl font-bold mb-4">Đánh giá của khách hàng</h2>
          <div className="bg-white rounded-xl shadow p-6">
            <p className="text-gray-500">Chưa có đánh giá nào.</p>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
