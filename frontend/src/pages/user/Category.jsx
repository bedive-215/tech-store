import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Category() {
  const navigate = useNavigate();

  const categories = [
    {
      id: 1,
      name: "Điện thoại, Tablet",
      sub: [
        "Apple", "Samsung", "Xiaomi", "OPPO", "TECNO", "HONOR",
        "ZTE | nubia", "SONY", "NOKIA", "Infinix", "NOTHING",
        "Masstel", "realme", "itel", "vivo"
      ],
      priceRanges: [
        { label: "Dưới 2 triệu", value: "0-2" },
        { label: "2 - 4 triệu", value: "2-4" },
        { label: "4 - 7 triệu", value: "4-7" },
        { label: "7 - 13 triệu", value: "7-13" },
        { label: "13 - 20 triệu", value: "13-20" },
        { label: "Trên 20 triệu", value: "20-999" }
      ]
    },
    {
      id: 2, name: "Laptop",
      sub: ["Macbook", "ASUS", "Acer", "HP", "DELL"],
      priceRanges: []
    },
    { id: 3, name: "Âm thanh, Mic thu âm", sub: [], priceRanges: [] },
    { id: 4, name: "Đồng hồ, Camera", sub: [], priceRanges: [] },
    { id: 5, name: "Đồ gia dụng, Làm đẹp", sub: [], priceRanges: [] },
  ];

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [selectedPrice, setSelectedPrice] = useState(null);

  const handleSubmit = () => {
    const params = new URLSearchParams();

    if (selectedCategory) params.set("category", selectedCategory.id);
    if (selectedBrand) params.set("brand", selectedBrand);
    if (selectedPrice) params.set("price", selectedPrice);

    // 👉 QUAY VỀ HOME, KHÔNG ĐĂNG NHẬP
    navigate("/user/home?" + params.toString());
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-xl p-6">

        <h1 className="text-xl font-bold mb-6 text-orange-600">
          Bộ lọc sản phẩm
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">

          {/* LEFT – CATEGORY LIST */}
          <div>
            <h2 className="font-semibold mb-3">Danh mục</h2>
            <div className="flex flex-col gap-2">
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedCategory(c);
                    setSelectedBrand(null);
                    setSelectedPrice(null);
                  }}
                  className={`px-4 py-2 rounded-lg text-left border transition ${
                    selectedCategory?.id === c.id
                      ? "bg-orange-50 border-orange-500"
                      : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* MIDDLE – BRAND LIST */}
          <div>
            <h2 className="font-semibold mb-3">Hãng</h2>

            {!selectedCategory && (
              <p className="text-gray-400 text-sm">Chọn danh mục trước</p>
            )}

            {selectedCategory && selectedCategory.sub.length === 0 && (
              <p className="text-gray-400 text-sm">
                Danh mục này không có hãng con
              </p>
            )}

            {selectedCategory && selectedCategory.sub.length > 0 && (
              <div className="flex flex-col gap-2">
                {selectedCategory.sub.map((brand, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedBrand(brand)}
                    className={`px-4 py-2 rounded-lg border text-left transition ${
                      selectedBrand === brand
                        ? "bg-orange-50 border-orange-500"
                        : "border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT – PRICE LIST */}
          <div>
            <h2 className="font-semibold mb-3">Giá</h2>

            {!selectedBrand && (
              <p className="text-gray-400 text-sm">Chọn hãng trước</p>
            )}

            {selectedBrand &&
              selectedCategory?.priceRanges.length === 0 && (
                <p className="text-gray-400 text-sm">Danh mục này không có mức giá</p>
              )}

            {selectedBrand &&
              selectedCategory?.priceRanges.length > 0 && (
                <div className="flex flex-col gap-2">
                  {selectedCategory.priceRanges.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedPrice(p.value)}
                      className={`px-4 py-2 rounded-lg border text-left transition ${
                        selectedPrice === p.value
                          ? "bg-orange-50 border-orange-500"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
          </div>

        </div>

        {/* ACTION BUTTONS */}
        <div className="flex justify-end gap-4 mt-8">
          <button
            onClick={() => navigate("/user/home")}
            className="px-6 py-3 rounded-lg border text-gray-600 hover:bg-gray-100"
          >
            Hủy
          </button>

          <button
            onClick={handleSubmit}
            className="px-6 py-3 rounded-lg text-white font-semibold shadow-md"
            style={{
              background: "linear-gradient(90deg, #F97316, #C2410C)",
            }}
          >
            Xác nhận
          </button>
        </div>

      </div>
    </div>
  );
}
