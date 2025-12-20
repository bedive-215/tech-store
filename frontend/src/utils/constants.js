export const ROUTERS = {
  USER: {
    HOME: "/user/home",
    DASHBOARD: "/user/dashboard",
    PAYMENTS: "/user/payments",
    CART: "/user/cart",

    CATEGORY: "/user/category",
    PROFILE: "/user/profile",
    PRODUCT: "/user/product/:id",

    CUSTOMER_INFO: "/user/customer-info",

    ORDERS: "/user/orders",
  },

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    SUBSCRIPTION_PLANS: "/admin/subscriptions",
    USER_MANAGEMENT: "/admin/users",
    DISCOUNTS: "/admin/discounts",
    ORDERS: "/admin/orders",
    FLASH_SALES: "/admin/flash-sales",
    PRODUCTS: "/admin/products",
  },

  PUBLIC: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    NOT_FOUND: "/404",

    // ⭐ Thêm mới 2 trang thành công / thất bại thanh toán
    PAYMENT_SUCCESS: "/payment-success",
    PAYMENT_FAILED: "/payment-failed",
  },

  PRIVATE: {
    FORBIDDEN: "/403",
  },
};
