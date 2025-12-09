// src/providers/CategoryProvider.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import categoryService from "@/services/categoryService";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  const { token } = useAuth() || {};

  const fetchCategories = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await categoryService.getCategories(params);
      const data = res.data;
      if (Array.isArray(data)) {
        setCategories(data);
        setTotal(data.length);
      } else if (data.rows) {
        setCategories(data.rows);
        setTotal(data.total ?? data.rows.length);
      } else {
        // fallback shapes
        setCategories(data?.categories ?? []);
        setTotal(data?.total ?? 0);
      }
    } catch (err) {
      console.error("fetchCategories error", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const createCategory = async (payload) => {
    try {
      setLoading(true);
      const res = await categoryService.createCategory(payload, token);
      const created = res.data?.category ?? res.data;
      if (created) {
        setCategories((prev) => [created, ...prev]);
        setTotal((t) => t + 1);
      }
      toast.success("Tạo category thành công");
      return created;
    } catch (err) {
      console.error("createCategory error", err);
      toast.error(err?.response?.data?.message || "Tạo category thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (id) => {
    try {
      setLoading(true);
      await categoryService.deleteCategory(id, token);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setTotal((t) => Math.max(0, t - 1));
      toast.success("Xóa category thành công");
    } catch (err) {
      console.error("deleteCategory error", err);
      toast.error(err?.response?.data?.message || "Xóa category thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        error,
        total,
        fetchCategories,
        createCategory,
        deleteCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const ctx = useContext(CategoryContext);
  if (!ctx) {
    throw new Error("useCategory must be used within CategoryProvider");
  }
  return ctx;
}
