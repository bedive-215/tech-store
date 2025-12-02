import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Mail, Lock, Eye, EyeOff, User, Phone, Calendar, ShieldCheck } from "lucide-react";
import LangSwitcher from "@/components/common/LangSwitcher";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import { useNavigate, Link } from "react-router-dom";
import { ROUTERS } from "@/utils/constants";
import shopImg from "@/assets/images/shop_cart.jpg";

// 🔥 IMPORT AuthProvider
import { useAuth } from "@/hooks/useAuth";

const schemaStep1 = yup.object({
  full_name: yup.string().required("auth.required"),
  date_of_birth: yup.string().required("auth.required"),
  phone_number: yup.string().required("auth.required"),
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
  password: yup.string().required("auth.required").min(6, "auth.minPassword"),
});

export default function RegisterPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register: registerUser, verifyEmail } = useAuth(); // 🔥 LẤY API TỪ AUTH PROVIDER

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // STEP 1 = nhập thông tin, STEP 2 = nhập mã OTP
  const [errorMessage, setErrorMessage] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [email, setEmail] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  // STEP 1 FORM
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schemaStep1) });

  // STEP 2 FORM — OTP
  const [otp, setOtp] = useState("");

  // ============================
  // 🔥 SUBMIT STEP 1 — REGISTER
  // ============================
  const onSubmitStep1 = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");

      const res = await registerUser({
        full_name: data.full_name,
        date_of_birth: data.date_of_birth,
        phone_number: data.phone_number,
        email: data.email,
        password: data.password,
      });

      setEmail(data.email);
      setStep(2); // Chuyển sang bước nhập mã

      setOtpMessage("Mã xác minh đã được gửi đến email của bạn.");
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  // ============================
// 🔥 SUBMIT STEP 2 — VERIFY EMAIL
// ============================
const onSubmitVerify = async () => {
  try {
    setLoading(true);
    setErrorMessage("");

    // 🔥 Gửi đúng payload { email, otp }
    await verifyEmail({
      email,
      otp, // dùng otp từ state
    });

    setOtpMessage("Xác minh thành công!");
     setTimeout(() => navigate("/login"), 1500);
  } catch (err) {
    setErrorMessage(err?.response?.data?.message || "Mã xác minh không đúng.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[100vh]">
        
        {/* LEFT */}
        <div className="hidden md:flex flex-col justify-center items-center 
          bg-orange-500 text-white p-10 gap-8 shadow-inner">

          <div className="w-72 h-72 rounded-2xl overflow-hidden shadow-2xl border border-white/20">
            <img 
              src={shopImg} 
              alt="Shop illustration"
              className="w-full h-full object-cover"
            />
          </div>

          <h1 className="text-3xl font-bold tracking-wide">Bán Hàng Online</h1>

          <p className="text-orange-100 text-sm tracking-wide">
            Hệ thống quản lý bán hàng hiện đại – nhanh chóng – tiện lợi
          </p>
        </div>

        {/* RIGHT */}
        <div className="p-10 md:p-14 flex flex-col justify-center">

          <div className="flex justify-end mb-6 gap-3">
            <LangSwitcher />
            <ThemeSwitcher />
          </div>

          <div className="mx-auto w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 shadow-lg">

            {/* Title */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {step === 1 ? "Đăng ký tài khoản" : "Xác minh email"}
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                {step === 1
                  ? "Tạo tài khoản để sử dụng hệ thống"
                  : "Nhập mã gửi đến email để hoàn tất đăng ký"}
              </p>
            </div>

            {/* FORM STEP 1 */}
            {step === 1 && (
              <form onSubmit={handleSubmit(onSubmitStep1)} className="space-y-4">

                {/* FULL NAME */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Họ và tên
                  </label>
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                    <User className="text-orange-600" size={20} />
                    <input
                      {...register("full_name")}
                      placeholder="Nhập họ và tên..."
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                  {errors.full_name && (
                    <p className="text-orange-500 text-xs mt-1">{t(errors.full_name.message)}</p>
                  )}
                </div>

                {/* DATE OF BIRTH */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Ngày sinh
                  </label>
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                    <Calendar className="text-orange-600" size={20} />
                    <input
                      type="date"
                      {...register("date_of_birth")}
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                  {errors.date_of_birth && (
                    <p className="text-orange-500 text-xs mt-1">{t(errors.date_of_birth.message)}</p>
                  )}
                </div>

                {/* PHONE */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Số điện thoại
                  </label>
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                    <Phone className="text-orange-600" size={20} />
                    <input
                      {...register("phone_number")}
                      placeholder="Nhập số điện thoại..."
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                  {errors.phone_number && (
                    <p className="text-orange-500 text-xs mt-1">{t(errors.phone_number.message)}</p>
                  )}
                </div>

                {/* EMAIL */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Email
                  </label>
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                    <Mail className="text-orange-600" size={20} />
                    <input
                      type="email"
                      {...register("email")}
                      placeholder="Nhập email..."
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                  {errors.email && (
                    <p className="text-orange-500 text-xs mt-1">{t(errors.email.message)}</p>
                  )}
                </div>

                {/* PASSWORD */}
                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Mật khẩu
                  </label>
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                    <Lock className="text-orange-600" size={20} />
                    <input
                      type={showPassword ? "text" : "password"}
                      {...register("password")}
                      placeholder="Nhập mật khẩu..."
                      className="flex-1 bg-transparent outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-orange-500 text-xs mt-1">{t(errors.password.message)}</p>
                  )}
                </div>

                {errorMessage && (
                  <p className="text-orange-500 text-sm">{errorMessage}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold 
                  bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800"
                >
                  {loading ? "Đang xử lý..." : "Đăng ký"}
                </button>
              </form>
            )}

            {/* FORM STEP 2 — VERIFY EMAIL */}
            {step === 2 && (
              <div className="space-y-4">

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Mã xác minh đã gửi đến <b>{email}</b>
                </p>

                <div>
                  <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                    Nhập mã xác minh (OTP)
                  </label>
                  <div className="flex items-center gap-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3">
                    <ShieldCheck className="text-orange-600" size={20} />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Nhập mã gồm 6 chữ số..."
                      className="flex-1 bg-transparent outline-none"
                    />
                  </div>
                </div>

                {errorMessage && (
                  <p className="text-orange-500 text-sm">{errorMessage}</p>
                )}

                {otpMessage && (
                  <p className="text-green-500 text-sm">{otpMessage}</p>
                )}

                <button
                  onClick={onSubmitVerify}
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white font-semibold 
                  bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-600 hover:to-orange-800"
                >
                  {loading ? "Đang xử lý..." : "Xác minh email"}
                </button>
              </div>
            )}

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600 dark:text-gray-300">Đã có tài khoản? </span>
              <Link to="/login" className="text-orange-600 hover:underline font-semibold">
                Đăng nhập ngay
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
