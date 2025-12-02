import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useTranslation } from "react-i18next";
import { Mail, Send } from "lucide-react";
import LangSwitcher from "@/components/common/LangSwitcher";
import ThemeSwitcher from "@/components/common/ThemeSwitcher";
import { Link } from "react-router-dom";

import shopImg from "@/assets/images/shop_cart.jpg"; // giữ ảnh cũ

const schema = yup.object({
  email: yup.string().required("auth.required").email("auth.invalidEmail"),
});

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Giả lập gửi request
      await new Promise((res) => setTimeout(res, 1500));

      setSuccessMessage(
        "Nếu email hợp lệ, bạn sẽ nhận được link đặt lại mật khẩu."
      );
    } catch (err) {
      setErrorMessage("Có lỗi xảy ra, vui lòng thử lại.");
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

        {/* RIGHT — FORGOT PASSWORD FORM */}
        <div className="p-10 md:p-14 flex flex-col justify-center">

          <div className="flex justify-end mb-6 gap-3">
            <LangSwitcher />
            <ThemeSwitcher />
          </div>

          <div className="mx-auto w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-3xl p-8 md:p-10 shadow-lg">
            <div className="mb-6 text-center">
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
                Quên mật khẩu
              </h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-300">
                Nhập email của bạn để nhận link đặt lại mật khẩu
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
                    placeholder="Nhập email của bạn..."
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100"
                  />
                </div>
                {errors.email && <p className="text-orange-500 text-xs mt-1">{t(errors.email.message)}</p>}
              </div>

              {errorMessage && <p className="text-orange-500 text-sm">{errorMessage}</p>}
              {successMessage && <p className="text-green-500 text-sm">{successMessage}</p>}

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-white font-semibold 
                  bg-gradient-to-r from-orange-500 to-orange-700 
                  hover:from-orange-600 hover:to-orange-800 shadow-md active:scale-95 transition"
              >
                <Send size={18} />
                {loading ? "Đang xử lý..." : "Gửi link đặt lại"}
              </button>
            </form>

            {/* EXTRA LINK */}
            <div className="mt-6 text-center text-sm">
              <Link 
                to="/login" 
                className="text-orange-600 hover:underline font-medium"
              >
                Quay lại đăng nhập
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
