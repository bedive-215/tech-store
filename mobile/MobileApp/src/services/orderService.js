import apiClient from "../api/apiClient";

/** BASE URL */
const ORDER_BASE = "/api/v1/orders";
const COUPON_BASE = "/api/v1/coupons";

/**
 * Helper: detect React Native file object
 * RN file format: { uri, name, type }
 */
const isRNFile = (v) =>
  v &&
  typeof v === "object" &&
  typeof v.uri === "string" &&
  typeof v.name === "string";

/**
 * Convert payload → FormData (React Native safe)
 */
const buildFormData = (payload = {}) => {
  const formData = new FormData();

  Object.keys(payload).forEach((key) => {
    const value = payload[key];
    if (value === undefined || value === null) return;

    // Array
    if (Array.isArray(value)) {
      value.forEach((v, index) => {
        if (isRNFile(v)) {
          formData.append(key, {
            uri: v.uri,
            name: v.name,
            type: v.type || "application/octet-stream",
          });
        } else if (typeof v === "object") {
          formData.append(`${key}[${index}]`, JSON.stringify(v));
        } else {
          formData.append(`${key}[${index}]`, v);
        }
      });
      return;
    }

    // Single file
    if (isRNFile(value)) {
      formData.append(key, {
        uri: value.uri,
        name: value.name,
        type: value.type || "application/octet-stream",
      });
      return;
    }

    // Object
    if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
      return;
    }

    // Primitive
    formData.append(key, value);
  });

  return formData;
};

/**
 * Helper: build Authorization header
 */
const withAuth = (token) =>
  token
    ? {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    : {};

const orderService = {
  /* ==============================
   *            ORDER
   * ============================== */

  /**
   * POST /api/v1/orders
   * CREATE ORDER
   */
  createOrder: (payload = {}, token) =>
  apiClient.post(ORDER_BASE, payload, {
    ...withAuth(token),
    headers: {
      "Content-Type": "application/json",
    },
  }),


  /**
   * GET /api/v1/orders
   * USER ORDERS
   */
  listOrders: (params = {}, token) =>
    apiClient.get(ORDER_BASE, {
      params,
      ...withAuth(token),
    }),

  /**
   * GET /api/v1/orders/admin/all
   * ADMIN: ALL ORDERS
   */
  listAllOrders: (params = {}, token) =>
    apiClient.get(`${ORDER_BASE}/admin/all`, {
      params,
      ...withAuth(token),
    }),

  /**
   * GET /api/v1/orders/:id
   */
  getOrderDetail: (id, token) =>
    apiClient.get(`${ORDER_BASE}/${id}`, withAuth(token)),

  /**
   * PUT /api/v1/orders/:id/cancel
   */
  cancelOrder: (id, body = {}, token) => {
    if (!id) throw new Error("order id is required");

    return apiClient.put(
      `${ORDER_BASE}/${id}/cancel`,
      body,
      withAuth(token)
    );
  },

  /**
   * PUT /api/v1/orders/:id/confirmed
   * ADMIN CONFIRM ORDER
   */
  setOrderConfirmed: (id, body = {}, token) => {
    if (!id) throw new Error("order id is required");

    return apiClient.put(
      `${ORDER_BASE}/${id}/confirmed`,
      body,
      withAuth(token)
    );
  },

  /**
   * PUT /api/v1/orders/:id/ship
   */
  setOrderShipping: (id, body = {}, token) => {
    if (!id) throw new Error("order id is required");

    return apiClient.put(
      `${ORDER_BASE}/${id}/ship`,
      body,
      withAuth(token)
    );
  },

  /**
   * PUT /api/v1/orders/:id/complete
   */
  setOrderCompleted: (id, body = {}, token) => {
    if (!id) throw new Error("order id is required");

    return apiClient.put(
      `${ORDER_BASE}/${id}/complete`,
      body,
      withAuth(token)
    );
  },

  /* ==============================
   *            COUPON
   * ============================== */

  coupon: {
    /**
     * POST /api/v1/coupons/validate
     */
    validate: (body = {}, token) =>
      apiClient.post(
        `${COUPON_BASE}/validate`,
        body,
        withAuth(token)
      ),

    /**
     * POST /api/v1/coupons
     */
    create: (body = {}, token) =>
      apiClient.post(COUPON_BASE, body, withAuth(token)),

    /**
     * GET /api/v1/coupons
     */
    list: (params = {}, token) =>
      apiClient.get(COUPON_BASE, {
        params,
        ...withAuth(token),
      }),

    /**
     * DELETE /api/v1/coupons/:id
     */
    remove: (id, token) =>
      apiClient.delete(
        `${COUPON_BASE}/${id}`,
        withAuth(token)
      ),
  },
};

export default orderService;
