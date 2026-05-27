/**
 * DashboardPage.jsx — Refactored
 *
 * CHANGES:
 *   1. Loại bỏ prop `user` — dùng useAuth() thay thế (Context Pattern)
 *   2. Thay toàn bộ alert() → useToast() (Observer Pattern)
 *   3. Thay confirm() → ConfirmDialog component nội bộ (không chặn UI thread)
 *   4. Giữ nguyên 100% UI, logic, và API calls
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
import { useAuth } from "../context/AuthContext"; // ← NEW
import { useToast } from "../context/ToastContext"; // ← NEW

// ── ConfirmDialog — thay thế window.confirm() ───────────────
/**
 * TRƯỚC: if (!confirm("Xoá bài đăng này?")) return;
 * SAU:   <ConfirmDialog> với callback onConfirm
 *
 * confirm() block UI thread, không có animation, không customizable
 */
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

// ── Main Component ───────────────────────────────────────────
export function DashboardPage() {
  // ← THAY ĐỔI: không nhận user qua props nữa
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [unread, setUnread] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [bumpingId, setBumpingId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null); // productId cần xoá

  useEffect(() => {
    api("/products/my")
      .then((data) => setListings(data))
      .catch(() => {})
      .finally(() => setLoadingListings(false));
    api("/messages/unread-count")
      .then((data) => setUnread(data.count))
      .catch(() => {});
    api("/favorites")
      .then((data) => setFavorites(data))
      .catch(() => {})
      .finally(() => setFavLoading(false));
  }, []);

  const saveWeight = async (productId) => {
    if (!editVal) return;
    setEditLoading(true);
    try {
      await api(`/products/${productId}`, {
        method: "PUT",
        body: JSON.stringify({ remainingWeight: parseFloat(editVal) }),
      });
      setListings((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, remainingWeight: parseFloat(editVal) }
            : p,
        ),
      );
      setEditId(null);
      toast.success("Đã cập nhật trọng lượng!"); // ← THAY alert()
    } catch (e) {
      toast.error(e.message); // ← THAY alert()
    } finally {
      setEditLoading(false);
    }
  };

  // TRƯỚC: if (!confirm(...)) return; await api(...) / catch alert()
  // SAU:   mở ConfirmDialog → onConfirm gọi doDelete
  const doDelete = async (productId) => {
    setConfirmDelete(null);
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      setListings((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Đã xoá bài đăng."); // ← THAY alert()
    } catch (e) {
      toast.error(e.message); // ← THAY alert()
    }
  };

  const bumpProduct = async (productId) => {
    setBumpingId(productId);
    try {
      const res = await api(`/products/${productId}/bump`, { method: "POST" });
      toast.success(res.message || "Đã đẩy tin lên đầu thành công!"); // ← THAY alert()
    } catch (e) {
      toast.error(e.message); // ← THAY alert()
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
          ["listings", `📦 Bài đã đăng (${listings.length})`],
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
                    {/* Edit weight */}
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
                          step="0.5"
                          onChange={(e) => setEditVal(e.target.value)}
                          style={{
                            width: 80,
                            padding: "6px 10px",
                            borderRadius: 8,
                            border: `1px solid ${C.border}`,
                            fontFamily: "inherit",
                            fontSize: 13,
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveWeight(p.id)}
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
                          onClick={() => setEditId(null)}
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
                      <button
                        onClick={() => {
                          setEditId(p.id);
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
                        ✏️ Sửa kg
                      </button>
                    )}

                    <button
                      onClick={() => bumpProduct(p.id)}
                      disabled={bumpingId === p.id}
                      style={{
                        padding: "6px 14px",
                        borderRadius: 8,
                        border: "none",
                        background: `linear-gradient(135deg, ${C.ocean}, ${C.oceanL})`,
                        color: "#fff",
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "inherit",
                        fontSize: 13,
                        opacity: bumpingId === p.id ? 0.7 : 1,
                      }}
                    >
                      {bumpingId === p.id ? "…" : "🚀 Đẩy tin"}
                    </button>

                    {/* TRƯỚC: onClick={() => deleteProduct(p.id)} dùng confirm()
                        SAU: mở ConfirmDialog */}
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
