/**
 * DashboardPage.jsx — Refactored & Optimized (Full Edit Modal + Pagination)
 *
 * CHANGES vs. phiên bản trước:
 *   1. Xoá inline edit (Sửa kg / Sửa giá) → thay bằng EditProductModal chỉnh toàn bộ thông tin
 *   2. Gộp state: bỏ editId + editType + editVal → dùng editProduct (null | object)
 *   3. handleSave(productId, formData) nhận đủ payload 1 lần duy nhất
 *   4. Nút "✏️ Sửa thông tin" duy nhất thay cho "⚖️ Sửa kg" + "🏷️ Sửa giá"
 *   5. EditProductModal hỗ trợ: tên, loại, giá, cân nặng, trạng thái, thời gian đánh bắt
 */
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt, pill } from "../utils/format";
import { useCountdown } from "../hooks/useCountdown";
import { CountdownBadge } from "../components/ProductCard";
import { ChatBox } from "../components/ChatBox";
import { InboxTab } from "../components/InboxTab";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1000;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: "image/jpeg" }));
          },
          "image/jpeg",
          0.85
        );
      };
    };
  });
};

// ── ConfirmDialog — thay thế window.confirm() ───────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 16,
          padding: "28px 32px",
          maxWidth: 360,
          width: "90%",
          boxShadow: "0 20px 40px rgba(0,0,0,0.2)",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 40, marginBottom: 12 }}>🗑️</div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: C.dark,
            marginBottom: 20,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: C.muted,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            Huỷ
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: "#DC2626",
              color: "#fff",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

