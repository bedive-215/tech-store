// src/providers/BrandProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import brandService from "@/services/brandService";
import { useAuth } from "@/hooks/useAuth"; // assuming you have auth hook to get token
import { toast } from "react-toastify";

const BrandContext = createContext();

export function BrandProvider({ children }) {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const { token } = useAuth() || {}; // depends on your auth provider shape

  const fetchBrands = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await brandService.getBrands(params);
      // assume API returns { rows, total } or array — handle both
      if (Array.isArray(data)) {
        setBrands(data);
        setTotal(data.length);
      } else if (data.rows) {
        setBrands(data.rows);
        setTotal(data.total ?? data.rows.length);
      } else {
        setBrands(data?.brands ?? []);
        setTotal(data?.total ?? 0);
      }
    } catch (err) {
      setError(err);
      console.error("fetchBrands error", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  const createBrand = async (payload) => {
    try {
      setLoading(true);
      const res = await brandService.createBrand(payload, token);
      // assume res.data contains created brand
      const created = res.data?.brand ?? res.data;
      // update local list optimistically
      setBrands((prev) => [created, ...prev]);
      toast.success("Tạo brand thành công");
      return created;
    } catch (err) {
      console.error("createBrand error", err);
      toast.error(err?.response?.data?.message || "Tạo brand thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteBrand = async (id) => {
    try {
      setLoading(true);
      await brandService.deleteBrand(id, token);
      setBrands((prev) => prev.filter((b) => b.id !== id));
      toast.success("Xóa brand thành công");
    } catch (err) {
      console.error("deleteBrand error", err);
      toast.error(err?.response?.data?.message || "Xóa brand thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <BrandContext.Provider
      value={{
        brands,
        loading,
        error,
        total,
        fetchBrands,
        createBrand,
        deleteBrand,
      }}
    >
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error("useBrand must be used within BrandProvider");
  }
  return ctx;
}
