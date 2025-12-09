export const ROUTERS = {
  USER: {
    HOME: "/user/home",
    DASHBOARD: "/user/dashboard",
    PAYMENTS: "/user/payments",
    CART: "/user/cart",

    // ➕ Trang thêm mới
    CATEGORY: "/user/category",
    PROFILE: "/user/profile",
    PRODUCT: "/user/product/:id",

    // ⭐ Trang nhập thông tin mua hàng
    CUSTOMER_INFO: "/user/customer-info",

    // ➕ Trang quản lý đơn hàng (user)
    ORDERS: "/user/orders",
  },

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    SUBSCRIPTION_PLANS: "/admin/subscriptions",
    USER_MANAGEMENT: "/admin/users",
    DISCOUNTS: "/admin/discounts",
    ORDERS: "/admin/orders",
    FLASH_SALES: "/admin/flash-sales",

    // ⭐ Thêm mới: trang quản lý sản phẩm
    PRODUCTS: "/admin/products",
  },

  PUBLIC: {
    LOGIN: "/login",
    REGISTER: "/register",
    FORGOT_PASSWORD: "/forgot-password",
    NOT_FOUND: "/404",
  },

  PRIVATE: {
    FORBIDDEN: "/403",
  },
};
