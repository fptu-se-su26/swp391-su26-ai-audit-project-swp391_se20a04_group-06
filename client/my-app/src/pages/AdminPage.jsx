import React, { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt } from "../utils/format";

/* ─── Mini bar chart (SVG thuần, không cần thư viện) ─── */
function BarChart({ data, color }) {
  const W = 340,
    H = 130,
    padL = 28,
    padR = 8,
    padB = 22,
    padT = 16;
  const cW = W - padL - padR;
  const cH = H - padT - padB;
  const max = Math.max(...data.map((d) => d.count), 1);
  const step = cW / data.length;
  const bW = step * 0.55;

  /* Đường kẻ ngang */
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Grid lines */}
      {gridLines.map((v) => {
        const y = padT + cH - (v / max) * cH;
        return (
          <g key={v}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke="#e5e7eb"
              strokeWidth={0.5}
              strokeDasharray="3,3"
            />
            <text
              x={padL - 4}
              y={y + 3}
              textAnchor="end"
              fontSize={8}
              fill="#9ca3af"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const bH = Math.max((d.count / max) * cH, d.count > 0 ? 3 : 0);
        const x = padL + i * step + (step - bW) / 2;
        const y = padT + cH - bH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bW}
              height={bH}
              fill={color}
              rx={3}
              opacity={0.85}
            />
            {d.count > 0 && (
              <text
                x={x + bW / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize={8}
                fill={color}
                fontWeight="600"
              >
                {d.count}
              </text>
            )}
            <text
              x={x + bW / 2}
              y={H - 5}
              textAnchor="middle"
              fontSize={8}
              fill="#6b7280"
            >
              {d.label}
            </text>
          </g>
        );
      })}

      {/* Trục Y */}
      <line
        x1={padL}
        x2={padL}
        y1={padT}
        y2={padT + cH}
        stroke="#d1d5db"
        strokeWidth={0.5}
      />
    </svg>
  );
}

/* ─── Pill badge ─── */
function Pill({ bg, color, children }) {
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 8px",
        borderRadius: 20,
      }}
    >
      {children}
    </span>
  );
}

/* ─── Star rating hiển thị ─── */
function Stars({ value }) {
  return (
    <span style={{ fontSize: 12, color: "#f59e0b", letterSpacing: 1 }}>
      {"★".repeat(Math.round(value))}
      {"☆".repeat(5 - Math.round(value))}
      <span style={{ color: "#6b7280", marginLeft: 4 }}>
        {value.toFixed(1)}
      </span>
    </span>
  );
}

