import { useState, useEffect } from "react";
import { C } from "../utils/theme";
import { api } from "../services/api";
import { fmt } from "../utils/format";
import { VerifiedBadge } from "../components/VerifiedBadge";
import { AdminBroadcastTab } from "../components/AdminBroadcastTab"; // ← MỚI
import { useToast } from "../context/ToastContext";

/* ─── Hộp thoại xác nhận tùy chỉnh ConfirmDialog ─── */
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

/* ─── Hook xác minh người dùng ─── */
function useVerifyUser(users, setUsers) {
  const toast = useToast();
  const [verifyingId, setVerifyingId] = useState(null);

  const toggleVerify = async (userId) => {
    setVerifyingId(userId);
    try {
      const res = await api(`/admin/users/${userId}/verify`, {
        method: "PATCH",
      });
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isVerified: res.isVerified } : u,
        ),
      );
      toast.success(res.message || "Xác minh người bán thành công!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setVerifyingId(null);
    }
  };

  return { toggleVerify, verifyingId };
}

/* ─── Hàng người dùng trong bảng ─── */
function AdminUserRow({
  user,
  onToggleActive,
  onToggleVerify,
  verifyingId,
  togglingId,
}) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{user.email}</div>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        <span
          style={{
            background: user.role === "Admin" ? "#7C3AED" : C.ocean,
            color: "#fff",
            padding: "2px 8px",
            borderRadius: 10,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {user.role}
        </span>
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "center" }}>
        {user.postCount}
      </td>
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        {user.isVerified && <VerifiedBadge showLabel />}
      </td>
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          <button
            onClick={() => onToggleActive(user.id)}
            disabled={togglingId === user.id}
            style={{
              background: user.isActive ? "#EF4444" : "#22C55E",
              color: "#fff",
              border: "none",
              padding: "4px 10px",
              borderRadius: 6,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 700,
              fontFamily: "inherit",
            }}
          >
            {togglingId === user.id
              ? "..."
              : user.isActive
                ? "Khoá"
                : "Mở khoá"}
          </button>

          {user.role !== "Admin" && (
            <button
              onClick={() => onToggleVerify(user.id)}
              disabled={verifyingId === user.id}
              style={{
                background: user.isVerified ? "#64748B" : "#0EA5E9",
                color: "#fff",
                border: "none",
                padding: "4px 10px",
                borderRadius: 6,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 700,
                fontFamily: "inherit",
              }}
            >
              {verifyingId === user.id
                ? "..."
                : user.isVerified
                  ? "✗ Thu hồi"
                  : "✓ Xác minh"}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

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

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  const gradientId = `bar-gradient-${color.replace("#", "")}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

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
              rx={4}
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

function StatCard({ value, label, sub, color, icon }) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${color}`,
        padding: "18px 20px",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
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

export function AdminPage() {
  const toast = useToast();
  const [tab, setTab] = useState("stats");
  const [reports, setReports] = useState([]);
  const [reportStatus, setReportStatus] = useState("Pending");
  const [reportsLoading, setReportsLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const loadReports = (status) => {
    Promise.resolve().then(() => {
      setReportsLoading(true);
    });
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
      toast.success(
        action === "resolve"
          ? "Đã ẩn bài viết vi phạm và xử lý báo cáo thành công!"
          : "Đã từ chối phản hồi báo cáo này.",
      );
    } catch (e) {
      toast.error(e.message);
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
      .catch((e) => toast.error("Admin error: " + e.message))
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
      toast.success(
        "Đã thay đổi trạng thái hoạt động của tài khoản thành công!",
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTogglingId(null);
    }
  };

  const doDeleteProduct = async (id) => {
    setConfirmDelete(null);
    try {
      await api(`/admin/listings/${id}`, { method: "DELETE" });
      setListings((prev) => prev.filter((p) => p.id !== id));
      toast.success("Đã gỡ bỏ bài đăng hải sản vĩnh viễn.");
    } catch (e) {
      toast.error(e.message);
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
    <div className="container py-5" style={{ maxWidth: 1200 }}>
      {confirmDelete && (
        <ConfirmDialog
          message="Gỡ bài viết này vĩnh viễn? Quyết định này không thể khôi phục."
          onConfirm={() => doDeleteProduct(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
      <h1 className="fw-bold mb-4" style={{ fontSize: 24, color: C.dark }}>
        ⚙️ Trang Quản Trị Hệ Thống Admin
      </h1>
      {/* ── Stat Cards ────────────────────────────────────────────── */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.totalUsers}
              icon="👥"
              label="Người dùng"
              color={C.ocean}
            />
          </div>
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={totalActive}
              icon="📋"
              label="Tin rao active"
              color={C.ok}
            />
          </div>
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.activeFresh}
              icon="🌊"
              label="Hải sản tươi"
              color={C.coral}
            />
          </div>
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.activeDried}
              icon="🔥"
              label="Hải sản khô"
              color={C.warn}
            />
          </div>
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.totalReviews}
              icon="⭐"
              label="Tổng đánh giá"
              sub={`Trung bình: ${safeStats.avgRating}/5`}
              color="#f59e0b"
            />
          </div>
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.totalFollows}
              icon="🔔"
              label="Lượt theo dõi"
              color="#8b5cf6"
            />
          </div>
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.totalMessages}
              icon="💬"
              label="Lượt nhắn tin"
              color="#3b82f6"
            />
          </div>
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.expiredTotal}
              icon="⏰"
              label="Bài đã hết hạn"
              color="#ef4444"
            />
          </div>
        </div>
      )}
      {/* ── Tab bar ───────────────────────────────────────────────── */}
      <div
        className="d-inline-flex gap-1 p-1 mb-4"
        style={{ background: "#E2E8F0", borderRadius: 12 }}
      >
        {[
          ["stats", "📊 Thống kê"],
          ["users", "👥 Người dùng"],
          ["listings", "📋 Bài đăng"],
          ["reports", "🚩 Báo cáo"],
          ["broadcast", "📢 Thông báo"], // ← MỚI
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className="btn fw-bold border-0 px-3 py-2"
            style={{
              borderRadius: 10,
              cursor: "pointer",
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
      {/* ── Tab: Thống kê ─────────────────────────────────────────── */}
      {tab === "stats" && stats && (
        <div className="d-flex flex-column gap-4">
          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <div
                className="card border-0 p-4"
                style={{
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
                }}
              >
                <div
                  className="fw-bold mb-1"
                  style={{ fontSize: 14, color: C.dark }}
                >
                  📋 Tin đăng mới — 7 ngày gần nhất
                </div>
                <div className="text-muted mb-3" style={{ fontSize: 11 }}>
                  Tổng cộng:{" "}
                  <strong>
                    {safeStats.postsPerDay.reduce((s, d) => s + d.count, 0)}
                  </strong>{" "}
                  bài đăng mới trong tuần
                </div>
                <BarChart data={safeStats.postsPerDay} color={C.coral} />
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div
                className="card border-0 p-4"
                style={{
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
                }}
              >
                <div
                  className="fw-bold mb-1"
                  style={{ fontSize: 14, color: C.dark }}
                >
                  👥 Đăng ký mới — 7 ngày gần nhất
                </div>
                <div className="text-muted mb-3" style={{ fontSize: 11 }}>
                  Tổng cộng:{" "}
                  <strong>
                    {safeStats.usersPerDay.reduce((s, d) => s + d.count, 0)}
                  </strong>{" "}
                  tài khoản mới trong tuần
                </div>
                <BarChart data={safeStats.usersPerDay} color={C.ocean} />
              </div>
            </div>
          </div>

          <div className="row g-4">
            <div className="col-12 col-lg-6">
              <div
                className="card border-0 p-4"
                style={{
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
                }}
              >
                <div
                  className="fw-bold mb-3"
                  style={{ fontSize: 14, color: C.dark }}
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
                    <div key={lbl} className="mb-3">
                      <div
                        className="d-flex justify-content-between mb-2"
                        style={{ fontSize: 13 }}
                      >
                        <span className="fw-bold" style={{ color: C.text }}>
                          {ico} {lbl}
                        </span>
                        <span className="fw-semibold text-muted">
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
                            transition:
                              "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}

                <div
                  className="d-flex flex-column gap-2 mt-4 pt-3 border-top"
                  style={{ borderColor: `${C.border} !important` }}
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
                      className="d-flex justify-content-between"
                      style={{ fontSize: 13 }}
                    >
                      <span className="fw-medium text-muted">{lbl}</span>
                      <strong className="fw-bold" style={{ color: col }}>
                        {val}
                      </strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="col-12 col-lg-6">
              <div
                className="card border-0 p-4"
                style={{
                  background: C.white,
                  borderRadius: 16,
                  border: `1px solid ${C.border}`,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.01)",
                }}
              >
                <div
                  className="fw-bold mb-3"
                  style={{ fontSize: 14, color: C.dark }}
                >
                  🏆 Top 5 người bán tích cực nhất
                </div>
                {safeStats.topSellers.length === 0 && (
                  <div className="text-muted py-3" style={{ fontSize: 13 }}>
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
                    <div key={seller.id} className="mb-3">
                      <div className="d-flex align-items-center justify-content-between mb-2">
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: 16 }}>{medals[idx]}</span>
                          <span
                            className="fw-bold text-dark"
                            style={{ fontSize: 13 }}
                          >
                            {seller.name}
                          </span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <Stars value={seller.avgRating} />
                          <Pill bg="#FDE8E0" color="#C0401A">
                            {seller.postCount} bài
                          </Pill>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="flex-grow-1"
                          style={{
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
                          className="text-muted text-nowrap fw-medium"
                          style={{ fontSize: 11 }}
                        >
                          {seller.followers} followers
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* ── Tab: Người dùng ───────────────────────────────────────── */}
      {tab === "users" && (
        <div
          className="card border-0"
          style={{
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.02)",
          }}
        >
          <div className="table-responsive">
            <table
              className="table table-hover align-middle mb-0"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr
                  className="table-light"
                  style={{ borderBottom: `1px solid ${C.border}` }}
                >
                  {[
                    "Người dùng",
                    "Vai trò",
                    "Tin đã đăng",
                    "Danh tính",
                    "Hành động",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-uppercase fw-bold text-secondary"
                      style={{
                        padding: "16px 20px",
                        fontSize: 11,
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
      {/* ── Tab: Bài đăng ─────────────────────────────────────────── */}
      {tab === "listings" && (
        <div
          className="card border-0"
          style={{
            background: C.white,
            borderRadius: 16,
            border: `1px solid ${C.border}`,
            overflow: "hidden",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.02)",
          }}
        >
          <div className="table-responsive">
            <table
              className="table table-hover align-middle mb-0"
              style={{ borderCollapse: "collapse" }}
            >
              <thead>
                <tr
                  className="table-light"
                  style={{ borderBottom: `1px solid ${C.border}` }}
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
                      className="text-uppercase fw-bold text-secondary"
                      style={{
                        padding: "16px 20px",
                        fontSize: 11,
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
                    style={{ borderBottom: `1px solid ${C.border}` }}
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
                      className="fw-medium"
                      style={{
                        padding: "16px 20px",
                        fontSize: 13,
                        color: C.text,
                      }}
                    >
                      {p.sellerName}
                    </td>
                    <td
                      className="fw-bold"
                      style={{
                        padding: "16px 20px",
                        fontSize: 14,
                        color: C.coral,
                      }}
                    >
                      {fmt(p.price)}
                    </td>
                    <td
                      className="fw-bold"
                      style={{
                        padding: "16px 20px",
                        fontSize: 13,
                        color: C.dark,
                      }}
                    >
                      {p.remainingWeight} kg
                    </td>
                    <td style={{ padding: "16px 20px" }}>
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        className="btn btn-danger fw-bold border-0 text-danger"
                        style={{
                          background: "#fee2e2",
                          padding: "8px 14px",
                          borderRadius: 8,
                          fontSize: 12,
                          fontFamily: "inherit",
                        }}
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
      {/* ── Tab: Báo cáo ──────────────────────────────────────────── */}
      {tab === "reports" && (
        <div>
          <div className="d-flex gap-2 mb-4">
            {["Pending", "Resolved", "Dismissed"].map((s) => (
              <button
                key={s}
                onClick={() => setReportStatus(s)}
                className="btn fw-bold px-3 py-2 border-0"
                style={{
                  borderRadius: 10,
                  fontSize: 13,
                  fontFamily: "inherit",
                  background: reportStatus === s ? C.ocean : "#F1F5F9",
                  color: reportStatus === s ? "#fff" : "#475569",
                }}
              >
                {s === "Pending"
                  ? "⏳ Đang chờ"
                  : s === "Resolved"
                    ? "✅ Đã gỡ"
                    : "❌ Đã từ chối"}
              </button>
            ))}
          </div>

          {reportsLoading ? (
            <div className="text-center py-4 text-muted">
              Đang truy xuất báo cáo...
            </div>
          ) : reports.length === 0 ? (
            <div
              className="card border-0 text-center p-5"
              style={{
                background: C.white,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
              }}
            >
              <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
              <div className="fw-bold text-dark">
                Không có báo cáo vi phạm nào
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="card border-0 p-4 d-flex flex-row flex-wrap align-items-start justify-content-between gap-3"
                  style={{ borderRadius: 16, border: "1px solid #e5e7eb" }}
                >
                  <div className="flex-grow-1">
                    <div
                      className="fw-bold text-danger mb-2"
                      style={{ fontSize: 15 }}
                    >
                      🚩 Lý do: {r.reason}
                    </div>
                    <div className="text-dark" style={{ fontSize: 13 }}>
                      Sản phẩm vi phạm:{" "}
                      <strong style={{ color: C.ocean }}>
                        {r.productName}
                      </strong>
                    </div>
                    <div className="text-muted mt-2" style={{ fontSize: 11 }}>
                      🕒 Gửi lúc:{" "}
                      {new Date(r.createdAt).toLocaleString("vi-VN")}
                    </div>
                  </div>
                  {reportStatus === "Pending" && (
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleReport(r.id, "resolve")}
                        className="btn btn-danger fw-bold border-0 text-danger"
                        style={{
                          background: "#FEE2E2",
                          padding: "10px 16px",
                          borderRadius: 8,
                          fontSize: 13,
                        }}
                      >
                        🗑️ Ẩn tin
                      </button>
                      <button
                        onClick={() => handleReport(r.id, "dismiss")}
                        className="btn btn-secondary fw-bold border-0 text-secondary"
                        style={{
                          background: "#F1F5F9",
                          padding: "10px 16px",
                          borderRadius: 8,
                          fontSize: 13,
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
      {/* ── Tab: Thông báo broadcast ──────────────────────────────── */}
      {tab === "broadcast" && <AdminBroadcastTab />} {/* ← MỚI */}
    </div>
  );
}
