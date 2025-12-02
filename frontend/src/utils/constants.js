export const ROUTERS = {
  USER: {
    HOME: "/user/home",
    DASHBOARD: "/user/dashboard",
    PAYMENTS: "/user/payments",
    CART: "/user/cart",

    // ➕ Thêm 3 trang mới
    CATEGORY: "/user/category",   // danh mục → có id
    PROFILE: "/user/profile",         // trang cá nhân
    PRODUCT: "/user/product",     // chi tiết sản phẩm
  },

  ADMIN: {
    DASHBOARD: "/admin/dashboard",
    SUBSCRIPTION_PLANS: "/admin/subscriptions",
    USER_MANAGEMENT: "/admin/users",
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
