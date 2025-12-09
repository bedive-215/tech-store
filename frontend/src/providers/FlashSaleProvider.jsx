// src/context/FlashSaleContext.jsx
import React, { createContext, useState, useContext, useCallback } from "react";
import { flashSaleService } from "@/services/flashSaleService";
import { toast } from "react-toastify";

export const FlashSaleContext = createContext();

export const useFlashSale = () => {
  const ctx = useContext(FlashSaleContext);
  if (!ctx) throw new Error("useFlashSale must be used within FlashSaleProvider");
  return ctx;
};

const FlashSaleProvider = ({ children }) => {
  const [flashSales, setFlashSales] = useState([]); // danh sách active flash sales
  const [current, setCurrent] = useState(null); // chi tiết flash sale hiện xem
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // helper lấy token (cùng cách như UserProvider)
  const getToken = () =>
    localStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    null;

  // GET / - Lấy danh sách flash sales (active)
  const fetchActiveFlashSales = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await flashSaleService.getActiveFlashSales(params);
      const data = res.data?.data ?? res.data ?? [];
      setFlashSales(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Không lấy được Flash Sales";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // GET /:id - Lấy chi tiết 1 flash sale
  const fetchFlashSaleDetail = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await flashSaleService.getFlashSaleDetail(id);
      const data = res.data?.data ?? res.data ?? null;
      setCurrent(data);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || "Không tìm thấy Flash Sale";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // POST / - Tạo flash sale (admin)
  // payload: object chứa thông tin flash sale (name, start_at, end_at, ...)
  const createFlashSale = async (payload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      const res = await flashSaleService.createFlashSale(payload, token);
      const created = res.data?.data ?? res.data;
      toast.success("Tạo Flash Sale thành công");
      // cập nhật local list (nếu cần)
      if (created) setFlashSales(prev => [created, ...prev]);
      return created;
    } catch (err) {
      const msg = err.response?.data?.message || "Tạo Flash Sale thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // POST /:id/items - Thêm item vào flash sale (admin)
  // payload: { product_id, discount_price, quantity, ... }
  const addItemToFlashSale = async (flashSaleId, payload, options = {}) => {
    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      const res = await flashSaleService.addItem(flashSaleId, payload, token);
      const added = res.data?.data ?? res.data;
      toast.success("Thêm sản phẩm vào Flash Sale thành công");

      // Nếu đang xem chi tiết flash sale hiện tại và id khớp, cập nhật state current.items
      if (current && current.id === (flashSaleId || current._id || current.id)) {
        const items = current.items ?? [];
        setCurrent({ ...current, items: [added, ...items] });
      }
      return added;
    } catch (err) {
      const msg = err.response?.data?.message || "Thêm sản phẩm thất bại";
      setError(msg);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // DELETE /items/:item_id - Xóa item khỏi flash sale (admin)
  const removeItemFromFlashSale = async (itemId, options = {}) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa mặt hàng này khỏi Flash Sale?")) return false;

    setLoading(true);
    setError(null);
    try {
      const token = options.token ?? getToken();
      await flashSaleService.removeItem(itemId, token);
      toast.success("Xóa sản phẩm khỏi Flash Sale thành công");

      // cập nhật local state nếu item tồn tại trong current
      if (current && Array.isArray(current.items)) {
        setCurrent(prev => {
          if (!prev) return prev;
          return { ...prev, items: prev.items.filter(i => (i.id ?? i._id ?? i.item_id) !== itemId) };
        });
      }

      // cũng có thể cập nhật flashSales list nếu chứa items summary
      setFlashSales(prev =>
        prev.map(fs => {
          if (!fs.items) return fs;
          return { ...fs, items: fs.items.filter(i => (i.id ?? i._id ?? i.item_id) !== itemId) };
        })
      );

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

  const clearError = () => setError(null);

  const value = {
    flashSales,
    current,
    loading,
    error,
    clearError,

    // fetch
    fetchActiveFlashSales,
    fetchFlashSaleDetail,

    // admin actions
    createFlashSale,
    addItemToFlashSale,
    removeItemFromFlashSale,

    // state setters in case cần thao tác trực tiếp
    setFlashSales,
    setCurrent,
  };

  return <FlashSaleContext.Provider value={value}>{children}</FlashSaleContext.Provider>;
};

export default FlashSaleProvider;
