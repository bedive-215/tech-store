import React, { useState } from "react";

export default function Profile() {
  const [user, setUser] = useState({
    name: "Nguyễn Văn A",
    phone: "0901234567",
    email: "example@gmail.com",
    address: "123 Nguyễn Trãi, Quận 1, TP.HCM",
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    setMessage("Cập nhật thành công!");
    setTimeout(() => setMessage(""), 2500);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 mt-10">
      <h1 className="text-2xl font-bold mb-6">Thông tin cá nhân</h1>

      <div className="bg-white shadow-md rounded-xl p-6 border border-gray-200">

        {/* Họ tên */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Họ và tên</label>
          <input
            name="name"
            value={user.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:border-orange-500 outline-none"
          />
        </div>

        {/* Số điện thoại */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Số điện thoại</label>
          <input
            name="phone"
            value={user.phone}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:border-orange-500 outline-none"
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block font-medium mb-1">Email</label>
          <input
            name="email"
            value={user.email}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:border-orange-500 outline-none"
          />
        </div>

        {/* Địa chỉ */}
        <div className="mb-6">
          <label className="block font-medium mb-1">Địa chỉ</label>
          <input
            name="address"
            value={user.address}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:border-orange-500 outline-none"
          />
        </div>

        {/* BUTTON LƯU */}
        <button
          onClick={handleSave}
          className="w-full bg-orange-500 text-white py-3 rounded-lg font-medium hover:bg-orange-600 transition"
        >
          Lưu thay đổi
        </button>

        {message && (
          <div className="text-green-600 text-center mt-4">{message}</div>
        )}
      </div>
    </div>
  );
}
