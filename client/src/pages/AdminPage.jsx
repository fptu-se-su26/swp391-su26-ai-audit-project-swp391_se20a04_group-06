// Nhập các React Hooks cần thiết để quản lý state, vòng đời và tối ưu hiệu năng hàm (useCallback)
import { useState, useEffect, useCallback } from "react";
// Nhập mã màu sắc và hằng số giao diện dùng chung của hệ thống
import { C } from "../utils/theme";
// Nhập đối tượng gọi API (fetch wrapper) đã cấu hình sẵn
import { api } from "../services/api";
// Nhập hàm tiện ích định dạng tiền tệ hoặc chuỗi số hiển thị
import { fmt } from "../utils/format";
// Nhập component con hiển thị huy hiệu người dùng đã được xác minh danh tính
import { VerifiedBadge } from "../components/VerifiedBadge";
// Nhập component con quản lý gửi thông báo hàng loạt (broadcast) tới mọi client qua Socket.io
import { AdminBroadcastTab } from "../components/AdminBroadcastTab"; // ← MỚI
// Nhập hook hiển thị thông báo toast nhanh lên màn hình
import { useToast } from "../context/ToastContext";

/* ─── Hộp thoại xác nhận tùy chỉnh ConfirmDialog ─── */
// Hiển thị một modal nhỏ yêu cầu admin xác nhận hành động nguy hiểm như xóa bài đăng
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    // Lớp phủ nền mờ bao toàn bộ màn hình
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)", // Nền đen mờ 40%
        zIndex: 99998, // Ưu tiên xếp lớp cao để đè lên UI chính
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.15s ease",
      }}
      onClick={onCancel} // Click ra ngoài modal sẽ tự động hủy bỏ
    >
      {/* Khung chứa thông báo và các nút bấm */}
      <div
        onClick={(e) => e.stopPropagation()} // Ngăn chặn lan truyền sự kiện click ra lớp nền mờ
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
        {/* Nhóm nút Hủy bỏ và Xóa */}
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button
            onClick={onCancel} // Trở về, không xóa
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
            onClick={onConfirm} // Gọi hàm xóa thực tế ở component cha
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: "#DC2626", // Màu đỏ cảnh báo
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
// Custom hook giúp tách biệt logic gọi API xác minh danh tính người bán (isVerified)
function useVerifyUser(users, setUsers) {
  const toast = useToast();
  // State lưu trữ ID người dùng đang được gọi API xác minh (dùng để hiển thị trạng thái chờ loading)
  const [verifyingId, setVerifyingId] = useState(null);

  // Hàm kích hoạt việc bật/tắt (toggle) trạng thái xác minh người dùng
  const toggleVerify = async (userId) => {
    setVerifyingId(userId); // Thiết lập trạng thái loading cho user này
    try {
      // Gửi yêu cầu PATCH xác minh danh tính tới backend
      const res = await api(`/admin/users/${userId}/verify`, {
        method: "PATCH",
      });
      // Cập nhật lại danh sách người dùng cục bộ tại React state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, isVerified: res.isVerified } : u,
        ),
      );
      // Hiển thị thông báo thành công từ backend
      toast.success(res.message || "Xác minh người bán thành công!");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setVerifyingId(null); // Tắt trạng thái loading sau khi gọi xong
    }
  };

  return { toggleVerify, verifyingId };
}

