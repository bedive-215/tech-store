// src/pages/user/CategoryPage.jsx
// Dynamic category page for /user/category/:slug
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import {
    HiOutlineDevicePhoneMobile,
    HiOutlineComputerDesktop,
    HiOutlineSpeakerWave,
    HiOutlineCpuChip,
    HiOutlineAdjustmentsHorizontal,
    HiOutlineXMark,
    HiChevronDown,
    HiArrowLeft
} from "react-icons/hi2";

import TopBanner from "../../components/common/TopBanner";
import Footer from "../../components/common/Footer";
import ProductCard from "../../components/common/ProductCard";
import { useProduct } from "@/providers/ProductProvider";

// Category metadata
const CATEGORY_MAP = {
    'dien-thoai': {
        name: 'Điện Thoại',
        description: 'Điện thoại thông minh từ các thương hiệu hàng đầu',
        icon: HiOutlineDevicePhoneMobile,
        gradient: 'from-blue-600 to-cyan-500',
        bgGradient: 'from-blue-50 to-cyan-50',
        brands: ['Apple', 'Samsung', 'Xiaomi', 'OPPO', 'Realme', 'Vivo', 'Honor', 'Nothing'],
    },
    'laptop': {
        name: 'Laptop',
        description: 'Laptop gaming, văn phòng và đồ họa chuyên nghiệp',
        icon: HiOutlineComputerDesktop,
        gradient: 'from-purple-600 to-pink-500',
        bgGradient: 'from-purple-50 to-pink-50',
        brands: ['MacBook', 'ASUS', 'Acer', 'HP', 'Dell', 'Lenovo', 'MSI', 'LG'],
    },
    'tai-nghe': {
        name: 'Tai Nghe',
        description: 'Tai nghe không dây, có dây và gaming chất lượng cao',
        icon: HiOutlineSpeakerWave,
        gradient: 'from-orange-600 to-amber-500',
        bgGradient: 'from-orange-50 to-amber-50',
        brands: ['Apple', 'Sony', 'Samsung', 'JBL', 'Beats', 'Bose', 'Anker', 'Baseus'],
    },
    'ban-phim-co': {
        name: 'Phụ Kiện',
        description: 'Bàn phím, chuột, sạc và phụ kiện công nghệ',
        icon: HiOutlineCpuChip,
        gradient: 'from-emerald-600 to-teal-500',
        bgGradient: 'from-emerald-50 to-teal-50',
        brands: ['Logitech', 'Razer', 'Apple', 'Anker', 'Baseus', 'Belkin'],
    },
};

const PRICE_RANGES = [
    { label: 'Tất cả', value: '' },
    { label: 'Dưới 2 triệu', min: 0, max: 2000000, value: '0-2' },
    { label: '2 - 5 triệu', min: 2000000, max: 5000000, value: '2-5' },
    { label: '5 - 10 triệu', min: 5000000, max: 10000000, value: '5-10' },
    { label: '10 - 20 triệu', min: 10000000, max: 20000000, value: '10-20' },
    { label: 'Trên 20 triệu', min: 20000000, max: null, value: '20+' },
];

