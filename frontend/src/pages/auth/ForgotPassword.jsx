import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Mail, Send, Key, Lock } from "lucide-react";
import LangSwitcher from "@/components/common/LangSwitcher";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

import shopImg from "@/assets/images/shop_cart.jpg";

// ================== VALIDATION ==================
const schemaEmail = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
});

const schemaCode = yup.object({
  code: yup.string().required("auth.required").min(4, "Mã không hợp lệ"),
});

const schemaReset = yup.object({
  newPassword: yup.string().required("auth.required").min(6, "Mật khẩu quá ngắn"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword")], "Mật khẩu không khớp"),
});

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Lấy các hàm provider từ useAuth()
  const { forgotPassword, verifyResetCode, resetPassword } = useAuth();

  const [step, setStep] = useState(1); // 1 = nhập email, 2 = nhập mã, 3 = đặt mật khẩu
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState(""); // lưu email để dùng lại khi reset password
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // ================== FORM HOOKS ==================
  const formEmail = useForm({ resolver: yupResolver(schemaEmail) });
  const formCode = useForm({ resolver: yupResolver(schemaCode) });
  const formReset = useForm({ resolver: yupResolver(schemaReset) });

  // ================== STEP 1: Gửi mail ==================
  const handleSendEmail = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      const res = await forgotPassword(data);

      setSuccessMessage("Email đã được gửi. Vui lòng kiểm tra hộp thư!");
      setEmail(data.email); // lưu email lại
      setStep(2); // chuyển sang bước nhập mã
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể gửi email.");
    } finally {
      setLoading(false);
    }
  };

  // ================== STEP 2: Xác minh mã ==================
  const handleVerifyCode = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await verifyResetCode({ email, code: data.code });

      setSuccessMessage("Xác minh thành công!");
      setStep(3);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Mã không đúng.");
    } finally {
      setLoading(false);
    }
  };

  // ================== STEP 3: Đặt mật khẩu ==================
  const handleResetPassword = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      await resetPassword({
        email,
        newPassword: data.newPassword,
      });

      setSuccessMessage("Đặt lại mật khẩu thành công. Hãy đăng nhập lại!");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Không thể đặt lại mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-white dark:bg-gray-900 rounded-3xl shadow-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 min-h-[100vh]">
        
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

        {/* RIGHT — FORM */}
        <div className="p-10 md:p-14 flex flex-col justify-center">

          <div className="flex justify-end mb-6 gap-3">
            <LangSwitcher />
            <ThemeSwitcher />
          </div>

          <div className="mx-auto w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-10 shadow-lg">
            
            {/* TITLE */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                {step === 1 && "Quên mật khẩu"}
                {step === 2 && "Nhập mã xác nhận"}
                {step === 3 && "Đặt mật khẩu mới"}
              </h2>

              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                {step === 1 && "Nhập email để nhận mã khôi phục"}
                {step === 2 && `Một mã đã gửi đến email: ${email}`}
                {step === 3 && "Đặt lại mật khẩu mới cho tài khoản"}
              </p>
            </div>

            {/* FORM THEO STEP */}
            {step === 1 && (
              <form onSubmit={formEmail.handleSubmit(handleSendEmail)} className="space-y-4">
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-300">
                  Email
                </label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 border rounded-xl px-4 py-3">
                  <Mail className="text-orange-600" size={20} />
                  <input
                    type="email"
                    {...formEmail.register("email")}
                    placeholder="Nhập email..."
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>
                {formEmail.formState.errors.email && (
                  <p className="text-orange-500 text-xs">{t(formEmail.formState.errors.email.message)}</p>
                )}

                {errorMessage && <p className="text-orange-500 text-sm">{errorMessage}</p>}
                {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-3"
                >
                  <Send size={18} />
                  {loading ? "Đang gửi..." : "Gửi mã khôi phục"}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={formCode.handleSubmit(handleVerifyCode)} className="space-y-4">
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">Mã xác nhận</label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 border rounded-xl px-4 py-3">
                  <Key className="text-orange-600" size={20} />
                  <input
                    type="text"
                    {...formCode.register("code")}
                    placeholder="Nhập mã 4-6 số..."
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>

                {formCode.formState.errors.code && (
                  <p className="text-orange-500 text-xs">{formCode.formState.errors.code.message}</p>
                )}

                {errorMessage && <p className="text-orange-500 text-sm">{errorMessage}</p>}
                {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-3"
                >
                  <Send size={18} />
                  {loading ? "Đang xác minh..." : "Xác minh mã"}
                </button>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={formReset.handleSubmit(handleResetPassword)} className="space-y-4">
                
                {/* NEW PASSWORD */}
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Mật khẩu mới
                </label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 border rounded-xl px-4 py-3">
                  <Lock className="text-orange-600" size={20} />
                  <input
                    type="newPassword"
                    {...formReset.register("newPassword")}
                    placeholder="Nhập mật khẩu mới..."
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>

                {/* CONFIRM */}
                <label className="text-xs font-medium text-gray-600 dark:text-gray-300">
                  Xác nhận mật khẩu
                </label>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/40 border rounded-xl px-4 py-3">
                  <Lock className="text-orange-600" size={20} />
                  <input
                    type="newPassword"
                    {...formReset.register("confirmPassword")}
                    placeholder="Nhập lại mật khẩu..."
                    className="flex-1 bg-transparent outline-none"
                  />
                </div>

                {formReset.formState.errors.confirmPassword && (
                  <p className="text-orange-500 text-xs">
                    {formReset.formState.errors.confirmPassword.message}
                  </p>
                )}

                {errorMessage && <p className="text-orange-500 text-sm">{errorMessage}</p>}
                {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl text-white bg-orange-600 hover:bg-orange-700 flex items-center justify-center gap-3"
                >
                  <Send size={18} />
                  {loading ? "Đang đặt lại..." : "Đặt mật khẩu mới"}
                </button>
              </form>
            )}

            <div className="mt-6 text-center text-sm">
              <Link to="/login" className="text-orange-600 hover:underline font-medium">
                Quay lại đăng nhập
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
