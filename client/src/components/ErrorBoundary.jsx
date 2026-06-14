// Import thư viện React để sử dụng lớp Component và JSX
import React from "react";

// Định nghĩa và xuất lớp ErrorBoundary kế thừa từ React.Component để bắt các lỗi runtime trong các component con
export class ErrorBoundary extends React.Component {
  // Hàm khởi tạo nhận vào các props truyền vào component
  constructor(props) {
    // Gọi hàm khởi tạo của lớp cha React.Component
    super(props);
    // Thiết lập trạng thái ban đầu của ErrorBoundary: chưa có lỗi và không lưu trữ lỗi
    this.state = { hasError: false, error: null };
  }

  // Phương thức tĩnh được kích hoạt khi có lỗi runtime phát sinh từ các component con để cập nhật state
  static getDerivedStateFromError(error) {
    // Trả về state mới: đánh dấu hasError là true và lưu trữ đối tượng lỗi
    return { hasError: true, error };
  }

  // Phương thức vòng đời thực thi sau khi bắt được lỗi để ghi log hoặc gửi báo cáo lỗi lên server
  componentDidCatch(error, errorInfo) {
    // In thông tin lỗi và thông tin ngăn xếp lỗi (stack trace) ra console
    console.error("ErrorBoundary caught:", error, errorInfo);
    // Bạn có thể gửi log lên server ở đây
  }

  // Phương thức hiển thị giao diện UI
  render() {
    // Nếu trạng thái hasError là true (đã có lỗi xảy ra)
    if (this.state.hasError) {
      // Trả về giao diện thông báo lỗi thân thiện cho người dùng thay vì làm trắng màn hình
      return (
        <div
          // Thiết lập style căn giữa, padding lớn và kiểu font sans-serif
          style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif" }}
        >
          {/* Tiêu đề cảnh báo có lỗi xảy ra */}
          <h2>⚠️ Có lỗi xảy ra</h2>
          {/* Lời nhắn nhủ người dùng tải lại trang */}
          <p>
            Chúng tôi đã ghi nhận và đang khắc phục. Vui lòng tải lại trang.
          </p>
          {/* Nút nhấn cho phép tải lại trang web */}
          <button
            // Sự kiện click gọi hàm reload của trình duyệt để tải lại trang
            onClick={() => window.location.reload()}
            // Thiết lập kiểu dáng nút bấm đẹp với nền xanh đậm, chữ trắng, bo góc và con trỏ pointer
            style={{
              padding: "8px 16px",
              background: "#0B4F6C",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Tải lại
          </button>
        </div>
      );
    }
    // Nếu không có lỗi, hiển thị bình thường toàn bộ các component con được bọc bên trong
    return this.props.children;
  }
}