/* ─── Stat card ─── */
function StatCard({ value, label, sub, color, icon }) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 12,
        border: `1px solid ${C.border}`,
        padding: "16px 18px",
      }}
    >
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>{sub}</div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AdminPage
═══════════════════════════════════════════════════════════ */
export function AdminPage() {
  const [tab, setTab] = useState("stats");
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api("/admin/stats"),
      api("/admin/users"),
      api("/admin/listings"),
    ])
      .then(([s, u, l]) => {
        setStats(s);
        setUsers(u);
        setListings(l);
      })
      .catch((e) => alert("Admin error: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  const toggleUser = async (id) => {
    try {
      const res = await api(`/admin/users/${id}/toggle`, { method: "PATCH" });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: res.isActive } : u)),
      );
    } catch (e) {
      alert(e.message);
    }
  };

  const deleteProduct = async (id) => {
    if (!confirm("Xoá bài đăng này?")) return;
    try {
      await api(`/admin/listings/${id}`, { method: "DELETE" });
      setListings((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e.message);
    }
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: 80, color: C.muted }}>
        ⏳ Đang tải dữ liệu admin...
      </div>
    );

  const totalActive = stats ? stats.activeFresh + stats.activeDried : 0;

  return (
    <div
      style={{ maxWidth: 1040, margin: "0 auto", padding: "24px 20px 80px" }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: C.dark,
          marginBottom: 20,
        }}
      >
        ⚙️ Trang Quản Trị Admin
      </h1>

      {/* ── Stat cards ── */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          <StatCard
            value={stats.totalUsers}
            icon="👥"
            label="Tổng người dùng"
            color={C.ocean}
          />
          <StatCard
            value={totalActive}
            icon="📋"
            label="Bài đang rao"
            color={C.ok}
          />
          <StatCard
            value={stats.activeFresh}
            icon="🌊"
            label="Hải sản tươi"
            color={C.coral}
          />
          <StatCard
            value={stats.activeDried}
            icon="🔥"
            label="Hải sản khô"
            color={C.warn}
          />
          <StatCard
            value={stats.totalReviews}
            icon="⭐"
            label="Đánh giá"
            sub={`TB: ${stats.avgRating} / 5`}
            color="#f59e0b"
          />
          <StatCard
            value={stats.totalFollows}
            icon="🔔"
            label="Lượt theo dõi"
            color="#8b5cf6"
          />
          <StatCard
            value={stats.totalMessages}
            icon="💬"
            label="Tin nhắn"
            color="#3b82f6"
          />
          <StatCard
            value={stats.expiredTotal}
            icon="⏰"
            label="Bài hết hạn"
            color="#ef4444"
          />
        </div>
      )}

      {/* ── Tabs ── */}
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
          ["stats", "📊 Thống kê"],
          ["users", "👥 Người dùng"],
          ["listings", "📋 Bài đăng"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              padding: "8px 18px",
              borderRadius: 8,
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
              fontFamily: "inherit",
              background: tab === k ? C.ocean : "transparent",
              color: tab === k ? "#fff" : C.muted,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ══════════════════════ TAB THỐNG KÊ ══════════════════════ */}
      {tab === "stats" && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Hàng 1: 2 biểu đồ cột */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* Biểu đồ bài đăng 7 ngày */}
            <div
              style={{
                background: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 4,
                }}
              >
                📋 Bài đăng mới — 7 ngày gần nhất
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                Tổng: {stats.postsPerDay.reduce((s, d) => s + d.count, 0)} bài
                trong tuần
              </div>
              <BarChart data={stats.postsPerDay} color={C.coral} />
            </div>

            {/* Biểu đồ người dùng 7 ngày */}
            <div
              style={{
                background: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 4,
                }}
              >
                👥 Người dùng mới — 7 ngày gần nhất
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>
                Tổng: {stats.usersPerDay.reduce((s, d) => s + d.count, 0)} tài
                khoản trong tuần
              </div>
              <BarChart data={stats.usersPerDay} color={C.ocean} />
            </div>
          </div>

          {/* Hàng 2: Phân bố loại + Top người bán */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
          >
            {/* Phân bố Fresh / Dried */}
            <div
              style={{
                background: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 16,
                }}
              >
                🐟 Phân bố loại sản phẩm
              </div>
              {[
                ["Hải sản tươi", stats.activeFresh, C.coral, "🌊"],
                ["Hải sản khô", stats.activeDried, C.warn, "🔥"],
              ].map(([lbl, n, col, ico]) => {
                const pct =
                  totalActive > 0 ? Math.round((n / totalActive) * 100) : 0;
                return (
                  <div key={lbl} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        marginBottom: 6,
                      }}
                    >
                      <span style={{ color: C.text, fontWeight: 600 }}>
                        {ico} {lbl}
                      </span>
                      <span style={{ color: C.muted }}>
                        {n} bài ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{ height: 10, background: C.bg, borderRadius: 5 }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: col,
                          borderRadius: 5,
                          transition: "width 0.5s",
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  marginTop: 20,
                  paddingTop: 14,
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {[
                  ["Tổng bài đang rao", totalActive, C.dark],
                  ["Bài đã hết hạn", stats.expiredTotal, "#ef4444"],
                  ["Tổng tin nhắn", stats.totalMessages, C.muted],
                  ["Lượt theo dõi", stats.totalFollows, "#8b5cf6"],
                ].map(([lbl, val, col]) => (
                  <div
                    key={lbl}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: C.muted }}>{lbl}</span>
                    <strong style={{ color: col }}>{val}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 người bán */}
            <div
              style={{
                background: C.white,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: "18px 20px",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 14,
                }}
              >
                🏆 Top 5 người bán nhiều nhất
              </div>

              {stats.topSellers.length === 0 && (
                <div style={{ color: C.muted, fontSize: 13 }}>
                  Chưa có dữ liệu
                </div>
              )}

              {stats.topSellers.map((seller, idx) => {
                const maxPosts = stats.topSellers[0]?.postCount || 1;
                const barPct =
                  seller.postCount > 0
                    ? Math.round((seller.postCount / maxPosts) * 100)
                    : 0;
                const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                return (
                  <div key={seller.id} style={{ marginBottom: 14 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                        }}
                      >
                        <span style={{ fontSize: 14 }}>{medals[idx]}</span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: C.dark,
                          }}
                        >
                          {seller.name}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <Stars value={seller.avgRating} />
                        <Pill bg="#FDE8E0" color="#C0401A">
                          {seller.postCount} bài
                        </Pill>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 6,
                          background: C.bg,
                          borderRadius: 3,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${barPct}%`,
                            background: idx === 0 ? "#f59e0b" : C.ocean,
                            borderRadius: 3,
                            transition: "width 0.6s",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          whiteSpace: "nowrap",
                        }}
                      >
                        🔔 {seller.followers} followers
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Hàng 3: Tổng kết đánh giá */}
          <div
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: "18px 20px",
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: C.dark,
                marginBottom: 12,
              }}
            >
              ⭐ Tổng kết đánh giá người bán
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{ fontSize: 40, fontWeight: 800, color: "#f59e0b" }}
                >
                  {stats.avgRating}
                </div>
                <Stars value={stats.avgRating} />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  Điểm trung bình
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.muted }}>
                  Dựa trên{" "}
                  <strong style={{ color: C.dark }}>
                    {stats.totalReviews}
                  </strong>{" "}
                  đánh giá từ người mua thực tế trên toàn nền tảng.
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: "flex",
                    gap: 10,
                    flexWrap: "wrap",
                  }}
                >
                  <Pill bg="#FDE8E0" color="#C0401A">
                    {stats.totalReviews} reviews tổng
                  </Pill>
                  <Pill
                    bg={stats.avgRating >= 4 ? "#dcfce7" : "#fef9c3"}
                    color={stats.avgRating >= 4 ? "#166534" : "#854d0e"}
                  >
                    {stats.avgRating >= 4.5
                      ? "🌟 Xuất sắc"
                      : stats.avgRating >= 4
                        ? "👍 Tốt"
                        : stats.avgRating >= 3
                          ? "😐 Trung bình"
                          : "⚠️ Cần cải thiện"}
                  </Pill>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB NGƯỜI DÙNG ══════════════════════ */}
      {tab === "users" && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {[
                  "#",
                  "Tên",
                  "SĐT",
                  "Bài đăng",
                  "Quyền",
                  "Trạng thái",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: C.muted,
                      fontSize: 13,
                    }}
                  >
                    #{u.id}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                  >
                    {u.name}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: C.muted,
                    }}
                  >
                    {u.phone}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    {u.postCount}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {u.role === "Admin" ? (
                      <Pill bg="#ede9fe" color="#5b21b6">
                        Admin
                      </Pill>
                    ) : (
                      <Pill bg={C.bg} color={C.muted}>
                        User
                      </Pill>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {u.isActive ? (
                      <Pill bg="#dcfce7" color="#166534">
                        ● Hoạt động
                      </Pill>
                    ) : (
                      <Pill bg="#fee2e2" color="#991b1b">
                        ● Bị khoá
                      </Pill>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => toggleUser(u.id)}
                      style={{
                        background: u.isActive ? "#fee2e2" : "#dcfce7",
                        color: u.isActive ? "#991b1b" : "#166534",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      {u.isActive ? "🔒 Khoá" : "🔓 Mở khoá"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════════════ TAB BÀI ĐĂNG ══════════════════════ */}
      {tab === "listings" && (
        <div
          style={{
            background: C.white,
            borderRadius: 12,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: C.bg }}>
                {[
                  "Sản phẩm",
                  "Loại",
                  "Hình thức",
                  "Người bán",
                  "Giá/kg",
                  "Còn lại",
                  "Thao tác",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "12px 16px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.muted,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {listings.map((p) => (
                <tr key={p.id} style={{ borderTop: `1px solid ${C.border}` }}>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontWeight: 600,
                      fontSize: 14,
                      maxWidth: 180,
                    }}
                  >
                    <div
                      style={{
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {p.name}
                    </div>
                    <div style={{ fontSize: 11, color: C.muted }}>#{p.id}</div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.type === "Fresh" ? (
                      <Pill bg="#FDE8E0" color="#C0401A">
                        🌊 Tươi
                      </Pill>
                    ) : (
                      <Pill bg="#FEF5E4" color="#8A5C00">
                        🔥 Khô
                      </Pill>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.salesType === "Retail" ? (
                      <Pill bg="#eff6ff" color="#1d4ed8">
                        Lẻ
                      </Pill>
                    ) : (
                      <Pill bg="#f0fdf4" color="#15803d">
                        Sỉ
                      </Pill>
                    )}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      color: C.muted,
                    }}
                  >
                    {p.sellerName}
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.coral,
                    }}
                  >
                    {fmt(p.price)}
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: 13 }}>
                    {p.remainingWeight}kg
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <button
                      onClick={() => deleteProduct(p.id)}
                      style={{
                        background: "#fee2e2",
                        color: "#991b1b",
                        border: "none",
                        padding: "6px 12px",
                        borderRadius: 8,
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 700,
                        fontFamily: "inherit",
                      }}
                    >
                      🗑️ Xoá
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
