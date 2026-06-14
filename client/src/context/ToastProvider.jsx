// Nhập hook useState và useCallback từ thư viện React để quản lý state và tối ưu hóa hàm callback
import { useState, useCallback } from "react";
// Nhập đối tượng ToastContext từ file ToastContext để cung cấp giá trị cho cây component
import { ToastContext } from "./ToastContext";

// Component ToastProvider bao bọc toàn bộ ứng dụng để cung cấp và render các thông báo toast nhanh
export function ToastProvider({ children }) {
  // State toasts lưu trữ mảng danh sách các thông báo đang hiển thị trên màn hình
  const [toasts, setToasts] = useState([]);

  // Hàm addToast dùng useCallback để tránh tạo lại hàm khi render, nhận vào nội dung tin nhắn và loại thông báo
  const addToast = useCallback((message, type = "info") => {
    // Tạo ID duy nhất cho thông báo dựa theo mốc thời gian timestamp hiện tại
    const id = Date.now();
    // Thêm đối tượng thông báo mới vào cuối mảng danh sách toasts
    setToasts((prev) => [...prev, { id, message, type }]);

    // Sử dụng setTimeout để tự động xóa thông báo này khỏi danh sách toasts sau 3 giây (3000ms)
    setTimeout(() => {
      // Lọc bỏ thông báo có ID tương ứng ra khỏi mảng toasts
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []); // Mảng dependency rỗng vì hàm không phụ thuộc vào state nào khác

  return (
    // Cung cấp hàm addToast làm value của ToastContext cho các component con gọi sử dụng
    <ToastContext.Provider value={addToast}>
      {/* Kết xuất các component con bên trong ứng dụng */}
      {children}
      {/* Khung chứa cố định ở góc dưới bên phải màn hình để hiển thị các hộp thoại thông báo */}
      <div
        style={{
          // Đặt vị trí cố định
          position: "fixed",
          // Khoảng cách cách đáy màn hình 20px
          bottom: 20,
          // Khoảng cách cách lề phải màn hình 20px
          right: 20,
          // Đảm bảo thông báo hiển thị trên mọi lớp giao diện khác
          zIndex: 99999,
          // Hiển thị dạng flexbox
          display: "flex",
          // Sắp xếp các thông báo theo cột đứng
          flexDirection: "column",
          // Khoảng cách giữa các hộp thông báo là 8px
          gap: 8,
        }}
      >
        {/* Duyệt qua từng thông báo trong state toasts để hiển thị */}
        {toasts.map((t) => (
          <div
            // Sử dụng ID của thông báo làm key cho React Virtual DOM
            key={t.id}
            style={{
              // Khoảng đệm bên trong hộp thông báo
              padding: "12px 20px",
              // Chọn màu nền dựa vào loại thông báo: thành công là xanh lá, lỗi là đỏ, các loại khác (info, warn) dùng xanh dương
              background:
                t.type === "success"
                  ? "#22C55E"
                  : t.type === "error"
                    ? "#EF4444"
                    : "#3B82F6",
              // Màu chữ trắng
              color: "#fff",
              // Bo tròn góc hộp thông báo
              borderRadius: 8,
              // Tạo bóng đổ nổi bật cho hộp thông báo
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              // Kích thước chữ
              fontSize: 14,
              // Độ đậm chữ vừa phải
              fontWeight: 500,
            }}
          >
            {/* Hiển thị nội dung văn bản của thông báo */}
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
