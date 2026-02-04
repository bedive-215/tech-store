// src/pages/admin/ProductManagement.jsx
import React, { useState, useEffect, useRef } from "react";
import {
  Pencil,
  Trash2,
  Plus,
  X,
  ImagePlus,
  Star,
  UploadCloud,
  Package,
  Sparkles,
} from "lucide-react";
import { useProduct } from "@/providers/ProductProvider";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "react-toastify";
import { useBrand } from "@/providers/BrandProvider";
import { useCategory } from "@/providers/CategoryProvider";


/**
 * Product management (Admin) - includes media manager in Edit modal
 *
 * - Uses provider functions:
 *   fetchProducts, createProduct, updateProduct, deleteProduct,
 *   uploadProductMedia, setPrimaryImage, deleteMedia, fetchProductById
 *
 * - Token from useAuth is passed to all protected calls.
 * 
 * - CREATE/UPDATE không gửi ảnh, chỉ gửi JSON data
 * - Upload ảnh tách biệt qua nút "Upload ảnh" (chỉ trong Edit mode)
 */

export default function ProductManagement() {
  const { token } = useAuth();

  const {
    products,
    fetchProducts,
    fetchProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductMedia,
    setPrimaryImage,
    deleteMedia,
    loading,
  } = useProduct();
  const { brands, fetchBrands } = useBrand();
  const { categories, fetchCategories } = useCategory();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
    description: "",
    brand_name: "",
    category_name: "",
  });

  // For media manager (when editing)
  const [mediaList, setMediaList] = useState([]); // array of { media_id, url, is_primary }
  const [mediaUploading, setMediaUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]); // for upload input
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  // AI Generate states
  const [specs, setSpecs] = useState("");
  const [isAIGenerating, setIsAIGenerating] = useState(false);
  const [aiImageUrl, setAiImageUrl] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchBrands();      // 👈 load brand
    fetchCategories();  // 👈 load category
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // Open modal to add product
  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: "",
      price: "",
      stock: "",
      description: "",
      brand_name: "",
      category_name: "",
    });
    setMediaList([]);
    setSelectedFiles([]);
    setSpecs("");
    setAiImageUrl(null);
    setModalOpen(true);
  };

  // AI Generate product details
  const handleAIGenerate = async () => {
    if (!formData.name) {
      alert("Vui lòng nhập tên sản phẩm trước");
      return;
    }
    if (!specs) {
      alert("Vui lòng nhập cấu hình sản phẩm");
      return;
    }

    setIsAIGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "https://api.store.hailamdev.space"}/api/v1/products/ai/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: formData.name, specs }),
        }
      );

      const result = await response.json();

      if (result.success && result.data) {
        const { description, suggestedPrice, brand, category, imageUrl } = result.data;

        setFormData((prev) => ({
          ...prev,
          description: description || prev.description,
          price: suggestedPrice || prev.price,
          brand_name: brand || prev.brand_name,
          category_name: category || prev.category_name,
        }));

        if (imageUrl) {
          setAiImageUrl(imageUrl);
        }

        alert("✅ AI đã tạo nội dung thành công!");
      } else {
        alert("Lỗi: " + (result.message || "Không thể tạo nội dung"));
      }
    } catch (error) {
      console.error("AI Generate Error:", error);
      alert("Lỗi kết nối AI: " + error.message);
    } finally {
      setIsAIGenerating(false);
    }
  };

  const openEditModal = async (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name ?? "",
      price: product.price ?? "",
      stock: product.stock ?? "",
      description: product.description ?? "",
      brand_name: product.brand_name ?? product.brand ?? "",
      category_name: product.category_name ?? product.category ?? "",
    });
    setSelectedFiles([]);
    // Load product details (including media)
    try {
      const item = await fetchProductById(product.product_id);
      // Expect item.media or item.images array from API
      const medias = item?.media ?? item?.images ?? item?.product_media ?? [];
      // Normalize to objects: { media_id, url, is_primary }
      const normalized = (medias || []).map((m) => {
        // support both {media_id, url, is_primary} and {id, path, is_primary}
        return {
          media_id: m.media_id ?? m.id ?? m.mediaId ?? m.id,
          url: m.url ?? m.path ?? m.src ?? m.url,
          is_primary: !!(m.is_primary ?? m.isPrimary ?? m.primary),
        };
      });
      setMediaList(normalized);
    } catch (err) {
      // fetchProductById already toasts error via provider; still handle gracefully
      setMediaList([]);
    }

    setModalOpen(true);
  };

  // Submit create or update - CHỈ GỬI JSON, KHÔNG GỬI ẢNH
  const handleSubmit = async () => {
    try {
      // Build payload with raw values
      const rawPayload = {
        name: formData.name,
        description: formData.description,
        // keep original form values as strings; we'll parse/validate below
        price: formData.price,
        stock: formData.stock,
        brand_name: formData.brand_name,
        category_name: formData.category_name,
      };

      // Clean payload: remove undefined/null/empty-string; parse numbers safely
      const payload = {};

      // name & description: include if non-empty string (trimmed)
      if (typeof rawPayload.name === "string" && rawPayload.name.trim() !== "") {
        payload.name = rawPayload.name.trim();
      }

      if (typeof rawPayload.description === "string" && rawPayload.description.trim() !== "") {
        payload.description = rawPayload.description.trim();
      }

      // price: only include if not empty and is a valid number
      if (rawPayload.price !== "" && rawPayload.price !== undefined && rawPayload.price !== null) {
        const n = Number(rawPayload.price);
        if (!Number.isNaN(n)) {
          payload.price = n;
        }
      }

      // stock: same as price
      if (rawPayload.stock !== "" && rawPayload.stock !== undefined && rawPayload.stock !== null) {
        const n = Number(rawPayload.stock);
        if (!Number.isNaN(n)) {
          payload.stock = n;
        }
      }

      // brand_id & category_id: include only if non-empty trimmed string
      if (typeof rawPayload.brand_name === "string" && rawPayload.brand_name.trim() !== "") {
        payload.brand_name = rawPayload.brand_name.trim();
      }

      if (typeof rawPayload.category_name === "string" && rawPayload.category_name.trim() !== "") {
        payload.category_name = rawPayload.category_name.trim();
      }

      // Debug logs
      if (editingProduct) {
        console.log("Updating product ID:", editingProduct.product_id);
        console.log("Payload:", payload);
      } else {
        console.log("Creating product Payload:", payload);
      }

      // If editingProduct -> update, else create
      if (editingProduct) {
        await updateProduct(editingProduct.product_id, payload, token);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        const newProduct = await createProduct(payload, token);
        toast.success("Tạo sản phẩm thành công");

        // If we have an AI-generated image URL, upload it to the new product
        if (aiImageUrl && newProduct?.product?.product_id) {
          try {
            const uploadResponse = await fetch(
              `${import.meta.env.VITE_API_BASE_URL || "https://api.store.hailamdev.space"}/api/v1/products/${newProduct.product.product_id}/media/from-url`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ imageUrl: aiImageUrl })
              }
            );
            if (uploadResponse.ok) {
              toast.success("Đã upload ảnh từ AI!");
            }
          } catch (imgErr) {
            console.warn("AI image upload failed:", imgErr);
          }
        }
      }

      await fetchProducts();
      setModalOpen(false);
      setSelectedFiles([]);
      setAiImageUrl(null);
      setSpecs("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error("Submit error:", err);
      console.error("Error response:", err.response?.data);
      const msg = err.response?.data?.message || "Lỗi xử lý sản phẩm";
      toast.error(msg);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa sản phẩm?")) return;
    await deleteProduct(id, token);
    await fetchProducts();
  };

  // file change handler - chỉ để preview, không submit cùng form
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
  };

  // -------------------------
  // Media manager handlers
  // -------------------------

  // Upload files to product media - TÁCH BIỆT, chỉ dùng khi Edit
  const handleUploadMedia = async () => {
    if (!editingProduct) {
      toast.error("Không tìm thấy product id để upload");
      return;
    }
    if (!selectedFiles || selectedFiles.length === 0) {
      toast.error("Chưa chọn ảnh để upload");
      return;
    }
    try {
      setMediaUploading(true);
      await uploadProductMedia(editingProduct.product_id, selectedFiles, token);

      // refresh media list
      const item = await fetchProductById(editingProduct.product_id);
      const medias = item?.media ?? item?.images ?? [];
      const normalized = (medias || []).map((m) => ({
        media_id: m.media_id ?? m.id,
        url: m.url ?? m.path ?? m.src ?? m.url,
        is_primary: !!(m.is_primary ?? m.isPrimary ?? m.primary),
      }));
      setMediaList(normalized);

      // clear selected files
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";

      toast.success("Upload ảnh thành công");
    } catch (err) {
      console.error(err);
      toast.error("Upload ảnh thất bại");
    } finally {
      setMediaUploading(false);
    }
  };

  // Set primary image
  // thêm util nhỏ convert url -> File
  const urlToFile = async (url, filename = "primary.jpg") => {
    // Cần CORS: server phải phản hồi header Access-Control-Allow-Origin nếu url ở domain khác
    const res = await fetch(url, { mode: "cors" });
    if (!res.ok) throw new Error("Không lấy được ảnh từ URL");
    const blob = await res.blob();
    // attempt to infer type from blob or from response headers
    const type = blob.type || "image/jpeg";
    return new File([blob], filename, { type });
  };

  const handleSetPrimary = async (mediaId) => {
    if (!editingProduct) return;
    // tìm media object từ mediaList theo mediaId
    const media = mediaList.find((m) => String(m.media_id) === String(mediaId));
    if (!media || !media.url) {
      toast.error("Không tìm thấy ảnh để upload");
      return;
    }

    try {
      setMediaUploading(true);
      // tạo filename từ url (nếu có)
      let filename = media.url.split("/").pop().split("?")[0] || "primary.jpg";
      if (!filename.includes(".")) filename = filename + ".jpg";

      // tải ảnh về dưới dạng File (cần CORS trên server chứa ảnh)
      const file = await urlToFile(media.url, filename);

      // gọi provider (của bạn) -- file là File object
      await setPrimaryImage(editingProduct.product_id, file, token);

      // refresh media list
      const item = await fetchProductById(editingProduct.product_id);
      const medias = item?.media ?? item?.images ?? [];
      const normalized = (medias || []).map((m) => ({
        media_id: m.media_id ?? m.id,
        url: m.url ?? m.path ?? m.src ?? m.url,
        is_primary: !!(m.is_primary ?? m.isPrimary ?? m.primary),
      }));
      setMediaList(normalized);

      toast.success("Đặt ảnh đại diện thành công");
    } catch (err) {
      console.error(err);
      toast.error("Đặt ảnh đại diện thất bại: " + (err.message || ""));
    } finally {
      setMediaUploading(false);
    }
  };

  // Delete media by id
  const handleDeleteMedia = async (mediaId) => {
    if (!editingProduct) return;
    if (!window.confirm("Xác nhận xóa ảnh này?")) return;

    try {
      await deleteMedia(editingProduct.product_id, mediaId, token);

      // Refresh media list
      const item = await fetchProductById(editingProduct.product_id);
      const medias = item?.media ?? item?.images ?? [];
      const normalized = (medias || []).map((m) => ({
        media_id: m.media_id ?? m.id,
        url: m.url ?? m.path ?? m.src ?? m.url,
        is_primary: !!(m.is_primary ?? m.isPrimary ?? m.primary),
      }));
      setMediaList(normalized);

      toast.success("Xóa ảnh thành công");
    } catch (err) {
      console.error(err);
      toast.error("Xóa ảnh thất bại");
    }
  };

  // Refresh media list manually
  const handleRefreshMedia = async () => {
    if (!editingProduct) return;

    try {
      const item = await fetchProductById(editingProduct.product_id);
      const medias = item?.media ?? item?.images ?? [];
      const normalized = (medias || []).map((m) => ({
        media_id: m.media_id ?? m.id,
        url: m.url ?? m.path ?? m.src ?? m.url,
        is_primary: !!(m.is_primary ?? m.isPrimary ?? m.primary),
      }));
      setMediaList(normalized);
      toast.success("Đã tải lại danh sách ảnh");
    } catch (err) {
      console.error(err);
      toast.error("Tải lại ảnh thất bại");
    }
  };

  // Drag & drop handlers
  useEffect(() => {
    const div = dropRef.current;
    if (!div) return;

    const onDragOver = (e) => {
      e.preventDefault();
      div.style.borderColor = "#F97316";
    };
    const onDragLeave = (e) => {
      e.preventDefault();
      div.style.borderColor = "#E5E7EB";
    };
    const onDrop = (e) => {
      e.preventDefault();
      div.style.borderColor = "#E5E7EB";
      const dt = e.dataTransfer;
      const files = Array.from(dt.files || []).filter((f) =>
        f.type.startsWith("image/")
      );
      if (files.length) {
        setSelectedFiles(files);
        if (fileInputRef.current) fileInputRef.current.files = dt.files;
      }
    };

    div.addEventListener("dragover", onDragOver);
    div.addEventListener("dragleave", onDragLeave);
    div.addEventListener("drop", onDrop);

    return () => {
      div.removeEventListener("dragover", onDragOver);
      div.removeEventListener("dragleave", onDragLeave);
      div.removeEventListener("drop", onDrop);
    };
  }, []);

  // Render preview thumbnails for selectedFiles
  const renderSelectedPreviews = () => {
    if (!selectedFiles || selectedFiles.length === 0) return null;
    return (
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {selectedFiles.map((f, idx) => {
          const url = URL.createObjectURL(f);
          return (
            <div
              key={idx}
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                overflow: "hidden",
                position: "relative",
                border: "1px solid #E5E7EB",
              }}
            >
              <img
                src={url}
                alt={f.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  // Render media thumbnails (existing images)
  const renderMediaGrid = () => {
    if (!mediaList || mediaList.length === 0) {
      return (
        <div style={{ color: "#6B7280", padding: "20px", textAlign: "center" }}>
          Chưa có ảnh cho sản phẩm này.
        </div>
      );
    }

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          gap: 12,
        }}
      >
        {mediaList.map((m) => (
          <div
            key={m.media_id || m.url}
            style={{
              position: "relative",
              borderRadius: 8,
              overflow: "hidden",
              border: m.is_primary
                ? "2px solid #F97316"
                : "1px solid #E5E7EB",
            }}
          >
            <img
              src={m.url}
              alt=""
              style={{
                width: "100%",
                height: 120,
                objectFit: "cover",
                display: "block",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "flex",
                gap: 8,
              }}
            >
              {!m.is_primary && (
                <button
                  title="Đặt làm ảnh đại diện"
                  onClick={() => handleSetPrimary(m.media_id)}
                  style={{
                    background: "rgba(255,255,255,0.9)",
                    borderRadius: 8,
                    padding: 6,
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Star size={16} />
                </button>
              )}

              <button
                title="Xóa ảnh"
                onClick={() => handleDeleteMedia(m.media_id)}
                style={{
                  background: "rgba(255,255,255,0.9)",
                  borderRadius: 8,
                  padding: 6,
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>

            {m.is_primary && (
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  left: 8,
                  background: "rgba(0,0,0,0.6)",
                  color: "white",
                  padding: "4px 8px",
                  borderRadius: 6,
                  fontSize: 12,
                }}
              >
                Ảnh đại diện
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-light" style={{ padding: "20px", minHeight: "100vh" }}>
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "20px",
          color: "#111827",
        }}
      >
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
          border: "none",
          cursor: "pointer",
        }}
      >
        <Plus size={18} /> Thêm sản phẩm
      </button>

      {/* Bảng sản phẩm với ảnh */}
      <div
        style={{
          background: "white",
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#F3F4F6" }}>
              <th style={th}>Ảnh</th>
              <th style={th}>Tên sản phẩm</th>
              <th style={th}>Giá</th>
              <th style={th}>Kho</th>
              <th style={th}>Brand</th>
              <th style={th}>Category</th>
              <th style={th}>Hành động</th>
            </tr>
          </thead>

          <tbody>
            {products.map((p) => (
              <tr key={p.product_id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                <td style={{ ...td, width: "80px" }}>
                  {p.image ? (
                    <img
                      src={p.image}
                      alt={p.name}
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        border: "1px solid #E5E7EB",
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML = `
                          <div style="
                            width: 60px;
                            height: 60px;
                            border-radius: 8px;
                            background: #F3F4F6;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border: 1px solid #E5E7EB;
                          ">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                              <line x1="12" y1="2" x2="12" y2="6"></line>
                              <line x1="12" y1="18" x2="12" y2="22"></line>
                              <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                              <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                              <line x1="2" y1="12" x2="6" y2="12"></line>
                              <line x1="18" y1="12" x2="22" y2="12"></line>
                              <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                              <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                            </svg>
                          </div>
                        `;
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        borderRadius: "8px",
                        background: "#F3F4F6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1px solid #E5E7EB",
                      }}
                    >
                      <Package size={24} color="#9CA3AF" />
                    </div>
                  )}
                </td>
                <td style={td}>
                  <div style={{ fontWeight: "600", color: "#111827" }}>{p.name}</div>
                  {p.flash_sale && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: "#DC2626",
                        background: "#FEE2E2",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        display: "inline-block",
                        marginTop: "4px",
                        fontWeight: "600",
                      }}
                    >
                      FLASH SALE
                    </div>
                  )}
                </td>
                <td style={td}>
                  <div>
                    {p.flash_sale ? (
                      <>
                        <div
                          style={{
                            textDecoration: "line-through",
                            color: "#9CA3AF",
                            fontSize: "12px",
                          }}
                        >
                          {Number(p.price).toLocaleString("vi-VN")} đ
                        </div>
                        <div style={{ fontWeight: "700", color: "#DC2626" }}>
                          {Number(p.flash_sale.sale_price).toLocaleString("vi-VN")} đ
                        </div>
                      </>
                    ) : (
                      <div style={{ fontWeight: "600" }}>
                        {Number(p.price).toLocaleString("vi-VN")} đ
                      </div>
                    )}
                  </div>
                </td>
                <td style={td}>
                  <span
                    style={{
                      padding: "4px 8px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      background: p.stock > 0 ? "#D1FAE5" : "#FEE2E2",
                      color: p.stock > 0 ? "#059669" : "#DC2626",
                    }}
                  >
                    {p.stock}
                  </span>
                </td>
                <td style={td}>{p.brand}</td>
                <td style={td}>{p.category}</td>
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
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
                {editingProduct ? "Cập nhật sản phẩm" : "Thêm sản phẩm"}
              </h2>
              <div style={{ display: "flex", gap: 8 }}>
                {editingProduct && (
                  <button
                    onClick={handleRefreshMedia}
                    title="Tải lại danh sách ảnh"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      padding: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <UploadCloud size={20} />
                  </button>
                )}
                <button
                  onClick={() => setModalOpen(false)}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Fields */}
            <label style={label}>Tên sản phẩm</label>
            <input
              style={input}
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="VD: iPhone 16 Pro Max 256GB"
            />

            {/* AI Generate Section - Only show for new products */}
            {!editingProduct && (
              <div style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                padding: "16px",
                borderRadius: "12px",
                marginBottom: "16px"
              }}>
                <label style={{ ...label, color: "white", marginBottom: "8px" }}>
                  🤖 Cấu hình sản phẩm (cho AI Generate)
                </label>
                <input
                  style={{ ...input, marginBottom: "12px" }}
                  value={specs}
                  onChange={(e) => setSpecs(e.target.value)}
                  placeholder="VD: A18 Pro, 256GB, 6.9 inch, 48MP camera"
                />
                <button
                  type="button"
                  onClick={handleAIGenerate}
                  disabled={isAIGenerating || !formData.name || !specs}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    width: "100%",
                    padding: "12px",
                    background: isAIGenerating ? "#9CA3AF" : "white",
                    color: isAIGenerating ? "white" : "#764ba2",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: "600",
                    fontSize: "14px",
                    cursor: isAIGenerating ? "wait" : "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <Sparkles size={18} />
                  {isAIGenerating ? "Đang tạo nội dung..." : "✨ AI Generate - Tự động điền"}
                </button>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "12px", marginTop: "8px", textAlign: "center" }}>
                  AI sẽ tự động tạo: Mô tả, Giá, Brand, Category, Ảnh
                </p>
              </div>
            )}

            {/* AI Generated Image Preview */}
            {aiImageUrl && !editingProduct && (
              <div style={{
                background: "#f0fdf4",
                border: "2px solid #22c55e",
                borderRadius: "12px",
                padding: "12px",
                marginBottom: "16px",
                textAlign: "center"
              }}>
                <p style={{ fontSize: "12px", color: "#166534", marginBottom: "8px", fontWeight: "600" }}>
                  🖼️ Ảnh gợi ý từ AI
                </p>
                <img
                  src={aiImageUrl}
                  alt="AI Generated"
                  style={{
                    maxWidth: "200px",
                    maxHeight: "150px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    border: "1px solid #ddd"
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <p style={{ fontSize: "11px", color: "#666", marginTop: "8px" }}>
                  Ảnh sẽ được tải lên sau khi tạo sản phẩm
                </p>
              </div>
            )}

            <label style={label}>Giá</label>
            <input
              style={input}
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
            />

            <label style={label}>Số lượng</label>
            <input
              style={input}
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
            />

            <label style={label}>Mô tả</label>
            <textarea
              style={{ ...input, height: "80px", resize: "vertical" }}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />

            <label style={label}>Brand</label>
            <select
              style={input}
              value={formData.brand_name}
              onChange={(e) =>
                setFormData({ ...formData, brand_name: e.target.value })
              }
            >
              <option value="">-- Chọn brand --</option>
              {brands.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>


            <label style={label}>Category</label>
            <select
              style={input}
              value={formData.category_name}
              onChange={(e) =>
                setFormData({ ...formData, category_name: e.target.value })
              }
            >
              <option value="">-- Chọn category --</option>
              {categories.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>


            {/* Nút Submit - CHỈ GỬI DATA, KHÔNG GỬI ẢNH */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                background: loading ? "#FBBF24" : "#F97316",
                padding: "12px",
                color: "white",
                borderRadius: "8px",
                marginTop: "16px",
                fontWeight: "600",
                border: "none",
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading
                ? "Đang xử lý..."
                : editingProduct
                  ? "Cập nhật"
                  : "Thêm mới"}
            </button>

            {/* Upload area - CHỈ HIỂN THỊ KHI EDIT */}
            {editingProduct && (
              <>
                <div
                  style={{
                    borderTop: "1px solid #E5E7EB",
                    marginTop: "24px",
                    paddingTop: "24px",
                  }}
                >
                  <label style={{ ...label, marginTop: 0, marginBottom: 12 }}>
                    Quản lý ảnh sản phẩm
                  </label>

                  {/* Upload section */}
                  <div
                    ref={dropRef}
                    style={{
                      border: "2px dashed #E5E7EB",
                      borderRadius: 8,
                      padding: 16,
                      marginBottom: 16,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        justifyContent: "space-between",
                        flexWrap: "wrap",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            background: "#FFF3E0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <ImagePlus size={24} color="#F97316" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: 4 }}>
                            Kéo thả ảnh vào đây
                          </div>
                          <div style={{ color: "#6B7280", fontSize: 13 }}>
                            Hoặc chọn file bằng nút bên dưới
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                        <button
                          onClick={() =>
                            fileInputRef.current && fileInputRef.current.click()
                          }
                          style={{
                            background: "#F97316",
                            color: "white",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            fontWeight: 600,
                          }}
                        >
                          <Plus size={14} /> Chọn ảnh
                        </button>

                        <button
                          onClick={handleUploadMedia}
                          disabled={
                            mediaUploading ||
                            !selectedFiles ||
                            selectedFiles.length === 0
                          }
                          style={{
                            background:
                              mediaUploading ||
                                !selectedFiles ||
                                selectedFiles.length === 0
                                ? "#D1D5DB"
                                : "#10B981",
                            color: "white",
                            border: "none",
                            padding: "8px 12px",
                            borderRadius: 8,
                            cursor:
                              mediaUploading ||
                                !selectedFiles ||
                                selectedFiles.length === 0
                                ? "not-allowed"
                                : "pointer",
                            display: "flex",
                            gap: 8,
                            alignItems: "center",
                            fontWeight: 600,
                          }}
                        >
                          <UploadCloud size={14} />
                          {mediaUploading ? "Đang upload..." : "Upload ảnh"}
                        </button>
                      </div>
                    </div>

                    {/* Preview selected files */}
                    {renderSelectedPreviews()}
                  </div>

                  {/* Existing media grid */}
                  <div style={{ marginTop: 16, marginBottom: 8, fontWeight: 600 }}>
                    Ảnh hiện có
                  </div>
                  {renderMediaGrid()}

                  <div
                    style={{
                      color: "#6B7280",
                      fontSize: 13,
                      marginTop: 12,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <Star size={14} /> = Đặt làm ảnh đại diện |{" "}
                    <Trash2 size={14} /> = Xóa ảnh
                  </div>
                </div>
              </>
            )}
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
  fontWeight: 600,
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
  border: "none",
  cursor: "pointer",
};
const label = {
  display: "block",
  color: "#374151",
  fontWeight: "600",
  marginBottom: "6px",
  marginTop: "10px",
};
const input = {
  width: "100%",
  padding: "10px",
  background: "#F9FAFB",
  borderRadius: "8px",
  border: "1px solid #E5E7EB",
  marginBottom: "10px",
  fontSize: "14px",
  boxSizing: "border-box",
};
const modalOverlay = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 999,
};
const modalBox = {
  background: "white",
  padding: "24px",
  borderRadius: "12px",
  width: "90%",
  maxWidth: "900px",
  maxHeight: "90vh",
  overflowY: "auto",
  boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
};