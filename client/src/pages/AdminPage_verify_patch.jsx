/* eslint-disable react-refresh/only-export-components */
// Import hook useState từ thư viện React để quản lý state cục bộ
import { useState } from "react";
// Import cấu hình theme màu sắc chung của ứng dụng
import { C } from "../utils/theme";
// Import hàm gọi API dùng chung để gửi các HTTP request lên backend
import { api } from "../services/api";
// Import component hiển thị huy hiệu đã xác minh (VerifiedBadge)
import { VerifiedBadge } from "../components/VerifiedBadge";
// Import hook useToast từ ToastContext để hiển thị thông báo popup (toast)
import { useToast } from "../context/ToastContext"; // ← NEW

// Hook tùy biến (custom hook) để xử lý hành động xác minh/thu hồi xác minh tài khoản người dùng
export function useVerifyUser(users, setUsers) {
  // Lấy hàm hiển thị toast thông báo thành công hoặc lỗi
  const toast = useToast(); // ← NEW
  // State quản lý ID của người dùng đang trong quá trình xử lý xác minh (hiển thị trạng thái loading)
  const [verifyingId, setVerifyingId] = useState(null);

  // Hàm thực hiện gửi request PATCH lên server để thay đổi trạng thái xác minh (verify)
  const toggleVerify = async (userId) => {
    // Đặt trạng thái đang xác minh cho userId này
    setVerifyingId(userId);
    try {
      // Gọi API PATCH gửi yêu cầu xác minh người dùng lên server
      const res = await api(`/admin/users/${userId}/verify`, {
        method: "PATCH",
      });
      // Cập nhật lại danh sách người dùng trong state ở component cha
      setUsers((prev) =>
        prev.map((u) =>
          // Nếu đúng userId vừa thao tác, cập nhật lại cờ isVerified từ kết quả trả về của API, ngược lại giữ nguyên
          u.id === userId ? { ...u, isVerified: res.isVerified } : u,
        ),
      );
      // Hiển thị toast thông báo thành công
      toast.success(
        res.message || "Đã cập nhật trạng thái xác minh tài khoản thành công!",
      );
    } catch (e) {
      // Hiển thị toast thông báo lỗi nếu có lỗi xảy ra
      toast.error(e.message);
    } finally {
      // Reset trạng thái đang xác minh về null
      setVerifyingId(null);
    }
  };

  // Trả về hàm toggleVerify và ID đang được xử lý xác minh
  return { toggleVerify, verifyingId };
}

// Component hiển thị một dòng thông tin người dùng trong bảng quản trị của Admin
export function AdminUserRow({
  user,           // Đối tượng thông tin người dùng cụ thể
  onToggleActive, // Hàm xử lý khóa/mở khóa tài khoản
  onToggleVerify, // Hàm xử lý xác minh tài khoản
  verifyingId,    // ID của người dùng đang thực hiện xác minh
  togglingId,     // ID của người dùng đang thực hiện khóa/mở khóa
}) {
  return (
    // Thẻ tr hiển thị dòng của bảng, định dạng đường viền dưới theo cấu hình màu border của theme
    <tr style={{ borderBottom: `1px solid ${C.border}` }}>
      {/* Cột hiển thị Tên và Email người dùng */}
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        <div style={{ fontWeight: 600 }}>{user.name}</div>
        <div style={{ fontSize: 11, color: C.muted }}>{user.email}</div>
      </td>
      {/* Cột hiển thị Vai trò (Role) của người dùng */}
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        <span
          style={{
            // Nếu vai trò là Admin thì hiển thị nền tím nhạt, còn lại hiển thị nền xanh đại dương
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
      {/* Cột hiển thị Số lượng bài viết của người dùng, căn giữa nội dung */}
      <td style={{ padding: "10px 12px", fontSize: 13, textAlign: "center" }}>
        {user.postCount}
      </td>
      {/* Cột hiển thị trạng thái đã xác minh (nếu isVerified đúng thì hiển thị huy hiệu) */}
      <td style={{ padding: "10px 12px", fontSize: 13 }}>
        {user.isVerified && <VerifiedBadge showLabel />}
      </td>
      {/* Cột chứa các nút chức năng thao tác trên tài khoản */}
      <td style={{ padding: "10px 12px" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {/* Nút Khóa/Mở khóa tài khoản */}
          <button
            onClick={() => onToggleActive(user.id)}
            // Vô hiệu hóa nút nếu tài khoản này đang trong quá trình khóa/mở khóa
            disabled={togglingId === user.id}
            style={{
              // Nền màu đỏ nếu đang hoạt động (để khóa), nền màu xanh lá nếu đang bị khóa (để mở khóa)
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
            {/* Hiển thị ba dấu chấm nếu đang xử lý, ngược lại hiển thị nhãn Khóa hoặc Mở khóa */}
            {togglingId === user.id
              ? "..."
              : user.isActive
                ? "Khoá"
                : "Mở khoá"}
          </button>

          {/* Nút Xác minh/Thu hồi xác minh: Chỉ hiển thị đối với những tài khoản không phải là Admin */}
          {user.role !== "Admin" && (
            <button
              onClick={() => onToggleVerify(user.id)}
              // Vô hiệu hóa nút nếu tài khoản này đang trong quá trình xác minh
              disabled={verifyingId === user.id}
              style={{
                // Nền màu xám nếu đã xác minh (để thu hồi), nền màu xanh dương nếu chưa xác minh (để xác minh)
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
              {/* Hiển thị ba dấu chấm nếu đang xử lý, ngược lại hiển thị nhãn tương ứng */}
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

