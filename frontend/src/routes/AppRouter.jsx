import { Routes, Route, Navigate } from "react-router-dom";

// Routes
import PrivateRoute from "@/routes/PrivateRoute";
import PublicRoute from "@/routes/PublicRoute";

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

// Staff pages
import DashboardSuser from "@/pages/user/Dashboard";
import Payments from "@/pages/user/PaymentPage";

// Errors
import NotFound from "@/pages/error/NotFound";
import Forbidden from "@/pages/error/Forbidden";

// Constants
import { ROUTERS } from "@/utils/constants";

const routeConfig = [
  // ===== PUBLIC ROUTES =====
  { path: ROUTERS.PUBLIC.LOGIN, element: Login, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.REGISTER, element: Register, layout: AuthLayout },
  { path: ROUTERS.PUBLIC.FORGOT_PASSWORD, element: ForgotPassword, layout: AuthLayout },

  // ===== STAFF ROUTES =====
  { path: ROUTERS.USER.DASHBOARD, element: DashboardSuser, layout: UserLayout, roles: ["user"] },
  { path: ROUTERS.USER.PAYMENTS, element: Payments, layout: UserLayout, roles: ["user"] },

  // ===== ADMIN ROUTES =====
  { path: ROUTERS.ADMIN.DASHBOARD, element: DashboardAdmin, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.SUBSCRIPTION_PLANS, element: SubscriptionPlansAdmin, layout: AdminLayout, roles: ["admin"] },
  { path: ROUTERS.ADMIN.USER_MANAGEMENT, element: UserManagementAdmin, layout: AdminLayout, roles: ["admin"] },

  // ===== ERROR ROUTES =====
  { path: ROUTERS.PRIVATE.FORBIDDEN, element: Forbidden },
  { path: ROUTERS.PUBLIC.NOT_FOUND, element: NotFound },
];

const AppRouter = () => {
  return (
    <Routes>
      {routeConfig.map((route) => {
        // Wrap with layout if exists
        const Content = route.layout
          ? () => (
              <route.layout>
                <route.element />
              </route.layout>
            )
          : route.element;

        let element = <Content />;

        // Private route → requires login
        if (route.roles) {
          element = (
            <PrivateRoute roles={route.roles}>
              {element}
            </PrivateRoute>
          );
        } else {
          // Public route → block access when user already logged in
          element = (
            <PublicRoute>
              {element}
            </PublicRoute>
          );
        }

        return <Route key={route.path} path={route.path} element={element} />;
      })}

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={ROUTERS.PUBLIC.LOGIN} replace />} />

      {/* 404 fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRouter;
