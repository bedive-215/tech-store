import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import userService from "@/services/userService";
import { toast } from "react-toastify";
import { Loader2, Trash2, RotateCcw } from "lucide-react";

export default function UserManagement() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const limit = 10;

  const [total, setTotal] = useState(0);

  const lastPage = Math.ceil(total / limit);

  const fetchListUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getListOfUser({ page, limit }, token);

      const list = res?.data?.data || [];
      const totalItems = res?.data?.total || 0;

      setUsers(Array.isArray(list) ? list : []);
      setTotal(totalItems);
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
    if (lastPage <= 5) {
      return [...Array(lastPage).keys()].map((x) => x + 1);
    }

    let start = Math.max(page - 2, 1);
    let end = Math.min(start + 4, lastPage);

    if (end - start < 4) start = Math.max(end - 4, 1);

    return [...Array(end - start + 1).keys()].map((x) => start + x);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">User Management</h1>

        <button
          onClick={fetchListUsers}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 
            rounded-lg shadow-sm 
            bg-gray-800 text-white
            hover:bg-black transition-all active:scale-95"
        >
          <RotateCcw size={18} />
          Refresh
        </button>
      </div>

      {/* Loader */}
      {loading && (
        <div className="flex justify-center py-6">
          <Loader2 className="animate-spin text-gray-700" size={40} />
        </div>
      )}

      {/* Table */}
      {!loading && (
        <div className="overflow-hidden rounded-xl shadow-sm border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-gray-700">
              <tr>
                {[
                  "ID",
                  "Full Name",
                  "Email",
                  "Phone",
                  "Role",
                  "Birthdays",
                  "Action",
                ].map((h) => (
                  <th key={h} className="p-3 text-left font-medium border-b">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-4 text-gray-500">
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                users.map((u, index) => (
                  <tr
                    key={u.id}
                    className="transition-colors hover:bg-gray-50"
                  >
                    <td className="p-3 border-b">{u.id}</td>
                    <td className="p-3 border-b font-medium">{u.full_name}</td>
                    <td className="p-3 border-b">{u.email}</td>
                    <td className="p-3 border-b">{u.phone_number || "-"}</td>
                    <td className="p-3 border-b">{u.role}</td>
                    <td className="p-3 border-b">
                      {new Date(u.created_at).toLocaleString()}
                    </td>
                    <td className="p-3 border-b text-center">
                      <button
                        onClick={() => removeUser(u.id)}
                        className="px-3 py-2 rounded-md text-white text-sm
                          bg-red-500 hover:bg-red-600 transition shadow-sm active:scale-95 flex items-center gap-2 mx-auto"
                      >
                        <Trash2 size={16} /> Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex justify-center mt-6 gap-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="px-3 py-2 border rounded-md text-gray-700 bg-white shadow-sm
            hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Prev
        </button>

        {getVisiblePages().map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`px-3 py-2 rounded-md shadow-sm border
              ${
                p === page
                  ? "bg-gray-800 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
          >
            {p}
          </button>
        ))}

        <button
          disabled={page === lastPage}
          onClick={() => setPage((p) => p + 1)}
          className="px-3 py-2 border rounded-md text-gray-700 bg-white shadow-sm
            hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
}
