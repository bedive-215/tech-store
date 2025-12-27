// src/providers/BrandProvider.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { Alert } from "react-native";
import brandService from "../services/brandService";

// ============================
// Context
// ============================
const BrandContext = createContext(null);

// ============================
// Provider
// ============================
export const BrandProvider = ({ children }) => {
  const [brands, setBrands] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ============================
  // Fetch brands
  // ============================
  const fetchBrands = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);

      const res = await brandService.getBrands(params);
      const data = res?.data ?? res;

      /**
       * Hỗ trợ nhiều format API:
       * - []
       * - { rows, total }
       * - { brands, total }
       */
      if (Array.isArray(data)) {
        setBrands(data);
        setTotal(data.length);
      } else if (Array.isArray(data?.rows)) {
        setBrands(data.rows);
        setTotal(data.total ?? data.rows.length);
      } else if (Array.isArray(data?.brands)) {
        setBrands(data.brands);
        setTotal(data.total ?? data.brands.length);
      } else {
        setBrands([]);
        setTotal(0);
      }
    } catch (err) {
      console.error("fetchBrands error:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ============================
  // Auto fetch when app starts
  // ============================
  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  // ============================
  // Create brand
  // ============================
  const createBrand = async (payload) => {
    try {
      setLoading(true);

      const res = await brandService.createBrand(payload);
      const data = res?.data ?? res;

      const createdBrand = data?.brand ?? data;

      setBrands((prev) => [createdBrand, ...prev]);
      setTotal((prev) => prev + 1);

      Alert.alert("Thành công", "Tạo brand thành công");
      return createdBrand;
    } catch (err) {
      console.error("createBrand error:", err);
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Tạo brand thất bại"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Delete brand
  // ============================
  const deleteBrand = async (id) => {
    try {
      setLoading(true);

      await brandService.deleteBrand(id);

      setBrands((prev) => prev.filter((b) => b.id !== id));
      setTotal((prev) => Math.max(prev - 1, 0));

      Alert.alert("Thành công", "Xóa brand thành công");
    } catch (err) {
      console.error("deleteBrand error:", err);
      Alert.alert(
        "Lỗi",
        err?.response?.data?.message || "Xóa brand thất bại"
      );
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ============================
  // Provider value
  // ============================
  const value = {
    brands,
    total,
    loading,
    error,

    fetchBrands,
    createBrand,
    deleteBrand,
    setBrands, // optional – giống AuthProvider cho linh hoạt
  };

  return (
    <BrandContext.Provider value={value}>
      {children}
    </BrandContext.Provider>
  );
};

// ============================
// Hook
// ============================
export const useBrand = () => {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error("useBrand must be used within BrandProvider");
  }
  return ctx;
};
