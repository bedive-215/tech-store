import React, { useEffect, useState } from "react";
import {
  Eye,
  CheckCircle,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { useWarranty } from "@/providers/WarrantyProvider";

export default function WarrantyManagement() {
  const {
    warranties,
    loading,
    fetchAllWarranties,
    updateWarrantyStatus,
    validateWarranty,
  } = useWarranty();

  const [selectedWarranty, setSelectedWarranty] = useState(null);
  const [validating, setValidating] = useState(false);
  const [rejectReason, setRejectReason] = useState(null);

  /* ================= LOAD ================= */
  useEffect(() => {
    fetchAllWarranties();
  }, [fetchAllWarranties]);

  /* ================= HELPERS ================= */
  const renderStatus = (status) => {
    const map = {
      pending: { text: "Chờ xử lý", bg: "#FEF3C7", color: "#D97706" },
      approved: { text: "Đã duyệt", bg: "#D1FAE5", color: "#059669" },
      completed: { text: "Hoàn thành", bg: "#DBEAFE", color: "#2563EB" },
      rejected: { text: "Từ chối", bg: "#FEE2E2", color: "#DC2626" },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{
        background: s.bg,
        color: s.color,
        padding: "4px 10px",
        borderRadius: 6,
        fontWeight: 600,
        fontSize: 13,
      }}>
        {s.text}
      </span>
    );
  };

  const openModal = (w) => {
    setSelectedWarranty(w);
    setRejectReason(w.reason || null);
  };

  const isValidateDisabled =
    selectedWarranty?.status === "rejected" ||
    selectedWarranty?.status === "completed";

  /* ================= ACTIONS ================= */

  // ✅ VALIDATE
  const handleValidate = async () => {
    if (!selectedWarranty) return;

    try {
      setValidating(true);
      setRejectReason(null);

      const { data } = await validateWarranty(selectedWarranty.id, {
        valid: true,
      });

      // ❌ backend trả không hợp lệ
      if (data.valid === false) {
        setRejectReason(data.reason);

        // cập nhật lại warranty trong modal
        setSelectedWarranty(data.warranty);

        // reload bảng
        fetchAllWarranties();
        return;
      }

      // ✅ hợp lệ
      setSelectedWarranty(null);
      fetchAllWarranties();
    } finally {
      setValidating(false);
    }
  };

  // ❌ REJECT
  const handleReject = async () => {
    if (!selectedWarranty) return;

    try {
      setValidating(true);
      setRejectReason(null);

      const { data } = await validateWarranty(selectedWarranty.id, {
        valid: false,
      });

      setRejectReason(data.reason);
      setSelectedWarranty(data.warranty);
      fetchAllWarranties();
    } finally {
      setValidating(false);
    }
  };

  // ✅ UPDATE STATUS
  const handleUpdateStatus = async (status) => {
    if (!selectedWarranty) return;
    await updateWarrantyStatus(selectedWarranty.id, { status });
    setSelectedWarranty(null);
    fetchAllWarranties();
  };

  /* ================= UI ================= */
  return (
    <div style={{ padding: 20, background: "#F3F4F6", minHeight: "100vh" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 20 }}>
        Quản lý bảo hành
      </h1>

      <div style={box}>
        {loading ? (
          <p>Đang tải dữ liệu...</p>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#F3F4F6" }}>
                <th style={th}>ID</th>
                <th style={th}>Order</th>
                <th style={th}>Sản phẩm</th>
                <th style={th}>Serial</th>
                <th style={th}>Ngày gửi</th>
                <th style={th}>Trạng thái</th>
                <th style={th}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {warranties.map((w) => (
                <tr key={w.id}>
                  <td style={td}>{w.id.slice(0, 8)}...</td>
                  <td style={td}>{w.order_id?.slice(0, 8)}...</td>
                  <td style={td}>{w.product_id?.slice(0, 8)}...</td>
                  <td style={td}>{w.serial || "-"}</td>
                  <td style={td}>{new Date(w.created_at).toLocaleDateString()}</td>
                  <td style={td}>{renderStatus(w.status)}</td>
                  <td style={td}>
                    <button onClick={() => openModal(w)} style={iconButton}>
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {selectedWarranty && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <h2 style={{ fontSize: 20, fontWeight: "bold" }}>
              Chi tiết yêu cầu bảo hành
            </h2>

            <p><b>ID:</b> {selectedWarranty.id}</p>
            <p><b>Mô tả lỗi:</b> {selectedWarranty.issue_description}</p>
            <p><b>Serial:</b> {selectedWarranty.serial || "-"}</p>
            <p><b>Trạng thái:</b> {renderStatus(selectedWarranty.status)}</p>

            {rejectReason && (
              <div style={rejectBox}>
                ❌ Lý do từ chối: <b>{rejectReason}</b>
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button
                disabled={isValidateDisabled || validating}
                onClick={handleValidate}
                style={{
                  ...actionBtn,
                  background: isValidateDisabled ? "#9CA3AF" : "#10B981",
                  cursor: isValidateDisabled ? "not-allowed" : "pointer",
                }}
              >
                <ShieldCheck size={16} /> Hợp lệ
              </button>

              <button
                disabled={validating}
                onClick={handleReject}
                style={{ ...actionBtn, background: "#EF4444" }}
              >
                <XCircle size={16} /> Không hợp lệ
              </button>

              <button
                onClick={() => handleUpdateStatus("completed")}
                style={{ ...actionBtn, background: "#2563EB" }}
              >
                <CheckCircle size={16} /> Hoàn thành
              </button>

              <button
                onClick={() => setSelectedWarranty(null)}
                style={{ ...actionBtn, background: "#9CA3AF" }}
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

/* ================= STYLES ================= */

const box = {
  background: "white",
  padding: 20,
  borderRadius: 12,
};

const th = { padding: 12, fontWeight: 600 };
const td = { padding: 12 };

const iconButton = {
  background: "#F97316",
  color: "white",
  border: "none",
  padding: "6px 10px",
  borderRadius: 6,
};

const actionBtn = {
  color: "white",
  border: "none",
  padding: "8px 12px",
  borderRadius: 8,
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontWeight: 600,
};

const modalOverlay = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const modalBox = {
  background: "white",
  padding: 24,
  borderRadius: 12,
  width: "90%",
  maxWidth: 520,
};

const rejectBox = {
  marginTop: 12,
  padding: 12,
  background: "#FEE2E2",
  color: "#991B1B",
  borderRadius: 8,
  fontWeight: 600,
};
