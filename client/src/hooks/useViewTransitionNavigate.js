/**
 * useViewTransitionNavigate.js
 * Bao bọc (wrap) hook useNavigate của react-router-dom với View Transitions API của trình duyệt.
 * Khi điều hướng sang trang mới, trình duyệt sẽ tự động kích hoạt hiệu ứng
 * chuyển cảnh fade/slide gốc (qua cấu hình CSS ::view-transition-old/new trong index.css).
 *
 * Khả năng tương thích (fallback graceful): nếu trình duyệt chưa hỗ trợ API này (ví dụ: Firefox phiên bản cũ, Safari cũ),
 * chương trình sẽ tự động điều hướng bình thường mà không gây ra lỗi hay đứng trang.
 */
// Nhập hook useNavigate từ react-router-dom để thực hiện điều hướng trang
import { useNavigate } from "react-router-dom";
// Nhập hook useCallback để tối ưu hóa hiệu năng hàm điều hướng, tránh render lại dư thừa
import { useCallback } from "react";

// Custom hook useViewTransitionNavigate hỗ trợ điều hướng trang kèm hiệu ứng chuyển cảnh
export function useViewTransitionNavigate() {
  // Khởi tạo hàm điều hướng chuẩn của react-router-dom
  const navigate = useNavigate();

  // Định nghĩa hàm vtNavigate sử dụng useCallback, nhận tham số đường dẫn đích (to) và cấu hình điều hướng (options)
  const vtNavigate = useCallback(
    (to, options) => {
      // Nếu trình duyệt hiện tại không hỗ trợ API startViewTransition
      if (!document.startViewTransition) {
        // Thực hiện điều hướng trang bình thường như mặc định
        navigate(to, options);
        return;
      }
      // Ngược lại, nếu trình duyệt có hỗ trợ, gọi startViewTransition để chạy hiệu ứng chuyển cảnh
      document.startViewTransition(() => {
        // Thực hiện chuyển trang bên trong hàm callback để trình duyệt chụp màn hình cũ/mới và áp dụng CSS transition
        navigate(to, options);
      });
    },
    [navigate], // Phụ thuộc vào hàm navigate của react-router-dom
  );

  // Trả về hàm điều hướng đã được tối ưu hiệu ứng
  return vtNavigate;
}
