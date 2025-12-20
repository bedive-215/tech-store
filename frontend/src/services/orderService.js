import apiClient from "@/api/apiClient";

/** BASE URL */
const ORDER_BASE = "/api/v1/orders";
const COUPON_BASE = "/api/v1/coupons";

/** helper: kiểm tra payload có File/FileList/Blob hay không */
const payloadHasFile = (payload) => {
  if (!payload || typeof payload !== "object") return false;

  return Object.values(payload).some((v) => {
    if (!v) return false;

    const isFile =
      (typeof File !== "undefined" && v instanceof File) ||
      (typeof Blob !== "undefined" && v instanceof Blob) ||
      (typeof v === "object" &&
        (v instanceof FileList || v.constructor?.name === "FileList"));

    const isArrayOfFiles =
      Array.isArray(v) &&
      v.some(
        (x) =>
          (typeof File !== "undefined" && x instanceof File) ||
          (typeof Blob !== "undefined" && x instanceof Blob)
      );

    return isFile || isArrayOfFiles;
  });
};

export const orderService = {
  /* ===================================
   *            ORDER SERVICE
   * =================================== */

  // --- CREATE ORDER ---
  createOrder: (payload, token) => {
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    if (payloadHasFile(payload)) {
      const formData = new FormData();

      Object.keys(payload).forEach((key) => {
        const value = payload[key];
        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          value.forEach((v) => {
            if (
              typeof v === "object" &&
              !(v instanceof File) &&
              !(v instanceof Blob)
            ) {
              formData.append(`${key}[]`, JSON.stringify(v));
            } else {
              formData.append(`${key}[]`, v);
            }
          });
        } else if (
          typeof value === "object" &&
          !(value instanceof File) &&
          !(value instanceof Blob)
        ) {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, value);
        }
      });

      return apiClient.post(ORDER_BASE, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...headers,
        },
      });
    }

    return apiClient.post(ORDER_BASE, payload, {
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });
  },

  // --- USER ORDERS ---
  listOrders: (params = {}, token) => {
    const config = { params };
    if (token) config.headers = { Authorization: `Bearer ${token}` };
    return apiClient.get(ORDER_BASE, config);
  },

  // --- ADMIN: ALL ORDERS ---
  listAllOrders: (params = {}, token) => {
    const config = { params };
    if (token) config.headers = { Authorization: `Bearer ${token}` };
    return apiClient.get(`${ORDER_BASE}/admin/all`, config);
  },

  // --- ORDER DETAIL ---
  getOrderDetail: (id, token) => {
    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};
    return apiClient.get(`${ORDER_BASE}/${id}`, config);
  },

  // --- CANCEL ORDER ---
  cancelOrder: (id, body = {}, token) => {
    if (!id) throw new Error("order id is required");

    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    return apiClient.put(`${ORDER_BASE}/${id}/cancel`, body, config);
  },

  // --- NEW: CONFIRM ORDER ---
  // map với router.put('/:id/confirmed')
  // admin xác nhận đơn hàng
  setOrderConfirmed: (id, body = {}, token) => {
    if (!id) throw new Error("order id is required");

    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    return apiClient.put(`${ORDER_BASE}/${id}/confirmed`, body, config);
  },

  // --- SET STATUS => SHIPPING ---
  setOrderShipping: (id, body = {}, token) => {
    if (!id) throw new Error("order id is required");

    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    return apiClient.put(`${ORDER_BASE}/${id}/ship`, body, config);
  },

  // --- SET STATUS => COMPLETED ---
  setOrderCompleted: (id, body = {}, token) => {
    if (!id) throw new Error("order id is required");

    const config = token
      ? { headers: { Authorization: `Bearer ${token}` } }
      : {};

    return apiClient.put(`${ORDER_BASE}/${id}/complete`, body, config);
  },

  /* ===================================
   *            COUPON SERVICE
   * =================================== */
  coupon: {
    validate: (body, token) => {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      return apiClient.post(`${COUPON_BASE}/validate`, body, config);
    },

    create: (body, token) => {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      return apiClient.post(COUPON_BASE, body, config);
    },

    list: (params = {}, token) => {
      const config = { params };
      if (token) config.headers = { Authorization: `Bearer ${token}` };
      return apiClient.get(COUPON_BASE, config);
    },

    remove: (id, token) => {
      const config = token
        ? { headers: { Authorization: `Bearer ${token}` } }
        : {};
      return apiClient.delete(`${COUPON_BASE}/${id}`, config);
    },
  },
};

export default orderService;
