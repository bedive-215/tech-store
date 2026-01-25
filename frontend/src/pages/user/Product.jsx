// src/pages/product/Product.jsx
import React, { useEffect, useState, useCallback, useRef } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { format } from "date-fns";

import Footer from "../../components/common/Footer";
import { useProduct } from "@/providers/ProductProvider";
import { useCart } from "@/providers/CartProvider";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";
import userService from "@/services/userService";
import { useParams, useNavigate, useLocation } from "react-router-dom";


export default function Product() {
  const { id } = useParams(); // id = product_id
  const navigate = useNavigate();

  const {
    productDetail,
    loading,
    error,
    fetchProductById,
  } = useProduct();

  // Cart context
  const { addToCart } = useCart();

  // Auth state
 // Check đăng nhập bằng access_token
const isLoggedIn = !!localStorage.getItem("access_token");



  const [currentImg, setCurrentImg] = useState(0);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState("");

  // --- Reviews state ---
  const [reviews, setReviews] = useState([]);
  const reviewsRef = useRef([]); // keep latest reviews for sync calculations
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // per page
  const [hasMore, setHasMore] = useState(false);

  // rating summary and filter
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [distribution, setDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }); // counts
  const [starFilter, setStarFilter] = useState(0); // 0 = all, 1..5 = star filter
  const [filtering, setFiltering] = useState(false); // to show small loading when filter changes

  // keep last fetch params so load more keeps them
  const lastFetchParamsRef = useRef({});

  // Check authentication on mount
  

  // Function to check auth and show alert if not logged in
