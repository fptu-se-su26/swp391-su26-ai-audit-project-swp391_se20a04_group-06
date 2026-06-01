/**
 * DashboardPage.jsx — Refactored & Optimized (Edit Price + Pagination Support)
 *
 * CHANGES:
 *   1. Loại bỏ prop `user` — dùng useAuth() thay thế (Context Pattern)
 *   2. Thay toàn bộ alert() → useToast() (Observer Pattern)
 *   3. Thay confirm() → ConfirmDialog component nội bộ (không chặn UI thread)
 *   4. Tích hợp tính năng SỬA GIÁ bên cạnh SỬA CÂN NẶNG dùng chung hàm gộp handleSave()
 *   5. Hỗ trợ PHÂN TRANG (Pagination) mượt mà cho danh sách tin cá nhân
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
// Kiểm tra xem mẻ hàng có đang trong thời gian chờ 24h hay không
const isBumpingOnCooldown = (bumpedAtStr) => {
  if (!bumpedAtStr) return false;
  const diffMs = Date.now() - new Date(bumpedAtStr).getTime();
  return diffMs < 24 * 3600 * 1000;
};

// Tính số giờ còn lại cần phải đợi
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

  // States quản lý phân trang cá nhân
  const [listingsPage, setListingsPage] = useState(1);
  const [listingsTotalPages, setListingsTotalPages] = useState(1);
  const [listingsTotal, setListingsTotal] = useState(0);

  // States sửa đổi cân nặng & giá cả mẻ hàng
  const [editId, setEditId] = useState(null);
  const [editType, setEditType] = useState(null); // 'weight' hoặc 'price'
  const [editVal, setEditVal] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [bumpingId, setBumpingId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null); // productId cần xoá

  // Hàm tải danh sách mẻ hàng phân trang
  const fetchMyListings = useCallback((pageNo) => {
    setLoadingListings(true);
    // Đặt limit=5 để dễ dàng kiểm tra cơ chế phân trang hoạt động ngoài giao diện
    api(`/products/my?page=${pageNo}&limit=5`)
      .then((res) => {
        setListings(res.data || []);
        setListingsTotalPages(res.totalPages || 1);
        setListingsTotal(res.total || 0);
      })
      .catch(() => { })
      .finally(() => setLoadingListings(false));
  }, []);

  // Tải danh sách mẻ hàng khi thay đổi trang hoặc tab chuyển sang "listings"
  useEffect(() => {
    if (tab === "listings") {
      fetchMyListings(listingsPage);
    }
  }, [tab, listingsPage, fetchMyListings]);

  // Tải số tin nhắn chưa đọc & danh mục yêu thích
  useEffect(() => {
    api("/messages/unread-count")
      .then((data) => setUnread(data.count))
      .catch(() => { });
    api("/favorites")
      .then((data) => setFavorites(data))
      .catch(() => { })
      .finally(() => setFavLoading(false));
  }, []);

  // Hàm cập nhật cân nặng hoặc đổi giá tích hợp
  const handleSave = async (productId) => {
    if (!editVal) return;
    setEditLoading(true);

    const payload = editType === "weight"
      ? { remainingWeight: parseFloat(editVal) }
      : { price: parseInt(editVal, 10) };

    try {
      await api(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setListings((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, ...payload }
            : p,
        ),
      );
      setEditId(null);
      setEditType(null);
      toast.success(editType === "weight" ? "Đã cập nhật trọng lượng!" : "Đã cập nhật giá bán mới!");
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
      // Tải lại dữ liệu phân trang mới nhất để dồn tin từ trang sau lên lấp đầy slot trống
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

      // 🌟 CẢI TIẾN: Cập nhật cục bộ thời gian đẩy tin mới nhất để nút đổi sang Cooldown ngay lập tức
      setListings((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, bumpedAt: new Date().toISOString() } : p
        )
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
      {/* ConfirmDialog — render nếu đang chờ confirm delete */}
      {confirmDelete && (
        <ConfirmDialog
          message="Xoá bài đăng này? Thao tác không thể hoàn tác."
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
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
        }}
      >
        {[
          ["listings", `📦 Bài đã đăng (${listingsTotal})`],
          ["chats", "💬 Tin nhắn trao đổi"],
          ["favorites", `❤️ Mục yêu thích (${favorites.length})`],
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

                    {/* CountdownBadge cho hải sản tươi */}
                    {p.type === "Fresh" && p.catchTime && (
                      <div style={{ marginTop: 6 }}>
                        <CountdownBadge catchTime={p.catchTime} />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {/* Khung nhập liệu khi đang Sửa kg hoặc Sửa giá */}
                    {editId === p.id ? (
                      <div
                        style={{
                          display: "flex",
                          gap: 6,
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="number"
                          value={editVal}
                          min="0"
                          step={editType === "weight" ? "0.5" : "1000"}
                          onChange={(e) => setEditVal(e.target.value)}
                          style={{
                            width: editType === "weight" ? 80 : 115,
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: `1px solid ${C.border}`,
                            fontFamily: "inherit",
                            fontSize: 13,
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSave(p.id)}
                          disabled={editLoading}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: "none",
                            background: C.ok,
                            color: "#fff",
                            fontWeight: 700,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 13,
                          }}
                        >
                          {editLoading ? "…" : "Lưu"}
                        </button>
                        <button
                          onClick={() => { setEditId(null); setEditType(null); }}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 8,
                            border: `1px solid ${C.border}`,
                            background: C.white,
                            color: C.muted,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 13,
                          }}
                        >
                          Huỷ
                        </button>
                      </div>
                    ) : (
                      <>
                        {/* Nút Sửa cân nặng */}
                        <button
                          onClick={() => {
                            setEditId(p.id);
                            setEditType("weight");
                            setEditVal(String(p.remainingWeight));
                          }}
                          style={{
                            padding: "6px 14px",
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
                          ⚖️ Sửa kg
                        </button>

                        {/* Nút Sửa giá bán */}
                        <button
                          onClick={() => {
                            setEditId(p.id);
                            setEditType("price");
                            setEditVal(String(p.price));
                          }}
                          style={{
                            padding: "6px 14px",
                            borderRadius: 8,
                            border: `1px solid ${C.border}`,
                            background: C.white,
                            color: C.coral,
                            fontWeight: 600,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            fontSize: 13,
                          }}
                        >
                          🏷️ Sửa giá
                        </button>
                      </>
                    )}

                    {/* Nút Đẩy tin */}
                    <button
                      onClick={() => bumpProduct(p.id)}
                      // 🌟 CẢI TIẾN: Khóa nút bấm nếu đang trong trạng thái loading hoặc đang trong thời gian Cooldown 24h
                      disabled={bumpingId === p.id || isBumpingOnCooldown(p.bumpedAt)}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        // Nếu đang chờ thì đổi màu xám sẫm, nếu sẵn sàng thì hiển thị màu xanh đại dương nguyên bản
                        background: isBumpingOnCooldown(p.bumpedAt)
                          ? "#64748B"
                          : `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                        color: "#fff",
                        fontWeight: 700,
                        cursor: isBumpingOnCooldown(p.bumpedAt) ? "not-allowed" : "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                        opacity: bumpingId === p.id || isBumpingOnCooldown(p.bumpedAt) ? 0.75 : 1,
                      }}
                    >
                      {bumpingId === p.id
                        ? "…"
                        : isBumpingOnCooldown(p.bumpedAt)
                          ? `⏳ Chờ (${getCooldownHours(p.bumpedAt)}h)` // Hiển thị số giờ còn lại
                          : "🚀 Đẩy tin"
                      }
                    </button>

                    {/* Nút Xoá bài */}
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

          {/* Phân trang cho tab Listings */}
          {listingsTotalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 24 }}>
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
                  transition: "all 0.2s"
                }}
              >
                ‹ Trước
              </button>

              <span style={{ fontSize: 13, fontWeight: 700, color: C.dark, alignSelf: "center" }}>
                Trang {listingsPage} / {listingsTotalPages}
              </span>

              <button
                disabled={listingsPage === listingsTotalPages}
                onClick={() => setListingsPage((p) => Math.min(listingsTotalPages, p + 1))}
                style={{
                  padding: "8px 14px",
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.white,
                  color: listingsPage === listingsTotalPages ? C.muted : C.ocean,
                  cursor: listingsPage === listingsTotalPages ? "not-allowed" : "pointer",
                  fontWeight: 700,
                  fontSize: 13,
                  fontFamily: "inherit",
                  transition: "all 0.2s"
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
    </div>
  );
}