// src/providers/ProductProvider.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import { Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import productService from "../services/productService";

// ============================
// Context
// ============================
const ProductContext = createContext(null);

export const useProduct = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProduct must be used within ProductProvider");
  return ctx;
};

// ============================
// Provider
// ============================
export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [productDetail, setProductDetail] = useState(null);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Helper token
  // ============================
  const getToken = async () => {
    try {
      const token = await AsyncStorage.getItem("access_token");
      if (token) return token;
      const token2 = await AsyncStorage.getItem("token");
      return token2 ?? null;
    } catch {
      return null;
    }
  };

  const handleAlert = (title, message) => {
    Alert.alert(title, message);
  };

  const confirmAlert = (title, message) => {
    return new Promise((resolve) => {
      Alert.alert(title, message, [
        { text: "Huỷ", onPress: () => resolve(false), style: "cancel" },
        { text: "Đồng ý", onPress: () => resolve(true) },
      ]);
    });
  };

  // =====================================================
  // FETCH PRODUCTS
  // =====================================================
  const fetchProducts = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getProducts(params);
      const list = res.data?.products ?? [];
      setProducts(Array.isArray(list) ? list : []);
      setPagination({
        total: res.data?.total ?? 0,
        page: res.data?.page ?? 1,
        limit: res.data?.limit ?? 20,
      });
      return list;
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể tải danh sách sản phẩm";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await productService.getProductById(id);
      const item = res.data?.product ?? res.data?.data ?? res.data ?? null;
      setProductDetail(item);
      return item;
    } catch (err) {
      const msg = err?.response?.data?.message || "Không tìm thấy sản phẩm";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // CREATE PRODUCT
  // =====================================================
  const createProduct = async (payload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      const res = await productService.createProduct(payload, token);
      handleAlert("Thành công", "Tạo sản phẩm thành công!");
      await fetchProducts();
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Tạo sản phẩm thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UPDATE PRODUCT
  // =====================================================
  const updateProduct = async (id, payload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      const res = await productService.updateProduct(id, payload, token);
      handleAlert("Thành công", "Cập nhật sản phẩm thành công!");
      await fetchProducts();
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Cập nhật thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================
  const deleteProduct = async (id, options = {}) => {
    const ok = await confirmAlert("Xác nhận", "Bạn có chắc chắn muốn xóa sản phẩm?");
    if (!ok) return false;

    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      await productService.deleteProduct(id, token);
      handleAlert("Thành công", "Xóa sản phẩm thành công!");
      await fetchProducts();
      return true;
    } catch (err) {
      const msg = err?.response?.data?.message || "Xóa sản phẩm thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // MEDIA HANDLING
  // =====================================================
  const uploadProductMedia = async (product_id, files, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      const res = await productService.uploadProductMedia(product_id, files, token);
      handleAlert("Thành công", "Tải ảnh sản phẩm thành công!");
      await fetchProductById(product_id);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Upload hình ảnh thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setPrimaryImage = async (product_id, file, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      const res = await productService.setPrimaryImage(product_id, file, token);
      handleAlert("Thành công", "Đặt ảnh đại diện thành công!");
      await fetchProductById(product_id);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Đặt ảnh đại diện thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteMedia = async (product_id, mediaIds, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? (await getToken());
      const res = await productService.deleteMedia(product_id, mediaIds, token);
      handleAlert("Thành công", "Xóa ảnh thành công!");
      await fetchProductById(product_id);
      return res.data;
    } catch (err) {
      const msg = err?.response?.data?.message || "Xóa hình ảnh thất bại";
      setError(msg);
      handleAlert("Lỗi", msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // Reset lỗi
  // =====================================================
  const clearError = () => setError(null);

  const value = {
    products,
    productDetail,
    pagination,
    loading,
    error,

    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,

    uploadProductMedia,
    setPrimaryImage,
    deleteMedia,

    clearError,
    setProducts,
    setProductDetail,
  };

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export default ProductProvider;
