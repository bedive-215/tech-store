import React, { useState, useEffect } from "react";
import { useFlashSale } from "@/providers/FlashSaleProvider";
import { toast } from "react-toastify";
import { useProduct } from "@/providers/ProductProvider";


// NOTE: Using the COLORS inline as you requested (do NOT import from other file)
const COLORS = {
  primary: "#F97316",
  primaryHover: "#EA580C",
  primaryGradientStart: "#F97316",
  primaryGradientEnd: "#C2410C",
  secondary: "#FCD34D",
  secondaryHover: "#FBBF24",
  bgLight: "#FFFFFF",
  bgDark: "#1F2937",
  bgGrayLight: "#F3F4F6",
  bgGrayDark: "#374151",
  textLight: "#111827",
  textDark: "#F9FAFB",
  textGray: "#6B7280",
  borderLight: "#E5E7EB",
  borderDark: "#4B5563",
  error: "#F87171",
  white: "#FFFFFF",
  black: "#000000",
  shadowLight: "0 4px 6px rgba(0,0,0,0.1)",
  shadowDark: "0 4px 6px rgba(0,0,0,0.3)",
};

export default function AdminFlashSalePage() {
  const {
    flashSales,
    current,
    fetchActiveFlashSales,
    fetchFlashSaleDetail,
    createFlashSale,
    addItemToFlashSale,
    removeItemFromFlashSale,
    loading,
  } = useFlashSale();

  // Local UI states
  const [createForm, setCreateForm] = useState({ name: "", start_at: "", end_at: "" });
  const [selectedFlashSaleId, setSelectedFlashSaleId] = useState(null);
  const [itemForm, setItemForm] = useState({ product_id: "", sale_price: "", stock_limit: "" });
  const [showAddItem, setShowAddItem] = useState(false);
const { fetchProducts } = useProduct();
const [products, setProducts] = useState([]);
const [productLoading, setProductLoading] = useState(false);

  useEffect(() => {
    // load active flash sales on mount
    fetchActiveFlashSales().catch(() => {});
  }, []);

  const onCreateSubmit = async (e) => {
    e.preventDefault();

    if (!createForm.name || !createForm.start_at || !createForm.end_at) {
      toast.error("Vui lòng điền đầy đủ thông tin flash sale");
      return;
    }

    try {
      const payload = {
        name: createForm.name,
        start_at: new Date(createForm.start_at).toISOString(),
        end_at: new Date(createForm.end_at).toISOString(),
      };

      const created = await createFlashSale(payload);
      toast.success("Tạo Flash Sale thành công");
      setCreateForm({ name: "", start_time: "", end_time: "" });
      // optionally fetch list again
      await fetchActiveFlashSales();
      // open detail view
      if (created && (created.id || created._id)) {
        handleViewDetail(created.id ?? created._id);
      }
    } catch (err) {
      console.error(err);
      // createFlashSale already shows toast
    }
  };

  const handleViewDetail = async (id) => {
    setSelectedFlashSaleId(id);
    try {
      await fetchFlashSaleDetail(id);
    } catch (err) {
      console.error(err);
    }
  };

 const openAddItem = async (flashSaleId) => {
  setSelectedFlashSaleId(flashSaleId);
  setItemForm({ product_id: "", sale_price: "", stock_limit: "" });
  setShowAddItem(true);

  try {
    setProductLoading(true);
    const list = await fetchProducts({ limit: 1000 }); 
    setProducts(list);
  } catch (err) {
    console.error(err);
  } finally {
    setProductLoading(false);
  }
};


  const onAddItemSubmit = async (e) => {
    e.preventDefault();
    if (!itemForm.product_id || !itemForm.sale_price) {
      toast.error("Vui lòng nhập product_id và sale_price");
      return;
    }

    try {
      const payload = {
        product_id: itemForm.product_id,
        sale_price: Number(itemForm.sale_price),
        stock_limit: itemForm.stock_limit ? Number(itemForm.stock_limit) : undefined,
      };

      const added = await addItemToFlashSale(selectedFlashSaleId, payload);
      toast.success("Thêm sản phẩm thành công");
      setShowAddItem(false);
      // refresh detail
      await fetchFlashSaleDetail(selectedFlashSaleId);
    } catch (err) {
      console.error(err);
    }
  };

  const onRemoveItem = async (itemId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi Flash Sale?")) return;
    try {
      await removeItemFromFlashSale(itemId);
      toast.success("Xóa thành công");
      // refresh detail
      if (selectedFlashSaleId) await fetchFlashSaleDetail(selectedFlashSaleId);
      await fetchActiveFlashSales();
    } catch (err) {
      console.error(err);
    }
  };

  return (
  <div className="p-6 min-h-screen admin-light">
    <div className="max-w-6xl mx-auto">

      {/* HEADER */}
      <header className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center gap-2"
          style={{ color: COLORS.primary }}>
          ⚡ Quản lý Flash Sale
        </h1>

        <button
          onClick={() => fetchActiveFlashSales()}
          className="px-4 py-2 rounded-xl font-medium shadow hover:scale-105 transition"
          style={{
            background: COLORS.primaryGradientStart,
            color: COLORS.white
          }}
        >
          Tải lại danh sách
        </button>
      </header>

      {/* CREATE FLASH SALE */}
      <section className="mb-10 bg-white p-6 rounded-2xl shadow-xl border"
        style={{ borderColor: COLORS.borderLight }}>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          ✨ Tạo Flash Sale mới
        </h2>

        <form onSubmit={onCreateSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Tên */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Tên Flash Sale</label>
            <input
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              placeholder="VD: Flash Sale Tết 2025"
              className="p-3 rounded-xl border focus:ring text-gray-900 bg-white"
              style={{ borderColor: COLORS.borderLight }}
            />
          </div>

          {/* Start */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Bắt đầu</label>
            <input
              type="datetime-local"
              value={createForm.start_at}
              onChange={(e) => setCreateForm({ ...createForm, start_at: e.target.value })}
              className="p-3 rounded-xl border focus:ring text-gray-900 bg-white"
              style={{ borderColor: COLORS.borderLight }}
            />
          </div>

          {/* End */}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Kết thúc</label>
            <input
              type="datetime-local"
              value={createForm.end_at}
              onChange={(e) => setCreateForm({ ...createForm, end_at: e.target.value })}
              className="p-3 rounded-xl border focus:ring text-gray-900 bg-white"
              style={{ borderColor: COLORS.borderLight }}
            />
          </div>

          {/* BUTTONS */}
          <div className="md:col-span-3 flex gap-3 mt-3">
            <button
              type="submit"
              className="px-5 py-3 rounded-xl font-medium shadow hover:scale-105 transition"
              style={{
                background: COLORS.primary,
                color: COLORS.white
              }}
            >
              {loading ? "Đang tạo..." : "Tạo Flash Sale"}
            </button>

            <button
              type="button"
              onClick={() => setCreateForm({ name: "", start_at: "", end_at: "" })}
              className="px-5 py-3 rounded-xl font-medium border"
              style={{
                borderColor: COLORS.borderLight,
                background: COLORS.white
              }}
            >
              Hủy
            </button>
          </div>
        </form>
      </section>

      {/* FLASH SALE LIST */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">📋 Danh sách Flash Sale</h2>

        <div className="grid gap-4">
          {flashSales?.length ? (
            flashSales.map((fs) => {
              const status = new Date(fs.end_at) < new Date()
                ? "Đã kết thúc"
                : new Date(fs.start_at) > new Date()
                  ? "Sắp diễn ra"
                  : "Đang diễn ra";

              const statusColor =
                status === "Đang diễn ra" ? "#16A34A"
                  : status === "Sắp diễn ra" ? "#0EA5E9"
                    : "#DC2626";

              return (
                <div key={fs.id ?? fs._id} className="bg-white p-5 rounded-2xl shadow-xl border flex justify-between items-center"
                  style={{ borderColor: COLORS.borderLight }}>

                  <div>
                    <div className="text-lg font-semibold">{fs.name}</div>
                    <div className="text-sm text-gray-500">
                      {fs.start_at} → {fs.end_at}
                    </div>

                    <span
                      className="mt-2 inline-block px-3 py-1 rounded-full text-white text-sm"
                      style={{ background: statusColor }}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(fs.id ?? fs._id)}
                      className="px-4 py-2 rounded-xl font-medium shadow"
                      style={{ background: COLORS.secondary }}
                    >
                      Xem chi tiết
                    </button>

                    <button
                      onClick={() => openAddItem(fs.id ?? fs._id)}
                      className="px-4 py-2 rounded-xl font-medium shadow"
                      style={{ background: COLORS.primary, color: COLORS.white }}
                    >
                      + Thêm SP
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-4 bg-white rounded-xl shadow">Không có Flash Sale nào</div>
          )}
        </div>
      </section>

      {/* FLASH SALE DETAIL */}
      <section className="mb-10 bg-white p-6 rounded-2xl shadow-xl">
        <h2 className="text-xl font-bold mb-4">📦 Chi tiết Flash Sale</h2>

        {!current ? (
          <div className="text-gray-500">Chưa chọn flash sale.</div>
        ) : (
          <>
            <div className="mb-4">
              <div className="text-2xl font-bold">{current.name}</div>
              <div className="text-sm text-gray-500">
                {current.start_at} → {current.end_at}
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-lg">Danh sách sản phẩm</h3>

              <button
                onClick={() => openAddItem(current.id ?? current._id)}
                className="px-4 py-2 rounded-xl shadow"
                style={{ background: COLORS.primary, color: COLORS.white }}
              >
                + Thêm SP
              </button>
            </div>

            {current.items?.length ? (
              <div className="grid gap-4">
                {current.items.map((it) => (
                  <div key={it.item_id ?? it.id} className="p-4 border rounded-xl shadow flex justify-between"
                    style={{ borderColor: COLORS.borderLight }}>

                    <div>
                      <div className="font-medium">📦 Sản phẩm: {it.product?.name || it.product_id}</div>
                      <div className="text-sm text-gray-500">
                        Giá gốc: {it.product?.price}₫ • Giá sale: {it.sale_price}₫
                      </div>
                      <div className="text-sm text-gray-500">
                        Giảm: {Math.round(((it.product?.price - it.sale_price) / it.product?.price) * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        Hạn mức: {it.stock_limit ?? "Không giới hạn"}
                      </div>
                    </div>

                    <button
                      onClick={() => onRemoveItem(it.item_id ?? it.id)}
                      className="px-4 py-2 rounded-xl text-white"
                      style={{ background: COLORS.error }}
                    >
                      Xóa
                    </button>

                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500">Chưa có sản phẩm nào.</div>
            )}
          </>
        )}
      </section>

      {/* MODAL ADD ITEM */}
      {showAddItem && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddItem(false)} />

          <div className="bg-white p-6 rounded-2xl shadow-xl w-full max-w-md relative">
            <h3 className="text-xl font-semibold mb-4">➕ Thêm sản phẩm</h3>

            <form onSubmit={onAddItemSubmit} className="grid gap-3">

              {/* ID */}
            <div className="flex flex-col">
  <label className="font-medium mb-1">Sản phẩm</label>

  <select
    value={itemForm.product_id}
    onChange={(e) =>
      setItemForm({ ...itemForm, product_id: e.target.value })
    }
    className="p-3 border rounded-xl text-gray-900 bg-white"
  >
    <option value="">-- Chọn sản phẩm --</option>

    {products.map((p) => (
      <option key={p.product_id} value={p.product_id}>
        {p.name} – {Number(p.price).toLocaleString("vi-VN")}₫
      </option>
    ))}
  </select>

  {productLoading && (
    <span className="text-sm text-gray-500 mt-1">
      Đang tải sản phẩm...
    </span>
  )}
</div>


              {/* PRICE */}
              <div className="flex flex-col">
                <label className="font-medium mb-1">Giá Flash Sale</label>
                <input
                  type="number"
                  value={itemForm.sale_price}
                  onChange={(e) => setItemForm({ ...itemForm, sale_price: e.target.value })}
                  className="p-3 border rounded-xl text-gray-900 bg-white"
                />
              </div>

              {/* STOCK LIMIT */}
              <div className="flex flex-col">
                <label className="font-medium mb-1">Hạn mức (tùy chọn)</label>
                <input
                  type="number"
                  value={itemForm.stock_limit}
                  onChange={(e) => setItemForm({ ...itemForm, stock_limit: e.target.value })}
                  className="p-3 border rounded-xl text-gray-900 bg-white"
                />
              </div>

              {/* BUTTONS */}
              <div className="flex justify-end gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddItem(false)}
                  className="px-4 py-2 rounded-xl border"
                  style={{ borderColor: COLORS.borderLight }}
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-white"
                  style={{ background: COLORS.primary }}
                >
                  {loading ? "Đang thêm..." : "Thêm"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  </div>
);

}