export default function CategoryPage() {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [showFilters, setShowFilters] = useState(false);
    const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
    const [selectedPrice, setSelectedPrice] = useState(searchParams.get('price') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || '');

    const { products, loading, error, fetchProducts } = useProduct();

    // Get category info
    const category = CATEGORY_MAP[slug] || {
        name: 'Sản Phẩm',
        description: 'Tất cả sản phẩm',
        icon: HiOutlineCpuChip,
        gradient: 'from-gray-600 to-gray-500',
        bgGradient: 'from-gray-50 to-gray-100',
        brands: [],
    };
    const IconComponent = category.icon;

    // Init AOS
    useEffect(() => {
        AOS.init({ duration: 600, once: true, easing: 'ease-out-cubic' });
    }, []);

    // Fetch products when params change
    useEffect(() => {
        const params = {
            page: 1,
            limit: 24,
            category: slug,
        };

        if (selectedBrand) params.brand = selectedBrand;

        // Handle price range
        const priceRange = PRICE_RANGES.find(p => p.value === selectedPrice);
        if (priceRange?.min !== undefined) params.min_price = priceRange.min;
        if (priceRange?.max) params.max_price = priceRange.max;

        if (sortBy) params.sort = sortBy;

        fetchProducts(params);
    }, [slug, selectedBrand, selectedPrice, sortBy, fetchProducts]);

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams();
        if (selectedBrand) params.set('brand', selectedBrand);
        if (selectedPrice) params.set('price', selectedPrice);
        if (sortBy) params.set('sort', sortBy);
        setSearchParams(params, { replace: true });
    }, [selectedBrand, selectedPrice, sortBy, setSearchParams]);

    // Helpers
    const getProductId = (p) => p?.product_id ?? p?.id ?? p?._id ?? null;
    const normalizeImage = (img) => {
        const FALLBACK = "/default-product.png";
        if (!img) return FALLBACK;
        if (Array.isArray(img)) img = img[0];
        if (typeof img === "object") img = img?.url ?? img?.path;
        if (typeof img !== "string") return FALLBACK;
        const matches = img.match(/https?:\/\/[^\s,;"]+/g);
        if (matches) return matches[0];
        return img.startsWith("/") ? img : FALLBACK;
    };

    const onProductClick = (p) => {
        const productId = getProductId(p);
        if (!productId) return;
        navigate(`/user/product/${productId}`, {
            state: { flash_sale: p.flash_sale ?? null },
        });
    };

    const clearFilters = () => {
        setSelectedBrand('');
        setSelectedPrice('');
        setSortBy('');
    };

    const activeFiltersCount = [selectedBrand, selectedPrice, sortBy].filter(Boolean).length;

    return (
        <div className="min-h-screen bg-gray-50">
            <TopBanner />

            {/* Hero Banner */}
            <section className={`relative py-12 md:py-20 bg-gradient-to-br ${category.bgGradient} overflow-hidden`}>
                {/* Decorative elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10">
                    <button
                        onClick={() => navigate('/user/home')}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <HiArrowLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">Quay lại trang chủ</span>
                    </button>

                    <div className="flex items-center gap-4 md:gap-6">
                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-lg`}>
                            <IconComponent className="w-8 h-8 md:w-10 md:h-10 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                                {category.name}
                            </h1>
                            <p className="text-gray-600 text-sm md:text-base">
                                {category.description}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-8 md:py-12">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 md:mb-8" data-aos="fade-up">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${showFilters || activeFiltersCount > 0
                                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <HiOutlineAdjustmentsHorizontal className="w-5 h-5" />
                                <span className="font-medium">Bộ lọc</span>
                                {activeFiltersCount > 0 && (
                                    <span className="w-5 h-5 bg-blue-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>

                            {activeFiltersCount > 0 && (
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                                >
                                    Xóa bộ lọc
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-500">
                                {loading ? 'Đang tải...' : `${products?.length || 0} sản phẩm`}
                            </span>

                            {/* Sort dropdown */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Mặc định</option>
                                    <option value="price_asc">Giá: Thấp → Cao</option>
                                    <option value="price_desc">Giá: Cao → Thấp</option>
                                    <option value="newest">Mới nhất</option>
                                </select>
                                <HiChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>
                    </div>

                    {/* Filters Panel */}
                    {showFilters && (
                        <div className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 mb-6 md:mb-8" data-aos="fade-down">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Bộ lọc nâng cao</h3>
                                <button onClick={() => setShowFilters(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                    <HiOutlineXMark className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Brand Filter */}
                                {category.brands?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Thương hiệu</h4>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setSelectedBrand('')}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${!selectedBrand
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                Tất cả
                                            </button>
                                            {category.brands.map((brand) => (
                                                <button
                                                    key={brand}
                                                    onClick={() => setSelectedBrand(brand)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedBrand === brand
                                                            ? 'bg-blue-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                        }`}
                                                >
                                                    {brand}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Price Filter */}
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-3">Mức giá</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {PRICE_RANGES.map((range) => (
                                            <button
                                                key={range.value}
                                                onClick={() => setSelectedPrice(range.value)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedPrice === range.value
                                                        ? 'bg-blue-600 text-white'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {range.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Loading State */}
                    {loading && (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="relative w-14 h-14">
                                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                            </div>
                            <p className="mt-4 text-gray-600">Đang tải sản phẩm...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <HiOutlineXMark className="w-8 h-8 text-red-500" />
                            </div>
                            <p className="text-red-600 font-medium mb-2">Đã xảy ra lỗi</p>
                            <p className="text-gray-500 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Product Grid */}
                    {!loading && !error && (
                        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5 lg:gap-6">
                            {products?.length > 0 ? (
                                products.map((p, index) => {
                                    const productId = getProductId(p);
                                    const imageUrl = normalizeImage(p?.image);

                                    return (
                                        <div
                                            key={productId ?? index}
                                            data-aos="fade-up"
                                            data-aos-delay={Math.min(index * 30, 200)}
                                            className="transform transition-transform duration-300"
                                        >
                                            <button
                                                onClick={() => onProductClick(p)}
                                                className="w-full text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-2xl"
                                            >
                                                <ProductCard product={{ ...p, image: imageUrl }} />
                                            </button>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="col-span-full flex flex-col items-center justify-center py-20">
                                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <IconComponent className="w-12 h-12 text-gray-300" />
                                    </div>
                                    <p className="text-gray-500 font-medium">Không tìm thấy sản phẩm</p>
                                    <p className="text-gray-400 text-sm mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                                    {activeFiltersCount > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Xóa bộ lọc
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            <Footer />
        </div>
    );
}
