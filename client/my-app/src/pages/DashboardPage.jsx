<<<<<<< Updated upstream
import React, { useState, useEffect } from 'react';
import { C } from '../utils/theme';
import { api } from '../services/api';
import { fmt, pill } from '../utils/format';
import { useCountdown } from '../hooks/useCountdown';
import { CountdownBadge } from '../components/ProductCard';
import { ChatBox } from '../components/ChatBox';
export function DashboardPage({ user, setPage, setSelectedProduct }) {
=======
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../services/api";
import { fmt, pill } from "../utils/format";
import { CountdownBadge } from "../components/ProductCard";
import { InboxTab } from "../components/InboxTab";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

// ── Design tokens ──
const T = {
  bg: "#fbf9f8",
  bg2: "#f5f3f3",
  white: "#ffffff",
  dark: "#1b1c1c",
  text: "#1b1c1c",
  muted: "#747878",
  border: "#c4c7c7",
  borderL: "#e4e2e2",
  accent: "#775a19",
  accentL: "#fef3c7",
  error: "#ba1a1a",
  errorL: "#ffdad6",
  ok: "#1e8449",
  okL: "#d5f5e3",
};

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
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: T.white,
          border: `1px solid ${T.border}`,
          padding: "28px 32px",
          maxWidth: 360,
          width: "90%",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>🗑️</div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: T.dark,
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
              border: `1px solid ${T.border}`,
              background: T.white,
              color: T.muted,
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
              border: "none",
              background: T.error,
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

export function DashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

>>>>>>> Stashed changes
  const [tab, setTab] = useState("listings");
  const [listings, setListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [unread, setUnread] = useState(0);
  const [editId, setEditId] = useState(null);
  const [editVal, setEditVal] = useState("");
  const [editLoading, setEditLoading] = useState(false);
<<<<<<< Updated upstream
=======
  const [bumpingId, setBumpingId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favLoading, setFavLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);
>>>>>>> Stashed changes

  useEffect(() => {
    api("/products/my")
      .then((data) => setListings(data))
      .catch(() => {})
      .finally(() => setLoadingListings(false));
    api("/messages/unread-count")
      .then((data) => setUnread(data.count))
      .catch(() => {});
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
<<<<<<< Updated upstream
    } catch (e) {
      alert(e.message);
=======
      toast.success("Đã cập nhật trọng lượng!");
    } catch (e) {
      toast.error(e.message);
>>>>>>> Stashed changes
    } finally {
      setEditLoading(false);
    }
  };

<<<<<<< Updated upstream
  const deleteProduct = async (productId) => {
    if (!confirm("Xoá bài đăng này?")) return;
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      setListings((prev) => prev.filter((p) => p.id !== productId));
    } catch (e) {
      alert(e.message);
=======
  const doDelete = async (productId) => {
    setConfirmDelete(null);
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      setListings((prev) => prev.filter((p) => p.id !== productId));
      toast.success("Đã xoá bài đăng.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  const bumpProduct = async (productId) => {
    setBumpingId(productId);
    try {
      const res = await api(`/products/${productId}/bump`, { method: "POST" });
      toast.success(res.message || "Đã đẩy tin lên đầu!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBumpingId(null);
>>>>>>> Stashed changes
    }
  };

  const activeCount = listings.filter((p) => p.status === "Active").length;
  const totalRemaining = listings.reduce(
    (s, p) => s + (p.remainingWeight || 0),
    0,
  );

  const tabStyle = (k) => ({
    padding: "10px 20px",
    border: tab === k ? `1px solid ${T.dark}` : `1px solid ${T.border}`,
    background: tab === k ? T.dark : T.white,
    color: tab === k ? "#fff" : T.muted,
    cursor: "pointer",
    fontWeight: 600,
    fontSize: 13,
    fontFamily: "inherit",
    letterSpacing: "0.04em",
    transition: "all 0.2s",
  });

  const btnStyle = (col = T.dark) => ({
    padding: "6px 14px",
    border: "none",
    background: col,
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    letterSpacing: "0.04em",
    transition: "opacity 0.2s",
  });

  const outlineBtn = () => ({
    padding: "6px 14px",
    border: `1px solid ${T.border}`,
    background: T.white,
    color: T.dark,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    transition: "all 0.2s",
  });

  return (
<<<<<<< Updated upstream
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 80px" }}>
=======
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        padding: "32px 24px 80px",
        background: T.bg,
      }}
    >
      {confirmDelete && (
        <ConfirmDialog
          message="Xoá bài đăng này? Thao tác không thể hoàn tác."
          onConfirm={() => doDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Header */}
>>>>>>> Stashed changes
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
<<<<<<< Updated upstream
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>
          📊 Dashboard — {user.name}
        </h1>
        <button
          onClick={() => setPage("post")}
          style={{
            background: C.coral,
            color: "#fff",
            border: "none",
            padding: "10px 18px",
            borderRadius: 10,
            cursor: "pointer",
            fontWeight: 700,
            fontSize: 14,
            fontFamily: "inherit",
          }}
        >
          ＋ Đăng bài mới
        </button>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        {[
          ["📦", activeCount, "Bài đang bán", C.ok],
          ["💬", unread, "Tin chưa đọc", C.coral],
          ["⚖️", `${totalRemaining}kg`, "Tổng hàng còn", C.ocean],
=======
          marginBottom: 32,
          flexWrap: "wrap",
          gap: 12,
          borderBottom: `1px solid ${T.border}`,
          paddingBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 28,
              fontWeight: 600,
              color: T.dark,
              margin: 0,
            }}
          >
            Bảng Điều Khiển
          </h1>
          <p
            style={{
              fontSize: 13,
              color: T.muted,
              margin: "4px 0 0",
              fontFamily: "'Be Vietnam Pro', sans-serif",
            }}
          >
            {user?.name}
          </p>
        </div>
        <button
          onClick={() => navigate("/dang-bai")}
          style={{ ...btnStyle(T.dark), padding: "12px 20px", fontSize: 13 }}
          onMouseEnter={(e) => (e.currentTarget.style.background = T.accent)}
          onMouseLeave={(e) => (e.currentTarget.style.background = T.dark)}
        >
          + Đăng hải sản mới
        </button>
      </div>

      {/* Stats Grid */}
      <div className="dash-stats-grid" style={{ marginBottom: 28 }}>
        {[
          ["📦", activeCount, "Hải sản đang bán", T.ok],
          ["💬", unread, "Tin nhắn chưa đọc", T.error],
          ["⚖️", `${totalRemaining} kg`, "Tổng kho hàng", T.accent],
>>>>>>> Stashed changes
        ].map(([ico, val, lbl, col]) => (
          <div
            key={lbl}
            style={{
<<<<<<< Updated upstream
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "18px 20px",
            }}
          >
            <div style={{ fontSize: 22 }}>{ico}</div>
            <div
              style={{
                fontSize: 26,
                fontWeight: 800,
=======
              background: T.white,
              border: `1px solid ${T.border}`,
              borderTop: `3px solid ${col}`,
              padding: "20px 24px",
            }}
          >
            <div style={{ fontSize: 22, marginBottom: 6 }}>{ico}</div>
            <div
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 26,
                fontWeight: 600,
>>>>>>> Stashed changes
                color: col,
                marginTop: 4,
              }}
            >
              {val}
            </div>
<<<<<<< Updated upstream
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
=======
            <div
              style={{
                fontSize: 11,
                color: T.muted,
                marginTop: 6,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
>>>>>>> Stashed changes
              {lbl}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
<<<<<<< Updated upstream
          gap: 4,
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          padding: 4,
          width: "fit-content",
          marginBottom: 20,
        }}
      >
        {[
          ["listings", `📦 Bài đã đăng (${listings.length})`],
          ["chats", "💬 Tin nhắn"],
=======
          gap: 0,
          marginBottom: 24,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        {[
          ["listings", `Bài đã đăng (${listings.length})`],
          ["chats", "Tin nhắn"],
          ["favorites", `Yêu thích (${favorites.length})`],
>>>>>>> Stashed changes
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
<<<<<<< Updated upstream
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === k ? C.oceanP : "transparent",
              color: tab === k ? C.ocean : C.muted,
              fontFamily: "inherit",
=======
              ...tabStyle(k),
              borderRadius: 0,
              borderBottom:
                tab === k ? `2px solid ${T.accent}` : "2px solid transparent",
              background: "none",
              color: tab === k ? T.accent : T.muted,
              border: "none",
              borderBottom:
                tab === k ? `2px solid ${T.accent}` : "2px solid transparent",
              padding: "10px 20px",
>>>>>>> Stashed changes
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loadingListings ? (
<<<<<<< Updated upstream
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              ⏳ Đang tải...
            </div>
          ) : listings.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
              <div style={{ fontSize: 48 }}>📦</div>
              <div style={{ marginTop: 12 }}>
                Chưa có bài đăng nào.{" "}
                <button
                  onClick={() => setPage("post")}
                  style={{
                    background: "none",
                    border: "none",
                    color: C.ocean,
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  Đăng ngay!
                </button>
=======
            <div style={{ textAlign: "center", padding: 40, color: T.muted }}>
              Đang tải...
            </div>
          ) : listings.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: T.muted,
                background: T.white,
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20,
                  fontWeight: 600,
                  color: T.dark,
                }}
              >
                Kho hàng đang trống
>>>>>>> Stashed changes
              </div>
              <button
                onClick={() => navigate("/dang-bai")}
                style={{ ...outlineBtn(), marginTop: 16, padding: "8px 20px" }}
              >
                Đăng bài ngay →
              </button>
            </div>
          ) : (
            listings.map((p) => (
              <div
                key={p.id}
                style={{
<<<<<<< Updated upstream
                  background: C.white,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: "16px 20px",
=======
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  padding: "18px 22px",
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
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 600,
                        fontSize: 16,
                        color: T.dark,
                        marginBottom: 6,
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        flexWrap: "wrap",
                        marginBottom: 8,
                      }}
                    >
                      <span
                        style={{
                          background:
                            p.type === "Fresh" ? "#dbeafe" : "#fef3c7",
                          color: p.type === "Fresh" ? "#1d4ed8" : "#92400e",
                          padding: "2px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.type === "Fresh" ? "Tươi" : "Khô"}
                      </span>
                      <span
                        style={{
                          background: p.status === "Active" ? T.okL : T.bg2,
                          color: p.status === "Active" ? T.ok : T.muted,
                          padding: "2px 8px",
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                        }}
                      >
                        {p.status === "Active" ? "Đang bán" : p.status}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: T.muted }}>
                      Giá:{" "}
                      <strong style={{ color: T.dark }}>
                        {fmt(p.price)}/kg
                      </strong>
                      {" · "}
                      Còn:{" "}
                      <strong
                        style={{
                          color: p.remainingWeight < 5 ? T.error : T.dark,
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

                  <div
                    style={{
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    {editId === p.id ? (
                      <>
                        <input
                          type="number"
                          value={editVal}
                          min="0"
                          step="0.5"
                          onChange={(e) => setEditVal(e.target.value)}
                          style={{
                            width: 80,
                            padding: "6px 10px",
                            border: `1px solid ${T.border}`,
                            fontFamily: "inherit",
                            fontSize: 13,
                            outline: "none",
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => saveWeight(p.id)}
                          disabled={editLoading}
                          style={{ ...btnStyle(T.ok), padding: "6px 12px" }}
                        >
                          {editLoading ? "…" : "Lưu"}
                        </button>
                        <button
                          onClick={() => setEditId(null)}
                          style={outlineBtn()}
                        >
                          Huỷ
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditId(p.id);
                          setEditVal(String(p.remainingWeight));
                        }}
                        style={outlineBtn()}
                      >
                        ✏️ Sửa kg
                      </button>
                    )}
                    <button
                      onClick={() => bumpProduct(p.id)}
                      disabled={bumpingId === p.id}
                      style={{
                        ...btnStyle(T.accent),
                        opacity: bumpingId === p.id ? 0.7 : 1,
                      }}
                    >
                      {bumpingId === p.id ? "…" : "🚀 Đẩy tin"}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      style={{ ...btnStyle(T.error) }}
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

      {tab === "chats" && <InboxTab user={user} />}

      {tab === "favorites" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {favLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: T.muted }}>
              Đang tải...
            </div>
          ) : favorites.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: T.muted,
                background: T.white,
                border: `1px solid ${T.border}`,
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 12 }}>❤️</div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 20,
                  color: T.dark,
                }}
              >
                Chưa có sản phẩm yêu thích
              </div>
            </div>
          ) : (
            favorites.map((p) => (
              <div
                key={p.id}
                style={{
                  background: T.white,
                  border: `1px solid ${T.border}`,
                  padding: "14px 18px",
>>>>>>> Stashed changes
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
<<<<<<< Updated upstream
                {p.coverImg ? (
                  <img
                    src={p.coverImg}
                    alt=""
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: 8,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <span
                    style={{ fontSize: 36, width: 52, textAlign: "center" }}
                  >
                    🐟
                  </span>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: C.muted,
                      marginTop: 3,
                      display: "flex",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{fmt(p.price)}/kg</span>
                    <span>Còn: {p.remainingWeight}kg</span>
                    {p.type === "Fresh"
                      ? pill("#FDE8E0", "#C0401A", "🌊 Tươi")
                      : pill("#FEF5E4", "#8A5C00", "🔥 Khô")}
                    {p.status !== "Active" &&
                      pill("#FEE2E2", "#991B1B", p.status)}
=======
                <div
                  style={{
                    width: 52,
                    height: 52,
                    background: T.bg2,
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
                        fontSize: 22,
                      }}
                    >
                      🐟
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 600,
                      fontSize: 15,
                      color: T.dark,
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: T.muted, marginTop: 2 }}>
                    {fmt(p.price)}/kg · Còn {p.remainingWeight} kg
>>>>>>> Stashed changes
                  </div>
                </div>
                {editId === p.id ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={editVal}
                      onChange={(e) => setEditVal(e.target.value)}
                      style={{
                        width: 80,
                        padding: "6px 10px",
                        border: `1.5px solid ${C.ocean}`,
                        borderRadius: 8,
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                      type="number"
                      placeholder="KL mới"
                    />
                    <button
                      onClick={() => saveWeight(p.id)}
                      disabled={editLoading}
                      style={{
                        background: C.ok,
                        color: "#fff",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                    >
                      ✓ Lưu
                    </button>
                    <button
                      onClick={() => setEditId(null)}
                      style={{
                        background: C.bg,
                        color: C.muted,
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 13,
                        fontFamily: "inherit",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditId(p.id);
                      setEditVal(p.remainingWeight);
                    }}
                    style={{
                      background: C.oceanP,
                      color: C.ocean,
                      border: "none",
                      padding: "7px 14px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: "inherit",
                    }}
                  >
                    ✏️ Cập nhật KL
                  </button>
                )}
                <button
<<<<<<< Updated upstream
                  onClick={() => {
                    setSelectedProduct(p);
                    setPage("detail");
                  }}
                  style={{
                    background: C.bg,
                    color: C.ocean,
                    border: `1px solid ${C.border}`,
                    padding: "7px 14px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
=======
                  onClick={() => navigate(`/san-pham/${p.id}`)}
                  style={outlineBtn()}
>>>>>>> Stashed changes
                >
                  Xem →
                </button>
                <button
                  onClick={() => deleteProduct(p.id)}
                  style={{
                    background: "#FEE2E2",
                    color: "#991B1B",
                    border: "none",
                    padding: "7px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                    fontSize: 13,
                    fontFamily: "inherit",
                  }}
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "chats" && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            padding: 24,
            textAlign: "center",
            color: C.muted,
          }}
        >
          <div style={{ fontSize: 36, marginBottom: 12 }}>💬</div>
          <div>
            Bấm vào sản phẩm → <strong>Liên hệ người bán</strong> để xem hội
            thoại cụ thể.
          </div>
          {unread > 0 && (
            <div style={{ marginTop: 8, color: C.coral, fontWeight: 700 }}>
              Bạn có {unread} tin nhắn chưa đọc!
            </div>
          )}
        </div>
      )}
    </div>
  );
}