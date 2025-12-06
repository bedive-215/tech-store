// src/services/orderService.js
import apiClient from "@/api/apiClient";

/**
 * Order service
 * Routes available (server):
 * POST   /api/v1/orders         -> create order
 * GET    /api/v1/orders         -> list user's orders (or all orders if admin)
 * GET    /api/v1/orders/:id     -> order detail
 * PUT    /api/v1/orders/:id/cancel -> cancel order
 */

const BASE = "/api/v1/orders";

/** helper: kiểm tra payload có File/FileList/Blob hay không */
const payloadHasFile = (payload) => {
  if (!payload || typeof payload !== "object") return false;
  return Object.values(payload).some((v) => {
    // Node environment may not have File, so check duck-typing
    if (!v) return false;
    const isFile =
      (typeof File !== "undefined" && v instanceof File) ||
      (typeof Blob !== "undefined" && v instanceof Blob) ||
      (typeof v === "object" && (v instanceof FileList || v.constructor.name === "FileList"));
    // also arrays of files
    const isArrayOfFiles = Array.isArray(v) && v.some((x) =>
      (typeof File !== "undefined" && x instanceof File) ||
      (typeof Blob !== "undefined" && x instanceof Blob)
    );
    return isFile || isArrayOfFiles;
  });
};

export const orderService = {
  /**
   * POST /api/v1/orders
   * payload: object chứa thông tin đơn hàng (items, shippingAddress, paymentMethod, v.v.)
   * Nếu payload có file(s) -> gửi multipart/form-data
   * token (optional): Bearer token nếu muốn override header (thường không cần nếu apiClient đã set sẵn)
   */
  createOrder: (payload, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    if (payloadHasFile(payload)) {
      const formData = new FormData();
      Object.keys(payload).forEach((key) => {
        const value = payload[key];
        if (value === undefined || value === null) return;
        // Nếu là mảng -> append từng phần tử (phục vụ items hoặc file list)
        if (Array.isArray(value)) {
          value.forEach((v) => {
            // nếu là object (non-file) -> stringify
            if (typeof v === "object" && !(v instanceof File) && !(v instanceof Blob)) {
              formData.append(`${key}[]`, JSON.stringify(v));
            } else {
              formData.append(`${key}[]`, v);
            }
          });
        } else if (typeof value === "object" && !(value instanceof File) && !(value instanceof Blob)) {
          // object (không phải file) -> stringify
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      return apiClient.post(BASE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...headers,
        },
      });
    }

    // Không có file -> gửi JSON bình thường
    return apiClient.post(BASE, payload, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  },

  /**
   * GET /api/v1/orders
   * params: object cho query (page, limit, status, fromDate, toDate,...)
   * token (optional)
   */
  listOrders: (params = {}, token) => {
    const config = { params };
    if (token) config.headers = { Authorization: `Bearer ${token}` };
    return apiClient.get(BASE, config);
  },

  /**
   * GET /api/v1/orders/:id
   * id: order id
   * token (optional)
   */
  getOrderDetail: (id, token) => {
    const config = {};
    if (token) config.headers = { Authorization: `Bearer ${token}` };
    return apiClient.get(`${BASE}/${id}`, config);
  },

  /**
   * PUT /api/v1/orders/:id/cancel
   * id: order id
   * body (optional): { reason: '...', ... }
   * token (optional)
   */
  cancelOrder: (id, body = {}, token) => {
    const config = {};
    if (token) config.headers = { Authorization: `Bearer ${token}` };
    // Một số backend có thể mong PUT với body JSON
    return apiClient.put(`${BASE}/${id}/cancel`, body, config);
  },
};

export default orderService;
