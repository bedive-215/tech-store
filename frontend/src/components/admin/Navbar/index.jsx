import React, { useState, useEffect, useCallback } from "react";
import { Bell, User, Menu, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import userService from "@/services/userService";
import { toast } from "react-toastify";

export default function AdminNavbar({ onToggle }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileView, setShowProfileView] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [profile, setProfile] = useState(null);

  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      navigate("/login");
    }
  };

  // Không dùng env, không prefix avatar — dùng trực tiếp value từ server
  const normalizeServerUser = (serverUser) => {
    if (!serverUser) return null;

    const avatarRaw =
      serverUser.avatar ??
      serverUser.avatar_url ??
      serverUser.avatarUrl ??
      null;

    return {
      user_id: serverUser.user_id ?? serverUser.id ?? serverUser._id ?? null,
      full_name: serverUser.full_name ?? serverUser.name ?? "",
      email: serverUser.email ?? serverUser.email_address ?? "",
      phone_number:
        serverUser.phone_number ?? serverUser.phone ?? serverUser.mobile ?? "",
      date_of_birth: serverUser.date_of_birth ?? "",
      avatar: avatarRaw || null, // Dùng nguyên xi từ API
      address: serverUser.address ?? "",
      role: serverUser.role ?? "",
    };
  };

  const fetchMyInfo = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await userService.getUserInfo();
      // serverUser có thể nằm ở res.data.user hoặc res.data.data hoặc res.data
      const serverUser = res.data?.user ?? res.data?.data ?? res.data ?? null;

      if (!serverUser) {
        throw new Error("Invalid user data from server");
      }

      const normalized = normalizeServerUser(serverUser);
      setProfile(normalized);
      return normalized;
    } catch (err) {
      const msg = err?.response?.data?.message || "Không thể tải thông tin người dùng";
      setError(msg);
      setProfile(null);
      toast.error(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!showDropdown) {
      setShowProfileView(false);
    }
  }, [showDropdown]);

  const onClickProfile = async () => {
    setShowProfileView(true);
    try {
      await fetchMyInfo();
    } catch {
      // lỗi đã được xử lý trong fetchMyInfo
    }
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-[1280px] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <button
            onClick={onToggle}
            className="p-2 rounded-md hover:bg-gray-100 transition"
            aria-label="Toggle menu"
          >
            <Menu size={24} />
          </button>

          <div className="text-xl font-bold text-orange-500 cursor-pointer">
            AdminPanel
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-4">
          <button
            className="relative p-2 rounded-md hover:bg-gray-100 transition"
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowDropdown((s) => !s)}
              className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition"
              aria-haspopup="true"
              aria-expanded={showDropdown}
            >
              <User size={20} />
              <span className="font-medium text-gray-700">Admin</span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 overflow-hidden z-50">
                {showProfileView ? (
                  <div className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center">
                        {loading ? (
                          <Loader2 className="animate-spin" size={24} />
                        ) : profile?.avatar ? (
                          // eslint-disable-next-line jsx-a11y/img-redundant-alt
                          <img
                            src={profile.avatar}
                            alt="avatar"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={28} className="text-gray-400" />
                        )}
                      </div>

                      <div>
                        <div className="font-semibold text-gray-800">
                          {loading ? "Đang tải..." : profile?.full_name ?? "—"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {profile?.role ?? "—"}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 text-sm text-gray-700">
                      {loading && (
                        <div className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={18} />
                          <span>Đang tải thông tin...</span>
                        </div>
                      )}

                      {!loading && error && (
                        <div className="text-red-500">{error}</div>
                      )}

                      {!loading && profile && (
                        <div className="space-y-2">
                          <div>
                            <div className="text-xs text-gray-500">Email</div>
                            <div className="font-medium">{profile.email ?? "—"}</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Phone</div>
                            <div className="font-medium">{profile.phone_number ?? "—"}</div>
                          </div>

                          {profile.address && (
                            <div>
                              <div className="text-xs text-gray-500">Address</div>
                              <div className="font-medium">{profile.address}</div>
                            </div>
                          )}

                          {profile.date_of_birth && (
                            <div>
                              <div className="text-xs text-gray-500">DOB</div>
                              <div className="font-medium">{profile.date_of_birth}</div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => setShowProfileView(false)}
                        className="flex-1 px-3 py-2 border rounded-md hover:bg-gray-50 transition"
                      >
                        Back
                      </button>

                      <button
                        onClick={handleLogout}
                        className="flex-1 px-3 py-2 bg-red-500 text-white rounded-md hover:opacity-95 transition"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={onClickProfile}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition flex items-center gap-2"
                    >
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <User size={18} />
                      </div>
                      <div>
                        <div className="font-medium text-gray-800">Profile</div>
                        <div className="text-xs text-gray-500">Xem thông tin cơ bản</div>
                      </div>
                    </button>

                    <button className="w-full text-left px-4 py-3 hover:bg-gray-100 transition">
                      Settings
                    </button>

                    <div className="border-t border-gray-100" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 hover:bg-gray-100 transition text-red-500"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
