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

              <div className="w-full max-w-[320px] aspect-square bg-white rounded-xl shadow 
                flex items-center justify-center overflow-hidden">
                <img
                  src={images[currentImg]}
                  alt={product.name}
                  className="w-full h-full object-contain"
                />
              </div>

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
            <div className="flex items-center gap-3">
              {isFlashSaleActive && (
                <span className="text-lg text-gray-400 line-through">
                  {Number(product.price).toLocaleString()}₫
                </span>
              )}

              <span className="text-3xl font-bold text-orange-500">
                {displayPrice.toLocaleString()}₫
              </span>

              {isFlashSaleActive && (
                <span className="ml-2 px-2 py-1 text-xs font-semibold bg-red-500 text-white rounded">
                  FLASH SALE
                </span>
              )}
            </div>

            {/* Thương hiệu & danh mục */}
            <div className="text-gray-700 text-lg">
              <p><strong>Thương hiệu:</strong> {product.brand?.name}</p>
              <p><strong>Danh mục:</strong> {product.category?.name}</p>
              <p><strong>Tồn kho:</strong> {product.stock}</p>
            </div>

            {/* Tổng quan đánh giá (compact) */}
            <div className="flex items-center gap-4">
              <div className="text-3xl font-semibold">{avgRating > 0 ? avgRating : "—"}</div>
              <div>{renderStars(avgRating, true)}</div>
              <div className="text-sm text-gray-500">({totalReviewsCount || reviews.length} đánh giá)</div>
            </div>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 mt-5">
              <button
                onClick={openQtyModal}
                className="w-full py-3 rounded-xl text-white text-lg font-semibold shadow-lg bg-orange-500 hover:opacity-90"
              >
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

        {/* REVIEWS (Shopee-like) */}
        <section className="mt-12" data-aos="fade-up">
          <h2 className="text-2xl font-bold mb-4">Đánh giá của khách hàng</h2>

          <div className="bg-white rounded-xl shadow p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: big avg + stars */}
            <div className="col-span-1 flex flex-col items-center justify-center border rounded-lg p-6">
              <div className="text-5xl font-extrabold">{avgRating > 0 ? avgRating : "—"}</div>
              <div className="mt-2">{renderStars(avgRating)}</div>
              <div className="text-gray-500 mt-2">{totalReviewsCount || reviews.length} đánh giá</div>
            </div>

            {/* Middle: distribution & filters */}
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-lg font-medium">Xếp hạng theo sao</div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => applyStarFilter(0)}
                    className={`px-3 py-1 rounded-full border ${starFilter === 0 ? "bg-orange-50 border-orange-300" : "bg-white"}`}
                  >
                    Tất cả
                  </button>
                  {starFilter !== 0 && (
                    <div className="text-sm text-gray-600">Đang lọc: {starFilter} sao</div>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {[5,4,3,2,1].map((s) => {
                  const cnt = distribution[s] ?? 0;
                  const percent = totalForDistribution ? Math.round((cnt / totalForDistribution) * 100) : 0;
                  return (
                    <div key={s} className="flex items-center gap-4">
                      <button
                        onClick={() => applyStarFilter(s)}
                        className={`w-24 flex items-center gap-2 ${starFilter === s ? "font-semibold" : ""}`}
                      >
                        <span className="font-medium">{s} sao</span>
                      </button>

                      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={`h-3 rounded-full ${starFilter === s ? "bg-orange-500" : "bg-orange-300"}`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="w-20 text-right text-sm text-gray-600">{cnt}</div>
                    </div>
                  );
                })}
              </div>

              {/* small note */}
              <div className="mt-4 text-sm text-gray-500">Bạn có thể nhấn vào thanh để lọc theo số sao. Nếu backend hỗ trợ tham số rating, việc lọc sẽ gọi API với param <code>rating</code>.</div>
            </div>

            {/* Reviews list below spanning full width */}
            <div className="col-span-3 mt-6">
              <div className="bg-white rounded-lg p-4 border">
                {/* Loading / Error */}
                {reviewsLoading && reviews.length === 0 && (
                  <div className="text-center py-8">Đang tải đánh giá...</div>
                )}
                {reviewsError && (
                  <div className="text-center text-red-500 py-4">{reviewsError}</div>
                )}

                {/* Empty */}
                {!reviewsLoading && reviews.length === 0 && !reviewsError && (
                  <div className="text-gray-500">Không tìm thấy đánh giá phù hợp.</div>
                )}

                {/* List */}
                <div className="space-y-6">
                  {reviews.map((r, idx) => {
                    // map response keys from your example:
                    // review_id, user_name, avatar, rating, comment, created_at
                    const rating = r?.rating ?? r?.stars ?? r?.score ?? r?.point ?? r?.rate ?? 0;
                    const author = r?.user_name ?? r?.user?.name ?? r?.author_name ?? r?.name ?? "Khách hàng";
                    const avatar = r?.avatar ?? r?.user?.avatar ?? null;
                    const createdAt = r?.created_at ?? r?.createdAt ?? r?.date ?? r?.time ?? null;
                    return (
                      <div key={r?.review_id ?? r?.id ?? r?._id ?? idx} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                            {avatar ? (
                              <img src={avatar} alt={author} className="w-full h-full object-cover"/>
                            ) : (
                              <span className="text-gray-500 font-medium">{(author || "K").charAt(0)}</span>
                            )}
                          </div>

                          <div className="flex-1">
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium">{author}</div>
                                <div className="text-xs text-gray-500">
                                  {createdAt ? format(new Date(createdAt), "dd/MM/yyyy HH:mm") : ""}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="text-sm">{renderStars(rating, true)}</div>
                                <div className="text-xs text-gray-500">{Number(rating) || 0} sao</div>
                              </div>
                            </div>

                            <div className="mt-3 text-gray-700 whitespace-pre-wrap">
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
                  {reviewsLoading && reviews.length > 0 && <div className="py-2">Đang tải thêm...</div>}
                  {!reviewsLoading && hasMore && (
                    <button
                      onClick={loadMore}
                      className="px-4 py-2 rounded-full border hover:bg-gray-50"
                    >
                      Xem thêm
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />

      {/* Modal chọn số lượng */}
      {showQtyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={closeQtyModal}
          />

          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 z-10">
            <h3 className="text-xl font-semibold mb-4">Chọn số lượng</h3>

            <div className="flex gap-4">
              <img
                src={images[0]}
                alt={product.name}
                className="w-28 h-28 object-cover rounded-md"
              />
              <div className="flex-1">
                <div className="font-medium">{product.name}</div>
                <div className="text-orange-500 font-bold mt-2">{Number(product.price).toLocaleString()}₫</div>
                <div className="text-sm text-gray-500 mt-1">Tồn kho: {product.stock}</div>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium mb-2">Số lượng</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={decQty}
                  className="px-3 py-1 rounded-md border"
                >
                  -
                </button>
                <input
                  type="number"
                  value={qty}
                  onChange={onQtyChange}
                  min={1}
                  max={product.stock ?? 999999}
                  className="w-20 text-center border rounded-md px-2 py-1"
                />
                <button
                  onClick={incQty}
                  className="px-3 py-1 rounded-md border"
                >
                  +
                </button>
                <div className="ml-3 text-sm text-gray-600">
                  Tổng: {(Number(product.price || 0) * qty).toLocaleString()}₫
                </div>
              </div>
              {qtyError && <div className="text-sm text-red-500 mt-2">{qtyError}</div>}
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={closeQtyModal}
                className="px-4 py-2 rounded-xl border"
              >
                Hủy
              </button>
              <button
                onClick={confirmAddToCart}
                className="px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold"
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