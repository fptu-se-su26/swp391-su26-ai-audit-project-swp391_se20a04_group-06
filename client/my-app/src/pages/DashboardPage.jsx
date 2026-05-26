/**
 * DashboardPage.jsx — Modernized UI/UX Version
 *
 * Tối ưu hóa giao diện trang điều khiển cá nhân, tương thích tốt trên điện thoại di động.
 * Giữ nguyên 100% logic quản lý listings, cập nhật trọng lượng, và yêu thích.
 */

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
      alert(res.message || "Đã đẩy tin lên đầu thành công!");
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
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px 80px" }}>
      {/* Header Dashboard */}
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
          📊 Bảng Điều Khiển — {user.name}
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

      {/* Grid thống kê nâng cấp vạch lề trái đồng bộ */}
      <div
        className="stats-grid"
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
            "0 0 0 2px rgba(45, 125, 70, 0.1)",
          ],
          [
            "💬",
            unread,
            "Tin nhắn chưa đọc",
            C.coral,
            "0 0 0 2px rgba(232, 100, 58, 0.1)",
          ],
          [
            "⚖️",
            `${totalRemaining} kg`,
            "Tổng trọng lượng kho",
            C.ocean,
            "0 0 0 2px rgba(11, 79, 108, 0.1)",
          ],
        ].map(([ico, val, lbl, col, glow]) => (
          <div
            key={lbl}
            style={{
              background: C.white,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              borderLeft: `4px solid ${col}`, // Thẻ chỉ số lề trái đồng bộ
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

      {/* Tabs Menu */}
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

      {/* TAB 1: DANH SÁCH BÀI ĐÃ ĐĂNG */}
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
                    cursor: "pointer",
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: "underline",
                  }}
                >
                  Đăng bán ngay!
                </button>
              </div>
            </div>
          ) : (
            listings.map((p) => (
              <div
                key={p.id}
                className="listing-row"
                style={{
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
                  transition: "all 0.2s",
                }}
              >
                {/* Ảnh bài viết */}
                {p.coverImg ? (
                  <img
                    src={p.coverImg}
                    alt=""
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      objectFit: "cover",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 10,
                      background: C.oceanP,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 28,
                    }}
                  >
                    🐟
                  </div>
                )}

                {/* Thông tin bài đăng */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 15, color: C.dark }}>
                    {p.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: C.muted,
                      marginTop: 4,
                      display: "flex",
                      gap: 8,
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: C.coral }}>
                      {fmt(p.price)}/kg
                    </span>
                    <span style={{ color: "#E5E7EB" }}>|</span>
                    <span>
                      Còn sẵn: <strong>{p.remainingWeight} kg</strong>
                    </span>
                    <span style={{ color: "#E5E7EB" }}>|</span>
                    {p.type === "Fresh"
                      ? pill("#FDE8E0", "#C0401A", "🌊 Tươi")
                      : pill("#FEF5E4", "#8A5C00", "🔥 Khô")}
                    {p.status !== "Active" &&
                      pill("#FEE2E2", "#991B1B", p.status)}
                  </div>
                </div>

                {/* Hàng hành động */}
                <div
                  className="listing-actions"
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  {editId === p.id ? (
                    <div style={{ display: "flex", gap: 6 }}>
                      <input
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        style={{
                          width: 80,
                          padding: "8px 12px",
                          border: `1.5px solid ${C.ocean}`,
                          borderRadius: 8,
                          fontSize: 13,
                          fontFamily: "inherit",
                          outline: "none",
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
                          padding: "8px 14px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "inherit",
                        }}
                      >
                        Lưu
                      </button>
                      <button
                        onClick={() => setEditId(null)}
                        style={{
                          background: "#E2E8F0",
                          color: "#475569",
                          border: "none",
                          padding: "8px 12px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
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
                        padding: "8px 14px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = "#D9EDF5")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = C.oceanP)
                      }
                    >
                      ✏️ Sửa số lượng
                    </button>
                  )}

                  <button
                    onClick={() => navigate(`/san-pham/${p.id}`)}
                    style={{
                      background: C.white,
                      color: C.ocean,
                      border: `1px solid ${C.border}`,
                      padding: "8px 14px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                      fontFamily: "inherit",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F1F5F9")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = C.white)
                    }
                  >
                    Xem bài
                  </button>

                  {p.status === "Active" && (
                    <button
                      onClick={() => bumpProduct(p.id)}
                      disabled={bumpingId === p.id}
                      title="Đẩy bài viết lên đầu trang chính (1 lần/24h)"
                      style={{
                        background: bumpingId === p.id ? "#E2E8F0" : "#FEF5E4",
                        color: "#92400E",
                        border: "none",
                        padding: "8px 14px",
                        borderRadius: 10,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: "inherit",
                        fontWeight: 700,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (bumpingId !== p.id)
                          e.currentTarget.style.background = "#FEEFCE";
                      }}
                      onMouseLeave={(e) => {
                        if (bumpingId !== p.id)
                          e.currentTarget.style.background = "#FEF5E4";
                      }}
                    >
                      {bumpingId === p.id ? "Đang đẩy..." : "🚀 Đẩy tin"}
                    </button>
                  )}

                  <button
                    onClick={() => deleteProduct(p.id)}
                    style={{
                      background: "#FEE2E2",
                      color: "#991B1B",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: 10,
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "inherit",
                      fontWeight: 700,
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#FCA5A5")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "#FEE2E2")
                    }
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: TIN NHẮN LIÊN LẠC */}
      {tab === "chats" && <InboxTab user={user} />}

      {/* TAB 3: DANH SÁCH YÊU THÍCH */}
      {tab === "favorites" && (
        <div>
          {favLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: C.muted,
                fontWeight: 500,
              }}
            >
              Đang tải danh sách yêu thích...
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
              <div style={{ fontSize: 56, marginBottom: 12 }}>🤍</div>
              <div style={{ fontWeight: 700, color: C.dark }}>
                Chưa có hải sản yêu thích nào
              </div>
              <div style={{ marginTop: 6, fontSize: 13 }}>
                Nhấn biểu tượng ❤️ trên các sản phẩm ngoài trang chủ để lưu lại
                xem sau.
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                gap: 24,
              }}
              className="product-grid"
            >
              {favorites.map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/san-pham/${p.id}`)}
                  style={{
                    background: C.white,
                    borderRadius: 16,
                    border: "1px solid #E5E7EB",
                    overflow: "hidden",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 15px 25px rgba(11, 79, 108, 0.08)";
                    e.currentTarget.style.transform = "translateY(-3px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow =
                      "0 4px 6px -1px rgba(0,0,0,0.01)";
                    e.currentTarget.style.transform = "none";
                  }}
                >
                  {/* Ảnh sản phẩm yêu thích */}
                  <div style={{ height: 140, overflow: "hidden" }}>
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
                          height: "100%",
                          background: `linear-gradient(135deg, ${C.ocean} 0%, ${C.oceanL} 100%)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 56,
                        }}
                      >
                        🐟
                      </div>
                    )}
                  </div>

                  <div style={{ padding: "14px 16px" }}>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 15,
                        color: C.dark,
                        marginBottom: 6,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </div>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 800,
                        color: C.coral,
                        marginBottom: 8,
                      }}
                    >
                      {fmt(p.price)}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: C.muted,
                        display: "flex",
                        gap: 10,
                        fontWeight: 500,
                      }}
                    >
                      <span>⚖️ Còn {p.remainingWeight} kg</span>
                      {p.viewCount > 0 && <span>👁️ {p.viewCount} xem</span>}
                    </div>

                    <hr
                      style={{
                        border: "none",
                        borderTop: "1px solid #F3F4F6",
                        margin: "10px 0",
                      }}
                    />

                    <div
                      style={{ fontSize: 12, color: C.ocean, fontWeight: 700 }}
                    >
                      👤 {p.sellerName} {p.sellerIsVerified && "✅"}
                    </div>
                    {p.status !== "Active" && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 11,
                          color: "#DC2626",
                          fontWeight: 700,
                          background: "#FEF2F2",
                          padding: "4px 8px",
                          borderRadius: 4,
                          width: "fit-content",
                        }}
                      >
                        ⚠️ Đã bán hết / Ẩn bài
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Đoạn mã CSS hỗ trợ Co giãn/Responsive cho giao diện cá nhân */}
      <style>{`
        @media (max-width: 680px) {
          .stats-grid {
            grid-template-columns: 1fr !important;
          }
          .listing-row {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .listing-actions {
            width: 100% !important;
            justify-content: flex-end !important;
          }
        }
      `}</style>
    </div>
  );
}
