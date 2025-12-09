// src/pages/admin/Orders.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useOrder } from "@/providers/OrderProvider";
import { toast } from "react-toastify";

function StatusBadge({ status }) {
  const map = {
    pending: { text: "Chưa xử lý", cls: "bg-yellow-100 text-yellow-800" },
    shipping: { text: "Đang giao", cls: "bg-blue-100 text-blue-800" },
    completed: { text: "Đã giao", cls: "bg-green-100 text-green-800" },
    cancelled: { text: "Đã huỷ", cls: "bg-red-100 text-red-800" },
  };

  const item = map[status] || { text: status || "-", cls: "bg-gray-100 text-gray-800" };
  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${item.cls}`}>
      {item.text}
    </span>
  );
}

function OrderRow({ o, onView, onShip, onComplete, processingId }) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-2 border">{o.order_id}</td>
      <td className="px-4 py-2 border">{o.customer?.name ?? o.customer ?? (o.raw?.customer_name ?? "-")}</td>
      <td className="px-4 py-2 border">{Number(o.total_amount ?? o.raw?.total_price ?? 0).toLocaleString()} ₫</td>
      <td className="px-4 py-2 border">
        <StatusBadge status={o.status} />
      </td>
      <td className="px-4 py-2 border">{new Date(o.created_at ?? o.raw?.created_at ?? Date.now()).toLocaleDateString()}</td>
      <td className="px-4 py-2 border">
        <div className="flex gap-2">
          <button
            onClick={() => onView(o)}
            className="px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Xem
          </button>

          {o.status === "pending" && (
            <button
              onClick={() => onShip(o)}
              disabled={processingId === o.order_id}
              className="px-3 py-1 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
            >
              {processingId === o.order_id ? "Đang xử lý..." : "Đặt shipping"}
            </button>
          )}

          {o.status === "shipping" && (
            <button
              onClick={() => onComplete(o)}
              disabled={processingId === o.order_id}
              className="px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {processingId === o.order_id ? "Đang xử lý..." : "Đánh dấu hoàn thành"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function Orders() {
  const {
    orders, // provider may sync but we'll keep our local full list
    setOrders,
    fetchAllOrders,
    fetchOrderDetail,
    shipOrder,
    completeOrder,
    loading,
  } = useOrder();

  // local state
  const [fullList, setFullList] = useState([]); // full list fetched from server (no params)
  const [displayList, setDisplayList] = useState([]); // paginated & filtered list
  const [page, setPage] = useState(1);
  const [limit] = useState(10); // client-side page size
  const [statusFilter, setStatusFilter] = useState("");
  const [q, setQ] = useState("");
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0); // force refetch after actions

  // Fetch full list from server (no query params) whenever refreshKey changes
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const resp = await fetchAllOrders(); // CALLS: GET /api/v1/orders/admin/all (no params)
        // resp.data expected to be an array (provider normalizes)
        const data = resp.data ?? [];
        const arr = Array.isArray(data) ? data : [];
        if (!mounted) return;

        setFullList(arr);
        setPage(1); // reset to first page on fresh fetch
      } catch (err) {
        toast.error("Không thể tải danh sách đơn (server).");
      }
    })();

    return () => (mounted = false);
  }, [fetchAllOrders, refreshKey]);

  // Apply filter/search + client-side pagination
  useEffect(() => {
    // filter by status and search q (search in order_id and customer name)
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

    // paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    const pageSlice = filtered.slice(start, end);

    setDisplayList(pageSlice);
  }, [fullList, page, limit, statusFilter, q]);

  // sync provider orders if provider updated (but don't override local filters)
  useEffect(() => {
    if (orders && Array.isArray(orders) && orders.length) {
      // only update fullList if no active filter/search to avoid surprising UI changes
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
      const updated = await shipOrder(order.order_id, {}, null); // provider will confirm
      // update local lists
      setFullList((prev) => prev.map((x) => (x.order_id === updated.order_id ? updated : x)));
      setDisplayList((prev) => prev.map((x) => (x.order_id === updated.order_id ? updated : x)));
      setProcessingId(null);
      setRefreshKey((k) => k + 1);
      toast.success("Đã cập nhật trạng thái sang 'shipping'.");
    } catch (err) {
      setProcessingId(null);
      // provider toasts on error
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

  const totalPages = useMemo(() => {
    if (!total || !limit) return 1;
    return Math.max(1, Math.ceil(total / limit));
  }, [total, limit]);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Quản lý Đơn hàng (Admin)</h1>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex gap-2 items-center">
          <select
            className="px-4 py-2 border rounded-lg"
            value={statusFilter}
            onChange={(e) => {
              setPage(1);
              setStatusFilter(e.target.value);
            }}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chưa xử lý</option>
            <option value="shipping">Đang giao</option>
            <option value="completed">Đã giao</option>
            <option value="cancelled">Đã huỷ</option>
          </select>

          <select
            className="px-4 py-2 border rounded-lg"
            value={limit}
            onChange={() => {}}
            disabled
            title="Số bản ghi mỗi trang hiện cố định"
          >
            <option value={10}>10 / trang</option>
          </select>
        </div>

        <div className="flex-1">
          <input
            type="text"
            placeholder="Tìm kiếm theo mã đơn hoặc khách hàng..."
            value={q}
            onChange={(e) => {
              setPage(1);
              setQ(e.target.value);
            }}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setPage(1);
              setStatusFilter("");
              setQ("");
              setRefreshKey((k) => k + 1);
            }}
            className="px-4 py-2 bg-gray-200 rounded-md"
          >
            Làm mới
          </button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-md shadow">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-4 py-2 border">Mã đơn</th>
              <th className="px-4 py-2 border">Khách hàng</th>
              <th className="px-4 py-2 border">Tổng tiền</th>
              <th className="px-4 py-2 border">Trạng thái</th>
              <th className="px-4 py-2 border">Ngày đặt</th>
              <th className="px-4 py-2 border">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {displayList.length === 0 && !loading && (
              <tr>
                <td className="px-4 py-6 text-center" colSpan={6}>
                  Không có đơn hàng.
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
                processingId={processingId}
              />
            ))}
          </tbody>
        </table>

        {loading && (
          <div className="p-4 text-center">Đang tải...</div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div>
          <span className="text-sm text-gray-600">
            Tổng: {total ?? displayList.length} đơn
          </span>
        </div>

        <div className="flex gap-2 items-center">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="px-3 py-1 border rounded bg-white">
            {page} / {totalPages}
          </span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white w-full max-w-3xl rounded-md shadow-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Chi tiết đơn {selected.order_id}</h2>
              <button
                onClick={handleCloseModal}
                className="px-3 py-1 bg-gray-200 rounded"
              >
                Đóng
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="font-semibold">Khách hàng</h3>
                <div>{selected.customer?.name ?? selected.customer ?? "-"}</div>
                {selected.customer?.email && <div className="text-sm text-gray-600">{selected.customer.email}</div>}
              </div>

              <div>
                <h3 className="font-semibold">Địa chỉ giao</h3>
                <div className="text-sm text-gray-700">{selected.shipping?.address ?? selected.raw?.shipping_address ?? "-"}</div>
              </div>
            </div>

            <div className="mb-4">
              <h3 className="font-semibold">Sản phẩm</h3>
              <div className="mt-2">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-gray-500">
                    <tr>
                      <th className="pb-2">Tên</th>
                      <th className="pb-2">Số lượng</th>
                      <th className="pb-2">Giá</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(selected.items || []).map((it, idx) => (
                      <tr key={idx} className="border-t">
                        <td className="py-2">{it.product_name ?? it.name ?? it.product_id}</td>
                        <td className="py-2">{it.quantity ?? 1}</td>
                        <td className="py-2">{Number(it.price ?? 0).toLocaleString()} ₫</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <div className="text-right">
                <div className="text-sm text-gray-500">Tổng</div>
                <div className="text-lg font-bold">{Number(selected.total_amount ?? selected.raw?.final_price ?? 0).toLocaleString()} ₫</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
