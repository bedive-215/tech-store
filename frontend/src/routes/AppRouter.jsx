import { Routes, Route, Navigate } from "react-router-dom";

// Layouts
import AdminLayout from "@/layouts/AdminLayout";
import UserLayout from "@/layouts/UserLayout";
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
import Orders from "@/pages/admin/Orders";

// ⭐ Thêm trang quản lý sản phẩm admin
import ProductManagementAdmin from "@/pages/admin/ProductManagement";

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

// Errors
import NotFound from "@/pages/error/NotFound";
import Forbidden from "@/pages/error/Forbidden";

// Constants
import { ROUTERS } from "@/utils/constants";

const routeConfig = [
  // PUBLIC
  { path: ROUTERS.PUBLIC.LOGIN, element: Login, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.REGISTER, element: Register, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.FORGOT_PASSWORD, element: ForgotPassword, layout: AuthLayout },

  // USER
  { path: ROUTERS.USER.HOME, element: Home, layout: UserLayout },
  { path: ROUTERS.USER.CART, element: Cart, layout: UserLayout },
  { path: ROUTERS.USER.DASHBOARD, element: DashboardSuser, layout: UserLayout },
  { path: ROUTERS.USER.PAYMENTS, element: Payments, layout: UserLayout },

  // ➕ 3 trang mới
  { path: ROUTERS.USER.CATEGORY, element: Category, layout: UserLayout },
  { path: ROUTERS.USER.PROFILE, element: Profile, layout: UserLayout },
  { path: ROUTERS.USER.PRODUCT, element: Product, layout: UserLayout },
  { path: ROUTERS.USER.CUSTOMER_INFO, element: CustomerInfo, layout: UserLayout },

  // ADMIN
  { path: ROUTERS.ADMIN.DASHBOARD, element: DashboardAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.SUBSCRIPTION_PLANS, element: SubscriptionPlansAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.USER_MANAGEMENT, element: UserManagementAdmin, layout: AdminLayout },
  { path: ROUTERS.ADMIN.DISCOUNTS, element: AdminDiscounts, layout: AdminLayout },
  { path: ROUTERS.ADMIN.ORDERS, element: Orders, layout: AdminLayout },

  // ⭐ Trang quản lý sản phẩm admin
  { path: ROUTERS.ADMIN.PRODUCTS, element: ProductManagementAdmin, layout: AdminLayout },

  // ERRORS
  { path: ROUTERS.PRIVATE.FORBIDDEN, element: Forbidden },
  { path: ROUTERS.PUBLIC.NOT_FOUND, element: NotFound },
];

const AppRouter = () => {
  return (
    <Routes>
      {routeConfig.map((route) => {
        const Page = route.element;

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
      <Route path="/" element={<Navigate to={ROUTERS.PUBLIC.LOGIN} replace />} />

      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
