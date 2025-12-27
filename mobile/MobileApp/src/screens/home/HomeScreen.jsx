// src/screens/home/HomeScreen.js
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import productService from "../../services/productService";
import Header from "../../components/Header";

// ================= PRODUCT CARD =================
function ProductCard({ product, onPress }) {
  const FALLBACK = { uri: "https://via.placeholder.com/150" };

  const [resolvedSrc, setResolvedSrc] = useState(FALLBACK);
  const [errored, setErrored] = useState(false);

  const normalizeImage = (img) => {
    if (!img) return FALLBACK;
    if (Array.isArray(img) && img.length > 0) img = img[0];
    if (typeof img === "object" && img !== null) {
      img = img.url ?? img.path ?? img.src ?? null;
    }
    if (typeof img !== "string") return FALLBACK;
    return { uri: img };
  };

  useEffect(() => {
    const img = normalizeImage(product?.image);
    if (errored && resolvedSrc === FALLBACK) return;
    setResolvedSrc(img);
    setErrored(false);
  }, [product?.image]);

  const handleImgError = () => {
    if (resolvedSrc === FALLBACK) return;
    setErrored(true);
    setResolvedSrc(FALLBACK);
  };

  const formatPrice = (p) => {
    if (!p) return "";
    const num = Number(p);
    if (isNaN(num)) return "";
    return num.toLocaleString("vi-VN") + " ₫";
  };

  const flashSaleActive = useMemo(() => {
    const fs = product?.flash_sale;
    if (!fs) return false;
    const now = new Date();
    return now >= new Date(fs.start_at) && now <= new Date(fs.end_at);
  }, [product?.flash_sale]);

  const originalPrice = Number(product?.price ?? 0);
  const salePrice = flashSaleActive ? Number(product.flash_sale.sale_price) : null;
  const discountPercent = flashSaleActive
    ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
    : 0;
  const flashSaleName = flashSaleActive
    ? product.flash_sale.flash_sale_name.split("-")[0].trim()
    : "";

  const stockBadge = product?.stock <= 10 && product?.stock > 0 ? (
    <View style={styles.stockBadge}>
      <Text style={styles.stockText}>Còn {product.stock}</Text>
    </View>
  ) : null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {flashSaleActive && (
        <View style={styles.flashRibbon}>
          <Text style={styles.flashText}>{flashSaleName}</Text>
        </View>
      )}

      <View style={styles.imgContainer}>
        <Image
          source={resolvedSrc}
          style={styles.img}
          resizeMode="contain"
          onError={handleImgError}
        />
        {stockBadge}
      </View>

      <View style={styles.infoContainer}>
        <Text numberOfLines={2} style={styles.name}>
          {product?.name}
        </Text>

        {product?.brand && (
          <Text style={styles.brand}>{product.brand}</Text>
        )}

        {flashSaleActive ? (
          <View>
            <View style={styles.priceRow}>
              <Text style={styles.salePrice}>{formatPrice(salePrice)}</Text>
              <Text style={styles.discount}>-{discountPercent}%</Text>
            </View>
            <Text style={styles.originalPrice}>{formatPrice(originalPrice)}</Text>
            {product.flash_sale?.stock_limit && (
              <Text style={styles.flashLimit}>Giới hạn: {product.flash_sale.stock_limit}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.salePrice}>{formatPrice(originalPrice)}</Text>
        )}

        {product?.stock === 0 && (
          <Text style={styles.outOfStock}>Hết hàng</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ================= HOME SCREEN =================
export default function HomeScreen({ navigation, route }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
  });

  // Danh sách categories với slug để gọi API
  const categories = [
    { icon: "📱", name: "Điện Thoại", slug: "dien-thoai" },
    { icon: "💻", name: "Laptop", slug: "laptop" },
    { icon: "🎧", name: "Tai Nghe", slug: "tai-nghe" },
    { icon: "🖱️", name: "Phụ Kiện", slug: "ban-phim-co" },
  ];

  const fetchProducts = useCallback(async (params = {}) => {
    console.log('===== FETCH PRODUCTS =====');
    console.log('Params received:', JSON.stringify(params, null, 2));
    
    setLoading(true);
    setError(null);
    try {
      console.log('Calling productService.getProducts...');
      const res = await productService.getProducts(params);
      
      console.log('Product API response status:', res.status);
      console.log('Product API response data:', JSON.stringify(res.data, null, 2));
      
      const list = res.data?.products ?? [];
      console.log('Products extracted, count:', list.length);
      
      setProducts(Array.isArray(list) ? list : []);
      setPagination({
        total: res.data?.total ?? 0,
        page: res.data?.page ?? 1,
        limit: res.data?.limit ?? 20,
      });
      
      console.log('Products state updated successfully');
      console.log('==========================');
      return list;
    } catch (err) {
      console.error('===== FETCH PRODUCTS ERROR =====');
      console.error('Error object:', err);
      console.error('Error response:', err?.response?.data);
      console.error('================================');
      
      const msg = err?.response?.data?.message || "Không thể tải danh sách sản phẩm";
      setError(msg);
      Alert.alert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // CRITICAL: Lắng nghe thay đổi từ route.params
  useEffect(() => {
    console.log('🔥🔥🔥 ===== HOME SCREEN USE EFFECT TRIGGERED ===== 🔥🔥🔥');
    console.log('Current route object:', route);
    console.log('Route params (raw):', route?.params);
    console.log('Route params (JSON):', JSON.stringify(route?.params, null, 2));
    
    const params = route?.params || {};
    const queryParams = {
      page: params.page || 1,
      limit: params.limit || 20,
    };

    // Thêm các filter vào queryParams
    if (params.search) {
      queryParams.search = params.search;
      console.log('✅ Added search to query:', queryParams.search);
    }
    if (params.category) {
      queryParams.category = params.category;
      console.log('✅ Added category to query:', queryParams.category);
    }
    if (params.brand) {
      queryParams.brand = params.brand;
      console.log('✅ Added brand to query:', queryParams.brand);
    }
    if (params.min_price) {
      queryParams.min_price = params.min_price;
      console.log('✅ Added min_price to query:', queryParams.min_price);
    }
    if (params.max_price) {
      queryParams.max_price = params.max_price;
      console.log('✅ Added max_price to query:', queryParams.max_price);
    }
    if (params.sort) {
      queryParams.sort = params.sort;
      console.log('✅ Added sort to query:', queryParams.sort);
    }

    console.log('📦 Final query params:', JSON.stringify(queryParams, null, 2));
    console.log('🚀 Calling fetchProducts now...');
    
    fetchProducts(queryParams);
    
    console.log('🔥🔥🔥 ===== USE EFFECT COMPLETED ===== 🔥🔥🔥');
  }, [route?.params, fetchProducts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = route?.params || {};
      const queryParams = {
        page: 1,
        limit: params.limit || 20,
      };
      
      if (params.search) queryParams.search = params.search;
      if (params.category) queryParams.category = params.category;
      if (params.brand) queryParams.brand = params.brand;
      if (params.min_price) queryParams.min_price = params.min_price;
      if (params.max_price) queryParams.max_price = params.max_price;
      if (params.sort) queryParams.sort = params.sort;

      await fetchProducts(queryParams);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  }, [route?.params, fetchProducts]);

  const onProductClick = (p) => {
    navigation.navigate("Product", {
      productId: p.product_id,
      flash_sale: p.flash_sale,
    });
  };

  const handleFilter = useCallback((filterData) => {
    console.log("Filter applied from Header:", filterData);
  }, []);

  // ✨ Xử lý khi click vào category icons từ HomeScreen
  const handleCategoryClick = useCallback((categorySlug) => {
    console.log('===== CATEGORY CLICK (FROM HOME ICONS) =====');
    console.log('Category slug clicked:', categorySlug);
    
    const params = route?.params || {};
    console.log('Current route params:', JSON.stringify(params, null, 2));
    
    // Nếu click vào category đang được chọn thì bỏ chọn (hiển thị tất cả)
    const newCategory = params.category === categorySlug ? null : categorySlug;
    console.log('New category:', newCategory);
    
    // Build params mới
    const newParams = {
      page: 1,
      limit: params.limit || 20,
    };

    // Set category (hoặc undefined nếu bỏ chọn)
    if (newCategory) {
      newParams.category = newCategory;
    } else {
      newParams.category = undefined; // Quan trọng: set undefined để xóa filter
    }
    
    // Giữ lại các filter khác
    if (params.search) newParams.search = params.search;
    if (params.brand) newParams.brand = params.brand;
    if (params.min_price) newParams.min_price = params.min_price;
    if (params.max_price) newParams.max_price = params.max_price;
    if (params.sort) newParams.sort = params.sort;

    console.log('Setting params with setParams():', JSON.stringify(newParams, null, 2));
    console.log('==========================================');
    
    // ✨ QUAN TRỌNG: Dùng setParams thay vì navigate để trigger useEffect
    navigation.setParams(newParams);
  }, [route?.params, navigation]);

  const flashSaleProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.flash_sale) return false;
      const now = new Date();
      return now >= new Date(p.flash_sale.start_at) && now <= new Date(p.flash_sale.end_at);
    });
  }, [products]);

  const regularProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.flash_sale) return true;
      const now = new Date();
      return !(now >= new Date(p.flash_sale.start_at) && now <= new Date(p.flash_sale.end_at));
    });
  }, [products]);

  // Lấy thông tin category và brand đang được chọn
  const currentCategory = route?.params?.category || null;
  const currentBrand = route?.params?.brand || null;
  const selectedCategoryName = categories.find(c => c.slug === currentCategory)?.name;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <Header onFilter={handleFilter} />

      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            colors={["#f97316"]}
            tintColor="#f97316"
          />
        }
      >
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>
            {pagination.total > 0 ? `${pagination.total} sản phẩm` : "Đang tải..."}
          </Text>
          {(currentCategory || currentBrand) && (
            <Text style={styles.categoryFilterText}>
              {selectedCategoryName && `Danh mục: ${selectedCategoryName}`}
              {currentBrand && ` • Thương hiệu: ${currentBrand}`}
            </Text>
          )}
        </View>

        {/* Category Icons - Click để filter */}
        <View style={styles.categories}>
          {categories.map((cat) => (
            <TouchableOpacity 
              key={cat.slug} 
              style={[
                styles.catBox,
                currentCategory === cat.slug && styles.catBoxSelected
              ]}
              activeOpacity={0.7}
              onPress={() => handleCategoryClick(cat.slug)}
            >
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[
                styles.catName,
                currentCategory === cat.slug && styles.catNameSelected
              ]}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {flashSaleProducts.length > 0 && (
          <View style={styles.products}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>⚡ Flash Sale Đang Diễn Ra</Text>
              <Text style={styles.sectionCount}>({flashSaleProducts.length})</Text>
            </View>

            <View style={styles.productGrid}>
              {flashSaleProducts.map((p) => (
                <ProductCard 
                  key={p.product_id} 
                  product={p} 
                  onPress={() => onProductClick(p)} 
                />
              ))}
            </View>
          </View>
        )}

        <View style={styles.products}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {flashSaleProducts.length > 0 ? "Sản Phẩm Khác" : "Sản Phẩm Nổi Bật"}
            </Text>
            <Text style={styles.sectionCount}>
              ({regularProducts.length})
            </Text>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator 
              size="large" 
              color="#f97316" 
              style={styles.loader} 
            />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity 
                style={styles.retryButton}
                onPress={() => fetchProducts({ page: 1, limit: 20 })}
              >
                <Text style={styles.retryText}>Thử lại</Text>
              </TouchableOpacity>
            </View>
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không có sản phẩm nào</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {regularProducts.map((p) => (
                <ProductCard 
                  key={p.product_id} 
                  product={p} 
                  onPress={() => onProductClick(p)} 
                />
              ))}
            </View>
          )}
        </View>

        {products.length > 0 && products.length < pagination.total && (
          <TouchableOpacity 
            style={styles.loadMoreButton}
            onPress={() => {
              const params = route?.params || {};
              const queryParams = {
                page: pagination.page + 1, 
                limit: pagination.limit,
              };
              
              // Giữ lại tất cả filter hiện tại
              if (params.category) queryParams.category = params.category;
              if (params.brand) queryParams.brand = params.brand;
              if (params.search) queryParams.search = params.search;
              if (params.min_price) queryParams.min_price = params.min_price;
              if (params.max_price) queryParams.max_price = params.max_price;
              if (params.sort) queryParams.sort = params.sort;

              // Load more vẫn dùng navigate vì thay đổi page
              navigation.navigate('UserHome', queryParams);
            }}
          >
            <Text style={styles.loadMoreText}>Xem thêm</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F97316",
  },
  container: { 
    flex: 1, 
    backgroundColor: "#f5f5f5" 
  },
  infoBar: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  categoryFilterText: {
    fontSize: 12,
    color: "#f97316",
    textAlign: "center",
    fontWeight: "600",
    marginTop: 4,
  },
  categories: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-around", 
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  catBox: { 
    width: 100, 
    height: 100, 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    justifyContent: "center", 
    alignItems: "center", 
    marginBottom: 15, 
    shadowColor: "#000", 
    shadowOpacity: 0.08, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 2,
    borderColor: "#f0f0f0",
  },
  catBoxSelected: {
    borderColor: "#f97316",
    backgroundColor: "#fff5f0",
  },
  catIcon: { 
    fontSize: 36 
  },
  catName: { 
    marginTop: 8, 
    fontWeight: "600",
    fontSize: 12,
    textAlign: "center",
    color: "#333",
  },
  catNameSelected: {
    color: "#f97316",
    fontWeight: "700",
  },
  products: { 
    paddingHorizontal: 15, 
    paddingBottom: 20 
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 15,
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "bold",
  },
  sectionCount: {
    fontSize: 16,
    color: "#666",
    marginLeft: 8,
  },
  productGrid: { 
    flexDirection: "row", 
    flexWrap: "wrap", 
    justifyContent: "space-between" 
  },
  card: { 
    width: "48%", 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    marginBottom: 15, 
    overflow: "hidden", 
    shadowColor: "#000", 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  flashRibbon: { 
    position: "absolute", 
    top: 10, 
    right: -30, 
    backgroundColor: "#ff0000", 
    paddingVertical: 4, 
    paddingHorizontal: 30, 
    transform: [{ rotate: "45deg" }], 
    zIndex: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  flashText: { 
    color: "#fff", 
    fontSize: 10, 
    fontWeight: "bold",
    textAlign: "center",
  },
  imgContainer: { 
    backgroundColor: "#f9f9f9", 
    height: 140, 
    justifyContent: "center", 
    alignItems: "center",
    position: "relative",
  },
  img: { 
    width: "90%", 
    height: "90%" 
  },
  stockBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(255, 152, 0, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  stockText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "600",
  },
  infoContainer: { 
    padding: 12 
  },
  name: { 
    fontSize: 14, 
    fontWeight: "600",
    marginBottom: 6,
    lineHeight: 18,
  },
  brand: {
    fontSize: 11,
    color: "#666",
    marginBottom: 6,
    fontWeight: "500",
  },
  priceRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6,
    marginTop: 4,
  },
  salePrice: { 
    color: "#f97316", 
    fontSize: 17, 
    fontWeight: "bold" 
  },
  discount: { 
    fontSize: 12, 
    color: "#fff",
    backgroundColor: "#ff0000",
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  originalPrice: { 
    textDecorationLine: "line-through", 
    color: "#999", 
    fontSize: 13,
    marginTop: 2,
  },
  flashLimit: {
    fontSize: 11,
    color: "#ff6b6b",
    marginTop: 4,
    fontStyle: "italic",
  },
  outOfStock: {
    color: "#999",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    fontStyle: "italic",
  },
  loader: {
    marginTop: 30,
    marginBottom: 30,
  },
  errorContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  errorText: {
    color: "#ff0000",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: "#f97316",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    color: "#999",
    fontSize: 16,
  },
  loadMoreButton: {
    backgroundColor: "#f97316",
    marginHorizontal: 15,
    marginBottom: 20,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  loadMoreText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});