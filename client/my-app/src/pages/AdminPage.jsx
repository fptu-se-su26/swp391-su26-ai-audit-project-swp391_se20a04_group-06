import React, { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { AdminUserRow, useVerifyUser } from "./AdminPage_verify_patch";

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
      {gridLines.map((v, gi) => {
        const y = padT + cH - (v / max) * cH;
        return (
          <g key={gi}>
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
  const num = parseFloat(value) || 0;
  return (
    <span style={{ fontSize: 12, color: "#f59e0b", letterSpacing: 1 }}>
      {"★".repeat(Math.round(num))}
      {"☆".repeat(5 - Math.round(num))}
      <span style={{ color: "#6b7280", marginLeft: 4 }}>{num.toFixed(1)}</span>
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
  const [reports, setReports] = useState([]);
  const [reportStatus, setReportStatus] = useState("Pending");
  const [reportsLoading, setReportsLoading] = useState(false);

  const loadReports = (status) => {
    setReportsLoading(true);
    api(`/reports?status=${status}`)
      .then((data) => setReports(data))
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  };

  React.useEffect(() => {
    if (tab === "reports") loadReports(reportStatus);
  }, [tab, reportStatus]);

  const handleReport = async (reportId, action) => {
    const adminNote =
      action === "resolve"
        ? (prompt("Ghi chú khi xử lý (tuỳ chọn):") ?? "")
        : "";
    try {
      await api(`/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ action, adminNote }),
      });
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      alert(
        action === "resolve"
          ? "✅ Đã ẩn bài và xử lý báo cáo"
          : "✅ Đã bỏ qua báo cáo",
      );
    } catch (e) {
      alert(e.message);
    }
  };
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);

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

  const { toggleVerify, verifyingId } = useVerifyUser(users, setUsers);

  const toggleUser = async (id) => {
    setTogglingId(id);
    try {
      const res = await api(`/admin/users/${id}/toggle`, { method: "PATCH" });
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: res.isActive } : u)),
      );
    } catch (e) {
      alert(e.message);
    } finally {
      setTogglingId(null);
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

  // Fallback an toàn cho các mảng — tránh crash nếu backend chưa trả đủ field
  const safeStats = stats
    ? {
        ...stats,
        postsPerDay: stats.postsPerDay || [],
        usersPerDay: stats.usersPerDay || [],
        topSellers: stats.topSellers || [],
        avgRating: parseFloat(stats.avgRating) || 0,
        totalReviews: stats.totalReviews ?? 0,
        totalMessages: stats.totalMessages ?? 0,
        totalFollows: stats.totalFollows ?? 0,
        expiredTotal: stats.expiredTotal ?? 0,
        activeFresh: stats.activeFresh ?? 0,
        activeDried: stats.activeDried ?? 0,
      }
    : null;

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
            value={safeStats.totalUsers}
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
            value={safeStats.activeFresh}
            icon="🌊"
            label="Hải sản tươi"
            color={C.coral}
          />
          <StatCard
            value={safeStats.activeDried}
            icon="🔥"
            label="Hải sản khô"
            color={C.warn}
          />
          <StatCard
            value={safeStats.totalReviews}
            icon="⭐"
            label="Đánh giá"
            sub={`TB: ${safeStats.avgRating} / 5`}
            color="#f59e0b"
          />
          <StatCard
            value={safeStats.totalFollows}
            icon="🔔"
            label="Lượt theo dõi"
            color="#8b5cf6"
          />
          <StatCard
            value={safeStats.totalMessages}
            icon="💬"
            label="Tin nhắn"
            color="#3b82f6"
          />
          <StatCard
            value={safeStats.expiredTotal}
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
          ["reports", "🚩 Báo cáo"],
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
                Tổng: {safeStats.postsPerDay.reduce((s, d) => s + d.count, 0)}{" "}
                bài trong tuần
              </div>
              <BarChart data={safeStats.postsPerDay} color={C.coral} />
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
                Tổng: {safeStats.usersPerDay.reduce((s, d) => s + d.count, 0)}{" "}
                tài khoản trong tuần
              </div>
              <BarChart data={safeStats.usersPerDay} color={C.ocean} />
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
                ["Hải sản tươi", safeStats.activeFresh, C.coral, "🌊"],
                ["Hải sản khô", safeStats.activeDried, C.warn, "🔥"],
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
                  ["Bài đã hết hạn", safeStats.expiredTotal, "#ef4444"],
                  ["Tổng tin nhắn", safeStats.totalMessages, C.muted],
                  ["Lượt theo dõi", safeStats.totalFollows, "#8b5cf6"],
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

              {safeStats.topSellers.length === 0 && (
                <div style={{ color: C.muted, fontSize: 13 }}>
                  Chưa có dữ liệu
                </div>
              )}

              {safeStats.topSellers.map((seller, idx) => {
                const maxPosts = safeStats.topSellers[0]?.postCount || 1;
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
                  {safeStats.avgRating}
                </div>
                <Stars value={safeStats.avgRating} />
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                  Điểm trung bình
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, color: C.muted }}>
                  Dựa trên{" "}
                  <strong style={{ color: C.dark }}>
                    {safeStats.totalReviews}
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
                    {safeStats.totalReviews} reviews tổng
                  </Pill>
                  <Pill
                    bg={safeStats.avgRating >= 4 ? "#dcfce7" : "#fef9c3"}
                    color={safeStats.avgRating >= 4 ? "#166534" : "#854d0e"}
                  >
                    {safeStats.avgRating >= 4.5
                      ? "🌟 Xuất sắc"
                      : safeStats.avgRating >= 4
                        ? "👍 Tốt"
                        : safeStats.avgRating >= 3
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
                  "Xác minh",
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
                <AdminUserRow
                  key={u.id}
                  user={u}
                  onToggleActive={toggleUser}
                  onToggleVerify={toggleVerify}
                  verifyingId={verifyingId}
                  togglingId={togglingId}
                />
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
      {tab === "reports" && (
        <div>
          {/* Status filter */}
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            {["Pending", "Resolved", "Dismissed"].map((s) => (
              <button
                key={s}
                onClick={() => setReportStatus(s)}
                style={{
                  padding: "7px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "inherit",
                  background: reportStatus === s ? "#0EA5E9" : "#F3F4F6",
                  color: reportStatus === s ? "#fff" : "#6B7280",
                }}
              >
                {s === "Pending"
                  ? "⏳ Chờ xử lý"
                  : s === "Resolved"
                    ? "✅ Đã xử lý"
                    : "❌ Đã bỏ qua"}
              </button>
            ))}
          </div>

          {reportsLoading ? (
            <div style={{ textAlign: "center", padding: 40, color: "#9CA3AF" }}>
              Đang tải...
            </div>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: 60, color: "#9CA3AF" }}>
              <div style={{ fontSize: 48 }}>🎉</div>
              <div style={{ marginTop: 12, fontWeight: 600 }}>
                Không có báo cáo nào
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {reports.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: "#fff",
                    borderRadius: 12,
                    border: "1px solid #e5e7eb",
                    padding: "16px 20px",
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}
                    >
                      🚩 {r.reason}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#6B7280",
                        marginBottom: 2,
                      }}
                    >
                      Sản phẩm: <strong>{r.productName}</strong> (ID:{" "}
                      {r.productId})
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#6B7280",
                        marginBottom: 2,
                      }}
                    >
                      Người bán: {r.sellerName} | Người báo cáo:{" "}
                      {r.reporterName}
                    </div>
                    <div style={{ fontSize: 11, color: "#9CA3AF" }}>
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  {reportStatus === "Pending" && (
                    <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                      <button
                        onClick={() => handleReport(r.id, "resolve")}
                        style={{
                          background: "#FEE2E2",
                          color: "#991B1B",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "inherit",
                        }}
                      >
                        🗑️ Ẩn bài
                      </button>
                      <button
                        onClick={() => handleReport(r.id, "dismiss")}
                        style={{
                          background: "#F3F4F6",
                          color: "#6B7280",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontFamily: "inherit",
                        }}
                      >
                        Bỏ qua
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
