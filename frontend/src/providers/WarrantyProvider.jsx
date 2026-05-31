import React, {
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import warrantyService from "@/services/warrantyService";
import { toast } from "react-toastify";

const WarrantyContext = createContext();

export function WarrantyProvider({ children }) {
  const [warranties, setWarranties] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState(null);

  // ===============================
  // USER: lấy bảo hành của tôi
  // ===============================
  const fetchMyWarranties = useCallback(async (token) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await warrantyService.getMyWarranties(token);

      const list =
        data?.rows ??
        data?.warranties ??
        (Array.isArray(data) ? data : []);

      setWarranties(list);
      setTotal(data?.total ?? list.length);
      return list;
    } catch (err) {
      console.error("fetchMyWarranties error", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===============================
  // ADMIN: lấy tất cả bảo hành
  // ===============================
  const fetchAllWarranties = useCallback(async (params = {}, token) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await warrantyService.getAllWarranties(params, token);

      const list =
        data?.rows ??
        data?.warranties ??
        (Array.isArray(data) ? data : []);

      setWarranties(list);
      setTotal(data?.total ?? list.length);
      return list;
    } catch (err) {
      console.error("fetchAllWarranties error", err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ===============================
  // USER: tạo yêu cầu bảo hành
  // ===============================
  const createWarranty = async (payload, token) => {
    setLoading(true);
    try {
      const res = await warrantyService.createWarranty(payload, token);
      const created = res.data?.warranty ?? res.data;

      setWarranties((prev) => [created, ...prev]);
      setTotal((prev) => prev + 1);

      toast.success("Gửi yêu cầu bảo hành thành công");
      return created;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Gửi yêu cầu thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ADMIN: cập nhật trạng thái
  // ===============================
  const updateWarrantyStatus = async (id, payload, token) => {
    setLoading(true);
    try {
      const res = await warrantyService.updateWarrantyStatus(id, payload, token);
      const updated = res.data?.warranty ?? res.data;

      setWarranties((prev) =>
        prev.map((w) => (w.id === id ? updated : w))
      );

      toast.success("Cập nhật trạng thái thành công");
      return updated;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Cập nhật thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // ADMIN: xác thực bảo hành
  // ===============================
  const validateWarranty = async (id, payload, token) => {
    setLoading(true);
    try {
      const res = await warrantyService.validateWarranty(id, payload, token);
      const updated = res.data?.warranty ?? res.data;

      setWarranties((prev) =>
        prev.map((w) => (w.id === id ? updated : w))
      );

      toast.success("Xác thực bảo hành thành công");
      return updated;
    } catch (err) {
      toast.error(err?.response?.data?.message || "Xác thực thất bại");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WarrantyContext.Provider
      value={{
        warranties,
        loading,
        error,
        total,

        fetchMyWarranties,
        fetchAllWarranties,
        createWarranty,
        updateWarrantyStatus,
        validateWarranty,
      }}
    >
      {children}
    </WarrantyContext.Provider>
  );
}

export function useWarranty() {
  const ctx = useContext(WarrantyContext);
  if (!ctx) {
    throw new Error("useWarranty must be used within WarrantyProvider");
  }
  return ctx;
}
