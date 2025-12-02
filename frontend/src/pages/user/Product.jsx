import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
//import Header from "../../components/common/Header";
import Footer from "../../components/common/Footer";

const FAKE_PRODUCTS = [
  {
    id: 1,
    name: "iPhone 15 Pro Max 256GB",
    price: "29.990.000đ",
    oldPrice: "34.990.000đ",
    badge: "Trả góp 0%",
    rating: 4.8,
    reviews: 234,
    description:
      "iPhone 15 Pro Max với chip A17 Pro mạnh mẽ, camera zoom quang 5x, màn hình Super Retina XDR 120Hz và thời lượng pin vượt trội.",
    specs: {
      Màn_hình: "OLED 6.7 inch, 120Hz",
      Chip: "A17 Pro",
      RAM: "8GB",
      Camera: "48MP + 12MP + 12MP",
      Pin: "4,422 mAh",
    },
    image:
      "https://cdn.tgdd.vn/Products/Images/42/329190/iphone-15-pro-max-blue-thumb-600x600.jpg",
  },

  {
    id: 2,
    name: "Samsung Galaxy S24 Ultra 12GB",
    price: "27.990.000đ",
    oldPrice: "31.990.000đ",
    badge: "Giảm 12%",
    rating: 4.7,
    reviews: 189,
    description:
      "Galaxy S24 Ultra sở hữu camera 200MP, màn hình Dynamic AMOLED 2X, chip Snapdragon 8 Gen 3 và bút S-Pen tiện lợi.",
    specs: {
      Màn_hình: "AMOLED 6.8 inch, 120Hz",
      Chip: "Snapdragon 8 Gen 3",
      RAM: "12GB",
      Camera: "200MP + 50MP + 12MP + 10MP",
      Pin: "5,000 mAh",
    },
    image:
      "https://cdn.tgdd.vn/Products/Images/42/329101/samsung-galaxy-s24-ultra-grey-thumbnew-600x600.jpg",
  },
];

export default function Product() {
  const { id } = useParams();
  const product = FAKE_PRODUCTS.find((p) => p.id === Number(id));

  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  if (!product) {
    return (
      <div className="text-center py-20 text-xl font-semibold">
        Không tìm thấy sản phẩm!
      </div>
    );
  }

  return (
    <>


      <div className="max-w-7xl mx-auto px-5 py-10">
        {/* MAIN PRODUCT SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* LEFT IMAGE */}
          <div className="flex items-center justify-center" data-aos="fade-right">
            <img
              src={product.image}
              alt={product.name}
              className="rounded-xl shadow-lg w-4/5 hover:scale-105 transition duration-300"
            />
          </div>

          {/* RIGHT INFO */}
          <div className="flex flex-col gap-6" data-aos="fade-left">
            <h1 className="text-3xl font-bold">{product.name}</h1>

            <div className="flex items-center gap-3">
              <span className="bg-orange-500 text-white px-3 py-1 rounded-lg text-sm font-medium">
                {product.badge}
              </span>
            </div>

            <div className="text-3xl font-bold text-orange-600">
              {product.price}
            </div>
            <div className="line-through text-gray-500">{product.oldPrice}</div>

            {/* RATING */}
            <div className="flex items-center gap-2 text-yellow-500">
              {"★".repeat(Math.round(product.rating))}
              <span className="text-gray-700 text-sm ml-2">
                {product.rating} ({product.reviews} đánh giá)
              </span>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 mt-5">
              <button
                className="w-full py-3 rounded-xl text-white text-lg font-semibold shadow-lg transition hover:opacity-90"
                style={{ background: COLORS.primary }}
              >
                Thêm vào giỏ hàng
              </button>

              <button
                className="w-full py-3 rounded-xl text-white text-lg font-semibold shadow-lg transition hover:opacity-90"
                style={{
                  background: `linear-gradient(90deg, ${COLORS.primaryGradientStart}, ${COLORS.primaryGradientEnd})`,
                }}
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

        {/* SPECS */}
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
