// src/screens/product/ProductScreen.js
import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useProduct } from '../../providers/ProductProvider';
import { useCart } from '../../providers/CartProvider';
import userService from '../../services/userService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
  primary: '#F97316',
  white: '#FFFFFF',
  black: '#000000',
  gray: '#6B7280',
  lightGray: '#F3F4F6',
  yellow: '#FCD34D',
  red: '#EF4444',
};

export default function ProductScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  
  console.log('=== ProductScreen mounted ===');
  console.log('Route params:', route.params);
  
  const productId = route.params?.productId;
  const flashSaleFromHome = route.params?.flash_sale; // Nhận flash_sale từ Home
  
  console.log('Product ID:', productId);
  console.log('Flash Sale from Home:', flashSaleFromHome);

  const productContext = useProduct();
  const cartContext = useCart();

  console.log('Product context available:', !!productContext);
  console.log('Cart context available:', !!cartContext);

  if (!productContext) {
    console.error('ERROR: ProductProvider not found!');
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Lỗi khởi tạo</Text>
          <Text style={styles.errorText}>
            ProductProvider chưa được cấu hình. Vui lòng kiểm tra App.js
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!cartContext) {
    console.error('ERROR: CartProvider not found!');
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Lỗi khởi tạo</Text>
          <Text style={styles.errorText}>
            CartProvider chưa được cấu hình. Vui lòng kiểm tra App.js
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { productDetail, loading, error, fetchProductById } = productContext;
  const { addToCart } = cartContext;

  const [currentImg, setCurrentImg] = useState(0);
  const [showQtyModal, setShowQtyModal] = useState(false);
  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [localError, setLocalError] = useState(null);

  // --- Reviews state ---
  const [reviews, setReviews] = useState([]);
  const reviewsRef = useRef([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(false);

  // Rating summary and filter
  const [avgRating, setAvgRating] = useState(0);
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [distribution, setDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [starFilter, setStarFilter] = useState(0);
  const [filtering, setFiltering] = useState(false);

  const lastFetchParamsRef = useRef({});

  // --- CHECK FLASH SALE STATUS ---
 const flashSaleInfo = useMemo(() => {
  const flashSale = flashSaleFromHome || productDetail?.flash_sale;
  if (!flashSale) return null;

  const now = new Date();
  const startAt = new Date(flashSale.start_at);
  const endAt = new Date(flashSale.end_at);

  if (now < startAt || now > endAt) return null;

  // 🔥 ƯU TIÊN GIÁ TỪ HOME, SAU ĐÓ MỚI TỚI API
  const originalPrice = Number(
    route.params?.price ??
    productDetail?.price ??
    0
  );

  const salePrice = Number(flashSale.sale_price || 0);
  if (originalPrice <= 0 || salePrice <= 0) return null;

  const discountPercent = Math.round(
    ((originalPrice - salePrice) / originalPrice) * 100
  );

  return {
    isActive: true,
    salePrice,
    originalPrice,
    discountPercent,
    flashSaleName:
      flashSale.flash_sale_name?.split('-')[0]?.trim() || 'Flash Sale',
    stockLimit: flashSale.stock_limit,
    startAt: flashSale.start_at,
    endAt: flashSale.end_at,
  };
}, [
  flashSaleFromHome,
  productDetail?.flash_sale,
  productDetail?.price,
  route.params?.price,
]);

  // --- Helpers to normalize server payloads ---
  const normalizePayloadToList = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload.reviews)) return payload.reviews;
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.data)) return payload.data;
    if (Array.isArray(payload.items)) return payload.items;
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
    const stats = payload.stats ?? payload.rating_stats ?? payload.distribution ?? null;
    if (stats && typeof stats === 'object') {
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
      .filter((v) => typeof v === 'number' && !Number.isNaN(v) && v > 0);

    const total = ratings.length;
    const avg = total === 0 ? 0 : Math.round((ratings.reduce((s, x) => s + x, 0) / total) * 10) / 10;

    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach((r) => {
      const k = Math.max(1, Math.min(5, Math.round(r)));
      dist[k] = (dist[k] || 0) + 1;
    });

    return { avg, total, dist };
  };

  // Fetch reviews function
  const fetchReviews = useCallback(
    async (pageToFetch = 1, ratingFilter = 0) => {
      if (!productId) return;
      setReviewsLoading(true);
      setReviewsError(null);
      if (ratingFilter) setFiltering(true);

      try {
        const params = { page: pageToFetch, limit };
        if (ratingFilter && ratingFilter >= 1 && ratingFilter <= 5) {
          params.rating = ratingFilter;
        }

        lastFetchParamsRef.current = params;

        console.log('Fetching reviews with params:', params);
        const resp = await userService.getReviewsByProduct(productId, params);

        const payload = resp?.data ?? resp;
        const list = normalizePayloadToList(payload);

        console.log('Reviews fetched:', list.length);

        setReviews((prev) => {
          const next = pageToFetch > 1 ? [...prev, ...list] : list;
          reviewsRef.current = next;
          return next;
        });

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

        const avgFromPayload = extractAverageFromPayload(payload);
        if (avgFromPayload != null) {
          setAvgRating(Number(avgFromPayload));
        }

        const distFromPayload = extractDistributionFromPayload(payload);
        if (distFromPayload) {
          setDistribution(distFromPayload);
        } else {
          const merged = pageToFetch > 1 ? [...reviewsRef.current, ...list] : list;
          const { avg, total, dist } = computeSummaryFromReviews(merged);
          if (avgFromPayload == null) setAvgRating(avg);
          setDistribution(dist);
          setTotalReviewsCount((prev) => (totalFromPayload != null ? prev : total));
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
        const msg = err.response?.data?.message || 'Không lấy được đánh giá';
        setReviewsError(msg);
      } finally {
        setReviewsLoading(false);
        setFiltering(false);
      }
    },
    [productId, limit]
  );

  // Load product
  useEffect(() => {
    console.log('=== useEffect: Fetching product ===');
    console.log('Product ID:', productId);
    
    if (!productId) {
      console.error('ERROR: No product ID provided!');
      setLocalError('Không có ID sản phẩm');
      return;
    }

    const fetchData = async () => {
      try {
        console.log('Calling fetchProductById...');
        await fetchProductById(productId);
        console.log('Product fetched successfully');
      } catch (err) {
        console.error('ERROR fetching product:', err);
        setLocalError(err.message || 'Không thể tải sản phẩm');
      }
    };

    fetchData();
    
    setPage(1);
    setReviews([]);
    reviewsRef.current = [];
    setStarFilter(0);
    setAvgRating(0);
    setTotalReviewsCount(0);
    setDistribution({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  }, [productId, fetchProductById]);

  useEffect(() => {
    if (productId) {
      fetchReviews(page, starFilter);
    }
  }, [page, productId, starFilter, fetchReviews]);

  const onRefresh = useCallback(async () => {
    console.log('=== Refreshing product ===');
    setRefreshing(true);
    setLocalError(null);
    try {
      await fetchProductById(productId);
      setPage(1);
      setReviews([]);
      reviewsRef.current = [];
      await fetchReviews(1, starFilter);
      console.log('Refresh successful');
    } catch (err) {
      console.error('Refresh error:', err);
      setLocalError(err.message || 'Không thể làm mới');
    } finally {
      setRefreshing(false);
    }
  }, [productId, fetchProductById, fetchReviews, starFilter]);

  const product = productDetail;

  console.log('Current state:', {
    loading,
    error,
    localError,
    hasProduct: !!product,
    productId: product?.product_id,
    hasFlashSale: !!flashSaleInfo,
  });

  useEffect(() => {
    setQty(1);
    setQtyError('');
  }, [product?.product_id]);

  // Loading state
  if (loading && !refreshing && !product) {
    console.log('Showing loading screen');
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải sản phẩm...</Text>
          <Text style={styles.debugText}>Product ID: {productId}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || localError || !product) {
    const errorMessage = error || localError || 'Không tìm thấy sản phẩm';
    console.log('Showing error screen:', errorMessage);
    
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Lỗi tải sản phẩm</Text>
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Text style={styles.debugText}>Product ID: {productId}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              console.log('Retry button pressed');
              setLocalError(null);
              fetchProductById(productId);
            }}
          >
            <Text style={styles.retryButtonText}>Thử lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backToHomeButton}
            onPress={() => navigation.navigate('HomeScreen')}
          >
            <Text style={styles.backToHomeText}>Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  console.log('Rendering product:', product.name);

  // Images
  const images =
    product.media?.length > 0
      ? product.media.map((m) => m.url)
      : ['https://via.placeholder.com/400'];

  const nextImage = () => setCurrentImg((prev) => (prev + 1) % images.length);
  const prevImage = () =>
    setCurrentImg((prev) => (prev === 0 ? images.length - 1 : prev - 1));

  // Xác định giá hiển thị
  const displayPrice = flashSaleInfo ? flashSaleInfo.salePrice : product.price;
  const originalPrice = flashSaleInfo ? flashSaleInfo.originalPrice : null;

  // Quantity modal handlers
  const openQtyModal = () => {
    console.log('Opening quantity modal');
    setQty(1);
    setQtyError('');
    setShowQtyModal(true);
  };

  const closeQtyModal = () => {
    console.log('Closing quantity modal');
    setShowQtyModal(false);
    setQtyError('');
  };

  const incQty = () => {
    const max = Number(product.stock ?? 999999);
    setQty((prev) => {
      const next = prev + 1;
      if (next > max) {
        setQtyError(`Tối đa ${max} sản phẩm`);
        return prev;
      }
      setQtyError('');
      return next;
    });
  };

  const decQty = () => {
    setQty((prev) => {
      const next = prev - 1;
      if (next < 1) return 1;
      setQtyError('');
      return next;
    });
  };

  const onQtyChange = (text) => {
    const parsed = parseInt(text, 10) || 0;
    const max = Number(product.stock ?? 999999);
    if (parsed <= 0) {
      setQty(1);
      setQtyError('');
      return;
    }
    if (parsed > max) {
      setQty(max);
      setQtyError(`Tối đa ${max} sản phẩm`);
      return;
    }
    setQty(parsed);
    setQtyError('');
  };

  const confirmAddToCart = async () => {
    console.log('=== Add to cart ===');
    const max = Number(product.stock ?? 999999);
    
    if (qty < 1) {
      setQtyError('Số lượng phải lớn hơn 0');
      return;
    }
    if (qty > max) {
      setQtyError(`Chỉ còn ${max} sản phẩm`);
      return;
    }

    const payload = {
      product_id: product.product_id ?? product.id,
      product_name: product.name ?? '',
      price: String(Number(displayPrice || 0).toFixed(2)), // Dùng displayPrice (giá flash sale nếu có)
      stock: max,
      quantity: qty,
      image_url: images[0],
    };

    console.log('Add to cart payload:', payload);

    try {
      await addToCart(payload);
      console.log('Add to cart successful');
      Alert.alert('Thành công', 'Đã thêm vào giỏ hàng');
      closeQtyModal();
    } catch (err) {
      console.error('Add to cart error:', err);
      const msg = err?.response?.data?.message || err.message || 'Thêm vào giỏ thất bại';
      Alert.alert('Lỗi', msg);
    }
  };

  const goToBuy = () => {
    console.log('=== Go to buy ===');
    const preselected = [
      {
        id: product.product_id ?? product.id,
        product_id: product.product_id ?? product.id,
        name: product.name,
        price: Number(displayPrice) || 0, // Dùng displayPrice
        quantity: 1,
        image: images[0],
        selected: true,
      },
    ];
    console.log('Preselected items:', preselected);
    navigation.navigate('CustomerInfo', { preselected });
  };

  const loadMore = () => {
    if (reviewsLoading) return;
    if (!hasMore) return;
    console.log('Loading more reviews...');
    setPage((p) => p + 1);
  };

  const applyStarFilter = (star) => {
    console.log('Applying star filter:', star);
    if (star === 0) {
      setStarFilter(0);
      setPage(1);
      setReviews([]);
      reviewsRef.current = [];
      return;
    }

    if (star === starFilter) {
      setStarFilter(0);
    } else {
      setStarFilter(star);
    }
    setPage(1);
    setReviews([]);
    reviewsRef.current = [];
  };

  const renderStars = (value, small = false) => {
    const v = Number(value) || 0;
    const full = Math.floor(v);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (i <= full) {
        stars.push(
          <Text key={i} style={[styles.star, small && styles.starSmall]}>
            ★
          </Text>
        );
      } else {
        stars.push(
          <Text key={i} style={[styles.starEmpty, small && styles.starSmall]}>
            ☆
          </Text>
        );
      }
    }
    return <View style={styles.starsContainer}>{stars}</View>;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN');
    } catch {
      return '';
    }
  };

  const totalForDistribution = 
    Object.values(distribution).reduce((s, x) => s + Number(x || 0), 0) || 
    totalReviewsCount || 
    reviews.length || 
    0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết sản phẩm</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Cart')} style={styles.cartButton}>
          <Text style={styles.cartIcon}>🛒</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
          />
        }
      >
        {/* IMAGE */}
        <View style={styles.imageGallery}>
          {flashSaleInfo && (
            <View style={styles.flashBadge}>
              <Text style={styles.flashBadgeText}>⚡ {flashSaleInfo.flashSaleName}</Text>
            </View>
          )}
          
          <View style={styles.imageContainer}>
            {images.length > 1 && (
              <TouchableOpacity onPress={prevImage} style={styles.imageNavLeft}>
                <Text style={styles.imageNavText}>‹</Text>
              </TouchableOpacity>
            )}

            <Image source={{ uri: images[currentImg] }} style={styles.mainImage} resizeMode="contain" />

            {images.length > 1 && (
              <TouchableOpacity onPress={nextImage} style={styles.imageNavRight}>
                <Text style={styles.imageNavText}>›</Text>
              </TouchableOpacity>
            )}
          </View>

          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnailsContainer}>
              {images.map((img, i) => (
                <TouchableOpacity key={i} onPress={() => setCurrentImg(i)}>
                  <Image
                    source={{ uri: img }}
                    style={[
                      styles.thumbnail,
                      currentImg === i && styles.thumbnailActive,
                    ]}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* PRODUCT INFO */}
        <View style={styles.infoContainer}>
          <Text style={styles.productName}>{product.name}</Text>
          
          {/* Giá */}
          {flashSaleInfo ? (
            <View style={styles.priceContainer}>
              <View style={styles.flashPriceRow}>
                <Text style={styles.flashPrice}>{formatPrice(flashSaleInfo.salePrice)}</Text>
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>-{flashSaleInfo.discountPercent}%</Text>
                </View>
              </View>
              <Text style={styles.originalPrice}>{formatPrice(flashSaleInfo.originalPrice)}</Text>
              {flashSaleInfo.stockLimit && (
                <Text style={styles.flashStockLimit}>
                  🔥 Chỉ còn {flashSaleInfo.stockLimit} suất giảm giá
                </Text>
              )}
            </View>
          ) : (
            <Text style={styles.price}>{formatPrice(product.price)}</Text>
          )}

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Thương hiệu</Text>
            <Text style={styles.detailValue}>{product.brand?.name || '—'}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Danh mục</Text>
            <Text style={styles.detailValue}>{product.category?.name || '—'}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={styles.detailLabel}>Tồn kho</Text>
            <Text style={styles.detailValue}>{product.stock || 0}</Text>
          </View>

          <View style={styles.ratingCompact}>
            <Text style={styles.ratingScore}>{avgRating > 0 ? avgRating : '—'}</Text>
            {renderStars(avgRating, true)}
            <Text style={styles.ratingCount}>({totalReviewsCount || 0} đánh giá)</Text>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.addToCartButton} onPress={openQtyModal}>
              <Text style={styles.buttonText}>Thêm vào giỏ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyNowButton} onPress={goToBuy}>
              <Text style={styles.buttonText}>Mua ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DESCRIPTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mô tả sản phẩm</Text>
          <Text style={styles.description}>{product.description || 'Chưa có mô tả'}</Text>
        </View>

        {/* SPECS */}
        {product.specs && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông số kỹ thuật</Text>
            <View style={styles.specsContainer}>
              {Object.entries(product.specs).map(([k, v]) => (
                <View key={k} style={styles.specRow}>
                  <Text style={styles.specKey}>{k.replace(/_/g, ' ')}</Text>
                  <Text style={styles.specValue}>{v}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* REVIEWS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Đánh giá sản phẩm</Text>

          <View style={styles.reviewOverview}>
            <View style={styles.reviewScore}>
              <Text style={styles.reviewScoreText}>{avgRating > 0 ? avgRating : '—'}</Text>
              {renderStars(avgRating)}
              <Text style={styles.reviewCountText}>{totalReviewsCount || 0} đánh giá</Text>
            </View>

            <View style={styles.reviewBars}>
              <View style={styles.filterContainer}>
                <TouchableOpacity
                  onPress={() => applyStarFilter(0)}
                  style={[
                    styles.filterButton,
                    starFilter === 0 && styles.filterButtonActive,
                  ]}
                >
                  <Text style={[
                    styles.filterButtonText,
                    starFilter === 0 && styles.filterButtonTextActive,
                  ]}>
                    Tất cả
                  </Text>
                </TouchableOpacity>
                {starFilter !== 0 && (
                  <Text style={styles.filterLabel}>Lọc: {starFilter}★</Text>
                )}
              </View>

              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const percent = totalForDistribution > 0 ? (count / totalForDistribution) * 100 : 0;

                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => applyStarFilter(star)}
                    style={styles.reviewBarRow}
                  >
                    <Text style={styles.reviewBarStar}>{star}★</Text>
                    <View style={styles.reviewBarBg}>
                      <View
                        style={[
                          styles.reviewBarFill,
                          { width: `${percent}%` },
                          starFilter === star && styles.reviewBarFillActive,
                        ]}
                      />
                    </View>
                    <Text style={styles.reviewBarCount}>{count}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {reviewsLoading && reviews.length === 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingSmallText}>Đang tải đánh giá...</Text>
            </View>
          )}

          {reviewsError && (
            <Text style={styles.errorTextSmall}>{reviewsError}</Text>
          )}

          {!reviewsLoading && reviews.length === 0 && !reviewsError && (
            <Text style={styles.noReviewText}>
              {starFilter ? 'Không có đánh giá phù hợp' : 'Chưa có đánh giá nào'}
            </Text>
          )}

          {reviews.map((rv) => {
            const rating = rv?.rating ?? rv?.stars ?? rv?.score ?? rv?.point ?? rv?.rate ?? 0;
            const author = rv?.user_name ?? rv?.user?.name ?? rv?.author_name ?? rv?.name ?? 'Khách hàng';
            const comment = rv?.comment ?? rv?.content ?? rv?.message ?? 'Không có nội dung';
            const createdAt = rv?.created_at ?? rv?.createdAt ?? rv?.date ?? rv?.time ?? null;

            return (
              <View key={rv?.review_id ?? rv?.id ?? rv?._id} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>{author}</Text>
                  {renderStars(rating, true)}
                </View>
                <Text style={styles.reviewComment} numberOfLines={3}>
                  {comment}
                </Text>
                <Text style={styles.reviewDate}>{formatDate(createdAt)}</Text>
              </View>
            );
          })}

          {reviewsLoading && reviews.length > 0 && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingSmallText}>Đang tải thêm...</Text>
            </View>
          )}

          {!reviewsLoading && hasMore && (
            <TouchableOpacity style={styles.viewAllReviewsBtn} onPress={loadMore}>
              <Text style={styles.viewAllReviewsText}>Xem thêm đánh giá →</Text>
            </TouchableOpacity>
          )}

          {filtering && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.loadingSmallText}>Đang lọc...</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* QUANTITY MODAL */}
      <Modal
        visible={showQtyModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeQtyModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Chọn số lượng</Text>

            <View style={styles.modalProductInfo}>
              <Image
                source={{ uri: images[0] }}
                style={styles.modalProductImage}
              />
              <View style={styles.modalProductDetails}>
                <Text style={styles.modalProductName} numberOfLines={2}>
                  {product.name}
                </Text>
                
                {flashSaleInfo ? (
                  <View>
                    <View style={styles.modalFlashPriceRow}>
                      <Text style={styles.modalFlashPrice}>
                        {formatPrice(flashSaleInfo.salePrice)}
                      </Text>
                      <Text style={styles.modalDiscount}>
                        -{flashSaleInfo.discountPercent}%
                      </Text>
                    </View>
                    <Text style={styles.modalOriginalPrice}>
                      {formatPrice(flashSaleInfo.originalPrice)}
                    </Text>
                  </View>
                ) : (
                  <Text style={styles.modalProductPrice}>
                    {formatPrice(product.price)}
                  </Text>
                )}
                
                <Text style={styles.modalProductStock}>
                  Tồn kho: {product.stock || 0}
                </Text>
              </View>
            </View>

            <View style={styles.qtyInputContainer}>
              <Text style={styles.qtyLabel}>Số lượng</Text>
              <View style={styles.qtyControls}>
                <TouchableOpacity onPress={decQty} style={styles.qtyButton}>
                  <Text style={styles.qtyButtonText}>−</Text>
                </TouchableOpacity>

                <TextInput
                  value={String(qty)}
                  onChangeText={onQtyChange}
                  keyboardType="number-pad"
                  style={styles.qtyInput}
                />

                <TouchableOpacity onPress={incQty} style={styles.qtyButton}>
                  <Text style={styles.qtyButtonText}>+</Text>
                </TouchableOpacity>

                <Text style={styles.qtyTotal}>
                  Tổng: {formatPrice(Number(displayPrice || 0) * qty)}
                </Text>
              </View>
              {qtyError ? (
                <Text style={styles.qtyErrorText}>{qtyError}</Text>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={closeQtyModal}
                style={styles.modalCancelButton}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmAddToCart}
                style={styles.modalConfirmButton}
              >
                <Text style={styles.modalConfirmText}>Xác nhận</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 32,
    color: COLORS.black,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  cartButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartIcon: {
    fontSize: 24,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.gray,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.red,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.gray,
    marginBottom: 12,
    textAlign: 'center',
  },
  debugText: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 8,
    fontFamily: 'monospace',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  backToHomeButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  backToHomeText: {
    color: COLORS.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  imageGallery: {
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    position: 'relative',
  },
  flashBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: COLORS.red,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 5,
  },
  flashBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  imageContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: 320,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainImage: {
    width: 320,
    height: 320,
  },
  imageNavLeft: {
    position: 'absolute',
    left: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 10,
  },
  imageNavRight: {
    position: 'absolute',
    right: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    zIndex: 10,
  },
  imageNavText: {
    fontSize: 28,
    color: COLORS.black,
  },
  thumbnailsContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
  },
  thumbnailActive: {
    borderColor: COLORS.primary,
  },
  infoContainer: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  productName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  priceContainer: {
    marginBottom: 16,
  },
  flashPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  flashPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.red,
  },
  discountBadge: {
    backgroundColor: COLORS.red,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  discountText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  originalPrice: {
    fontSize: 16,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  flashStockLimit: {
    fontSize: 12,
    color: COLORS.red,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  ratingCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  ratingCount: {
    fontSize: 12,
    color: COLORS.gray,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  addToCartButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buyNowButton: {
    flex: 1,
    backgroundColor: '#C2410C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  section: {
    padding: 16,
    backgroundColor: COLORS.white,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 22,
  },
  specsContainer: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    padding: 12,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  specKey: {
    fontSize: 14,
    color: COLORS.gray,
    textTransform: 'capitalize',
  },
  specValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 20,
    color: COLORS.yellow,
  },
  starEmpty: {
    fontSize: 20,
    color: COLORS.lightGray,
  },
  starSmall: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    width: SCREEN_WIDTH - 40,
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: COLORS.black,
  },
  modalProductInfo: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  modalProductImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  modalProductDetails: {
    flex: 1,
  },
  modalProductName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: 4,
  },
  modalFlashPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  modalFlashPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.red,
  },
  modalDiscount: {
    fontSize: 11,
    color: COLORS.white,
    backgroundColor: COLORS.red,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  modalOriginalPrice: {
    fontSize: 13,
    color: COLORS.gray,
    textDecorationLine: 'line-through',
    marginBottom: 4,
  },
  modalProductPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  modalProductStock: {
    fontSize: 12,
    color: COLORS.gray,
  },
  qtyInputContainer: {
    marginBottom: 20,
  },
  qtyLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: COLORS.black,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  qtyButton: {
    width: 36,
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  qtyInput: {
    width: 60,
    height: 36,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '600',
  },
  qtyTotal: {
    flex: 1,
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
  },
  qtyErrorText: {
    fontSize: 12,
    color: COLORS.red,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
  },
  reviewOverview: {
    flexDirection: 'row',
    backgroundColor: '#FFF7ED',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewScore: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#FED7AA',
    paddingRight: 12,
  },
  reviewScoreText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  reviewCountText: {
    marginTop: 4,
    fontSize: 12,
    color: COLORS.gray,
  },
  reviewBars: {
    flex: 1,
    paddingLeft: 12,
  },
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  filterButtonActive: {
    backgroundColor: '#FFF7ED',
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 12,
    color: COLORS.gray,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  filterLabel: {
    fontSize: 12,
    color: COLORS.gray,
  },
  reviewBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewBarStar: {
    width: 32,
    fontSize: 12,
    color: COLORS.gray,
  },
  reviewBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  reviewBarFill: {
    height: 6,
    backgroundColor: '#FED7AA',
    borderRadius: 4,
  },
  reviewBarFillActive: {
    backgroundColor: COLORS.primary,
  },
  reviewBarCount: {
    width: 28,
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'right',
  },
  reviewItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewUser: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.black,
  },
  reviewComment: {
    fontSize: 14,
    color: COLORS.gray,
    lineHeight: 20,
    marginBottom: 4,
  },
  reviewDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noReviewText: {
    textAlign: 'center',
    fontSize: 14,
    color: COLORS.gray,
    paddingVertical: 16,
  },
  viewAllReviewsBtn: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#FFF7ED',
    alignItems: 'center',
  },
  viewAllReviewsText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingSmallText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  errorTextSmall: {
    fontSize: 14,
    color: COLORS.red,
    textAlign: 'center',
    paddingVertical: 16,
  },
});