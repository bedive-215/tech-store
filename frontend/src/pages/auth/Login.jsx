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

// Validation schema for extra info (static)
const extraSchema = yup.object({
  phone_number: yup
    .string()
    .required("Số điện thoại không được bỏ trống")
    .matches(/^[0-9]{10,11}$/, "Số điện thoại phải có 10-11 chữ số"),
  date_of_birth: yup
    .string()
    .required("Ngày sinh không được bỏ trống")
    .matches(/^\d{4}-\d{2}-\d{2}$/, "Ngày sinh phải đúng định dạng YYYY-MM-DD"),
});

export default function Login() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Google OAuth
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || null;
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const googleClientLoaded = useRef(false);
  const gsiInitialized = useRef(false);
  const googleButtonRef = useRef(null);

  // Extra info modal state
  const [showExtraForm, setShowExtraForm] = useState(false);
  const [tempToken, setTempToken] = useState(null);
  const [missingFields, setMissingFields] = useState(null);

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
    clearErrors: clearExtraErrors,
  } = useForm({ 
    resolver: yupResolver(extraSchema),
    mode: "onChange"
  });

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

  // ====================== HANDLE GOOGLE GSI SETUP ======================
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (googleClientLoaded.current) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;

    script.onload = () => {
      googleClientLoaded.current = true;
      console.log("✅ GSI script loaded");
    };
    script.onerror = () => {
      googleClientLoaded.current = false;
      console.error("❌ Failed to load GSI script");
    };

    document.body.appendChild(script);
  }, [GOOGLE_CLIENT_ID]);

  const initGSI = () => {
    if (!GOOGLE_CLIENT_ID || !window.google || gsiInitialized.current) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          const idToken = response?.credential;
          if (!idToken) {
            setErrorMessage("Không nhận được token từ Google");
            return;
          }
          await handleGoogleTokenReceived(idToken);
        },
      });

      try {
        if (googleButtonRef.current) {
          window.google.accounts.id.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            locale: "vi",
          });
        }
      } catch (err) {
        console.warn("⚠️ renderButton failed:", err);
      }

      gsiInitialized.current = true;
      console.log("✅ GSI initialized");
    } catch (err) {
      console.error("❌ GSI initialize error:", err);
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

  // ====================== HANDLE GOOGLE TOKEN RECEIVED ======================
  const handleGoogleTokenReceived = async (idToken) => {
    try {
      setOauthLoading(true);
      setErrorMessage("");

      console.log("📤 Sending Google token to server...");

      // Bước 1: Gửi token lên server
      const res = await axios.post(`${API_URL}/api/v1/auth/login/oauth`, {
        token: idToken,
      });

      console.log("📥 OAuth response:", res.data);

      // Kiểm tra nếu cần thêm thông tin
      if (res.data.status === "incomplete" || res.data.code === "PROFILE_INCOMPLETE") {
        // Trường hợp cần thêm thông tin
        const missing = res.data.missing_fields || {};
        const tempTok = res.data.temp_token || idToken; // Lưu temp_token hoặc token ban đầu

        console.log("⚠️ Profile incomplete. Missing fields:", missing);
        console.log("🔑 Temp token:", tempTok);

        setMissingFields(missing);
        setTempToken(tempTok);
        setShowExtraForm(true);
        setOauthLoading(false);
        return;
      }

      // Nếu đăng nhập thành công hoàn toàn
      console.log("✅ Login successful!");
      handleSuccessfulLogin(res.data);
    } catch (err) {
      console.error("❌ Google token error:", err);
      
      // Kiểm tra xem có phải lỗi yêu cầu bổ sung thông tin không
      if (err?.response?.data?.code === "PROFILE_INCOMPLETE") {
        const missing = {};
        const requiredFields = err.response.data.required_fields || [];
        
        requiredFields.forEach(field => {
          missing[field] = true;
        });

        const tempTok = err.response.data.temp_token || null;

        console.log("⚠️ Profile incomplete (from error). Missing fields:", missing);
        console.log("🔑 Temp token:", tempTok);

        setMissingFields(missing);
        setTempToken(tempTok);
        setShowExtraForm(true);
      } else {
        const msg = err?.response?.data?.message || err?.message || "Google login failed";
        setErrorMessage(msg);
      }
      
      setOauthLoading(false);
    }
  };

  // ====================== HANDLE EXTRA INFO SUBMIT ======================
  const onSubmitExtra = async (formData) => {
    try {
      setOauthLoading(true);
      setErrorMessage("");

      console.log("📝 Form data:", formData);
      console.log("🔑 Using temp token:", tempToken);
      console.log("📋 Missing fields:", missingFields);

      // Chuẩn bị payload với token và thông tin bổ sung
      const payload = {
        token: tempToken, // Gửi temp_token như là token
      };

      // Chỉ thêm những field thực sự thiếu
      if (missingFields?.phone_number) {
        payload.phone_number = formData.phone_number;
      }

      if (missingFields?.date_of_birth) {
        payload.date_of_birth = formData.date_of_birth;
      }

      console.log("📤 Submitting extra info to /api/v1/auth/login/oauth");
      console.log("📦 Payload:", payload);

      // Gửi lại request đến endpoint OAuth với thông tin đầy đủ
      const res = await axios.post(
        `${API_URL}/api/v1/auth/login/oauth`,
        payload
      );

      console.log("✅ Complete profile response:", res.data);

      // Xử lý đăng nhập thành công
      handleSuccessfulLogin(res.data);
    } catch (err) {
      console.error("❌ Extra info submit error:", err);
      console.error("❌ Error response:", err?.response?.data);
      
      const msg = err?.response?.data?.message || err?.message || "Không thể hoàn tất đăng ký. Vui lòng thử lại.";
      setErrorMessage(msg);
      setOauthLoading(false);
    }
  };

  // ====================== HANDLE SUCCESSFUL LOGIN ======================
  const handleSuccessfulLogin = (data) => {
    console.log("🎉 Processing successful login...");
    
    // Lưu access token
    const accessToken = 
      data?.access_token || 
      data?.accessToken || 
      data?.token ||
      data?.data?.access_token ||
      data?.data?.token;

    const refreshToken = 
      data?.refresh_token || 
      data?.refreshToken ||
      data?.data?.refresh_token;

    if (accessToken) {
      localStorage.setItem("access_token", accessToken);
      console.log("✅ Access token saved");
    } else {
      console.warn("⚠️ No access token in response");
    }

    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
      console.log("✅ Refresh token saved");
    }

    // Lưu user info
    const userInfo = data?.user || data?.data?.user;
    if (userInfo) {
      localStorage.setItem("user", JSON.stringify(userInfo));
      console.log("✅ User info saved:", userInfo);
    }

    // Lấy role và điều hướng
    const role =
      data?.user?.role || 
      data?.role || 
      data?.data?.user?.role ||
      data?.data?.role ||
      "user";

    console.log("👤 User role:", role);

    // Reset states
    setShowExtraForm(false);
    setTempToken(null);
    setMissingFields(null);
    resetExtraForm();
    clearExtraErrors();
    setOauthLoading(false);

    // Navigate
    console.log("🚀 Navigating to dashboard...");
    if (role === "admin") {
      navigate(ROUTERS.ADMIN.DASHBOARD);
    } else if (role === "user") {
      navigate(ROUTERS.USER.HOME);
    } else {
      navigate("/");
    }
  };

  // ====================== RENDER ======================
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
                <label className="block text-xs font-medium mb-2 text-gray-600 dark:text-gray-300">
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

              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-white font-semibold 
                  bg-gradient-to-r from-orange-500 to-orange-700 
                  hover:from-orange-600 hover:to-orange-800 shadow-md active:scale-95 transition
                  disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <LogIn size={18} />
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                  Hoặc
                </span>
              </div>
            </div>

            {/* GOOGLE LOGIN */}
            <div className="space-y-3">
              <div ref={googleButtonRef} className="flex justify-center"></div>
            
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {GOOGLE_CLIENT_ID
                  ? "Đăng nhập nhanh với tài khoản Google"
                  : "Google Client ID chưa được cấu hình"}
              </p>
            </div>

            {/* EXTRA LINKS */}
            <div className="mt-6 text-center text-sm space-y-2">
              <Link 
                to="/forgot-password" 
                className="block text-orange-600 hover:text-orange-700 dark:hover:text-orange-500 hover:underline font-medium"
              >
                Quên mật khẩu?
              </Link>
              <div>
                <span className="text-gray-600 dark:text-gray-300">Chưa có tài khoản? </span>
                <Link 
                  to="/register" 
                  className="text-orange-600 hover:text-orange-700 dark:hover:text-orange-500 hover:underline font-semibold"
                >
                  Đăng ký ngay
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXTRA INFO MODAL */}
      {showExtraForm && missingFields && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
              Hoàn tất thông tin
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Vui lòng cung cấp thêm thông tin để hoàn tất đăng ký
            </p>

            <form onSubmit={handleSubmitExtra(onSubmitExtra)} className="space-y-4">
              {/* Phone Number - chỉ hiện nếu thiếu */}
              {missingFields.phone_number && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Số điện thoại <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...registerExtra("phone_number")}
                    placeholder="Ví dụ: 0912345678"
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 
                      text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/40
                      focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                  {extraErrors.phone_number && (
                    <p className="text-red-500 text-xs mt-1">
                      {extraErrors.phone_number.message}
                    </p>
                  )}
                </div>
              )}

              {/* Date of Birth - chỉ hiện nếu thiếu */}
              {missingFields.date_of_birth && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Ngày sinh <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...registerExtra("date_of_birth")}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 
                      text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700/40
                      focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition"
                  />
                  {extraErrors.date_of_birth && (
                    <p className="text-red-500 text-xs mt-1">
                      {extraErrors.date_of_birth.message}
                    </p>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
                  <p className="text-red-600 dark:text-red-400 text-sm">{errorMessage}</p>
                </div>
              )}

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    console.log("🚫 Cancelling extra info form");
                    setShowExtraForm(false);
                    setTempToken(null);
                    setMissingFields(null);
                    resetExtraForm();
                    clearExtraErrors();
                    setErrorMessage("");
                  }}
                  className="flex-1 px-4 py-3 rounded-xl bg-gray-200 dark:bg-gray-700 
                    text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-300 
                    dark:hover:bg-gray-600 transition"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={oauthLoading}
                  className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-700 
                    text-white font-semibold hover:from-orange-600 hover:to-orange-800 
                    shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {oauthLoading ? "Đang xử lý..." : "Hoàn tất"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {oauthLoading && !showExtraForm && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
              <p className="text-gray-700 dark:text-gray-300 font-medium">
                Đang xử lý đăng nhập...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}