import React from "react";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-16">
      <div className="max-w-7xl mx-auto px-5 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <h3 className="text-orange-500 text-lg font-bold mb-5">Về TechStore</h3>
          <ul className="space-y-3">
            <li><a href="#" className="hover:text-orange-500 transition">Giới thiệu công ty</a></li>
            <li><a href="#" className="hover:text-orange-500 transition">Tuyển dụng</a></li>
            <li><a href="#" className="hover:text-orange-500 transition">Liên hệ</a></li>
            <li><a href="#" className="hover:text-orange-500 transition">Hệ thống cửa hàng</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-orange-500 text-lg font-bold mb-5">Chính Sách</h3>
          <ul className="space-y-3">
            <li><a href="#" className="hover:text-orange-500 transition">Chính sách bảo hành</a></li>
            <li><a href="#" className="hover:text-orange-500 transition">Chính sách đổi trả</a></li>
            <li><a href="#" className="hover:text-orange-500 transition">Chính sách vận chuyển</a></li>
            <li><a href="#" className="hover:text-orange-500 transition">Chính sách bảo mật</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-orange-500 text-lg font-bold mb-5">Hỗ Trợ Khách Hàng</h3>
          <ul className="space-y-3">
            <li><a href="#" className="hover:text-orange-500 transition">Hướng dẫn mua hàng</a></li>
            <li><a href="#" className="hover:text-orange-500 transition">Hướng dẫn thanh toán</a></li>
            <li><a href="#" className="hover:text-orange-500 transition">Tra cứu đơn hàng</a></li>
            <li><a href="#" className="hover:text-orange-500 transition">Câu hỏi thường gặp</a></li>
          </ul>
        </div>

        <div>
          <h3 className="text-orange-500 text-lg font-bold mb-5">Liên Hệ</h3>
          <ul className="space-y-3 text-gray-400">
            <li>Hotline: 1900 1234</li>
            <li>Email: support@techstore.vn</li>
            <li>Địa chỉ: Thuận An, HCMC, VN</li>
            <li>8:00 - 22:00 (Tất cả các ngày)</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-gray-500 pt-8 border-t border-gray-800 mt-10">
        <p>&copy; 2024 TechStore. Tất cả quyền được bảo lưu.</p>
      </div>
    </footer>
  );
}