import React, { useState, useEffect } from "react";
import { Pencil, Trash2, Plus, X, ImagePlus } from "lucide-react";
import { useProduct } from "@/providers/ProductProvider";
import { useAuth } from "@/hooks/useAuth";

export default function ProductManagement() {
  const { token } = useAuth();

  const {
    products,
    fetchProducts,
    createProduct,
    updateProduct,
    deleteProduct,
    loading,
  } = useProduct();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    brand_id: "",
    category_id: "",
    images: [],
  });

  // Load API products
  useEffect(() => {
    fetchProducts();
  }, []);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      stock: "",
      description: "",
      brand_id: "",
      category_id: "",
      images: [],
    });
    setModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price,
      stock: product.stock,
      description: product.description,
      brand_id: product.brand_id,
      category_id: product.category_id,
      images: [], // Chỉ upload mới
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (editingProduct) {
      await updateProduct(editingProduct.product_id, formData, token);
    } else {
      await createProduct(formData, token);
    }
    setModalOpen(false);
  };

  const handleDelete = async (id) => {
    await deleteProduct(id, token);
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, images: Array.from(e.target.files) });
  };

  return (
    <div style={{ padding: "20px", background: "#F3F4F6", minHeight: "100vh" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px", color: "#111827" }}>
        Quản lý sản phẩm
      </h1>

      {/* Button thêm */}
      <button
        onClick={openAddModal}
        style={{
          background: "#F97316",
          color: "white",
          padding: "10px 16px",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "20px",
          fontWeight: "600",
        }}
      >
        <Plus size={18} /> Thêm sản phẩm
      </button>

      {/* Bảng sản phẩm */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F3F4F6" }}>
              <th style={th}>ID</th>
              <th style={th}>Tên</th>
              <th style={th}>Giá</th>
              <th style={th}>Kho</th>
              <th style={th}>Brand</th>
              <th style={th}>Category</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.product_id}>
                <td style={td}>{p.product_id}</td>
                <td style={td}>{p.name}</td>
                <td style={td}>{p.price.toLocaleString("vi-VN")} đ</td>
                <td style={td}>{p.stock}</td>
                <td style={td}>{p.brand?.name || p.brand_id}</td>
                <td style={td}>{p.category?.name || p.category_id}</td>
                <td style={td}>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={() => openEditModal(p)} style={iconButton}>
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.product_id)}
                      style={{ ...iconButton, background: "#F87171" }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "bold" }}>
                {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
              </h2>
              <button onClick={() => setModalOpen(false)}>
                <X />
              </button>
            </div>

            {/* Fields */}
            <label style={label}>Tên sản phẩm</label>
            <input
              style={input}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />

            <label style={label}>Giá</label>
            <input
              style={input}
              type="number"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
            />

            <label style={label}>Số lượng</label>
            <input
              style={input}
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
            />

            <label style={label}>Mô tả</label>
            <textarea
              style={{ ...input, height: "80px" }}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <label style={label}>Brand ID</label>
            <input
              style={input}
              value={formData.brand_id}
              onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
            />

            <label style={label}>Category ID</label>
            <input
              style={input}
              value={formData.category_id}
              onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
            />

            {/* Upload ảnh */}
            <label style={label}>Ảnh sản phẩm</label>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input type="file" multiple onChange={handleFileChange} />
            </div>

            <button
              onClick={handleSubmit}
              style={{
                width: "100%",
                background: "#F97316",
                padding: "12px",
                color: "white",
                borderRadius: "8px",
                marginTop: "16px",
                fontWeight: "600",
              }}
            >
              {loading ? "Đang xử lý..." : editingProduct ? "Cập nhật" : "Thêm mới"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** styles */
const th = {
  padding: "12px",
  borderBottom: "1px solid #E5E7EB",
  color: "#6B7280",
  textAlign: "left",
};
const td = {
  padding: "12px",
  borderBottom: "1px solid #E5E7EB",
  color: "#111827",
};
const iconButton = {
  background: "#F97316",
  color: "white",
  padding: "6px 10px",
  borderRadius: "6px",
};
const label = {
  color: "#6B7280",
  fontWeight: "600",
  marginBottom: "6px",
  marginTop: "10px",
};
const input = {
  width: "100%",
  padding: "10px",
  background: "#F3F4F6",
  borderRadius: "8px",
  border: "1px solid #E5E7EB",
  marginBottom: "10px",
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};
const modalBox = {
  background: "white",
  padding: "20px",
  borderRadius: "12px",
  width: "420px",
  boxShadow: "0 4px 6px rgba(0,0,0,0.2)",
};