const requireAuth = (
  callback,
  message = "Vui lòng đăng nhập để sử dụng tính năng này!"
) => {
  const token = localStorage.getItem("access_token");

  if (!token) {
    const confirmed = window.confirm(
      message + "\n\nBạn có muốn chuyển đến trang đăng nhập không?"
    );
    if (confirmed) {
      navigate("/login");
    }
    return false;
  }

  callback();
  return true;
};



  useEffect(() => {
    AOS.init({ duration: 900, once: true });
    fetchProductById(id);
    // reset reviews when product changes
    setPage(1);
    setReviews([]);
    reviewsRef.current = [];
    setStarFilter(0);
    setAvgRating(0);
    setTotalReviewsCount(0);
    setDistribution({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  }, [id, fetchProductById]);

  useEffect(() => {
    // fetch reviews whenever page or id or starFilter changes
    fetchReviews(page, starFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, id, starFilter]);

  // --- Helpers to normalize server payloads ---
  const normalizePayloadToList = (payload) => {
    if (!payload) return [];
    // prefer explicit "reviews" (as your example)
    if (Array.isArray(payload.reviews)) return payload.reviews;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
    // try to find any array field
    const arrField = Object.values(payload).find((v) => Array.isArray(v));
    return arrField ?? [];
  };

  const extractTotalFromPayload = (payload) => {
    if (!payload) return null;
    return (
      payload.total ??
      payload.count ??
      payload.meta?.total ??
      payload.pagination?.total ??
      payload.meta?.pagination?.total ??
      null
    );
  };

  const extractAverageFromPayload = (payload) => {
    if (!payload) return null;
    return payload.average_rating ?? payload.average ?? payload.avg ?? null;
  };

  const extractDistributionFromPayload = (payload) => {
    if (!payload) return null;
    // If server returns distribution-like object
    const stats = payload.stats ?? payload.rating_stats ?? payload.distribution ?? null;
    if (stats && typeof stats === "object") {
      const mapped = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      Object.entries(stats).forEach(([k, v]) => {
        const key = Number(k);
        if (key >= 1 && key <= 5) mapped[key] = Number(v) || 0;
      });
      return mapped;
    }
    return null;
  };

  const computeSummaryFromReviews = (list) => {
    const ratings = list
      .map((r) => (r?.rating ?? r?.stars ?? r?.score ?? r?.point ?? r?.rate ?? 0) * 1)
      .filter((v) => typeof v === "number" && !Number.isNaN(v) && v > 0);

    const total = ratings.length;
    const avg = total === 0 ? 0 : Math.round((ratings.reduce((s, x) => s + x, 0) / total) * 10) / 10;

    // distribution
    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      const k = Math.max(1, Math.min(5, Math.round(r)));
      dist[k] = (dist[k] || 0) + 1;
    });

    return { avg, total, dist };
  };

  const fetchReviews = useCallback(
    async (pageToFetch = 1, ratingFilter = 0) => {
      if (!id) return;
      setReviewsLoading(true);
      setReviewsError(null);
      if (ratingFilter) setFiltering(true);

      try {
        // build params
        const params = { page: pageToFetch, limit };
        if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) params.rating = ratingFilter;

        lastFetchParamsRef.current = params;

        const resp = await userService.getReviewsByProduct(id, params);

        const payload = resp?.data ?? resp;
        const list = normalizePayloadToList(payload);

        // update reviews (merge if page > 1)
        setReviews((prev) => {
          const next = pageToFetch > 1 ? [...prev, ...list] : list;
          reviewsRef.current = next;
          return next;
        });

        // total from payload (your example uses "total")
        const totalFromPayload = extractTotalFromPayload(payload);
        if (totalFromPayload != null) {
          setTotalReviewsCount(Number(totalFromPayload));
          setHasMore(pageToFetch * limit < Number(totalFromPayload));
        } else {
          setHasMore(list.length === limit);
          setTotalReviewsCount((prev) => {
            if (pageToFetch === 1) return list.length;
            return (prev || 0) + list.length;
          });
        }

        // average from payload (your example uses "average_rating")
        const avgFromPayload = extractAverageFromPayload(payload);
        if (avgFromPayload != null) {
          setAvgRating(Number(avgFromPayload));
        }

        // distribution if server provides
        const distFromPayload = extractDistributionFromPayload(payload);
        if (distFromPayload) {
          setDistribution(distFromPayload);
        } else {
          // if not provided, compute from merged reviews
          const merged = pageToFetch > 1 ? [...reviewsRef.current, ...list] : list;
          const { avg, total, dist } = computeSummaryFromReviews(merged);
          // Only overwrite avg if server didn't give average
          if (avgFromPayload == null) setAvgRating(avg);
          setDistribution(dist);
          setTotalReviewsCount((prev) => (totalFromPayload != null ? prev : total));
        }
      } catch (err) {
        console.error(err);
        const msg = err.response?.data?.message || "Không lấy được đánh giá";
        setReviewsError(msg);
        toast.error(msg);
      } finally {
        setReviewsLoading(false);
        setFiltering(false);
      }
    },
    [id, limit]
  );

  // load more handler
  const loadMore = () => {
    if (reviewsLoading) return;
    if (!hasMore) return;
    setPage((p) => p + 1);
  };

  // apply star filter (0 = all)
  const applyStarFilter = (star) => {
    // if user clicks "Tất cả", explicitly set 0
    if (star === 0) {
      setStarFilter(0);
      setPage(1);
      setReviews([]);
      reviewsRef.current = [];
      return;
    }

    // otherwise toggle selection: if clicking same star, toggle it off (go to all)
    if (star === starFilter) {
      setStarFilter(0);
    } else {
      setStarFilter(star);
    }
    setPage(1);
    setReviews([]);
    reviewsRef.current = [];
  };

  // reset qty when product changes
  const product = productDetail;
  useEffect(() => {
    setQty(1);
    setQtyError("");
  }, [product?.product_id, product?.id]);

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
  const location = useLocation();
 const flashSaleFromHome = location.state?.flash_sale ?? product?.flash_sale ?? null;


  const now = new Date();

  const flashSale = flashSaleFromHome ?? null;

