import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt, pill } from "../utils/format";
import { useCountdown } from "../hooks/useCountdown";
import { CountdownBadge } from "../components/ProductCard";
import { ChatBox } from "../components/ChatBox";
import { InboxTab } from "../components/InboxTab";
export function DashboardPage({ user }) {
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
    } catch (e) {
      alert(e.message);
    } finally {
      setEditLoading(false);
    }
  };

  const deleteProduct = async (productId) => {
    if (!confirm("Xoá bài đăng này?")) return;
    try {
      await api(`/products/${productId}`, { method: "DELETE" });
      setListings((prev) => prev.filter((p) => p.id !== productId));
    } catch (e) {
      alert(e.message);
    }
  };

  const bumpProduct = async (productId) => {
    setBumpingId(productId);
    try {
      const res = await api(`/products/${productId}/bump`, { method: "POST" });
      alert(res.message || "Đã đẩy tin!");
    } catch (e) {
      alert(e.message);
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
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 80px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 800, color: C.dark, margin: 0 }}>
          📊 Dashboard — {user.name}
        </h1>
        <button
          onClick={() => navigate("/dang-bai")}
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
        ].map(([ico, val, lbl, col]) => (
          <div
            key={lbl}
            style={{
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
                color: col,
                marginTop: 4,
              }}
            >
              {val}
            </div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
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
          ["favorites", `❤️ Yêu thích (${favorites.length})`],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              background: tab === k ? C.oceanP : "transparent",
              color: tab === k ? C.ocean : C.muted,
              fontFamily: "inherit",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "listings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {loadingListings ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>
              ⏳ Đang tải...
            </div>
          ) : listings.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
              <div style={{ fontSize: 48 }}>📦</div>
              <div style={{ marginTop: 12 }}>
                Chưa có bài đăng nào.{" "}
                <button
                  onClick={() => navigate("/dang-bai")}
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
              </div>
            </div>
          ) : (
            listings.map((p) => (
              <div
                key={p.id}
                style={{
                  background: C.white,
                  borderRadius: 12,
                  border: `1px solid ${C.border}`,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
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
                  onClick={() => {
                    navigate(`/san-pham/${p.id}`);
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
                >
                  Xem →
                </button>
                {p.status === "Active" && (
                  <button
                    onClick={() => bumpProduct(p.id)}
                    disabled={bumpingId === p.id}
                    title="Đẩy tin lên đầu (1 lần/24h)"
                    style={{
                      background: bumpingId === p.id ? C.bg : "#FEF5E4",
                      color: "#92400E",
                      border: "none",
                      padding: "7px 12px",
                      borderRadius: 8,
                      cursor: "pointer",
                      fontSize: 13,
                      fontFamily: "inherit",
                      fontWeight: 600,
                    }}
                  >
                    {bumpingId === p.id ? "..." : "🚀 Đẩy tin"}
                  </button>
                )}
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

      {tab === "chats" && <InboxTab user={user} />}

      {tab === "favorites" && (
        <div>
          {favLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: C.muted }}>Đang tải...</div>
          ) : favorites.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: C.muted }}>
              <div style={{ fontSize: 48 }}>🤍</div>
              <div style={{ marginTop: 12, fontSize: 15, fontWeight: 600 }}>Chưa có sản phẩm yêu thích</div>
              <div style={{ marginTop: 6, fontSize: 13 }}>Nhấn ❤️ trên bất kỳ sản phẩm nào để lưu lại</div>
            </div>
          ) : (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
              gap: 16,
            }} className="product-grid">
              {favorites.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/san-pham/${p.id}`)}
                  style={{
                    background: "#fff", borderRadius: 12,
                    border: "1px solid #e5e7eb", overflow: "hidden",
                    cursor: "pointer", transition: "box-shadow 0.15s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.1)"}
                  onMouseLeave={(e) => e.currentTarget.style.boxShadow = "none"}
                >
                  {p.coverImg ? (
                    <img src={p.coverImg} alt={p.name} style={{ width: "100%", height: 130, objectFit: "cover" }} />
                  ) : (
                    <div style={{ height: 130, background: "linear-gradient(135deg,#0EA5E9,#38BDF8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>🐟</div>
                  )}
                  <div style={{ padding: "10px 12px" }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: "#111", marginBottom: 4 }}>{p.name}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: "#EF4444", marginBottom: 4 }}>
                      {Number(p.price).toLocaleString("vi-VN")}₫/kg
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", display: "flex", gap: 8 }}>
                      <span>⚖️ {p.remainingWeight}kg</span>
                      {p.viewCount > 0 && <span>👁 {p.viewCount}</span>}
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                      👤 {p.sellerName} {p.sellerIsVerified ? "✅" : ""}
                    </div>
                    {p.status !== "Active" && (
                      <div style={{ marginTop: 6, fontSize: 11, color: "#DC2626", fontWeight: 600 }}>⚠️ Đã hết hàng</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
