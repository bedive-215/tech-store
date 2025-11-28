export const ROUTERS = {
  USER: {
    HOME: "/user",
    DASHBOARD: "/user/dashboard",
    PAYMENTS: "/user/payments",
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