const isFlashSaleActive =
  flashSale &&
  (!flashSale.start_at || new Date(flashSale.start_at) <= now) &&
  (!flashSale.end_at || new Date(flashSale.end_at) >= now) &&
  Number(flashSale.stock_limit ?? product.stock ?? 0) > 0;


  const displayPrice = isFlashSaleActive
  ? Number(flashSale.sale_price)
  : Number(product.price);


  const goToBuy = () => {
    if (!requireAuth(() => {}, "Bạn cần đăng nhập để mua hàng!")) {
      return;
    }

    const preselected = [
      {
        id: product.product_id ?? product.id ?? product._id ?? String(product.id),
        product_id: product.product_id ?? product.id ?? product._id ?? String(product.id),
        name: product.name,
        price: displayPrice,
        quantity: 1,
        image: images[0] ?? "/placeholder.png",
        selected: true,
      },
    ];
    navigate("/user/customer-info", { state: { preselected } });
  };

  // Quantity modal handlers
  const openQtyModal = () => {
    if (!requireAuth(() => {}, "Bạn cần đăng nhập để thêm sản phẩm vào giỏ hàng!")) {
      return;
    }
    setQty(1);
    setQtyError("");
    setShowQtyModal(true);
  };

  const closeQtyModal = () => {
    setShowQtyModal(false);
    setQtyError("");
  };

  const incQty = () => {
    const max = Number(product.stock ?? product.quantity ?? 999999);
    setQty((prev) => {
      const next = prev + 1;
      if (next > max) {
        setQtyError(`Tối đa ${max} sản phẩm trong kho`);
        return prev;
      }
      setQtyError("");
      return next;
    });
  };

  const decQty = () => {
    setQty((prev) => {
      const next = prev - 1;
      if (next < 1) {
        return 1;
      }
      setQtyError("");
      return next;
    });
  };

  const onQtyChange = (e) => {
    const raw = e.target.value;
    const parsed = parseInt(raw === "" ? "0" : raw, 10) || 0;
    const max = Number(product.stock ?? product.quantity ?? 999999);
    if (parsed <= 0) {
      setQty(1);
      setQtyError("");
      return;
    }
    if (parsed > max) {
      setQty(max);
      setQtyError(`Tối đa ${max} sản phẩm trong kho`);
      return;
    }
    setQty(parsed);
    setQtyError("");
  };

  const confirmAddToCart = async () => {
    const max = Number(product.stock ?? product.quantity ?? 999999);
    if (qty < 1) {
      setQtyError("Số lượng phải lớn hơn 0");
      return;
    }
    if (qty > max) {
      setQtyError(`Chỉ còn ${max} sản phẩm trong kho`);
      return;
    }
    const payload = {
      product_id: product.product_id ?? product.id ?? product._id ?? String(product.id),
      product_name: product.name ?? "",
      price: String(displayPrice.toFixed(2)),
      stock: max,
      quantity: qty,
      image_url: images[0] ?? "/placeholder.png",
    };

    try {
      await addToCart(payload);
      toast.success("Đã thêm sản phẩm vào giỏ hàng");
      closeQtyModal();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || "Thêm vào giỏ thất bại";
      toast.error(msg);
    }
  };

  // Helper render stars
  const renderStars = (value, small = false) => {
    const v = Number(value) || 0;
    const full = Math.floor(v);
    const half = v - full >= 0.5;
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= full) {
        stars.push(<span key={i} className={`text-yellow-500 ${small ? "text-sm" : "text-lg"}`}>★</span>);
      } else if (i === full + 1 && half) {
        stars.push(<span key={i} className={`text-yellow-500 ${small ? "text-sm" : "text-lg"}`}>★</span>);
      } else {
        stars.push(<span key={i} className={`${small ? "text-sm" : "text-lg"} text-gray-300`}>☆</span>);
      }
    }
    return <span className="inline-block align-middle">{stars}</span>;
  };

  // Calculate percentages for progress bars
  const totalForDistribution = Object.values(distribution).reduce((s, x) => s + Number(x || 0), 0) || totalReviewsCount || reviews.length || 0;

  return (
    <>
      {/* Premium Product Detail Layout */}
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            
            {/* LEFT IMAGE GALLERY - Premium Design */}
            <div className="flex flex-col gap-4" data-aos="fade-right">
              {/* Main Image */}
              <div className="relative group bg-white rounded-2xl shadow-lg overflow-hidden p-6 sm:p-8">
                {/* Flash Sale Badge */}
                {isFlashSaleActive && (
                  <div className="absolute top-4 left-4 z-20">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-500 rounded-lg blur-sm opacity-75 animate-pulse" />
                      <div className="relative bg-gradient-to-r from-red-600 to-orange-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
                        🔥 FLASH SALE
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Navigation Arrows */}
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <span className="text-xl text-gray-700">‹</span>
                </button>
                
                <div className="aspect-square flex items-center justify-center">
                  <img
                    src={images[currentImg]}
                    alt={product.name}
                    className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
                
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white/90 hover:bg-white rounded-full shadow-lg flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                >
                  <span className="text-xl text-gray-700">›</span>
                </button>
                
                {/* Image Counter */}
                <div className="absolute bottom-4 right-4 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full">
                  {currentImg + 1} / {images.length}
                </div>
              </div>
              
              {/* Thumbnails */}
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImg(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      currentImg === index 
                        ? "border-[#137fec] ring-2 ring-[#137fec]/30 shadow-lg" 
                        : "border-gray-200 hover:border-[#137fec]/50"
                    }`}
                  >
                    <img src={img} alt="thumb" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* RIGHT INFO - Premium Design */}
            <div className="flex flex-col gap-6" data-aos="fade-left">
              {/* Product Title */}
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight">
                  {product.name}
                </h1>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    {renderStars(avgRating, true)}
                    <span className="text-gray-500 ml-1">({totalReviewsCount || reviews.length})</span>
                  </div>
                  <span className="text-gray-300">|</span>
                  <span className="text-green-600 font-medium">✓ Còn {product.stock} sản phẩm</span>
                </div>
              </div>

              {/* Price Section - Premium Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-end gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-[#137fec] to-[#0ea5e9] bg-clip-text text-transparent">
                    {displayPrice.toLocaleString()}₫
                  </span>
                  {isFlashSaleActive && (
                    <>
                      <span className="text-lg text-gray-400 line-through">
                        {Number(product.price).toLocaleString()}₫
                      </span>
                      <span className="px-3 py-1 text-xs font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full animate-pulse">
                        -{Math.round((1 - displayPrice / Number(product.price)) * 100)}%
                      </span>
                    </>
                  )}
                </div>
                {isFlashSaleActive && flashSale?.end_at && (
                  <div className="mt-3 text-sm text-gray-600">
                    ⏰ Kết thúc: {format(new Date(flashSale.end_at), "dd/MM/yyyy HH:mm")}
                  </div>
                )}
              </div>

              {/* Product Info Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Thương hiệu</div>
                  <div className="mt-1 font-semibold text-gray-900">{product.brand?.name || "—"}</div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <div className="text-xs text-gray-500 uppercase tracking-wide">Danh mục</div>
                  <div className="mt-1 font-semibold text-gray-900">{product.category?.name || "—"}</div>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-green-500">✓</span> Chính hãng 100%
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-blue-500">🚚</span> Giao hàng toàn quốc
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="text-orange-500">🔄</span> Đổi trả 7 ngày
                </div>
              </div>

              {/* ACTION BUTTONS - Premium Design */}
              <div className="flex flex-col sm:flex-row gap-4 mt-2">
                <button
                  onClick={openQtyModal}
                  className="flex-1 py-4 rounded-xl text-[#137fec] text-lg font-semibold border-2 border-[#137fec] hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Thêm vào giỏ
                </button>
                <button
                  onClick={goToBuy}
                  className="flex-1 py-4 rounded-xl text-white text-lg font-semibold bg-gradient-to-r from-[#137fec] to-[#0ea5e9] hover:shadow-lg hover:shadow-blue-500/30 transition-all"
                >
                  Mua ngay
                </button>
              </div>
            </div>
          </div>

          {/* DESCRIPTION - Premium Section */}
          <section className="mt-12" data-aos="fade-up">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-[#137fec] to-[#0ea5e9] rounded-full" />
                Mô tả sản phẩm
              </h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            </div>
          </section>

          {/* SPECIFICATIONS - Premium Design */}
          {product.specs && (
            <section className="mt-8" data-aos="fade-up">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-[#137fec] to-[#0ea5e9] rounded-full" />
                  Thông số kỹ thuật
                </h2>
                <div className="divide-y divide-gray-100">
                  {Object.entries(product.specs).map(([key, value], idx) => (
                    <div
                      key={key}
                      className={`flex justify-between py-4 ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'} px-4 rounded-lg`}
                    >
                      <span className="text-gray-600 font-medium">{key.replace("_", " ")}</span>
                      <span className="font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* REVIEWS - Premium Design */}
          <section className="mt-8" data-aos="fade-up">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-[#137fec] to-[#0ea5e9] rounded-full" />
                Đánh giá của khách hàng
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Left: Rating Summary - Premium Card */}
                <div className="col-span-1 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center justify-center text-center">
                  <div className="text-5xl font-extrabold bg-gradient-to-r from-[#137fec] to-[#0ea5e9] bg-clip-text text-transparent">
                    {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                  </div>
                  <div className="mt-3">{renderStars(avgRating)}</div>
                  <div className="text-sm text-gray-600 mt-3 font-medium">
                    {totalReviewsCount || reviews.length} đánh giá
                  </div>
                </div>

                {/* Middle: Distribution & Filters */}
                <div className="col-span-2 lg:col-span-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                    <div className="text-lg font-semibold">Xếp hạng theo sao</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => applyStarFilter(0)}
                        className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-all ${
                          starFilter === 0 
                            ? "bg-gradient-to-r from-[#137fec] to-[#0ea5e9] text-white border-transparent shadow-md" 
                            : "bg-white text-gray-700 border-gray-200 hover:border-[#137fec]/50"
                        }`}
                      >
                        Tất cả
                      </button>
                      {starFilter !== 0 && (
                        <span className="text-sm text-gray-600">Đang lọc: {starFilter} ⭐</span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    {[5,4,3,2,1].map((s) => {
                      const cnt = distribution[s] ?? 0;
                      const percent = totalForDistribution ? Math.round((cnt / totalForDistribution) * 100) : 0;
                      return (
                        <button
                          key={s}
                          onClick={() => applyStarFilter(s)}
                          className={`w-full flex items-center gap-3 sm:gap-4 group hover:bg-gray-50 p-2 rounded-lg transition-all ${
                            starFilter === s ? "bg-blue-50" : ""
                          }`}
                        >
                          <div className="w-20 flex items-center gap-2 text-sm font-medium">
                            <span>{s}</span>
                            <span className="text-yellow-400">⭐</span>
                          </div>

                          <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                            <div
                              className={`h-3 rounded-full transition-all ${
                                starFilter === s 
                                  ? "bg-gradient-to-r from-[#137fec] to-[#0ea5e9]" 
                                  : "bg-blue-300 group-hover:bg-blue-400"
                              }`}
                              style={{ width: `${percent}%` }}
                            />
                          </div>

                          <div className="w-16 text-right text-sm text-gray-600 font-medium">{cnt}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Reviews list below spanning full width */}
                <div className="col-span-3 mt-6">
                  {/* Loading / Error */}
                  {reviewsLoading && reviews.length === 0 && (
                    <div className="text-center py-12">
                      <div className="inline-block w-8 h-8 border-4 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
                      <div className="mt-3 text-gray-600">Đang tải đánh giá...</div>
                    </div>
                  )}
                  {reviewsError && (
                    <div className="text-center text-red-500 py-8 bg-red-50 rounded-xl">{reviewsError}</div>
                  )}

                  {/* Empty */}
                  {!reviewsLoading && reviews.length === 0 && !reviewsError && (
                    <div className="text-center py-12 bg-gray-50 rounded-xl">
                      <div className="text-4xl mb-3">📝</div>
                      <div className="text-gray-500">Chưa có đánh giá nào</div>
                    </div>
                  )}

                  {/* List - Premium Cards */}
                  <div className="space-y-4">
                    {reviews.map((r, idx) => {
                      const rating = r?.rating ?? r?.stars ?? r?.score ?? r?.point ?? r?.rate ?? 0;
                      const author = r?.user_name ?? r?.user?.name ?? r?.author_name ?? r?.name ?? "Khách hàng";
                      const avatar = r?.avatar ?? r?.user?.avatar ?? null;
                      const createdAt = r?.created_at ?? r?.createdAt ?? r?.date ?? r?.time ?? null;
                      return (
                        <div key={r?.review_id ?? r?.id ?? r?._id ?? idx} className="bg-gray-50 rounded-xl p-4 sm:p-6 hover:bg-gray-100 transition-colors">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#137fec] to-[#0ea5e9] flex items-center justify-center overflow-hidden flex-shrink-0">
                              {avatar ? (
                                <img src={avatar} alt={author} className="w-full h-full object-cover"/>
                              ) : (
                                <span className="text-white font-semibold text-lg">{(author || "K").charAt(0).toUpperCase()}</span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                <div>
                                  <div className="font-semibold text-gray-900">{author}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">
                                    {createdAt ? format(new Date(createdAt), "dd/MM/yyyy HH:mm") : ""}
                                  </div>
                                </div>

                                <div className="flex items-center gap-1">
                                  {renderStars(rating, true)}
                                  <span className="ml-1 text-xs text-gray-600">({Number(rating) || 0})</span>
                                </div>
                              </div>

                              <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {r?.comment ?? r?.content ?? r?.message ?? "Không có nội dung"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Load more */}
                  <div className="mt-6 flex justify-center">
                    {reviewsLoading && reviews.length > 0 && (
                      <div className="flex items-center gap-2 text-[#137fec]">
                        <div className="w-5 h-5 border-2 border-[#137fec] border-t-transparent rounded-full animate-spin"></div>
                        <span>Đang tải thêm...</span>
                      </div>
                    )}
                    {!reviewsLoading && hasMore && (
                      <button
                        onClick={loadMore}
                        className="px-6 py-2.5 rounded-full border-2 border-[#137fec] text-[#137fec] font-medium hover:bg-blue-50 transition-colors"
                      >
                        Xem thêm đánh giá
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <Footer />

      {/* Modal chọn số lượng - Premium Design */}
      {showQtyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeQtyModal}
          />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 z-10 transform transition-all">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
              <div className="w-1 h-6 bg-gradient-to-b from-[#137fec] to-[#0ea5e9] rounded-full" />
              Chọn số lượng
            </h3>

            <div className="flex gap-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-white">
                <img
                  src={images[0]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 line-clamp-2 mb-2">{product.name}</div>
                <div className="text-lg font-bold bg-gradient-to-r from-[#137fec] to-[#0ea5e9] bg-clip-text text-transparent">
                  {Number(product.price).toLocaleString()}₫
                </div>
                <div className="text-xs text-gray-500 mt-1">Còn {product.stock} sản phẩm</div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-semibold mb-3">Số lượng</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={decQty}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-[#137fec] hover:text-[#137fec] transition-colors font-bold"
                >
                  -
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={onQtyChange}
                  min={1}
                  max={product.stock ?? 999999}
                  className="flex-1 text-center border-2 border-gray-200 rounded-lg px-4 py-2 font-semibold focus:border-[#137fec] focus:outline-none transition-colors"
                />
                <button
                  onClick={incQty}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-gray-200 hover:border-[#137fec] hover:text-[#137fec] transition-colors font-bold"
                >
                  +
                </button>
              </div>
              
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tổng cộng:</span>
                  <span className="text-lg font-bold bg-gradient-to-r from-[#137fec] to-[#0ea5e9] bg-clip-text text-transparent">
                    {(Number(product.price || 0) * qty).toLocaleString()}₫
                  </span>
                </div>
              </div>
              
              {qtyError && (
                <div className="mt-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                  {qtyError}
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={closeQtyModal}
                className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-200 font-semibold hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={confirmAddToCart}
                className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#137fec] to-[#0ea5e9] text-white font-semibold shadow-lg hover:shadow-xl transition-all"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}