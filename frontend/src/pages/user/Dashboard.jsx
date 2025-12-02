import React from "react";
//import Header from "../../components/common/Header/index";
import Footer from "../../components/common/Footer/index";

export default function Dashboard() {
  return (
    <>

      <div className="min-h-screen bg-gray-50 py-20">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <h1 className="text-4xl font-bold text-orange-600 mb-6">Chào mừng đến</h1>
          <p className="text-xl text-gray-700">Bạn đã đăng nhập thành công!</p>
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold text-orange-500">1,234</h3>
              <p className="text-gray-600">Đơn hàng hôm nay</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold text-orange-500">₫89.5M</h3>
              <p className="text-gray-600">Doanh thu tháng</p>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold text-orange-500">456</h3>
              <p className="text-gray-600">Khách hàng mới</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}