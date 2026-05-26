/**
 * AdminPage.jsx — Premium UI/UX Redesigned Version
 *
 * Nâng cấp toàn diện giao diện quản trị Admin.
 * Giữ nguyên 100% logic states, APIs và các hàm hỗ trợ.
 */
import React, { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { AdminUserRow, useVerifyUser } from "./AdminPage_verify_patch";

/* ─── Mini bar chart nâng cấp với Linear Gradients ─── */
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
  const gradientId = `bar-gradient-${color.replace("#", "")}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Định nghĩa dải màu Gradient cho cột biểu đồ */}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

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
              stroke="#f3f4f6"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            <text
              x={padL - 6}
              y={y + 3}
              textAnchor="end"
              fontSize={8.5}
              fontWeight="600"
              fill="#9ca3af"
            >
              {v}
            </text>
          </g>
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const bH = Math.max((d.count / max) * cH, d.count > 0 ? 4 : 0);
        const x = padL + i * step + (step - bW) / 2;
        const y = padT + cH - bH;
        return (
          <g key={i}>
            <rect
              x={x}
              y={y}
              width={bW}
              height={bH}
              fill={`url(#${gradientId})`}
              rx={4} // Bo tròn cột biểu đồ mềm mại hơn
              style={{ transition: "all 0.3s ease" }}
            />
            {d.count > 0 && (
              <text
                x={x + bW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize={8.5}
                fill={color}
                fontWeight="700"
              >
                {d.count}
              </text>
            )}
            <text
              x={x + bW / 2}
              y={H - 5}
              textAnchor="middle"
              fontSize={8.5}
              fontWeight="500"
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
        stroke="#e5e7eb"
        strokeWidth={1}
      />
    </svg>
  );
}

/* ─── Pill badge thiết kế lại mềm dịu ─── */
function Pill({ bg, color, children }) {
  return (
    <span
      style={{
        background: bg,
        color,
        fontSize: 11,
        fontWeight: 700,
        padding: "3px 10px",
        borderRadius: 20,
        display: "inline-block",
        lineHeight: 1.2,
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
    <span
      style={{
        fontSize: 11,
        color: "#f59e0b",
        letterSpacing: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {"★".repeat(Math.round(num))}
      {"☆".repeat(5 - Math.round(num))}
      <span style={{ color: "#6b7280", marginLeft: 4, fontWeight: 700 }}>
        {num.toFixed(1)}
      </span>
    </span>
  );
}

/* ─── Stat card nâng cấp phong cách vạch chỉ thị lề trái ─── */
function StatCard({ value, label, sub, color, icon }) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${color}`, // Vạch chỉ thị màu lề trái chuyên nghiệp
        padding: "18px 20px",
        boxShadow:
          "0 4px 6px -1px rgba(0,0,0,0.01), 0 2px 4px -1px rgba(0,0,0,0.01)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <div>
        <div style={{ fontSize: 24, marginBottom: 6 }}>{icon}</div>
        <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
          {value}
        </div>
      </div>
      <div style={{ marginTop: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.dark }}>
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 11,
              color: C.muted,
              marginTop: 2,
              fontWeight: 500,
            }}
          >
            {sub}
          </div>
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   AdminPage Main Component
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

  useEffect(() => {
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

        // Kiểm tra u và l có phải là mảng không, nếu bọc trong .data thì lấy .data
        const safeUsers = Array.isArray(u)
          ? u
          : u && Array.isArray(u.data)
            ? u.data
            : [];
        const safeListings = Array.isArray(l)
          ? l
          : l && Array.isArray(l.data)
            ? l.data
            : [];

        setUsers(safeUsers);
        setListings(safeListings);
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
      <div
        style={{
          textAlign: "center",
          padding: 80,
          color: C.muted,
          fontWeight: 500,
        }}
      >
        ⏳ Đang tải dữ liệu quản trị... Vui lòng đợi trong giây lát...
      </div>
    );

  const totalActive = stats ? stats.activeFresh + stats.activeDried : 0;

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
      style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px 80px" }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          color: C.dark,
          marginBottom: 24,
        }}
      >
        ⚙️ Trang Quản Trị Hệ Thống Admin
      </h1>

      {/* ── Stat cards Grid ── */}
      {stats && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
            gap: 16,
            marginBottom: 32,
          }}
        >
          <StatCard
            value={safeStats.totalUsers}
            icon="👥"
            label="Người dùng"
            color={C.ocean}
          />
          <StatCard
            value={totalActive}
            icon="📋"
            label="Tin rao active"
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
            label="Tổng đánh giá"
            sub={`Trung bình: ${safeStats.avgRating}/5`}
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
            label="Lượt nhắn tin"
            color="#3b82f6"
          />
          <StatCard
            value={safeStats.expiredTotal}
            icon="⏰"
            label="Bài đã hết hạn"
            color="#ef4444"
          />
        </div>
      )}

      {/* ── Tabs Chuyên Nghiệp ── */}
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
          ["stats", "📊 Thống kê"],
          ["users", "👥 Người dùng"],
          ["listings", "📋 Bài đăng"],
          ["reports", "🚩 Báo cáo"],
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
              fontFamily: "inherit",
              background: tab === k ? C.white : "transparent",
              color: tab === k ? C.dark : C.muted,
              boxShadow: tab === k ? "0 4px 10px rgba(0,0,0,0.06)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {/* ══════════════════════ TAB THỐNG KÊ ══════════════════════ */}
      {tab === "stats" && stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Hàng 1: 2 biểu đồ cột */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 24,
            }}
          >
            {/* Biểu đồ bài đăng 7 ngày */}
            <div
              style={{
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "24px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 4,
                }}
              >
                📋 Tin đăng mới — 7 ngày gần nhất
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
                Tổng cộng:{" "}
                <strong>
                  {safeStats.postsPerDay.reduce((s, d) => s + d.count, 0)}
                </strong>{" "}
                bài đăng mới trong tuần
              </div>
              <BarChart data={safeStats.postsPerDay} color={C.coral} />
            </div>

            {/* Biểu đồ người dùng 7 ngày */}
            <div
              style={{
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "24px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 4,
                }}
              >
                👥 Đăng ký mới — 7 ngày gần nhất
              </div>
              <div style={{ fontSize: 11, color: C.muted, marginBottom: 16 }}>
                Tổng cộng:{" "}
                <strong>
                  {safeStats.usersPerDay.reduce((s, d) => s + d.count, 0)}
                </strong>{" "}
                tài khoản mới trong tuần
              </div>
              <BarChart data={safeStats.usersPerDay} color={C.ocean} />
            </div>
          </div>

          {/* Hàng 2: Phân bố loại + Top người bán */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 24,
            }}
          >
            {/* Phân bố Fresh / Dried */}
            <div
              style={{
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "24px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 20,
                }}
              >
                🐟 Phân bố loại sản phẩm hoạt động
              </div>
              {[
                ["Hải sản tươi sống", safeStats.activeFresh, C.coral, "🌊"],
                ["Hải sản khô đóng gói", safeStats.activeDried, C.warn, "🔥"],
              ].map(([lbl, n, col, ico]) => {
                const pct =
                  totalActive > 0 ? Math.round((n / totalActive) * 100) : 0;
                return (
                  <div key={lbl} style={{ marginBottom: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: 13,
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ color: C.text, fontWeight: 700 }}>
                        {ico} {lbl}
                      </span>
                      <span style={{ color: C.muted, fontWeight: 600 }}>
                        {n} bài ({pct}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: "#F1F5F9",
                        borderRadius: 10,
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${pct}%`,
                          background: col,
                          borderRadius: 10,
                          transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                        }}
                      />
                    </div>
                  </div>
                );
              })}

              <div
                style={{
                  marginTop: 24,
                  paddingTop: 18,
                  borderTop: `1px solid ${C.border}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[
                  ["Tổng bài đang rao bán", totalActive, C.dark],
                  [
                    "Bài đã quá hạn (24h tươi)",
                    safeStats.expiredTotal,
                    "#ef4444",
                  ],
                  [
                    "Tổng số tin nhắn liên lạc",
                    safeStats.totalMessages,
                    C.muted,
                  ],
                  [
                    "Tổng lượt theo dõi ngư dân",
                    safeStats.totalFollows,
                    "#8b5cf6",
                  ],
                ].map(([lbl, val, col]) => (
                  <div
                    key={lbl}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: C.muted, fontWeight: 500 }}>
                      {lbl}
                    </span>
                    <strong style={{ color: col, fontWeight: 700 }}>
                      {val}
                    </strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 người bán uy tín */}
            <div
              style={{
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: "24px",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
              }}
            >
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: C.dark,
                  marginBottom: 18,
                }}
              >
                🏆 Top 5 người bán tích cực nhất
              </div>

              {safeStats.topSellers.length === 0 && (
                <div
                  style={{ color: C.muted, fontSize: 13, padding: "20px 0" }}
                >
                  Chưa có dữ liệu hoạt động.
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
                  <div key={seller.id} style={{ marginBottom: 16 }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 16 }}>{medals[idx]}</span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
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
                          background: "#F1F5F9",
                          borderRadius: 10,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${barPct}%`,
                            background: idx === 0 ? "#f59e0b" : C.ocean,
                            borderRadius: 10,
                            transition:
                              "width 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          whiteSpace: "nowrap",
                          fontWeight: 500,
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
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: "24px",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: C.dark,
                marginBottom: 16,
              }}
            >
              ⭐ Thống kê phản hồi &amp; Đánh giá từ người mua
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 40,
                flexWrap: "wrap",
              }}
            >
              <div style={{ textAlign: "center", minWidth: 120 }}>
                <div
                  style={{
                    fontSize: 44,
                    fontWeight: 900,
                    color: "#f59e0b",
                    lineHeight: 1,
                  }}
                >
                  {safeStats.avgRating}
                </div>
                <div style={{ margin: "6px 0" }}>
                  <Stars value={safeStats.avgRating} />
                </div>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                  Điểm hài lòng trung bình
                </div>
              </div>
              <div style={{ flex: 1, minWidth: 260 }}>
                <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>
                  Dữ liệu được thống kê dựa trên tổng số{" "}
                  <strong style={{ color: C.dark }}>
                    {safeStats.totalReviews}
                  </strong>{" "}
                  lượt đánh giá giao dịch thực tế từ người dùng toàn hệ thống.
                </div>
                <div
                  style={{
                    marginTop: 12,
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <Pill bg="#EAF5EE" color="#166534">
                    {safeStats.totalReviews} reviews đã ghi nhận
                  </Pill>
                  <Pill
                    bg={safeStats.avgRating >= 4 ? "#dcfce7" : "#fef9c3"}
                    color={safeStats.avgRating >= 4 ? "#166534" : "#854d0e"}
                  >
                    {safeStats.avgRating >= 4.5
                      ? "🌟 Xuất sắc"
                      : safeStats.avgRating >= 4
                        ? "👍 Uy tín tốt"
                        : safeStats.avgRating >= 3
                          ? "😐 Bình thường"
                          : "⚠️ Cần rà soát"}
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
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#F8FAFC",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {[
                    "#ID",
                    "Họ và tên",
                    "Số điện thoại",
                    "Tin đã đăng",
                    "Vai trò",
                    "Trạng thái",
                    "Xác minh danh tính",
                    "Hành động",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#4B5563",
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
        </div>
      )}

      {/* ══════════════════════ TAB BÀI ĐĂNG ══════════════════════ */}
      {tab === "listings" && (
        <div
          style={{
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr
                  style={{
                    background: "#F8FAFC",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {[
                    "Sản phẩm",
                    "Phân loại",
                    "Bán Sỉ / Lẻ",
                    "Chủ tin đăng",
                    "Đơn giá",
                    "Trọng lượng sẵn có",
                    "Hành động",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "16px 20px",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#4B5563",
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
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: `1px solid ${C.border}`,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "#F8FAFC")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <td
                      style={{
                        padding: "16px 20px",
                        fontWeight: 700,
                        fontSize: 14,
                        maxWidth: 200,
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
                      <div
                        style={{
                          fontSize: 11,
                          color: C.muted,
                          fontWeight: 500,
                        }}
                      >
                        ID: #{p.id}
                      </div>
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      {p.type === "Fresh" ? (
                        <Pill bg="#FDE8E0" color="#C0401A">
                          🌊 Tươi sống
                        </Pill>
                      ) : (
                        <Pill bg="#FEF5E4" color="#8A5C00">
                          🔥 Đồ khô
                        </Pill>
                      )}
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      {p.salesType === "Retail" ? (
                        <Pill bg="#eff6ff" color="#1d4ed8">
                          Bán lẻ
                        </Pill>
                      ) : (
                        <Pill bg="#f0fdf4" color="#15803d">
                          Bán sỉ
                        </Pill>
                      )}
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: 13,
                        fontWeight: 500,
                        color: C.text,
                      }}
                    >
                      {p.sellerName}
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: 14,
                        fontWeight: 800,
                        color: C.coral,
                      }}
                    >
                      {fmt(p.price)}
                    </td>
                    <td
                      style={{
                        padding: "16px 20px",
                        fontSize: 13,
                        fontWeight: 600,
                        color: C.dark,
                      }}
                    >
                      {p.remainingWeight} kg
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        style={{
                          background: "#fee2e2",
                          color: "#991b1b",
                          border: "none",
                          padding: "8px 14px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 700,
                          fontFamily: "inherit",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fecaca")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#fee2e2")
                        }
                      >
                        🗑️ Xoá bài
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════════════ TAB BÁO CÁO ══════════════════════ */}
      {tab === "reports" && (
        <div>
          {/* Status filters */}
          <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
            {["Pending", "Resolved", "Dismissed"].map((s) => (
              <button
                key={s}
                onClick={() => setReportStatus(s)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 10,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  fontFamily: "inherit",
                  background: reportStatus === s ? C.ocean : "#F1F5F9",
                  color: reportStatus === s ? "#fff" : "#475569",
                  transition: "all 0.2s",
                }}
              >
                {s === "Pending"
                  ? "⏳ Đang chờ xử lý"
                  : s === "Resolved"
                    ? "✅ Đã gỡ bỏ bài"
                    : "❌ Đã từ chối báo cáo"}
              </button>
            ))}
          </div>

          {reportsLoading ? (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "#9CA3AF",
                fontWeight: 500,
              }}
            >
              Đang truy xuất các báo cáo liên quan...
            </div>
          ) : reports.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                color: "#9CA3AF",
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <div style={{ fontWeight: 700, color: C.dark }}>
                Không có báo cáo nào tồn đọng
              </div>
              <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>
                Hệ thống hoạt động rất sạch sẽ và an toàn.
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {reports.map((r) => (
                <div
                  key={r.id}
                  style={{
                    background: "#fff",
                    borderRadius: 16,
                    border: "1px solid #e5e7eb",
                    padding: "20px 24px",
                    display: "flex",
                    gap: 20,
                    alignItems: "flex-start",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        fontSize: 15,
                        marginBottom: 8,
                        color: "#991B1B",
                      }}
                    >
                      🚩 Lý do: {r.reason}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: C.dark,
                        marginBottom: 4,
                        fontWeight: 600,
                      }}
                    >
                      Sản phẩm vi phạm:{" "}
                      <strong style={{ color: C.ocean }}>
                        {r.productName}
                      </strong>{" "}
                      (ID tin: #{r.productId})
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: C.muted,
                        marginBottom: 4,
                        fontWeight: 500,
                      }}
                    >
                      Người bán:{" "}
                      <strong style={{ color: C.dark }}>{r.sellerName}</strong>{" "}
                      | Người báo cáo:{" "}
                      <strong style={{ color: C.dark }}>
                        {r.reporterName}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#9CA3AF",
                        marginTop: 8,
                        fontWeight: 500,
                      }}
                    >
                      🕒 Báo cáo gửi lúc:{" "}
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  {reportStatus === "Pending" && (
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        flexShrink: 0,
                        alignSelf: "center",
                      }}
                    >
                      <button
                        onClick={() => handleReport(r.id, "resolve")}
                        style={{
                          background: "#FEE2E2",
                          color: "#991B1B",
                          border: "none",
                          padding: "10px 16px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "inherit",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#fecaca")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#FEE2E2")
                        }
                      >
                        🗑️ Ẩn tin vi phạm
                      </button>
                      <button
                        onClick={() => handleReport(r.id, "dismiss")}
                        style={{
                          background: "#F1F5F9",
                          color: "#475569",
                          border: "none",
                          padding: "10px 16px",
                          borderRadius: 8,
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 700,
                          fontFamily: "inherit",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "#e2e8f0")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "#F1F5F9")
                        }
                      >
                        Bỏ qua báo cáo
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
