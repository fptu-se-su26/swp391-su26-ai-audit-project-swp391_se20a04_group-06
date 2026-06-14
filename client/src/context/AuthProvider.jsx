// Nhập các hook useState, useEffect, và useCallback từ React để quản lý state và vòng đời của component
import { useState, useEffect, useCallback } from "react";
// Nhập đối tượng AuthContext được tạo sẵn từ file AuthContext
import { AuthContext } from "./AuthContext"; 
// Nhập module tiện ích gọi API chung
import { api } from "../services/api";
// Nhập hàm ngắt kết nối socket real-time khi đăng xuất
import { disconnectSocket } from "../services/socket";

// Component AuthProvider làm nhiệm vụ bao bọc và cung cấp trạng thái xác thực cho toàn bộ ứng dụng
export function AuthProvider({ children }) {
  // State lưu thông tin chi tiết của người dùng đang đăng nhập (mặc định ban đầu là null)
  const [user, setUser] = useState(null);
  // State quản lý trạng thái đang kiểm tra phiên đăng nhập (loading), mặc định ban đầu là true
  const [loading, setLoading] = useState(true);

  // useEffect tự động kiểm tra xem trình duyệt có cookie phiên làm việc hợp lệ hay không khi vừa tải trang
  useEffect(() => {
    // Khởi tạo một đối tượng AbortController để hủy bỏ yêu cầu API nếu component bị unmount đột ngột
    const controller = new AbortController();

    // Gọi API '/auth/me' để kiểm tra thông tin tài khoản hiện tại, truyền thêm tín hiệu signal để có thể hủy bỏ
    api("/auth/me", { signal: controller.signal })
      .then((u) => {
        // Nếu yêu cầu API không bị hủy bỏ bởi AbortController
        if (!controller.signal.aborted) {
          // Lưu thông tin người dùng nhận được từ server vào state user
          setUser(u ?? null);
        }
      })
      .catch((e) => {
        // Nếu lỗi xảy ra không phải do AbortError (hủy yêu cầu) và yêu cầu không bị hủy bỏ
        if (e?.name !== "AbortError" && !controller.signal.aborted) {
          // Reset thông tin user về null (chưa đăng nhập)
          setUser(null);
        }
      })
      .finally(() => {
        // Tắt trạng thái loading khi hoàn tất yêu cầu kiểm tra phiên đăng nhập
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    // Cleanup function: Tự động hủy yêu cầu API nếu component bị unmount trước khi nhận được phản hồi
    return () => {
      controller.abort();
    };
  }, []); // Chỉ chạy một lần duy nhất khi component được mount lần đầu tiên

  // Hàm xử lý đăng xuất tài khoản sử dụng hook useCallback để tránh tạo lại hàm khi render
  const logout = useCallback(async () => {
    try {
      // Gọi API POST '/auth/logout' để thông báo cho máy chủ xóa cookie phiên làm việc
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Bỏ qua lỗi nếu gặp sự cố kết nối mạng trong lúc đăng xuất
    }
    // Ngắt kết nối socket real-time của người dùng
    disconnectSocket();
    // Đặt thông tin người dùng đăng nhập về null để cập nhật giao diện thành trạng thái khách
    setUser(null);
  }, []); // Mảng dependency rỗng vì hàm không phụ thuộc vào state nào khác

  // Tạo đối tượng chứa các giá trị chia sẻ cho các component con bên dưới
  const value = { user, setUser, logout, loading };

  // Kết xuất AuthContext.Provider truyền giá trị value xuống cho tất cả component con bên trong children
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
