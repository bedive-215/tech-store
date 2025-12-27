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
      bg: "bg-amber-100",
      text_color: "text-amber-800",
      border: "border-amber-200",
      icon: Clock,
    },
    shipping: { 
      text: "Đang giao", 
      bg: "bg-blue-100",
      text_color: "text-blue-800",
      border: "border-blue-200",
      icon: Truck,
    },
    completed: { 
      text: "Đã giao", 
      bg: "bg-emerald-100",
      text_color: "text-emerald-800",
      border: "border-emerald-200",
      icon: CheckCircle,
    },
    cancelled: { 
      text: "Đã huỷ", 
      bg: "bg-rose-100",
      text_color: "text-rose-800",
      border: "border-rose-200",
      icon: XCircle,
    },
    paid: { 
      text: "Đã thanh toán", 
      bg: "bg-purple-100",
      text_color: "text-purple-800",
      border: "border-purple-200",
      icon: DollarSign,
    },
  };
  
  const config = statusConfig[status] || { 
    text: status || "-", 
    bg: "bg-gray-100",
    text_color: "text-gray-800",
    border: "border-gray-200",
    icon: Package,
  };
  
  const Icon = config.icon;
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${config.bg} ${config.text_color} border ${config.border}`}>
      <Icon size={14} />
      {config.text}
    </span>
  );
}

function OrderRow({ o, onView, onShip, onComplete, onCancel, processingId }) {
  const isProcessing = processingId === o.order_id;
  
  return (
    <tr className="group hover:bg-slate-50 transition-colors duration-200 border-b border-slate-100">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
            <Package size={20} />
          </div>
          <span className="font-mono font-semibold text-slate-900">{o.order_id}</span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {(o.customer?.name ?? o.customer ?? "?")[0].toUpperCase()}
          </div>
          <span className="font-medium text-slate-700">
            {o.customer?.name ?? o.customer ?? (o.raw?.customer_name ?? "-")}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
          <DollarSign size={16} className="text-emerald-600" />
          {Number(o.final_price ?? o.raw?.final_price ?? 0).toLocaleString()} ₫
        </div>
      </td>
      <td className="px-6 py-4">
        <StatusBadge status={o.status} />
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
          <Calendar size={14} />
          {new Date(o.created_at ?? o.raw?.created_at ?? Date.now()).toLocaleDateString('vi-VN')}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <button
            onClick={() => onView(o)}
            className="p-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 shadow-sm"
            title="Xem chi tiết"
          >
            <Eye size={18} />
          </button>
          {(o.status === "confirmed" || o.status === "paid") && (
            <button
              onClick={() => onShip(o)}
              disabled={isProcessing}
              className="p-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
              title="Đặt shipping"
            >
              {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <Truck size={18} />}
            </button>
          )}
          {o.status === "shipping" && (
            <button
              onClick={() => onComplete(o)}
              disabled={isProcessing}
              className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
              title="Đánh dấu hoàn thành"
            >
              {isProcessing ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
            </button>
          )}
          {o.status !== "completed" && o.status !== "cancelled" && (
            <button
              onClick={() => onCancel(o)}
              disabled={isProcessing}
              className="p-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
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
    const resp = await fetchOrderDetail(order.order_id);
    console.log("Order detail:", resp);
    // Nếu resp có data bên trong thì setSelected(resp.data)
    setSelected(resp.data ?? resp);
  } catch (err) {
    // fetchOrderDetail sẽ toast
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
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-200/50">
            <ShoppingBag className="text-white" size={24} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">
            Quản lý Đơn hàng
          </h1>
        </div>
        <p className="text-slate-600 ml-15">Theo dõi và quản lý tất cả đơn hàng của bạn</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Tổng đơn</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Package className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Chưa xử lý</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">{stats.confirmed}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="text-amber-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Đang giao</p>
              <p className="text-2xl font-bold text-blue-600 mt-1">{stats.shipping}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Truck className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Đã giao</p>
              <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.completed}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
              <CheckCircle className="text-emerald-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-sm font-medium">Đã hủy</p>
              <p className="text-2xl font-bold text-rose-600 mt-1">{stats.cancelled}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center">
              <XCircle className="text-rose-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border border-slate-200">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex gap-3 flex-wrap">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
              <select
                className="pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium text-slate-700"
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
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hoặc tên khách hàng..."
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 font-medium"
            />
          </div>

          <button
            onClick={() => {
              setPage(1);
              setStatusFilter("");
              setQ("");
              setRefreshKey((k) => k + 1);
            }}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-200 shadow-sm flex items-center gap-2"
          >
            <RefreshCw size={18} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Mã đơn</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Khách hàng</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tổng tiền</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Trạng thái</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Ngày đặt</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayList.length === 0 && !loading && (
                <tr>
                  <td className="px-6 py-12 text-center text-slate-500" colSpan={6}>
                    <div className="flex flex-col items-center gap-3">
                      <Package size={48} className="text-slate-300" />
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
            <p className="text-slate-600 font-medium">Đang tải dữ liệu...</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 bg-white rounded-xl shadow-sm p-4 border border-slate-200">
        <div className="text-slate-600 font-medium">
          Hiển thị <span className="font-bold text-slate-900">{displayList.length}</span> / <span className="font-bold text-slate-900">{total}</span> đơn hàng
        </div>
        <div className="flex gap-2 items-center">
          <button
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors duration-200 font-semibold flex items-center gap-2"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            <ChevronLeft size={18} />
            Trước
          </button>
          <div className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold">
            {page} / {totalPages}
          </div>
          <button
            className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors duration-200 font-semibold flex items-center gap-2"
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
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden">
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-8 py-6">
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
            className="w-10 h-10 rounded-lg bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white transition-colors duration-200 flex items-center justify-center"
          >
            <XCircle size={24} />
          </button>
        </div>
      </div>

      <div className="p-8 max-h-[70vh] overflow-y-auto space-y-6">
        {/* Customer Info */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-center gap-3 mb-4">
            <User className="text-blue-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Thông tin khách hàng</h3>
          </div>
         <p className="font-bold text-slate-900 text-lg">{selected.customer?.full_name ?? "-"}</p>
{selected.customer?.email && <p className="text-slate-600">Email: {selected.customer.email}</p>}
{selected.customer?.phone_number && <p className="text-slate-600">SĐT: {selected.customer.phone_number}</p>}


        </div>

        {/* Shipping Info */}
        <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="text-emerald-600" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Địa chỉ giao hàng</h3>
          </div>
          {selected.shipping_address ?? selected.raw?.shipping_address ?? "-"}
        </div>

        {/* Products */}
        <div className="bg-slate-50 rounded-xl p-6 border border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <ShoppingBag className="text-slate-700" size={20} />
            <h3 className="text-lg font-bold text-slate-900">Sản phẩm trong đơn</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-slate-700">Tên sản phẩm</th>
                  <th className="px-4 py-2 text-center text-sm font-semibold text-slate-700">Số lượng</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">Đơn giá</th>
                  <th className="px-4 py-2 text-right text-sm font-semibold text-slate-700">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(selected.items || []).map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors duration-200">
                    <td className="px-4 py-2">{item.product_name}</td>
                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                    <td className="px-4 py-2 text-right">{Number(item.price ?? 0).toLocaleString()} ₫</td>
                    <td className="px-4 py-2 text-right font-bold">
                      {(Number(item.price ?? 0) * Number(item.quantity ?? 1)).toLocaleString()} ₫
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
          <div className="space-y-2 text-right">
            <div>
              <span className="font-medium">Tổng tiền: </span>
              {Number(selected.total_price ?? 0).toLocaleString()} ₫
            </div>
            <div>
              <span className="font-medium">Giảm giá: </span>
              {Number(selected.discount_amount ?? 0).toLocaleString()} ₫
            </div>
            <div className="text-2xl font-bold">
              <span>Tổng thanh toán: </span>
              {Number(selected.final_price ?? 0).toLocaleString()} ₫
            </div>
            <div>
              <span className="font-medium">Trạng thái: </span>
              <StatusBadge status={selected.status} />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

    </div>
  );
}