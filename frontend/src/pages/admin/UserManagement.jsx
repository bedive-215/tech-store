import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import userService from "@/services/userService";
import { toast } from "react-toastify";
import { Loader2, Trash2, RotateCcw, User, Users, Shield, Mail, Phone, Calendar } from "lucide-react";

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchListUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getListOfUser({ page, limit }, token);

      const list = res?.data?.data || [];
      const totalItems = res?.data?.total || 0;
      const pages = res?.data?.totalPages || 0;

      setUsers(Array.isArray(list) ? list : []);
      setTotal(totalItems);
      setTotalPages(pages);
    } catch (err) {
      toast.error(err.response?.data?.message || "Lấy danh sách thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListUsers();
  }, [page]);

  const removeUser = async (userId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    setLoading(true);
    try {
      await userService.deleteUser(userId, token);
      toast.success("Xóa người dùng thành công");
      fetchListUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    } finally {
      setLoading(false);
    }
  };

  // Tạo list trang (5 trang)
  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return [...Array(totalPages).keys()].map((x) => x + 1);
    }

    let start = Math.max(page - 2, 1);
    let end = Math.min(start + 4, totalPages);

    if (end - start < 4) start = Math.max(end - 4, 1);

    return [...Array(end - start + 1).keys()].map((x) => start + x);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  // Count stats
  const adminCount = users.filter(u => u.role === 'admin').length;
  const userCount = users.filter(u => u.role === 'user').length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200/50">
              <Users className="text-white" size={24} />
            </div>
            <h1 className="text-4xl font-bold text-slate-900">
              Quản lý Người dùng
            </h1>
          </div>
          <p className="text-slate-600 ml-15">Quản lý tất cả người dùng trong hệ thống</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Tổng người dùng</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{total}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Quản trị viên</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">{adminCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <Shield className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm font-medium">Người dùng thường</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{userCount}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <User className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-slate-200 flex justify-end">
          <button
            onClick={fetchListUsers}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 
              rounded-lg shadow-sm 
              bg-blue-600 text-white
              hover:bg-blue-700 transition-colors duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              font-semibold"
          >
            <RotateCcw size={18} className={loading ? "animate-spin" : ""} />
            Làm mới
          </button>
        </div>

        {/* Loader */}
        {loading && (
          <div className="flex justify-center py-12 bg-white rounded-xl shadow-sm border border-slate-200">
            <div className="text-center">
              <Loader2 className="animate-spin text-blue-600 mx-auto mb-3" size={40} />
              <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Avatar</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Họ và tên</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Số điện thoại</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ngày sinh</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Vai trò</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ngày tạo</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-slate-700">Hành động</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-3">
                          <Users size={48} className="text-slate-300" />
                          <p className="text-lg font-medium">Không có người dùng nào</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr
                        key={u.id}
                        className="group hover:bg-slate-50 transition-colors duration-200"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-start">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt={u.full_name}
                                className="w-10 h-10 rounded-full object-cover border-2 border-slate-200"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "";
                                  e.target.style.display = "none";
                                  e.target.parentElement.innerHTML = `
                                    <div class="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500">
                                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                      </svg>
                                    </div>
                                  `;
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <User size={20} className="text-white" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-900">{u.full_name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Mail size={14} className="text-slate-400" />
                            {u.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            {u.phone_number ? (
                              <>
                                <Phone size={14} className="text-slate-400" />
                                {u.phone_number}
                              </>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-slate-700">
                            <Calendar size={14} className="text-slate-400" />
                            {formatDate(u.date_of_birth)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border
                            ${u.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800 border-purple-200' 
                              : 'bg-blue-100 text-blue-800 border-blue-200'
                            }`}>
                            {u.role === 'admin' ? <Shield size={14} /> : <User size={14} />}
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {new Date(u.created_at).toLocaleDateString("vi-VN")}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">
                            <button
                              onClick={() => removeUser(u.id)}
                              className="px-4 py-2 rounded-lg text-white text-sm
                                bg-rose-500 hover:bg-rose-600 transition-colors duration-200 shadow-sm
                                flex items-center gap-2 font-semibold"
                            >
                              <Trash2 size={16} /> Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 bg-white rounded-xl shadow-sm p-4 border border-slate-200">
            <div className="text-slate-600 font-medium">
              Trang <span className="font-bold text-slate-900">{page}</span> / <span className="font-bold text-slate-900">{totalPages}</span>
            </div>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white shadow-sm
                  hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
              >
                Trước
              </button>

              {getVisiblePages().map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`px-4 py-2 rounded-lg shadow-sm transition-colors duration-200 font-semibold
                    ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50"
                    }`}
                >
                  {p}
                </button>
              ))}

              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white shadow-sm
                  hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-semibold"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}