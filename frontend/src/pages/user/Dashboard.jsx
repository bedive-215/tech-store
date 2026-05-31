// src/pages/user/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { orderService } from "@/services/orderService";
import { format, isValid } from "date-fns";

const formatPrice = (price) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(price ?? 0));

const safeDate = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (!isValid(d)) return "";
  return format(d, "dd/MM/yyyy");
};

const STATUS_LABEL = {
  confirmed: "Chờ xác nhận",
  paid: "Đã thanh toán",
  shipping: "Đang giao",
  completed: "Hoàn thành",
  cancelled: "Đã hủy",
};

const STATUS_COLOR = {
  confirmed: "bg-yellow-100 text-yellow-700",
  paid: "bg-blue-100 text-blue-700",
  shipping: "bg-purple-100 text-purple-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const res = await orderService.listOrders({ user_id: user.user_id ?? user.id });
        const raw = res.data?.data ?? res.data ?? {};
        const list = Array.isArray(raw.orders) ? raw.orders : [];
        setOrders(list);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user]);

  // Calculate stats
  const stats = useMemo(() => {
    const all = orders.length;
    const pending = orders.filter(o => ["confirmed", "paid"].includes(String(o.status).toLowerCase())).length;
    const shipping = orders.filter(o => String(o.status).toLowerCase() === "shipping").length;
    const completed = orders.filter(o => String(o.status).toLowerCase() === "completed").length;
    const totalSpent = orders
      .filter(o => String(o.status).toLowerCase() !== "cancelled")
      .reduce((sum, o) => sum + Number(o.final_price ?? o.total_price ?? 0), 0);
    return { all, pending, shipping, completed, totalSpent };
  }, [orders]);

  // Recent orders (last 5)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 5);
  }, [orders]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Chào buổi sáng";
    if (hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            {greeting}, {user?.name || user?.email?.split('@')[0] || 'bạn'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Tổng quan tài khoản và đơn hàng của bạn</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon="shopping_bag"
            label="Tổng đơn hàng"
            value={stats.all}
            color="blue"
            loading={loading}
          />
          <StatCard
            icon="pending_actions"
            label="Đang xử lý"
            value={stats.pending}
            color="yellow"
            loading={loading}
          />
          <StatCard
            icon="local_shipping"
            label="Đang giao"
            value={stats.shipping}
            color="purple"
            loading={loading}
          />
          <StatCard
            icon="check_circle"
            label="Hoàn thành"
            value={stats.completed}
            color="green"
            loading={loading}
          />
        </div>

        {/* Total Spent Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 mb-8 text-white shadow-lg shadow-blue-500/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Tổng chi tiêu</p>
              <p className="text-3xl font-bold mt-1">
                {loading ? "..." : formatPrice(stats.totalSpent)}
              </p>
            </div>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
              <span className="material-icons-outlined text-3xl">payments</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <QuickAction
            icon="shopping_cart"
            label="Giỏ hàng"
            onClick={() => navigate("/user/cart")}
          />
          <QuickAction
            icon="receipt_long"
            label="Đơn hàng"
            onClick={() => navigate("/user/orders")}
          />
          <QuickAction
            icon="verified_user"
            label="Bảo hành"
            onClick={() => navigate("/user/warranties")}
          />
          <QuickAction
            icon="person"
            label="Tài khoản"
            onClick={() => navigate("/user/profile")}
          />
        </div>

        {/* Recent Orders */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Đơn hàng gần đây</h2>
            <button
              onClick={() => navigate("/user/orders")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Xem tất cả →
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3"></div>
              <p className="text-gray-500">Đang tải...</p>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-icons-outlined text-4xl text-gray-300 dark:text-gray-600 mb-3">inbox</span>
              <p className="text-gray-500 dark:text-gray-400">Chưa có đơn hàng nào</p>
              <button
                onClick={() => navigate("/user/home")}
                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Mua sắm ngay
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {recentOrders.map((order) => {
                const status = String(order.status ?? "").toLowerCase();
                return (
                  <div
                    key={order.order_id ?? order.id}
                    className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => navigate("/user/orders")}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                        <span className="material-icons-outlined text-blue-600 dark:text-blue-400">receipt</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white text-sm">
                          #{String(order.order_id ?? order.id).slice(-8).toUpperCase()}
                        </p>
                        <p className="text-xs text-gray-500">{safeDate(order.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${STATUS_COLOR[status] || "bg-gray-100 text-gray-700"}`}>
                        {STATUS_LABEL[status] || status}
                      </span>
                      <span className="font-semibold text-gray-900 dark:text-white text-sm">
                        {formatPrice(order.final_price ?? order.total_price)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function StatCard({ icon, label, value, color, loading }) {
  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600",
    yellow: "bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600",
    green: "bg-green-50 dark:bg-green-900/20 text-green-600",
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center mb-3`}>
        <span className="material-icons-outlined">{icon}</span>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {loading ? "..." : value}
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

function QuickAction({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md transition-all flex flex-col items-center gap-2 group"
    >
      <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
        <span className="material-icons-outlined text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors">{icon}</span>
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
    </button>
  );
}