// ── EditProductModal — Sửa toàn bộ thông tin sản phẩm ───────
function EditProductModal({ product, onSave, onClose, loading }) {
  const [form, setForm] = useState({
    name: product.name || "",
    type: product.type || "Fresh",
    price: product.price ?? 0,
    remainingWeight: product.remainingWeight ?? 0,
    status: product.status || "Active",
    // datetime-local cần định dạng "YYYY-MM-DDTHH:mm"
    catchTime: product.catchTime
      ? new Date(product.catchTime).toISOString().slice(0, 16)
      : "",
  });

  const set = (key, val) => setForm((prev) => ({ ...prev, [key]: val }));

  // Kiểu input dùng chung
  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: `1px solid ${C.border}`,
    fontFamily: "inherit",
    fontSize: 14,
    color: C.dark,
    background: C.white,
    boxSizing: "border-box",
    outline: "none",
    transition: "border-color 0.2s",
  };
  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontWeight: 700,
    color: C.muted,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: "0.04em",
  };
  const fieldStyle = { marginBottom: 18 };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 99998,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.15s ease",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.white,
          borderRadius: 20,
          padding: "28px 32px",
          maxWidth: 500,
          width: "100%",
          boxShadow: "0 24px 48px rgba(0,0,0,0.22)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <h2
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: C.dark,
              margin: 0,
            }}
          >
            ✏️ Chỉnh sửa sản phẩm
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: 20,
              cursor: "pointer",
              color: C.muted,
              lineHeight: 1,
              padding: "2px 6px",
            }}
          >
            ×
          </button>
        </div>

        {/* Tên sản phẩm */}
        <div style={fieldStyle}>
          <label style={labelStyle}>Tên sản phẩm</label>
          <input
            style={inputStyle}
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ví dụ: Tôm Thẻ Chân Trắng"
          />
        </div>

        {/* Loại + Trạng thái — 2 cột */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div>
            <label style={labelStyle}>Loại hải sản</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.type}
              onChange={(e) => set("type", e.target.value)}
            >
              <option value="Fresh">🐟 Tươi</option>
              <option value="Dry">🌊 Khô</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Trạng thái</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="Active">✅ Đang bán</option>
              <option value="Inactive">⏸️ Tạm ngừng</option>
              <option value="Sold">🎉 Đã bán hết</option>
            </select>
          </div>
        </div>

        {/* Giá + Cân nặng — 2 cột */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 14,
            marginBottom: 18,
          }}
        >
          <div>
            <label style={labelStyle}>Giá bán (₫/kg)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="1000"
              value={form.price}
              onChange={(e) => set("price", parseInt(e.target.value, 10) || 0)}
            />
          </div>
          <div>
            <label style={labelStyle}>Còn lại (kg)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="0.5"
              value={form.remainingWeight}
              onChange={(e) =>
                set("remainingWeight", parseFloat(e.target.value) || 0)
              }
            />
          </div>
        </div>

        {/* Thời gian đánh bắt — chỉ hiện khi loại = Fresh */}
        {form.type === "Fresh" && (
          <div style={fieldStyle}>
            <label style={labelStyle}>Thời gian đánh bắt</label>
            <input
              style={inputStyle}
              type="datetime-local"
              value={form.catchTime}
              onChange={(e) => set("catchTime", e.target.value)}
            />
            <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
              Dùng để hiển thị đếm ngược độ tươi cho người mua.
            </div>
          </div>
        )}

        {/* Divider */}
        <div
          style={{
            height: 1,
            background: C.border,
            margin: "4px 0 20px",
          }}
        />

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: "11px 0",
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.white,
              color: C.muted,
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              fontSize: 14,
            }}
          >
            Huỷ
          </button>
          <button
            onClick={() => onSave(form)}
            disabled={loading || !form.name.trim()}
            style={{
              flex: 2,
              padding: "11px 0",
              borderRadius: 10,
              border: "none",
              background:
                loading || !form.name.trim()
                  ? "#CBD5E1"
                  : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
              color: "#fff",
              fontWeight: 700,
              cursor: loading || !form.name.trim() ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              fontSize: 14,
              transition: "all 0.2s",
            }}
          >
            {loading ? "⏳ Đang lưu…" : "💾 Lưu thay đổi"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cooldown helpers ─────────────────────────────────────────
const isBumpingOnCooldown = (bumpedAtStr) => {
  if (!bumpedAtStr) return false;
  return Date.now() - new Date(bumpedAtStr).getTime() < 24 * 3600 * 1000;
};

const getCooldownHours = (bumpedAtStr) => {
  if (!bumpedAtStr) return 0;
  const diffMs = Date.now() - new Date(bumpedAtStr).getTime();
  return Math.ceil((24 * 3600 * 1000 - diffMs) / 3600000);
};

// ── Main Component ───────────────────────────────────────────
export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [unread, setUnread] = useState(0);

  // Phân trang
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsTotalPages, setListingsTotalPages] = useState(1);
  const [listingsTotal, setListingsTotal] = useState(0);

  // ── THAY ĐỔI: editId/editType/editVal → editProduct ─────────
  // editProduct = null | product object đang được mở modal sửa
  const [editProduct, setEditProduct] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  const [bumpingId, setBumpingId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Boat logs state
  const [myLogs, setMyLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [logImages, setLogImages] = useState([]);
  const [logPreviews, setLogPreviews] = useState([]);
  const [submittingLog, setSubmittingLog] = useState(false);

  const fetchMyLogs = useCallback(() => {
    if (!user) return;
    setLoadingLogs(true);
    api(`/boat-logs?userId=${user.userId || user.id}`)
      .then((res) => setMyLogs(res.boatLogs || []))
      .catch(() => {})
      .finally(() => setLoadingLogs(false));
  }, [user]);

  useEffect(() => {
    if (tab === "boatlogs") fetchMyLogs();
  }, [tab, fetchMyLogs]);

  const handleLogImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + logImages.length > 4) {
      toast.error("Bạn chỉ được tải lên tối đa 4 hình ảnh");
      return;
    }
    setLogImages([...logImages, ...files]);
    const previews = files.map(file => URL.createObjectURL(file));
    setLogPreviews([...logPreviews, ...previews]);
  };

  const removeLogImage = (idx) => {
    setLogImages(logImages.filter((_, i) => i !== idx));
    setLogPreviews(logPreviews.filter((_, i) => i !== idx));
  };

  const handleCreateLog = async (e) => {
    e.preventDefault();
    if (!logContent.trim()) return;

    setSubmittingLog(true);
    try {
      let uploadedImageUrls = [];
      if (logImages.length > 0) {
        const sigData = await api("/images/signature");
        uploadedImageUrls = await Promise.all(
          logImages.map(async (file) => {
            const compressed = await compressImage(file);
            const fd = new FormData();
            fd.append("file", compressed);
            fd.append("api_key", sigData.apiKey);
            fd.append("timestamp", sigData.timestamp);
            fd.append("signature", sigData.signature);
            fd.append("folder", sigData.folder);

            const cloudRes = await fetch(
              `https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`,
              { method: "POST", body: fd }
            );
            if (!cloudRes.ok) throw new Error("Không thể tải ảnh lên CDN");
            const cloudData = await cloudRes.json();
            return cloudData.secure_url;
          })
        );
      }

      await api("/boat-logs", {
        method: "POST",
        body: {
          content: logContent,
          images: uploadedImageUrls,
        }
      });

      toast.success("✅ Đã đăng nhật ký boong tàu mới!");
      setLogContent("");
      setLogImages([]);
      setLogPreviews([]);
      fetchMyLogs();
    } catch (err) {
      toast.error(err.message || "Có lỗi xảy ra");
    } finally {
      setSubmittingLog(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!window.confirm("Xóa bài nhật ký này? Thao tác không thể hoàn tác.")) return;
    try {
      await api(`/boat-logs/${logId}`, { method: "DELETE" });
      toast.success("Đã xóa nhật ký.");
      fetchMyLogs();
    } catch (err) {
      toast.error(err.message || "Không thể xóa nhật ký");
    }
  };

  // Tải danh sách mẻ hàng
  const fetchMyListings = useCallback((pageNo) => {
    setLoadingListings(true);
    api(`/products/my?page=${pageNo}&limit=5`)
      .then((res) => {
        setListings(res.data || []);
        setListingsTotalPages(res.totalPages || 1);
        setListingsTotal(res.total || 0);
      })
      .catch(() => {})
      .finally(() => setLoadingListings(false));
  }, []);

  useEffect(() => {
    if (tab === "listings") fetchMyListings(listingsPage);
  }, [tab, listingsPage, fetchMyListings]);

  useEffect(() => {
    api("/messages/unread-count")
      .then((data) => setUnread(data.count))
      .catch(() => {});
    api("/favorites")
      .then((data) => setFavorites(data))
      .catch(() => {})
      .finally(() => setFavLoading(false));
  }, []);

  // ── THAY ĐỔI: handleSave nhận (productId, formData) toàn bộ ─
  const handleSave = async (productId, formData) => {
    setEditLoading(true);
    // Chuẩn hoá: đảm bảo price & remainingWeight là số
    const payload = {
      ...formData,
      price: Number(formData.price),
      remainingWeight: Number(formData.remainingWeight),
      // Nếu catchTime rỗng (hải sản khô) thì gửi null
      catchTime: formData.catchTime || null,
    };

    try {
      await api(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setListings((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, ...payload } : p)),
      );
      setEditProduct(null);
      toast.success("✅ Đã cập nhật thông tin sản phẩm!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const doDelete = async (productId) => {
    setConfirmDelete(null);
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      toast.success("Đã xoá bài đăng.");
      fetchMyListings(listingsPage);
    } catch (e) {
      toast.error(e.message);
    }
  };

  const bumpProduct = async (productId) => {
    setBumpingId(productId);
    try {
      const res = await api(`/products/${productId}/bump`, { method: "POST" });
      toast.success(res.message || "Đã đẩy tin lên đầu thành công!");
      setListings((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, bumpedAt: new Date().toISOString() } : p,
        ),
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBumpingId(null);
    }
  };

  const activeCount = listings.filter((p) => p.status === "Active").length;
  const totalRemaining = listings.reduce(
    (s, p) => s + (p.remainingWeight || 0),
    0,
  );

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* ConfirmDialog */}
      {confirmDelete && (
        <ConfirmDialog
          message="Xoá bài đăng này? Thao tác không thể hoàn tác."
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ── THAY ĐỔI: EditProductModal render khi editProduct != null ── */}
      {editProduct && (
        <EditProductModal
          product={editProduct}
          loading={editLoading}
          onSave={(formData) => handleSave(editProduct.id, formData)}
          onClose={() => setEditProduct(null)}
        />
      )}

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 800, color: C.dark, margin: 0 }}>
          📊 Bảng Điều Khiển — {user?.name}
        </h1>
        <button
          onClick={() => navigate("/dang-bai")}
          style={{
            background: `linear-gradient(135deg, ${C.coral} 0%, #D94E21 100%)`,
            color: "#fff",
            border: "none",
            padding: "12px 20px",
            borderRadius: 12,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
            boxShadow: "0 6px 20px rgba(232, 100, 58, 0.3)",
            transition: "all 0.25s",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.transform = "translateY(-1.5px)")
          }
          onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
        >
          ＋ Đăng hải sản mới
        </button>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        {[
          [
            "📦",
            activeCount,
            "Hải sản đang rao bán",
            C.ok,
            "rgba(45, 125, 70, 0.1)",
          ],
          [
            "💬",
            unread,
            "Tin nhắn chưa đọc",
            C.coral,
            "rgba(232, 100, 58, 0.1)",
          ],
          [
            "⚖️",
            `${totalRemaining} kg`,
            "Tổng trọng lượng kho",
            C.ocean,
            "rgba(11, 79, 108, 0.1)",
          ],
        ].map(([ico, val, lbl, col]) => (
          <div
            key={lbl}
            style={{
              background: C.white,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${col}`,
              padding: "20px 24px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.01)",
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 4 }}>{ico}</div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: col,
                lineHeight: 1.1,
              }}
            >
              {val}
            </div>
            <div
              style={{
                fontSize: 12,
                color: C.muted,
                marginTop: 6,
                fontWeight: 600,
              }}
            >
              {lbl}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 4,
          background: "#E2E8F0",
          borderRadius: 12,
          padding: 4,
          width: "fit-content",
          marginBottom: 24,
          flexWrap: "wrap"
        }}
      >
        {[
          ["listings", `📦 Bài đã đăng (${listingsTotal})`],
          ["chats", "💬 Tin nhắn trao đổi"],
          ["favorites", `❤️ Mục yêu thích (${favorites.length})`],
          ["boatlogs", "⛵ Nhật ký cabin"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === k ? C.white : "transparent",
              color: tab === k ? C.ocean : C.muted,
              boxShadow: tab === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
              fontFamily: "inherit",
              transition: "all 0.2s",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Tab: Listings */}
      {tab === "listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {loadingListings ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: C.muted,
                fontWeight: 500,
              }}
            >
              ⏳ Đang tải kho bài viết của bạn...
            </div>
          ) : listings.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: C.muted,
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>📦</div>
              <div style={{ fontWeight: 700, color: C.dark }}>
                Kho hàng của bạn đang trống rỗng
              </div>
              <div style={{ fontSize: 13, marginTop: 6 }}>
                Bắt đầu bán hàng cùng HảiSản.vn ngay!{" "}
                <button
                  onClick={() => navigate("/dang-bai")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.ocean,
                    fontWeight: 700,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Đăng bài ngay →
                </button>
              </div>
            </div>
          ) : (
            listings.map((p) => (
              <div
                key={p.id}
                style={{
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: "20px 24px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: C.dark,
                        marginBottom: 6,
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      {pill(
                        p.type === "Fresh" ? "#DBEAFE" : "#FEF3C7",
                        p.type === "Fresh" ? "#1D4ED8" : "#92400E",
                        p.type === "Fresh" ? "Tươi" : "Khô",
                      )}
                      {pill(
                        p.status === "Active" ? C.okL : "#F3F4F6",
                        p.status === "Active" ? C.ok : C.muted,
                        p.status === "Active" ? "Đang bán" : p.status,
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: C.muted }}>
                      Giá:{" "}
                      <strong style={{ color: C.dark }}>
                        {fmt(p.price)}/kg
                      </strong>
                      {" · "}
                      Còn:{" "}
                      <strong
                        style={{
                          color: p.remainingWeight < 5 ? "#DC2626" : C.dark,
                        }}
                      >
                        {p.remainingWeight} kg
                      </strong>
                    </div>
                    {p.type === "Fresh" && p.catchTime && (
                      <div style={{ marginTop: 6 }}>
                        <CountdownBadge catchTime={p.catchTime} />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {/* ── THAY ĐỔI: 1 nút Sửa thông tin duy nhất ── */}
                    <button
                      onClick={() => setEditProduct(p)}
                      style={{
                        padding: "6px 16px",
                        borderRadius: 8,
                        border: `1px solid ${C.border}`,
                        background: C.white,
                        color: C.ocean,
                        fontWeight: 600,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                      }}
                    >
                      ✏️ Sửa thông tin
                    </button>

                    {/* Nút Đẩy tin */}
                    <button
                      onClick={() => bumpProduct(p.id)}
                      disabled={
                        bumpingId === p.id || isBumpingOnCooldown(p.bumpedAt)
                      }
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: isBumpingOnCooldown(p.bumpedAt)
                          ? "#64748B"
                          : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                        color: "#fff",
                        fontWeight: 700,
                        cursor: isBumpingOnCooldown(p.bumpedAt)
                          ? "not-allowed"
                          : "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                        opacity:
                          bumpingId === p.id || isBumpingOnCooldown(p.bumpedAt)
                            ? 0.75
                            : 1,
                      }}
                    >
                      {bumpingId === p.id
                        ? "…"
                        : isBumpingOnCooldown(p.bumpedAt)
                          ? `⏳ Chờ (${getCooldownHours(p.bumpedAt)}h)`
                          : "🚀 Đẩy tin"}
                    </button>

                    {/* Nút Xoá */}
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: "#FEE2E2",
                        color: "#DC2626",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                      }}
                    >
                      🗑️ Xoá
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Phân trang */}
          {listingsTotalPages > 1 && (
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginTop: 24,
              }}
            >
              <button
                disabled={listingsPage === 1}
                onClick={() => setListingsPage((p) => Math.max(1, p - 1))}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color: listingsPage === 1 ? C.muted : C.ocean,
                  cursor: listingsPage === 1 ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                ‹ Trước
              </button>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.dark,
                  alignSelf: "center",
                }}
              >
                Trang {listingsPage} / {listingsTotalPages}
              </span>
              <button
                disabled={listingsPage === listingsTotalPages}
                onClick={() =>
                  setListingsPage((p) => Math.min(listingsTotalPages, p + 1))
                }
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color:
                    listingsPage === listingsTotalPages ? C.muted : C.ocean,
                  cursor:
                    listingsPage === listingsTotalPages
                      ? "not-allowed"
                      : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "inherit",
                  transition: "all 0.2s",
                }}
              >
                Sau ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab: Chats */}
      {tab === "chats" && <InboxTab user={user} />}

      {/* Tab: Favorites */}
      {tab === "favorites" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {favLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              ⏳ Đang tải...
            </div>
          ) : favorites.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: C.muted,
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>❤️</div>
              <div style={{ fontWeight: 700, color: C.dark }}>
                Chưa có sản phẩm yêu thích
              </div>
            </div>
          ) : (
            favorites.map((p) => (
              <div
                key={p.id}
                style={{
                  background: C.white,
                  borderRadius: 14,
                  border: `1px solid ${C.border}`,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 10,
                    background: C.bg,
                    overflow: "hidden",
                    flexShrink: 0,
                  }}
                >
                  {p.coverImg ? (
                    <img
                      src={p.coverImg}
                      alt={p.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 24,
                      }}
                    >
                      🐟
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: C.dark }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>
                    {fmt(p.price)}/kg · Còn {p.remainingWeight} kg
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/san-pham/${p.id}`)}
                  style={{
                    padding: "7px 16px",
                    borderRadius: 8,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    color: C.ocean,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: "inherit",
                    fontSize: 13,
                  }}
                >
                  Xem →
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab: BoatLogs */}
      {tab === "boatlogs" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {!(user?.isVerified || user?.isPremium || user?.role === "Admin") ? (
            <div style={{
              textAlign: "center",
              padding: "40px 20px",
              background: "#FFFBEB",
              border: "1px solid #F59E0B",
              borderRadius: 16,
              color: "#B45309"
            }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>⚠️</div>
              <h3 style={{ fontWeight: 800, margin: "0 0 8px 0" }}>Tính năng giới hạn</h3>
              <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>
                Chức năng đăng Nhật ký Cabin chỉ dành cho chủ tàu cá/ngư thuyền đã xác minh danh tính hoặc nâng cấp thành viên. Vui lòng liên hệ Admin để hoàn tất xác minh tài khoản của bạn.
              </p>
            </div>
          ) : (
            <>
              {/* Write log form */}
              <div style={{
                background: C.white,
                borderRadius: 16,
                padding: "24px",
                border: `1px solid ${C.border}`,
                boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
              }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: C.dark, marginBottom: 14 }}>
                  ⛵ Đăng Nhật Ký Cabin mới
                </h3>
                <form onSubmit={handleCreateLog} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <textarea
                    rows={4}
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    placeholder="Hôm nay tàu cá của bạn hoạt động ở ngư trường nào? Thời tiết ngoài khơi ra sao? Đánh bắt được những hải sản gì tươi ngon..."
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: 10,
                      border: `1px solid ${C.border}`,
                      fontSize: 14,
                      outline: "none",
                      fontFamily: "inherit",
                      resize: "vertical"
                    }}
                    required
                  />

                  {/* Previews */}
                  {logPreviews.length > 0 && (
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {logPreviews.map((p, idx) => (
                        <div key={idx} style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden" }}>
                          <img src={p} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button
                            type="button"
                            onClick={() => removeLogImage(idx)}
                            style={{
                              position: "absolute",
                              top: 2,
                              right: 2,
                              background: "rgba(0,0,0,0.6)",
                              color: "#fff",
                              border: "none",
                              borderRadius: "50%",
                              width: 16,
                              height: 16,
                              fontSize: 10,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center"
                            }}
                          >
                            &times;
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ cursor: "pointer", fontSize: 13, color: C.ocean, fontWeight: 700 }}>
                      📷 Đính kèm hình ảnh
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleLogImageChange}
                        style={{ display: "none" }}
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={submittingLog || !logContent.trim()}
                      style={{
                        background: submittingLog || !logContent.trim() ? "#CBD5E1" : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                        color: "#fff",
                        border: "none",
                        padding: "8px 24px",
                        borderRadius: 99,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: submittingLog || !logContent.trim() ? "not-allowed" : "pointer"
                      }}
                    >
                      {submittingLog ? "Đang đăng..." : "Đăng nhật ký"}
                    </button>
                  </div>
                </form>
              </div>

              {/* History logs list */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Lịch sử nhật ký boong tàu của bạn
                </h4>
                {loadingLogs ? (
                  <div style={{ textAlign: "center", padding: 20, color: C.muted }}>⏳ Đang tải...</div>
                ) : myLogs.length === 0 ? (
                  <div style={{
                    textAlign: "center",
                    padding: 30,
                    color: C.muted,
                    background: C.white,
                    borderRadius: 14,
                    border: `1px solid ${C.border}`
                  }}>
                    Chưa đăng bài nhật ký cabin nào.
                  </div>
                ) : (
                  myLogs.map((log) => (
                    <div key={log._id} style={{
                      background: C.white,
                      borderRadius: 14,
                      padding: "16px 20px",
                      border: `1px solid ${C.border}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 12
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: C.muted }}>
                          Đăng lúc {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </span>
                        <button
                          onClick={() => handleDeleteLog(log._id)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#DC2626",
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          🗑️ Xóa nhật ký
                        </button>
                      </div>

                      <p style={{ fontSize: 13.5, color: C.dark, margin: 0, whiteSpace: "pre-line", lineHeight: 1.5 }}>
                        {log.content}
                      </p>

                      {log.images && log.images.length > 0 && (
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          {log.images.map((imgUrl, i) => (
                            <img
                              key={i}
                              src={imgUrl}
                              alt="Cabin Log"
                              style={{ width: 64, height: 64, borderRadius: 6, objectFit: "cover" }}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