/* ─── Hàng người dùng trong bảng ─── */
// Hiển thị một dòng dữ liệu của một người dùng cụ thể trong bảng danh sách quản lý
function AdminUserRow({
  user,
  onToggleActive,
  onToggleVerify,
  verifyingId,
  togglingId,
}) {
  return (
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      {/* Cột Tên và Email */}
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{user.email}</div>
      </td>
      {/* Cột vai trò người dùng (Admin hiển thị màu tím, người bán/mua thông thường hiển thị màu xanh biển) */}
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
      {/* Cột tổng số bài rao bán */}
      <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "center" }}>
        {user.postCount}
      </td>
      {/* Cột hiển thị huy hiệu xác minh nếu tài khoản đã verify */}
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        {user.isVerified && <VerifiedBadge showLabel />}
      </td>
      {/* Cột Hành động của admin */}
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {/* Nút Khoá hoặc Mở khoá tài khoản */}
          <button
            onClick={() => onToggleActive(user.id)}
            disabled={togglingId === user.id} // Vô hiệu hóa nút khi đang gửi yêu cầu
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
              ? "..." // Hiển thị ba chấm khi đang gửi request
              : user.isActive
                ? "Khoá"
                : "Mở khoá"}
          </button>

          {/* Chỉ hiển thị nút Xác minh nếu người dùng đó không phải là Admin hệ thống */}
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
                  ? "✗ Thu hồi" // Hủy xác minh
                  : "✓ Xác minh" // Xác minh danh tính
              }
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── BarChart ─────────────────────────────────────────────────────────────────
// Vẽ một biểu đồ SVG cột tĩnh hiển thị tần suất hoạt động theo 7 ngày gần nhất
function BarChart({ data, color }) {
  // Định nghĩa kích thước SVG và khoảng cách lề (padding) để vẽ lưới trục
  const W = 340,
    H = 130,
    padL = 28,
    padR = 8,
    padB = 22,
    padT = 16;
  const cW = W - padL - padR; // Chiều rộng vẽ biểu đồ thực tế
  const cH = H - padT - padB; // Chiều cao vẽ biểu đồ thực tế
  // Tìm giá trị lớn nhất trong bộ số liệu để tính tỷ lệ phần trăm chiều cao cột (tối thiểu là 1 để tránh chia cho 0)
  const max = Math.max(...data.map((d) => d.count), 1);
  const step = cW / data.length; // Khoảng cách giữa các cột
  const bW = step * 0.55; // Chiều rộng của mỗi cột đơn lẻ

  // Tạo ra các mốc lưới kẻ ngang dựa trên giá trị tối đa
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));
  // Tạo ID duy nhất cho dải gradient của cột
  const gradientId = `bar-gradient-${color.replace("#", "")}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Định nghĩa thẻ màu chuyển sắc (gradient) cho cột */}
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Vẽ các dòng kẻ ngang và nhãn trục Y hiển thị số liệu định mức */}
      {gridLines.map((v, gi) => {
        const y = padT + cH - (v / max) * cH;
        return (
          <g key={gi}>
            {/* Đường kẻ trục ngang dạng đứt quãng */}
            <line
              x1={padL}
              x2={W - padR}
              y1={y}
              y2={y}
              stroke="#f3f4f6"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
            {/* Văn bản hiển thị số liệu bên trái đường biên */}
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

      {/* Vẽ từng cột (rect) dữ liệu tương ứng */}
      {data.map((d, i) => {
        // Chiều cao thực tế của cột được tính tỷ lệ với giá trị max (tối thiểu là 4px nếu giá trị lớn hơn 0)
        const bH = Math.max((d.count / max) * cH, d.count > 0 ? 4 : 0);
        const x = padL + i * step + (step - bW) / 2;
        const y = padT + cH - bH;
        return (
          <g key={i}>
            {/* Hình chữ nhật vẽ thân cột, có bo tròn đầu gập (rx=4) */}
            <rect
              x={x}
              y={y}
              width={bW}
              height={bH}
              fill={`url(#${gradientId})`} // Sử dụng dải gradient đã khai báo ở phần <defs>
              rx={4}
              style={{ transition: "all 0.3s ease" }}
            />
            {/* Hiển thị số lượng ở ngay phía trên đỉnh cột (chỉ hiện nếu > 0) */}
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
            {/* Nhãn văn bản trục X hiển thị ngày tháng hoặc nhãn danh mục ở chân cột */}
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

      {/* Đường biên dọc trục Y bên trái */}
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

// Component hiển thị thẻ badge nhỏ gọn (Pill)
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

// Component hiển thị các ngôi sao đánh giá và điểm số trung bình dạng số thập phân
function Stars({ value }) {
  const num = parseFloat(value) || 0;
  return (
    <span
      style={{
        fontSize: 11,
        color: "#f59e0b", // Màu vàng sao
        letterSpacing: 1,
        display: "inline-flex",
        alignItems: "center",
      }}
    >
      {"★".repeat(Math.round(num))} {/* Vẽ các sao đặc */}
      {"☆".repeat(5 - Math.round(num))} {/* Vẽ các sao rỗng để lấp đầy 5 sao */}
      <span style={{ color: "#6b7280", marginLeft: 4, fontWeight: 700 }}>
        {num.toFixed(1)}
      </span>
    </span>
  );
}

// Component con hiển thị thẻ thống kê nhanh (ví dụ: Tổng người dùng, Bài rao...)
function StatCard({ value, label, sub, color, icon }) {
  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        borderLeft: `4px solid ${color}`, // Tạo viền trái màu đậm để định hướng trực quan
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
        {/* Nếu có dòng phụ thích (sub-label) thì kết xuất */}
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

// ── AdminPage ────────────────────────────────────────────────────────────────
// Component chính quản trị viên hệ thống
export function AdminPage() {
  const toast = useToast();
  // State lưu tab hiện tại đang mở ("stats" | "users" | "listings" | "reports" | "broadcast")
  const [tab, setTab] = useState("stats");
  // Danh sách các báo cáo vi phạm sản phẩm
  const [reports, setReports] = useState([]);
  // Bộ lọc trạng thái báo cáo ("Pending" | "Resolved" | "Dismissed")
  const [reportStatus, setReportStatus] = useState("Pending");
  // Trạng thái chờ trong khi gọi API lấy danh sách báo cáo
  const [reportsLoading, setReportsLoading] = useState(false);
  // Lưu trữ ID của sản phẩm chuẩn bị bị xóa để hiển thị modal xác nhận
  const [confirmDelete, setConfirmDelete] = useState(null);

  // 🌟 KHẮC PHỤC 1: Bọc loadReports vào useCallback để tránh tạo lại hàm sau mỗi lần render gây rò rỉ hoặc loop
  const loadReports = useCallback((status) => {
    api(`/reports?status=${status}`)
      .then((data) => setReports(data))
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }, []);

  // 🌟 KHẮC PHỤC 2: Gọi fetch lại danh sách báo cáo mỗi khi tab chuyển sang "reports" hoặc bộ lọc status thay đổi
  useEffect(() => {
    if (tab === "reports") loadReports(reportStatus);
  }, [tab, reportStatus, loadReports]);

  // Xử lý báo cáo vi phạm (action có thể là: "resolve" - đồng ý ẩn bài viết vi phạm, "dismiss" - từ chối báo cáo)
  const handleReport = async (reportId, action) => {
    // Nếu đồng ý duyệt báo cáo (resolve), hiển thị prompt yêu cầu nhập lý do hoặc ghi chú tùy chọn
    const adminNote =
      action === "resolve"
        ? (prompt("Ghi chú khi xử lý (tuỳ chọn):") ?? "")
        : "";
    try {
      // Gửi yêu cầu cập nhật trạng thái báo cáo tới backend
      await api(`/reports/${reportId}`, {
        method: "PATCH",
        body: JSON.stringify({ action, adminNote }),
      });
      // Loại bỏ báo cáo vừa xử lý ra khỏi danh sách hiển thị tạm thời ở client
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

  // Các state lưu trữ dữ liệu tổng hợp
  const [stats, setStats] = useState(null); // Thống kê chung hệ thống
  const [users, setUsers] = useState([]); // Danh sách người dùng
  const [listings, setListings] = useState([]); // Danh sách tin đăng sản phẩm
  const [loading, setLoading] = useState(true); // Trạng thái tải dữ liệu lần đầu tiên vào trang
  const [togglingId, setTogglingId] = useState(null); // ID của user đang bị khóa/mở khóa tài khoản

  // 🌟 KHẮC PHỤC 3: Sử dụng useEffect kéo toàn bộ dữ liệu quản trị cơ sở khi vừa mount trang
  useEffect(() => {
    // Đồng thời gọi 3 API tổng hợp dữ liệu cho admin
    Promise.all([
      api("/admin/stats"),
      api("/admin/users"),
      api("/admin/listings"),
    ])
      .then(([s, u, l]) => {
        setStats(s);
        // Kiểm tra an toàn dữ liệu mảng người dùng trả về
        const safeUsers = Array.isArray(u)
          ? u
          : u && Array.isArray(u.data)
            ? u.data
            : [];
        // Kiểm tra an toàn dữ liệu mảng tin rao bán trả về
        const safeListings = Array.isArray(l)
          ? l
          : l && Array.isArray(l.data)
            ? l.data
            : [];
        setUsers(safeUsers);
        setListings(safeListings);
      })
      .catch((e) => toast.error("Admin error: " + e.message))
      .finally(() => setLoading(false)); // Tắt màn hình chờ
  }, [toast]); // Thêm toast làm phụ thuộc

  // Sử dụng custom hook toggle verify
  const { toggleVerify, verifyingId } = useVerifyUser(users, setUsers);

  // Hàm khóa / mở khóa hoạt động tài khoản của người dùng
  const toggleUser = async (id) => {
    setTogglingId(id); // Đặt trạng thái đang xử lý cho user này
    try {
      // Gửi PATCH toggle trạng thái hoạt động lên Backend
      const res = await api(`/admin/users/${id}/toggle`, { method: "PATCH" });
      // Cập nhật lại thuộc tính isActive của user tương ứng trong state cục bộ
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: res.isActive } : u)),
      );
      toast.success(
        "Đã thay đổi trạng thái hoạt động của tài khoản thành công!",
      );
    } catch (e) {
      toast.error(e.message);
    } finally {
      setTogglingId(null); // Hủy trạng thái xử lý
    }
  };

  // Hàm admin trực tiếp xóa bỏ bài đăng hải sản khỏi hệ thống (ví dụ bài rác hoặc sai phạm)
  const doDeleteProduct = async (id) => {
    setConfirmDelete(null); // Đóng modal xác nhận xóa
    try {
      // Gửi API DELETE gỡ bỏ sản phẩm
      await api(`/admin/listings/${id}`, { method: "DELETE" });
      // Lọc bỏ sản phẩm bị xóa khỏi danh sách tin đăng ở local state
      setListings((prev) => prev.filter((p) => p.id !== id));
      toast.success("Đã gỡ bỏ bài đăng hải sản vĩnh viễn.");
    } catch (e) {
      toast.error(e.message);
    }
  };

  // Nếu trang đang tải thông tin lần đầu, hiển thị màn hình chờ dịu mắt
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

  // Tính tổng tin rao bán đang hiển thị (bằng tổng tươi sống + đồ khô)
  const totalActive = stats ? stats.activeFresh + stats.activeDried : 0;

  // Tạo đối tượng chứa thống kê an toàn, gán giá trị mặc định tránh lỗi undefined property
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
      {/* Hiển thị Dialog xác nhận xóa sản phẩm */}
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

      {/* ── Khu vực hiển thị 8 thẻ Thống kê dạng ô chữ nhật ── */}
      {stats && (
        <div className="row g-3 mb-4">
          {/* Tổng số người dùng */}
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.totalUsers}
              icon="👥"
              label="Người dùng"
              color={C.ocean}
            />
          </div>
          {/* Tổng số tin đang bán */}
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={totalActive}
              icon="📋"
              label="Tin rao active"
              color={C.ok}
            />
          </div>
          {/* Số lượng hải sản tươi sống */}
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.activeFresh}
              icon="🌊"
              label="Hải sản tươi"
              color={C.coral}
            />
          </div>
          {/* Số lượng hải sản khô */}
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.activeDried}
              icon="🔥"
              label="Hải sản khô"
              color={C.warn}
            />
          </div>
          {/* Đánh giá bình quân kèm tổng số đánh giá */}
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.totalReviews}
              icon="⭐"
              label="Tổng đánh giá"
              sub={`Trung bình: ${safeStats.avgRating}/5`}
              color="#f59e0b"
            />
          </div>
          {/* Tổng số lượt kết nối theo dõi người bán */}
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.totalFollows}
              icon="🔔"
              label="Lượt theo dõi"
              color="#8b5cf6"
            />
          </div>
          {/* Tổng số lượt hội thoại trò chuyện (tin nhắn) */}
          <div className="col-6 col-sm-4 col-md-3 col-lg-3">
            <StatCard
              value={safeStats.totalMessages}
              icon="💬"
              label="Lượt nhắn tin"
              color="#3b82f6"
            />
          </div>
          {/* Bài đăng quá hạn (ví dụ 24h đối với đồ tươi sống) */}
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

      {/* ── Thanh điều hướng Tabs quản trị ── */}
      <div
        className="d-inline-flex gap-1 p-1 mb-4"
        style={{ background: "#E2E8F0", borderRadius: 12 }}
      >
        {[
          ["stats", "📊 Thống kê"],
          ["users", "👥 Người dùng"],
          ["listings", "📋 Bài đăng"],
          ["reports", "🚩 Báo cáo"],
          ["broadcast", "📢 Thông báo"],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => {
              setTab(k); // Chuyển đổi tab
              if (k === "reports") {
                setReportsLoading(true); // Bật loading khi chuyển sang tab báo cáo để cập nhật dữ liệu mới nhất
              }
            }}
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

      {/* ── TAB: THỐNG KÊ ── */}
      {tab === "stats" && stats && (
        <div className="d-flex flex-column gap-4">
          
          {/* Cặp biểu đồ: Số lượng tin đăng mới và Đăng ký mới trong tuần */}
          <div className="row g-4">
            {/* Cột trái: Biểu đồ tin đăng */}
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
                {/* Vẽ biểu đồ cột tin đăng với màu cam san hô */}
                <BarChart data={safeStats.postsPerDay} color={C.coral} />
              </div>
            </div>

            {/* Cột phải: Biểu đồ người đăng ký */}
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
                {/* Vẽ biểu đồ cột số người đăng ký mới bằng màu xanh đại dương */}
                <BarChart data={safeStats.usersPerDay} color={C.ocean} />
              </div>
            </div>
          </div>

          {/* Phần hàng dưới: Phân bố loại sản phẩm và Top 5 người bán tích cực */}
          <div className="row g-4">
            
            {/* Cột phân bố loại sản phẩm (Tươi sống vs Đồ khô) kèm tỷ lệ phần trạng */}
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
                      {/* Thanh progress bar tự động giãn rộng theo phần trăm */}
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

                {/* Bảng số liệu chi tiết bổ sung ở bên dưới phần phân bố */}
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

            {/* Cột hiển thị bảng xếp hạng 5 người bán có thành tích hoạt động tốt nhất */}
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
                  // Lấy số bài viết lớn nhất làm hệ số quy đổi 100% cho thanh ngang xếp hạng
                  const maxPosts = safeStats.topSellers[0]?.postCount || 1;
                  const barPct =
                    seller.postCount > 0
                      ? Math.round((seller.postCount / maxPosts) * 100)
                      : 0;
                  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"]; // Ký hiệu thứ bậc
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
                          {/* Vẽ sao điểm đánh giá trung bình */}
                          <Stars value={seller.avgRating} />
                          <Pill bg="#FDE8E0" color="#C0401A">
                            {seller.postCount} bài
                          </Pill>
                        </div>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        {/* Thanh đo mức độ tương quan bài đăng giữa các seller */}
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
                              background: idx === 0 ? "#f59e0b" : C.ocean, // Huy chương vàng màu vàng, còn lại màu xanh biển
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

      {/* ── TAB: NGƯỜI DÙNG ── */}
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
                {/* Lặp qua danh sách user để kết xuất hàng bảng tương ứng */}
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

      {/* ── TAB: BÀI ĐĂNG ── */}
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
                    {/* Tên và ID sản phẩm */}
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
                    {/* Loại hải sản (Tươi sống vs Khô) */}
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
                    {/* Hình thức bán (Sỉ vs Lẻ) */}
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
                    {/* Tên ngư dân đăng tin */}
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
                    {/* Giá tiền */}
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
                    {/* Trọng lượng còn lại trong kho */}
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
                    {/* Nút bấm để admin trực tiếp xóa bỏ bài viết rác */}
                    <td style={{ padding: "16px 20px" }}>
                      <button
                        onClick={() => setConfirmDelete(p.id)} // Kích hoạt Modal Confirm Dialog xác nhận xóa bài viết
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

      {/* ── TAB: BÁO CÁO VI PHẠM ── */}
      {tab === "reports" && (
        <div>
          {/* Nhóm lọc trạng thái báo cáo (Pending - Đang chờ xử lý, Resolved - Đã gỡ bỏ, Dismissed - Đã từ chối phản hồi) */}
          <div className="d-flex gap-2 mb-4">
            {["Pending", "Resolved", "Dismissed"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setReportStatus(s); // Đổi bộ lọc trạng thái
                  setReportsLoading(true); // Kích hoạt trạng thái xoay vòng chờ tải
                }}
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

          {/* Render theo trạng thái tải và dữ liệu mảng */}
          {reportsLoading ? (
            <div className="text-center py-4 text-muted">
              Đang truy xuất báo cáo...
            </div>
          ) : reports.length === 0 ? (
            // Kết xuất trống
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
            // Hiển thị danh sách các bài đăng bị người dùng báo cáo vi phạm
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
                  {/* Nhóm nút ẩn bài viết vi phạm hoặc từ chối xử lý báo cáo (Chỉ xuất hiện nếu trạng thái đang là Pending) */}
                  {reportStatus === "Pending" && (
                    <div className="d-flex gap-2">
                      <button
                        onClick={() => handleReport(r.id, "resolve")} // Ẩn tin đăng vi phạm
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
                        onClick={() => handleReport(r.id, "dismiss")} // Bỏ qua báo cáo
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

      {/* ── TAB: GỬI THÔNG BÁO BROADCAST ── */}
      {/* Component AdminBroadcastTab cho phép admin soạn và gửi thông điệp khẩn cấp tới tất cả các tài khoản đang online thông qua Socket.io */}
      {tab === "broadcast" && <AdminBroadcastTab />} {/* ← MỚI */}
    </div>
  );
}
