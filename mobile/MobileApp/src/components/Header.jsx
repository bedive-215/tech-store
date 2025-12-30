// src/components/Header.jsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import categoryService from '../services/categoryService';
import brandService from '../services/brandService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function Header({ onFilter = (f) => console.log('filter', f) }) {
  const navigation = useNavigation();
  const route = useRoute();

  const [showCategories, setShowCategories] = useState(false);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [loadingBrands, setLoadingBrands] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState(null);

  const [searchText, setSearchText] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('');

  const [marqueeAnim] = useState(new Animated.Value(0));

  const miniMessages = [
    '📱 Thu cũ giá ngon - Lên đời tiết kiệm',
    '📦 Sản phẩm Chính hãng - Xuất VAT đầy đủ',
    '🚚 Giao nhanh - Miễn phí cho đơn 300k',
  ];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(marqueeAnim, {
        toValue: -SCREEN_WIDTH,
        duration: 18000,
        useNativeDriver: true,
      })
    );
    animation.start();
    return () => animation.stop();
  }, []);

  useEffect(() => {
    if (!showCategories) return;
    if (categories.length > 0) return;
    (async () => {
      try {
        setLoadingCategories(true);
        const res = await categoryService.getCategories();
        const data = res.data;
        if (Array.isArray(data)) setCategories(data);
        else if (data.categories) setCategories(data.categories);
        else if (data.rows) setCategories(data.rows);
        else setCategories([]);
      } catch (err) {
        console.error('fetch categories error', err);
      } finally {
        setLoadingCategories(false);
      }
    })();
  }, [showCategories, categories.length]);

  const fetchBrands = async (category) => {
    console.log('===== FETCH BRANDS =====');
    console.log('Category object:', JSON.stringify(category, null, 2));
    
    if (!category) return setBrands([]);
    try {
      setLoadingBrands(true);
      const params = { 
        category_id: category.category_id || category.id 
      };
      console.log('Calling brandService.getBrands with params:', params);
      
      const res = await brandService.getBrands(params);
      console.log('Brand response:', JSON.stringify(res.data, null, 2));
      
      const data = res.data;
      if (Array.isArray(data)) setBrands(data);
      else if (data.brands) setBrands(data.brands);
      else if (data.rows) setBrands(data.rows);
      else setBrands([]);
      
      console.log('Brands set, total:', brands.length);
    } catch (err) {
      console.error('fetch brands error', err);
      setBrands([]);
    } finally {
      setLoadingBrands(false);
    }
  };

  // ✨ QUAN TRỌNG: Dùng setParams thay vì navigate để UPDATE params
  const buildAndNavigate = (overrides = {}) => {
    const category = overrides.category !== undefined ? overrides.category : selectedCategory;
    const brand = overrides.brand !== undefined ? overrides.brand : selectedBrand;
    const search = overrides.searchText !== undefined ? overrides.searchText : searchText;
    const min = overrides.minPrice !== undefined ? overrides.minPrice : minPrice;
    const max = overrides.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
    const st = overrides.sort !== undefined ? overrides.sort : sort;
    const page = overrides.page ?? 1;
    const limit = overrides.limit ?? 20;

    const params = {
      page,
      limit,
    };

    // Search text
    if (search && String(search).trim() !== '') {
      params.search = String(search).trim();
    }

    // Category: SỬ DỤNG SLUG
    if (category && category.slug) {
      params.category = category.slug;
    }

    // Brand: SỬ DỤNG SLUG
    if (brand && brand.slug) {
      params.brand = brand.slug;
    }

    // Price range
    const minNum = String(min).replace(/[^\d]/g, '');
    const maxNum = String(max).replace(/[^\d]/g, '');
    if (minNum !== '') params.min_price = minNum;
    if (maxNum !== '') params.max_price = maxNum;

    // Sort
    if (st) params.sort = st;

    console.log('🚀 Navigate with params:', params);

    // ✨ QUAN TRỌNG: Dùng setParams để UPDATE params hiện tại
    // Thay vì navigation.navigate() sẽ MERGE params
    navigation.setParams(params);

    // Callback cho parent component
    onFilter({
      page,
      limit,
      search: search && String(search).trim(),
      category: category?.slug || null,
      brand: brand?.slug || null,
      min_price: minNum || null,
      max_price: maxNum || null,
      sort: st || null,
    });
  };

  const handleSelectBrand = (brand) => {
    setSelectedBrand(brand);
    buildAndNavigate({ brand, page: 1 });
    setShowCategories(false);
  };

  const handleSelectCategoryOnly = async (category) => {
    setSelectedCategory(category);
    setSelectedBrand(null);
    await fetchBrands(category);
    buildAndNavigate({ category, brand: null, page: 1 });
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedBrand(null);
    setMinPrice('');
    setMaxPrice('');
    setSort('');
    setSearchText('');
    setBrands([]);
    
    // Reset params về default
    navigation.setParams({ 
      page: 1, 
      limit: 20,
      category: undefined,
      brand: undefined,
      search: undefined,
      min_price: undefined,
      max_price: undefined,
      sort: undefined,
    });
    
    onFilter({});
    setShowCategories(false);
  };

  const BrandImage = ({ brand, size = 84 }) => {
    const [imageError, setImageError] = useState(false);
    const src = brand?.logo || brand?.image || brand?.thumbnail || null;

    if (!src || imageError) {
      return (
        <View style={[styles.brandImagePlaceholder, { width: size, height: size }]}>
          <Text style={styles.brandImagePlaceholderText}>
            {brand?.name?.slice(0, 2)?.toUpperCase()}
          </Text>
        </View>
      );
    }

    return (
      <Image
        source={{ uri: src }}
        style={[styles.brandImage, { width: size, height: size }]}
        resizeMode="contain"
        onError={() => setImageError(true)}
      />
    );
  };

  const CategoryIcon = ({ keyName }) => {
    const k = (keyName || '').toLowerCase();
    const color = '#F97316';

    if (k.includes('dien-thoai') || k.includes('điện thoại') || k.includes('dien-thoai') || k.includes('mobile')) {
      return <Text style={[styles.iconText, { color }]}>📱</Text>;
    }
    if (k.includes('laptop') || k.includes('máy tính') || k.includes('pc')) {
      return <Text style={[styles.iconText, { color }]}>💻</Text>;
    }
    if (k.includes('watch') || k.includes('đồng hồ')) {
      return <Text style={[styles.iconText, { color }]}>⌚</Text>;
    }
    if (k.includes('tai-nghe') || k.includes('tai nghe') || k.includes('accessory') || k.includes('phụ kiện') || k.includes('headphone')) {
      return <Text style={[styles.iconText, { color }]}>🎧</Text>;
    }
    if (k.includes('ban-phim') || k.includes('bàn phím') || k.includes('keyboard')) {
      return <Text style={[styles.iconText, { color }]}>⌨️</Text>;
    }
    if (k.includes('tv') || k.includes('tivi') || k.includes('màn hình')) {
      return <Text style={[styles.iconText, { color }]}>📺</Text>;
    }
    return <Text style={[styles.iconText, { color }]}>📦</Text>;
  };

  return (
    <View style={styles.header}>
      <View style={styles.marqueeBanner}>
        <Animated.View
          style={[
            styles.marqueeTrack,
            {
              transform: [{ translateX: marqueeAnim }],
            },
          ]}
        >
          {[...miniMessages, ...miniMessages].map((msg, idx) => (
            <Text key={idx} style={styles.marqueeText}>
              {msg}
            </Text>
          ))}
        </Animated.View>
      </View>

      <View style={styles.mainHeader}>
        <TouchableOpacity
          onPress={() => {
            resetFilters();
          }}
          style={styles.logoButton}
        >
          <Text style={styles.logoText}>Store</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setShowCategories(true);
            setSelectedCategory(null);
            setSelectedBrand(null);
            setBrands([]);
          }}
          style={styles.categoryButton}
        >
          <Text style={styles.categoryButtonText}>☰ Danh mục</Text>
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Bạn muốn mua gì hôm nay?"
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => buildAndNavigate({ searchText, page: 1 })}
            returnKeyType="search"
          />
          <TouchableOpacity
            onPress={() => buildAndNavigate({ page: 1 })}
            style={styles.searchButton}
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('Cart')}
          style={styles.iconButton}
        >
          <Text style={styles.iconButtonText}>🛒</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCategories}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCategories(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowCategories(false)}
          />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedCategory ? selectedCategory.name : 'Danh mục sản phẩm'}
              </Text>
              <TouchableOpacity onPress={() => setShowCategories(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {!selectedCategory ? (
                loadingCategories ? (
                  <Text style={styles.loadingText}>Đang tải...</Text>
                ) : categories.length === 0 ? (
                  <Text style={styles.emptyText}>Chưa có danh mục</Text>
                ) : (
                  categories.map((category) => (
                    <TouchableOpacity
                      key={category.category_id || category.id}
                      onPress={() => handleSelectCategoryOnly(category)}
                      style={styles.categoryItem}
                    >
                      <View style={styles.categoryIconContainer}>
                        <CategoryIcon keyName={category.slug || category.name} />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <Text style={styles.arrowIcon}>›</Text>
                    </TouchableOpacity>
                  ))
                )
              ) : (
                <>
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedCategory(null);
                      setBrands([]);
                    }}
                    style={styles.backButton}
                  >
                    <Text style={styles.backButtonText}>‹ Quay lại</Text>
                  </TouchableOpacity>

                  {loadingBrands ? (
                    <Text style={styles.loadingText}>Đang tải thương hiệu...</Text>
                  ) : brands.length === 0 ? (
                    <Text style={styles.emptyText}>
                      Không tìm thấy thương hiệu cho danh mục này
                    </Text>
                  ) : (
                    <View style={styles.brandsGrid}>
                      {brands.map((brand) => {
                        const isActive = selectedBrand?.id === brand.id;
                        return (
                          <TouchableOpacity
                            key={brand.id}
                            onPress={() => handleSelectBrand(brand)}
                            style={[
                              styles.brandItem,
                              isActive && styles.brandItemActive,
                            ]}
                          >
                            <BrandImage brand={brand} size={60} />
                            <Text
                              style={styles.brandName}
                              numberOfLines={2}
                              ellipsizeMode="tail"
                            >
                              {brand.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <View style={styles.filterSection}>
                    <Text style={styles.filterTitle}>Lọc theo giá</Text>
                    <View style={styles.priceInputRow}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Từ (₫)"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={minPrice}
                        onChangeText={(text) =>
                          setMinPrice(text.replace(/[^\d]/g, ''))
                        }
                      />
                      <Text style={styles.priceSeparator}>-</Text>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="Đến (₫)"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="numeric"
                        value={maxPrice}
                        onChangeText={(text) =>
                          setMaxPrice(text.replace(/[^\d]/g, ''))
                        }
                      />
                    </View>

                    <Text style={styles.filterTitle}>Sắp xếp</Text>
                    <View style={styles.sortButtons}>
                      {[
                        { value: '', label: 'Mặc định' },
                        { value: 'price_asc', label: 'Giá: Thấp → Cao' },
                        { value: 'price_desc', label: 'Giá: Cao → Thấp' },
                        { value: 'newest', label: 'Mới nhất' },
                      ].map((option) => (
                        <TouchableOpacity
                          key={option.value}
                          onPress={() => setSort(option.value)}
                          style={[
                            styles.sortButton,
                            sort === option.value && styles.sortButtonActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.sortButtonText,
                              sort === option.value && styles.sortButtonTextActive,
                            ]}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        onPress={resetFilters}
                        style={styles.resetButton}
                      >
                        <Text style={styles.resetButtonText}>Đặt lại</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          buildAndNavigate({ page: 1 });
                          setShowCategories(false);
                        }}
                        style={styles.applyButton}
                      >
                        <Text style={styles.applyButtonText}>Áp dụng</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.filterSummary}>
                      <Text style={styles.filterSummaryText}>
                        Hiển thị: {selectedCategory?.name || 'Tất cả'}
                        {selectedBrand ? ` • ${selectedBrand.name}` : ''}
                        {minPrice || maxPrice
                          ? ` • Giá ${formatPrice(minPrice) || '0'} - ${
                              formatPrice(maxPrice) || '∞'
                            }`
                          : ''}
                      </Text>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function formatPrice(num) {
  if (!num) return '';
  const n = String(num).replace(/[^\d]/g, '');
  if (n === '') return '';
  return n.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#F97316',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  marqueeBanner: {
    backgroundColor: '#F97316',
    paddingVertical: 8,
    overflow: 'hidden',
  },
  marqueeTrack: {
    flexDirection: 'row',
    width: SCREEN_WIDTH * 4,
  },
  marqueeText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginHorizontal: 24,
  },
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  logoButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  categoryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  categoryButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
  },
  searchButton: {
    padding: 4,
  },
  searchIcon: {
    fontSize: 18,
  },
  iconButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconButtonText: {
    fontSize: 20,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },
  modalScroll: {
    padding: 16,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    paddingVertical: 20,
  },
  emptyText: {
    textAlign: 'center',
    color: '#9CA3AF',
    paddingVertical: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  categoryIconContainer: {
    width: 32,
    height: 32,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  categoryName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  arrowIcon: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  backButton: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 14,
    color: '#F97316',
    fontWeight: '500',
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  brandItem: {
    width: (SCREEN_WIDTH - 56) / 3,
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  brandItemActive: {
    borderColor: '#F97316',
    borderWidth: 2,
    backgroundColor: '#FFF7ED',
  },
  brandImage: {
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  brandImagePlaceholder: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandImagePlaceholderText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  brandName: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
    color: '#374151',
  },
  filterSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  filterTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 10,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#1F2937',
  },
  priceSeparator: {
    color: '#6B7280',
    fontSize: 14,
  },
  sortButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  sortButtonActive: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#374151',
  },
  sortButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F97316',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterSummary: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  filterSummaryText: {
    fontSize: 12,
    color: '#6B7280',
  },
});