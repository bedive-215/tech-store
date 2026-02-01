// src/AppRouter.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import UserLayout from "@/layouts/UserLayout";
import HomeLayout from "@/layouts/HomeLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";

// Admin pages
import DashboardAdmin from "@/pages/admin/Dashboard";
import SubscriptionPlansAdmin from "@/pages/admin/SubscriptionPlans";
import UserManagementAdmin from "@/pages/admin/UserManagement";
import AdminDiscounts from "@/pages/admin/Discounts";
import OrdersAdmin from "@/pages/admin/Orders";

// ⭐ Thêm trang quản lý sản phẩm admin
import ProductManagementAdmin from "@/pages/admin/ProductManagement";

// ⭐⭐ NEW — Flash Sale admin pages
import FlashSaleAdminPage from "@/pages/admin/FlashSalePage";
// ⭐⭐⭐ NEW — Warranty admin page
import WarrantyManagement from "@/pages/admin/WarrantyManagement";


// User pages
import Home from "@/pages/user/Home";
import Cart from "@/pages/user/Cart";
import DashboardSuser from "@/pages/user/Dashboard";
import Payments from "@/pages/user/PaymentPage";

// ➕ 3 trang mới
import Category from "@/pages/user/Category";
import Profile from "@/pages/user/Profile";
import Product from "@/pages/user/Product";

// ➕ Trang nhập thông tin khách hàng
import CustomerInfo from "@/pages/user/CustomerInfo";

// ===== NEW: user orders pages =====
import Orders from "@/pages/user/Orders"; // /user/orders

// Payment result pages (public)
import PaymentSuccess from "@/pages/user/PaymentSuccess";
import PaymentFailed from "@/pages/user/PaymentFailed";
// ⭐ NEW — user warranty page
import WarrantyPage from "@/pages/user/WarrantyPage";

// Errors
import NotFound from "@/pages/error/NotFound";
import Forbidden from "@/pages/error/Forbidden";

// Constants
import { ROUTERS } from "@/utils/constants";

const routeConfig = [
  // PUBLIC (auth)
  { path: ROUTERS.PUBLIC.LOGIN, element: Login, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.REGISTER, element: Register, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.FORGOT_PASSWORD, element: ForgotPassword, layout: AuthLayout },

  // PUBLIC (payment result) - no layout so they render standalone
  { path: ROUTERS.PUBLIC.PAYMENT_SUCCESS, element: PaymentSuccess }, // /payment-success
  { path: ROUTERS.PUBLIC.PAYMENT_FAILED, element: PaymentFailed },   // /payment-failed

  // USER
  { path: ROUTERS.USER.HOME, element: Home, layout: HomeLayout },
  { path: ROUTERS.USER.CART, element: Cart, layout: UserLayout },
  { path: ROUTERS.USER.DASHBOARD, element: DashboardSuser, layout: UserLayout },
  { path: ROUTERS.USER.PAYMENTS, element: Payments, layout: UserLayout },
  {
    path: ROUTERS.USER.WARRANTIES,
    element: WarrantyPage,
    layout: UserLayout,
  },
  // ➕ 3 trang mới (user)
  { path: ROUTERS.USER.CATEGORY, element: Category, layout: UserLayout },
  { path: ROUTERS.USER.PROFILE, element: Profile, layout: UserLayout },
  { path: ROUTERS.USER.PRODUCT, element: Product, layout: UserLayout },
  { path: ROUTERS.USER.CUSTOMER_INFO, element: CustomerInfo, layout: UserLayout },

  // ===== user orders routes =====
  { path: ROUTERS.USER.ORDERS, element: Orders, layout: UserLayout },

  // ADMIN pages
  { path: ROUTERS.ADMIN.DASHBOARD, element: DashboardAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.SUBSCRIPTION_PLANS, element: SubscriptionPlansAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.USER_MANAGEMENT, element: UserManagementAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.DISCOUNTS, element: AdminDiscounts, layout: AdminLayout },
  { path: ROUTERS.ADMIN.ORDERS, element: OrdersAdmin, layout: AdminLayout },

  // ⭐ Trang quản lý sản phẩm admin
  { path: ROUTERS.ADMIN.PRODUCTS, element: ProductManagementAdmin, layout: AdminLayout },

  // ⭐⭐ Trang quản lý Flash Sale admin
  { path: ROUTERS.ADMIN.FLASH_SALES, element: FlashSaleAdminPage, layout: AdminLayout },
  // 🛡️ Trang quản lý bảo hành admin
  {
    path: ROUTERS.ADMIN.WARRANTIES,
    element: WarrantyManagement,
    layout: AdminLayout,
  },



  // ERRORS
  { path: ROUTERS.PRIVATE.FORBIDDEN, element: Forbidden },
  { path: ROUTERS.PUBLIC.NOT_FOUND, element: NotFound },
];

const AppRouter = () => {
  return (
    <Routes>
      {routeConfig.map((route) => {
        const Page = route.element;

        // If a layout is provided, wrap the Page with it.
        const Wrapped = route.layout
          ? () => (
            <route.layout>
              <Page />
            </route.layout>
          )
          : Page;

        return <Route key={route.path} path={route.path} element={<Wrapped />} />;
      })}

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={ROUTERS.USER.HOME} replace />} />

      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
