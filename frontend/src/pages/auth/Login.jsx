// Login.jsx
import React, { useState, useEffect, useRef } from "react";
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
import shopImg from "@/assets/images/shop_cart.jpg";
import axios from "axios";

// Validation schema for email/password login
const schema = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
  password: yup.string().required("auth.required").min(6, "auth.minPassword"),
});

// Validation schema for Google extra info
const extraSchema = yup.object({
  phone_number: yup.string().required("Số điện thoại không được bỏ trống"),
  date_of_birth: yup
    .string()
    .required("Ngày sinh không được bỏ trống")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh phải đúng định dạng YYYY-MM-DD"),
});

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth(); // chỉ dùng login email/password
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Google
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || null;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const googleClientLoaded = useRef(false);
  const gsiInitialized = useRef(false);
  const googleButtonRef = useRef(null);

  // Extra info modal state
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [googleToken, setGoogleToken] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const {
    register: registerExtra,
    handleSubmit: handleSubmitExtra,
    formState: { errors: extraErrors },
    reset: resetExtraForm,
  } = useForm({ resolver: yupResolver(extraSchema) });

  // ====================== HANDLE EMAIL/PASSWORD ======================
  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await login({ email: data.email, password: data.password });

      const role =
        res?.user?.role || res?.role || res?.data?.user?.role || res?.data?.role;

      if (!role) throw new Error("Missing role in response");

      if (role === "admin") {
        navigate(ROUTERS.ADMIN.DASHBOARD);
      } else if (role === "user") {
        navigate(ROUTERS.USER.HOME);
      } else {
        navigate("/");
      }
    } catch (err) {
      const msg =
        err?.response?.data?.message || err?.message || "Invalid email or password";
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  // ====================== HANDLE GOOGLE ======================
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;

    if (googleClientLoaded.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleClientLoaded.current = true;
      console.log("GSI script loaded");
    };
    script.onerror = () => {
      googleClientLoaded.current = false;
      console.error("Failed to load GSI script");
    };

    document.body.appendChild(script);
  }, [GOOGLE_CLIENT_ID]);

  const initGSI = () => {
    if (!GOOGLE_CLIENT_ID || !window.google || gsiInitialized.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          const idToken = response?.credential;
          if (!idToken) {
            setErrorMessage("Không nhận được token từ Google");
            return;
          }
          setGoogleToken(idToken);
          setShowExtraForm(true); // hiện form nhập thêm
        },
      });

      try {
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
          });
        }
      } catch (err) {
        console.warn("renderButton failed:", err);
      }

      gsiInitialized.current = true;
    } catch (err) {
      console.error("GSI initialize error:", err);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (googleClientLoaded.current && !gsiInitialized.current) {
        initGSI();
      }
      if (gsiInitialized.current) clearInterval(interval);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const handleGoogleLogin = () => {
    setErrorMessage("");
    if (GOOGLE_CLIENT_ID && window.google && gsiInitialized.current) {
      window.google.accounts.id.prompt();
    } else {
      window.location.href = `${API_URL}/api/v1/auth/login/oauth`;
    }
  };

  // ====================== HANDLE EXTRA INFO SUBMIT ======================
  const onSubmitExtra = async (data) => {
    if (!googleToken) {
      setErrorMessage("Token Google không tồn tại");
      return;
    }

    try {
      setOauthLoading(true);
      setErrorMessage("");

      const res = await axios.post(`${API_URL}/api/v1/auth/login/oauth`, {
        phone_number: data.phone_number,
        date_of_birth: data.date_of_birth,
        token: googleToken,
      });

      const role =
        res?.data?.user?.role || res?.data?.role || "user";

      if (role === "admin") {
        navigate(ROUTERS.ADMIN.DASHBOARD);
      } else if (role === "user") {
        navigate(ROUTERS.USER.HOME);
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Extra info submit error:", err);
      const msg = err?.response?.data?.message || err?.message || "Google login failed";
      setErrorMessage(msg);
    } finally {
      setOauthLoading(false);
      setShowExtraForm(false);
      setGoogleToken(null);
      resetExtraForm();
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2">
        {/* LEFT SIDE */}
        <div className="hidden md:flex flex-col justify-center items-center bg-orange-500 text-white p-10 gap-8 shadow-inner">
          <div className="w-72 h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img src={shopImg} alt="Shop illustration" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold tracking-wide">Bán Hàng Online</h1>
          <p className="text-orange-100 text-sm tracking-wide">
            Hệ thống quản lý bán hàng hiện đại – nhanh chóng – tiện lợi
          </p>
        </div>

        {/* RIGHT SIDE */}
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

            {/* EMAIL/PASSWORD FORM */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{t(errors.email.message)}</p>
                )}
              </div>

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
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 dark:text-gray-300"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{t(errors.password.message)}</p>
                )}
              </div>

              {errorMessage && <p className="text-red-500 text-sm">{errorMessage}</p>}

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

            {/* GOOGLE LOGIN */}
            <div className="mt-4">
              <div ref={googleButtonRef} className="mb-3 flex justify-center"></div>
            
              <p className="text-xs text-gray-500 mt-2">
                {GOOGLE_CLIENT_ID
                  ? "Sử dụng Google Identity Services (client-side). Nếu gặp lỗi, kiểm tra Authorized JavaScript origins trong Google Cloud Console."
                  : "Không tìm thấy Google Client ID — luồng server-side OAuth sẽ được dùng."}
              </p>
            </div>

            {/* EXTRA LINKS */}
            <div className="mt-6 text-center text-sm">
              <Link to="/forgot-password" className="text-orange-600 hover:underline font-medium">
                Quên mật khẩu?
              </Link>
              <div className="mt-2">
                <span className="text-gray-600 dark:text-gray-300">Chưa có tài khoản? </span>
                <Link to="/register" className="text-orange-600 hover:underline font-semibold">
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXTRA INFO MODAL */}
      {showExtraForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">
              Thêm thông tin cần thiết
            </h3>
            <form onSubmit={handleSubmitExtra(onSubmitExtra)} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
                  Số điện thoại
                </label>
                <input
                  type="text"
                  {...registerExtra("phone_number")}
                  placeholder="Nhập số điện thoại..."
                  className="w-full border rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/40"
                />
                {extraErrors.phone_number && (
                  <p className="text-red-500 text-xs mt-1">{extraErrors.phone_number.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-300">
                  Ngày sinh (YYYY-MM-DD)
                </label>
                <input
                  type="date"
                  {...registerExtra("date_of_birth")}
                  className="w-full border rounded-xl px-3 py-2 text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/40"
                />
                {extraErrors.date_of_birth && (
                  <p className="text-red-500 text-xs mt-1">{extraErrors.date_of_birth.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowExtraForm(false);
                    setGoogleToken(null);
                    resetExtraForm();
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={oauthLoading}
                  className="px-4 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600"
                >
                  {oauthLoading ? "Đang gửi..." : "Gửi thông tin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
