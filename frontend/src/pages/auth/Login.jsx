import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Mail, Lock, LogIn, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import LangSwitcher from "@/components/common/LangSwitcher";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import { ROUTERS } from "@/utils/constants";
import { useNavigate, Link } from "react-router-dom";

import shopImg from "@/assets/images/shop_cart.jpg"; // <== ảnh giỏ hàng của bạn

const schema = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
  password: yup.string().required("auth.required").min(6, "auth.minPassword"),
});

export default function LoginPage() {
  const { t } = useTranslation();
  const authCtx = useAuth();
  const loginFn = authCtx?.login ?? authCtx;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const user = await loginFn({ ...data });

      if (!user?.role) throw new Error("Missing user role");

      if (user.role === "admin") {
        navigate(ROUTERS.ADMIN.DASHBOARD);
      } else if (user.role === "user") {
        navigate(ROUTERS.USER.DASHBOARD);
      } else {
        navigate("/");
      }
    } catch (err) {
      const serverMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password";
      setErrorMessage(serverMessage);
    } finally {
      setLoading(false);
    }
  };

  // ================= GOOGLE LOGIN (GỢI Ý) =================
  const handleGoogleLogin = () => {
    window.location.href = "/api/auth/google"; 
    // đổi theo backend của bạn
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">

        {/* LEFT — SHOPPING VISUAL */}
        <div className="hidden md:flex flex-col justify-center items-center 
          bg-orange-500 text-white p-10 gap-8 shadow-inner">

          <div className="w-72 h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img 
              src={shopImg} 
              alt="Shop illustration"
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-wide">
            Bán Hàng Online
          </h1>

          <p className="text-orange-100 text-sm tracking-wide">
            Hệ thống quản lý bán hàng hiện đại – nhanh chóng – tiện lợi
          </p>

        </div>

        {/* RIGHT — LOGIN FORM */}
        <div className="p-10 md:p-14 flex flex-col justify-center">

          <div className="flex justify-end mb-6 gap-3">
            <LangSwitcher />
            <ThemeSwitcher />
          </div>

          <div className="mx-auto w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-10 shadow-lg">
            <div className="mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                Đăng nhập hệ thống bán hàng online
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Quản lý sản phẩm • đơn hàng • khách hàng • doanh thu
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              
              {/* EMAIL */}
              <div>
                <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
                  Email
                </label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                  <Mail className="text-orange-600" size={20} />
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="Nhập email đăng nhập..."
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-1">{t(errors.email.message)}</p>}
              </div>

              {/* PASSWORD */}
              <div>
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Mật khẩu
                </label>

                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                  <Lock className="text-orange-600" size={20} />
                  <input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Nhập mật khẩu..."
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(s => !s)} 
                    className="text-gray-500 dark:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{t(errors.password.message)}</p>}
              </div>

              {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-white font-semibold 
                  bg-gradient-to-r from-orange-500 to-orange-700 
                  hover:from-orange-600 hover:to-orange-800 shadow-md active:scale-95 transition"
              >
                <LogIn size={18} />
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>

            </form>

            <button
  onClick={handleGoogleLogin}
  className="w-full mt-4 py-3 rounded-xl font-semibold
    bg-orange-500 text-white shadow-md
    hover:bg-orange-600 active:scale-95 transition-all duration-150
    flex items-center justify-center gap-3"
>
  {/* Google Icon */}
  <img
    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
    alt="Google logo"
    className="w-6 h-6 rounded-full bg-white p-1"
  />

  <span className="text-sm md:text-base font-medium text-white">
    Đăng nhập với Google
  </span>
</button>


            {/* EXTRA LINKS */}
            <div className="mt-6 text-center text-sm">
              <Link 
                to="/forgot-password" 
                className="text-orange-600 hover:underline font-medium"
              >
                Quên mật khẩu?
              </Link>

              <div className="mt-2">
                <span className="text-gray-600 dark:text-gray-300">Chưa có tài khoản? </span>
                <Link 
                  to="/register" 
                  className="text-orange-600 hover:underline font-semibold"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
