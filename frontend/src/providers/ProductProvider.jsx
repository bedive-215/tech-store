// src/context/ProductContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import { productService } from "@/services/productService";
import { toast } from "react-toastify";

// Tạo context
export const ProductContext = createContext();

// Hook dùng trong component
export const useProduct = () => {
  const ctx = useContext(ProductContext);
  if (!ctx) {
    throw new Error("useProduct must be used within ProductProvider");
  }
  return ctx;
};

const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [productDetail, setProductDetail] = useState(null);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // =====================================================
  // GET LIST PRODUCTS
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
      const msg =
        err.response?.data?.message || "Không thể tải danh sách sản phẩm";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // GET PRODUCT BY ID
  // =====================================================
  const fetchProductById = useCallback(async (id) => {
    setLoading(true);
    setError(null);

    try {
      const res = await productService.getProductById(id);

      const item =
        res.data?.product ?? res.data?.data ?? res.data ?? null;

      setProductDetail(item);
      return item;
    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy sản phẩm";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // CREATE PRODUCT
  // =====================================================
  const createProduct = async (payload, token) => {
    setLoading(true);
    setError(null);

    try {
      const res = await productService.createProduct(payload, token);
      toast.success("Tạo sản phẩm thành công!");

      await fetchProducts();

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo sản phẩm thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UPDATE PRODUCT
  // =====================================================
  const updateProduct = async (id, payload, token) => {
    setLoading(true);
    setError(null);

    try {
      const res = await productService.updateProduct(id, payload, token);
      toast.success("Cập nhật sản phẩm thành công!");

      await fetchProducts();

      return res.data;
    } catch (err) {
      const msg = err.response?.data?.message || "Cập nhật thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE PRODUCT
  // =====================================================
  const deleteProduct = async (id, token) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm?")) return false;

    setLoading(true);
    setError(null);

    try {
      await productService.deleteProduct(id, token);
      toast.success("Xóa sản phẩm thành công!");

      await fetchProducts();

      return true;
    } catch (err) {
      const msg = err.response?.data?.message || "Xóa sản phẩm thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // UPLOAD PRODUCT MEDIA (POST /:id/media)
  // =====================================================
  const uploadProductMedia = async (product_id, files, token) => {
    setLoading(true);
    setError(null);

    try {
      const res = await productService.uploadProductMedia(
        product_id,
        files,
        token
      );

      toast.success("Tải ảnh sản phẩm thành công!");

      await fetchProductById(product_id);
      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Upload hình ảnh thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // SET PRIMARY IMAGE (POST /:id/media/primary)
  // =====================================================
  const setPrimaryImage = async (product_id, file, token) => {
    setLoading(true);
    setError(null);

    try {
      const res = await productService.setPrimaryImage(
        product_id,
        file,
        token
      );

      toast.success("Đặt ảnh đại diện thành công!");

      await fetchProductById(product_id);
      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Đặt ảnh đại diện thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // DELETE MEDIA (DELETE /:id/media)
  // =====================================================
  const deleteMedia = async (product_id, mediaIds, token) => {
    setLoading(true);
    setError(null);

    try {
      const res = await productService.deleteMedia(
        product_id,
        mediaIds,
        token
      );

      toast.success("Xóa ảnh thành công!");

      await fetchProductById(product_id);
      return res.data;
    } catch (err) {
      const msg =
        err.response?.data?.message || "Xóa hình ảnh thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
};

export default ProductProvider;
