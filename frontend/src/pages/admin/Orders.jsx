// src/pages/admin/Orders.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useOrder } from "@/providers/OrderProvider";
import { toast } from "react-toastify";
import { 
  Package, 
  Truck, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Search, 
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  MapPin,
  DollarSign,
  Calendar,
  ShoppingBag
} from "lucide-react";

function StatusBadge({ status }) {
  const statusConfig = {
    confirmed: { 
      text: "Chưa xử lý", 
      gradient: "from-yellow-400 to-orange-500",
      icon: Clock,
      shadow: "shadow-yellow-200"
    },
    shipping: { 
      text: "Đang giao", 
      gradient: "from-blue-400 to-blue-600",
      icon: Truck,
      shadow: "shadow-blue-200"
    },
    completed: { 
      text: "Đã giao", 
      gradient: "from-green-400 to-emerald-600",
      icon: CheckCircle,
      shadow: "shadow-green-200"
    },
    cancelled: { 
      text: "Đã huỷ", 
      gradient: "from-red-400 to-red-600",
      icon: XCircle,
      shadow: "shadow-red-200"
    },
    paid: { 
      text: "Đã thanh toán", 
      gradient: "from-purple-400 to-purple-600",
      icon: DollarSign,
      shadow: "shadow-purple-200"
    },
  };
  
  const config = statusConfig[status] || { 
    text: status || "-", 
    gradient: "from-gray-400 to-gray-500",
    icon: Package,
    shadow: "shadow-gray-200"
  };
  
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-r ${config.gradient} text-white shadow-md ${config.shadow} transition-all duration-300 hover:scale-105`}>
      <Icon size={14} />
      {config.text}
    </span>
  );
}

function OrderRow({ o, onView, onShip, onComplete, onCancel, processingId }) {
  const isProcessing = processingId === o.order_id;
  
  return (
    <tr className="group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-300 border-b border-gray-100">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md">
            <Package size={20} />
          </div>
          <span className="font-mono font-semibold text-gray-800">{o.order_id}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {(o.customer?.name ?? o.customer ?? "?")[0].toUpperCase()}
          </div>
          <span className="font-medium text-gray-700">
            {o.customer?.name ?? o.customer ?? (o.raw?.customer_name ?? "-")}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 font-bold text-gray-800">
          <DollarSign size={16} className="text-green-600" />
          {Number(o.final_price ?? o.raw?.final_price ?? 0).toLocaleString()} ₫
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={o.status} />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-gray-600">
          <Calendar size={14} />
          {new Date(o.created_at ?? o.raw?.created_at ?? Date.now()).toLocaleDateString('vi-VN')}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => onView(o)}
            className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg hover:from-gray-600 hover:to-gray-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
            title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>
          {(o.status === "confirmed" || o.status === "paid") && (
            <button
              onClick={() => onShip(o)}
              disabled={isProcessing}
              className="p-2 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              title="Đặt shipping"
            >
              {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Truck size={18} />}
            </button>
          )}
          {o.status === "shipping" && (
            <button
              onClick={() => onComplete(o)}
              disabled={isProcessing}
              className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              title="Đánh dấu hoàn thành"
            >
              {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            </button>
          )}
          {o.status !== "completed" && o.status !== "cancelled" && (
            <button
              onClick={() => onCancel(o)}
              disabled={isProcessing}
              className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              title="Hủy đơn"
            >
              {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <XCircle size={18} />}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function Orders() {
  const {
    orders,
    setOrders,
    fetchAllOrders,
    fetchOrderDetail,
    shipOrder,
    completeOrder,
    cancelOrder,
    loading,
  } = useOrder();
  
  const [fullList, setFullList] = useState([]);
  const [displayList, setDisplayList] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const resp = await fetchAllOrders();
        const data = resp.data ?? [];
        const arr = Array.isArray(data) ? data : [];
        if (!mounted) return;
        setFullList(arr);
        setPage(1);
      } catch (err) {
        toast.error("Không thể tải danh sách đơn (server).");
      }
    })();
    return () => (mounted = false);
  }, [fetchAllOrders, refreshKey]);

  useEffect(() => {
    const normalizedQ = (q || "").trim().toLowerCase();
    const filtered = fullList.filter((o) => {
      if (statusFilter && String(o.status) !== String(statusFilter)) return false;
      if (!normalizedQ) return true;
      const matchOrderId = String(o.order_id ?? "").toLowerCase().includes(normalizedQ);
      const cust = o.customer?.name ?? o.customer ?? o.raw?.customer_name ?? "";
      const matchCustomer = String(cust).toLowerCase().includes(normalizedQ);
      return matchOrderId || matchCustomer;
    });
    const totalItems = filtered.length;
    setTotal(totalItems);
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageSlice = filtered.slice(start, end);
    setDisplayList(pageSlice);
  }, [fullList, page, limit, statusFilter, q]);

  useEffect(() => {
    if (orders && Array.isArray(orders) && orders.length) {
      if (!statusFilter && !q) {
        setFullList(orders);
      }
    }
  }, [orders, statusFilter, q]);

  const handleView = async (order) => {
    try {
      const detail = await fetchOrderDetail(order.order_id);
      setSelected(detail);
    } catch (err) {
      // fetchOrderDetail will toast
    }
  };

  const handleCloseModal = () => setSelected(null);

  const handleShip = async (order) => {
    try {
      setProcessingId(order.order_id);
      const updated = await shipOrder(order.order_id, {}, null);
      setFullList((prev) => prev.map((x) => (x.order_id === updated.order_id ? updated : x)));
      setDisplayList((prev) => prev.map((x) => (x.order_id === updated.order_id ? updated : x)));
      setProcessingId(null);
      setRefreshKey((k) => k + 1);
      toast.success("Đã cập nhật trạng thái sang 'shipping'.");
    } catch (err) {
      setProcessingId(null);
    }
  };

  const handleComplete = async (order) => {
    try {
      setProcessingId(order.order_id);
      const updated = await completeOrder(order.order_id, {}, null);
      setFullList((prev) => prev.map((x) => (x.order_id === updated.order_id ? updated : x)));
      setDisplayList((prev) => prev.map((x) => (x.order_id === updated.order_id ? updated : x)));
      setProcessingId(null);
      setRefreshKey((k) => k + 1);
      toast.success("Đã đặt trạng thái 'completed'.");
    } catch (err) {
      setProcessingId(null);
    }
  };

  const handleCancel = async (order) => {
    try {
      setProcessingId(order.order_id);
      const updated = await cancelOrder(order.order_id, {}, null);
      setFullList((prev) => prev.map((x) => (x.order_id === updated.order_id ? updated : x)));
      setDisplayList((prev) => prev.map((x) => (x.order_id === updated.order_id ? updated : x)));
      setProcessingId(null);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setProcessingId(null);
    }
  };

  const totalPages = useMemo(() => {
    if (!total || !limit) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: fullList.length,
      confirmed: fullList.filter(o => o.status === 'confirmed' || o.status === 'paid').length,
      shipping: fullList.filter(o => o.status === 'shipping').length,
      completed: fullList.filter(o => o.status === 'completed').length,
      cancelled: fullList.filter(o => o.status === 'cancelled').length,
    };
  }, [fullList]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg">
            <ShoppingBag className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Quản lý Đơn hàng
          </h1>
        </div>
        <p className="text-gray-600 ml-15">Theo dõi và quản lý tất cả đơn hàng của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Tổng đơn</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
              <Package className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Chưa xử lý</p>
              <p className="text-2xl font-bold text-orange-600 mt-1">{stats.confirmed}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-md">
              <Clock className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Đang giao</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.shipping}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-md">
              <Truck className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Đã giao</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-md">
              <CheckCircle className="text-white" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:scale-105">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm font-medium">Đã hủy</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{stats.cancelled}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center shadow-md">
              <XCircle className="text-white" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-100">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <select
                className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 font-medium text-gray-700 hover:border-blue-300"
                value={statusFilter}
                onChange={(e) => {
                  setPage(1);
                  setStatusFilter(e.target.value);
                }}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="confirmed">Chưa xử lý</option>
                <option value="shipping">Đang giao</option>
                <option value="completed">Đã giao</option>
                <option value="cancelled">Đã huỷ</option>
                <option value="paid">Đã thanh toán</option>
              </select>
            </div>
          </div>

          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..."
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 font-medium"
            />
          </div>

          <button
            onClick={() => {
              setPage(1);
              setStatusFilter("");
              setQ("");
              setRefreshKey((k) => k + 1);
            }}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2 transform hover:scale-105"
          >
            <RefreshCw size={18} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Mã đơn</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Khách hàng</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Tổng tiền</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Ngày đặt</th>
                <th className="px-6 py-4 text-left text-sm font-bold uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {displayList.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-12 text-center text-gray-500" colSpan={6}>
                    <div className="flex flex-col items-center gap-3">
                      <Package size={48} className="text-gray-300" />
                      <p className="text-lg font-medium">Không có đơn hàng nào</p>
                    </div>
                  </td>
                </tr>
              )}
              {displayList.map((order) => (
                <OrderRow
                  key={order.order_id}
                  o={order}
                  onView={handleView}
                  onShip={handleShip}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                  processingId={processingId}
                />
              ))}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="p-8 text-center">
            <RefreshCw className="animate-spin mx-auto text-blue-600 mb-3" size={32} />
            <p className="text-gray-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 bg-white rounded-xl shadow-lg p-4 border border-gray-100">
        <div className="text-gray-600 font-medium">
          Hiển thị <span className="font-bold text-gray-800">{displayList.length}</span> / <span className="font-bold text-gray-800">{total}</span> đơn hàng
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={18} />
            Trước
          </button>
          <div className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-bold shadow-md">
            {page} / {totalPages}
          </div>
          <button
            className="px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-gray-600 hover:to-gray-700 transition-all duration-300 font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-slideUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Package className="text-white" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Chi tiết đơn hàng</h2>
                    <p className="text-blue-100 font-mono mt-1">#{selected.order_id}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-all duration-300 flex items-center justify-center transform hover:scale-110"
                >
                  <XCircle size={24} />
                </button>
              </div>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-md">
                      <User className="text-white" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Thông tin khách hàng</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-lg">{selected.customer?.name ?? selected.customer ?? "-"}</p>
                    </div>
                    {selected.customer?.email && (
                      <p className="text-gray-600 flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        {selected.customer.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-md">
                      <MapPin className="text-white" size={20} />
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Địa chỉ giao hàng</h3>
                  </div>
                  <p className="text-gray-700 leading-relaxed">
                    {selected.shipping?.address ?? selected.raw?.shipping_address ?? "-"}
                  </p>
                </div>
              </div>

              {/* Products */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6 border border-gray-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-md">
                    <ShoppingBag className="text-white" size={20} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">Sản phẩm trong đơn</h3>
                </div>
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-bold text-gray-700">Tên sản phẩm</th>
                        <th className="px-4 py-3 text-center text-sm font-bold text-gray-700">Số lượng</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Đơn giá</th>
                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(selected.items || []).map((it, idx) => (
                        <tr key={idx} className="hover:bg-blue-50 transition-colors duration-200">
                          <td className="px-4 py-3 font-medium text-gray-800">
                            {it.product_name ?? it.name ?? it.product_id}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-semibold text-sm">
                              {it.quantity ?? 1}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-gray-700 font-medium">
                            {Number(it.price ?? 0).toLocaleString()} ₫
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-gray-800">
                            {(Number(it.price ?? 0) * Number(it.quantity ?? 1)).toLocaleString()} ₫
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <DollarSign size={32} />
                    <span className="text-xl font-semibold">Tổng thanh toán</span>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold">
                      {Number(selected.final_price ?? selected.raw?.final_price ?? 0).toLocaleString()} ₫
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}