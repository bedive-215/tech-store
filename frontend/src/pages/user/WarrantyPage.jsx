import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAuth } from "@/hooks/useAuth";
import { useWarranty } from "@/providers/WarrantyProvider";
import { useOrder } from "@/providers/OrderProvider";
import { ChevronDown, Package, Calendar, DollarSign, X } from "lucide-react";

const COLORS = {
  primary: "#F97316",
  primaryHover: "#EA580C",
  bgGrayLight: "#F3F4F6",
  textGray: "#6B7280",
  borderLight: "#E5E7EB",
  error: "#F87171",
};

export default function WarrantyPage() {
  const { accessToken } = useAuth();
  const {
    warranties,
    loading: warrantyLoading,
    createWarranty,
    fetchMyWarranties,
  } = useWarranty();
  const { fetchOrders } = useOrder();

  const [form, setForm] = useState({
    order_id: "",
    product_id: "",
    serial: "",
    issue_description: "",
  });

 const [files, setFiles] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrderInfo, setSelectedOrderInfo] = useState(null);
  const [selectedProductInfo, setSelectedProductInfo] = useState(null);

  // Load danh sách đơn hàng hoàn thành
  useEffect(() => {
    if (!accessToken) return;

    const loadCompletedOrders = async () => {
      setLoadingOrders(true);
      try {
        const result = await fetchOrders({}, accessToken);
        
        // Lọc chỉ lấy đơn hàng có status = "completed"
        const completed = (result.data || []).filter(
          order => order.status?.toLowerCase() === "completed"
        );
        
        setCompletedOrders(completed);
      } catch (err) {
        console.error("Lỗi khi tải đơn hàng:", err);
        toast.error("Không thể tải danh sách đơn hàng");
      } finally {
        setLoadingOrders(false);
      }
    };

    loadCompletedOrders();
    
    fetchMyWarranties(accessToken)
      .then(() => console.log("fetchMyWarranties thành công"))
      .catch(err => toast.error("Không thể tải danh sách bảo hành"));
  }, [accessToken, fetchOrders, fetchMyWarranties]);

  const handleSelectProduct = (order, product) => {
    setForm({
      ...form,
      order_id: order.order_id,
      product_id: product.product_id,
    });
    setSelectedOrderInfo(order);
    setSelectedProductInfo(product);
    setShowOrderModal(false);
  };

  const handleRemoveSelection = () => {
    setForm({
      ...form,
      order_id: "",
      product_id: "",
    });
    setSelectedOrderInfo(null);
    setSelectedProductInfo(null);
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

const handleFileChange = (e) => {
  const selectedFiles = Array.from(e.target.files || []);

  // Giới hạn số file
  if (selectedFiles.length > 5) {
    toast.error("Tối đa 5 hình ảnh");
    e.target.value = "";
    return;
  }

  // Giới hạn dung lượng 5MB/file
  for (const file of selectedFiles) {
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File ${file.name} vượt quá 5MB`);
      e.target.value = "";
      return;
    }
  }

  // Set file vào state
  setFiles(selectedFiles);
};



  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!form.order_id || !form.product_id || !form.issue_description) {
    toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
    return;
  }

  setSubmitting(true);

  try {
    // Tạo payload
    const payload = {
      product_id: form.product_id,
      order_id: form.order_id,
      serial: form.serial || undefined,
      issue_description: form.issue_description,
      files: files.length ? files : undefined, // Gửi file nếu có
    };

    // Gọi API tạo bảo hành
    await createWarranty(payload, accessToken);

    toast.success("Gửi yêu cầu bảo hành thành công");

    // Reset form và file
    setForm({
      order_id: "",
      product_id: "",
      serial: "",
      issue_description: "",
    });
    setSelectedOrderInfo(null);
    setSelectedProductInfo(null);
    setFiles([]);

    // Reset input file DOM (nếu muốn)
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";

    // Reload danh sách bảo hành
    await fetchMyWarranties(accessToken);

  } catch (err) {
    console.error(err);
    const errorMessage =
      err?.response?.data?.message || 
      err?.message || 
      "Gửi yêu cầu thất bại";
    toast.error(errorMessage);
  } finally {
    setSubmitting(false);
  }
};


  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return { bg: "#FEF3C7", text: "#92400E" };
      case "APPROVED":
        return { bg: "#D1FAE5", text: "#065F46" };
      case "REJECTED":
        return { bg: "#FEE2E2", text: "#991B1B" };
      case "COMPLETED":
        return { bg: "#DBEAFE", text: "#1E40AF" };
      default:
        return { bg: COLORS.bgGrayLight, text: COLORS.textGray };
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      PENDING: "Chờ xử lý",
      APPROVED: "Đã duyệt",
      REJECTED: "Từ chối",
      COMPLETED: "Hoàn thành",
    };
    return statusMap[status?.toUpperCase()] || status || "Chờ xử lý";
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM TẠO BẢO HÀNH */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow p-6">
          <h2
            className="text-xl font-semibold mb-4"
            style={{ color: COLORS.primary }}
          >
            Tạo yêu cầu bảo hành
          </h2>

          {loadingOrders ? (
  <div className="text-center py-8">
    <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500"></div>
    <p className="mt-2 text-sm text-gray-500">Đang tải đơn hàng...</p>
  </div>
) : completedOrders.length === 0 ? (
  <div className="text-center py-8">
    <p className="text-gray-500 text-sm">
      Bạn chưa có đơn hàng nào đã hoàn thành.
    </p>
    <p className="text-xs text-gray-400 mt-2">
      Chỉ có thể tạo bảo hành cho đơn hàng đã hoàn thành.
    </p>
  </div>
) : (
  // **Chỉnh sửa ở đây**
  <form onSubmit={handleSubmit} className="space-y-4">
    {/* Chọn đơn hàng và sản phẩm */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Chọn đơn hàng và sản phẩm *
      </label>
      {selectedOrderInfo && selectedProductInfo ? (
        <div className="border-2 border-orange-200 rounded-lg p-4 bg-orange-50">
          {/* Nội dung hiển thị order + product */}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowOrderModal(true)}
          className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-orange-400 hover:bg-orange-50 transition text-left"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Package className="text-gray-400" size={24} />
              <span className="text-gray-600">Chọn đơn hàng...</span>
            </div>
            <ChevronDown className="text-gray-400" size={20} />
          </div>
        </button>
      )}
    </div>

    {/* Serial */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Serial (tùy chọn)
      </label>
      <input
        name="serial"
        value={form.serial}
        onChange={handleChange}
        placeholder="Nhập serial sản phẩm"
        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>

    {/* Mô tả lỗi */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Mô tả lỗi *
      </label>
      <textarea
        name="issue_description"
        value={form.issue_description}
        onChange={handleChange}
        placeholder="Mô tả chi tiết vấn đề của sản phẩm..."
        required
        rows={4}
        className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
      />
    </div>

    {/* Hình ảnh */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Hình ảnh đính kèm (tùy chọn)
      </label>
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
      />
      {files.length > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          Đã chọn {files.length} file
        </p>
      )}
    </div>

    {/* Nút gửi */}
    <button
      type="submit"
      disabled={submitting || warrantyLoading}
      style={{ backgroundColor: COLORS.primary }}
      className="w-full text-white py-3 rounded-lg font-medium hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {submitting ? "Đang gửi..." : "Gửi yêu cầu bảo hành"}
    </button>
  </form>
)}

     
        </div>

        {/* DANH SÁCH BẢO HÀNH */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2
              className="text-xl font-semibold"
              style={{ color: COLORS.primary }}
            >
              Yêu cầu bảo hành của tôi
            </h2>
            <button
              type="button"
              onClick={() => accessToken && fetchMyWarranties(accessToken)}
              disabled={warrantyLoading}
              className="text-sm text-orange-600 hover:text-orange-700 disabled:opacity-50"
            >
              {warrantyLoading ? "Đang tải..." : "🔄 Làm mới"}
            </button>
          </div>

          {warrantyLoading && !warranties?.length ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
              <p className="mt-2 text-sm text-gray-500">Đang tải dữ liệu...</p>
            </div>
          ) : !warranties?.length ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Bạn chưa có yêu cầu bảo hành nào.</p>
              <p className="text-sm text-gray-400 mt-2">
                Hãy tạo yêu cầu bảo hành đầu tiên của bạn!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
           {warranties.map((w) => {
  const statusColors = getStatusColor(w.status);

  // Parse url thành mảng (nếu có)
  let images = [];
  if (w.url) {
    try {
      images = JSON.parse(w.url); // w.url là string kiểu JSON array
    } catch (err) {
      console.error("Lỗi parse url:", err);
    }
  }

  return (
    <div
      key={w.id || w._id}
      className="border rounded-lg p-4 hover:shadow-md transition"
    >
      <div className="flex justify-between items-start mb-3">
        <div>
          <p className="text-sm text-gray-500">
            Đơn hàng: <span className="font-medium">{w.order_id}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            ID: {w.id || w._id}
          </p>
        </div>
        <span
          className="text-xs font-medium px-3 py-1 rounded-full"
          style={{
            backgroundColor: statusColors.bg,
            color: statusColors.text,
          }}
        >
          {getStatusLabel(w.status)}
        </span>
      </div>

      <div className="space-y-2">
        <p className="text-sm">
          <strong className="text-gray-700">Sản phẩm:</strong>{" "}
          <span className="text-gray-600">{w.product_id}</span>
        </p>

        {w.serial && (
          <p className="text-sm">
            <strong className="text-gray-700">Serial:</strong>{" "}
            <span className="text-gray-600">{w.serial}</span>
          </p>
        )}

        <div className="pt-2 border-t">
          <p className="text-sm">
            <strong className="text-gray-700">Mô tả lỗi:</strong>
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {w.issue_description}
          </p>
        </div>

        {/* Hiển thị hình ảnh nếu có */}
        {images.length > 0 && (
          <div className="pt-2 border-t flex flex-wrap gap-2 mt-2">
            {images.map((imgUrl, idx) => (
              <img
                key={idx}
                src={imgUrl}
                alt={`Hình ảnh bảo hành ${idx + 1}`}
                className="w-20 h-20 object-cover rounded border"
              />
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mt-3 pt-3 border-t">
        <p className="text-xs text-gray-400">
          Ngày tạo: {new Date(w.created_at || w.createdAt).toLocaleString("vi-VN")}
        </p>
        {w.updated_at && w.updated_at !== w.created_at && (
          <p className="text-xs text-gray-400">
            Cập nhật: {new Date(w.updated_at).toLocaleString("vi-VN")}
          </p>
        )}
      </div>
    </div>
  );
})}

            </div>
          )}
        </div>
      </div>

      {/* MODAL CHỌN ĐƠN HÀNG VÀ SẢN PHẨM */}
      {showOrderModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-800">
                Chọn đơn hàng và sản phẩm
              </h3>
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4">
                {completedOrders.map((order) => (
                  <div
                    key={order.order_id}
                    className="border-2 border-gray-200 rounded-xl overflow-hidden hover:border-orange-300 transition"
                  >
                    {/* Thông tin đơn hàng */}
                    <div className="bg-gradient-to-r from-orange-50 to-white p-4 border-b">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="text-orange-500" size={20} />
                            <span className="text-sm font-semibold text-gray-800">
                              Đơn hàng #{order.order_id.slice(0, 12)}...
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar size={14} />
                              <span>{new Date(order.created_at).toLocaleDateString("vi-VN")}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign size={14} />
                              <span className="font-semibold text-orange-600">
                                {formatCurrency(order.final_price)}
                              </span>
                            </div>
                          </div>
                        </div>
                        <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
                          Hoàn thành
                        </span>
                      </div>
                      
                      {order.shipping_address && (
                        <p className="text-xs text-gray-500 mt-2">
                          📍 {order.shipping_address}
                        </p>
                      )}
                    </div>

                    {/* Danh sách sản phẩm */}
                    <div className="p-4 space-y-3">
                      {order.items && order.items.length > 0 ? (
                        order.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-orange-50 transition group"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-800 mb-1">
                                {item.product_name}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span>SL: {item.quantity}</span>
                                <span className="text-orange-600 font-semibold">
                                  {formatCurrency(item.price)}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSelectProduct(order, item)}
                              className="ml-4 px-4 py-2 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600 transition opacity-0 group-hover:opacity-100"
                            >
                              Chọn
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-400 text-center py-4">
                          Không có sản phẩm
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50">
              <button
                type="button"
                onClick={() => setShowOrderModal(false)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition text-gray-700 font-medium"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}