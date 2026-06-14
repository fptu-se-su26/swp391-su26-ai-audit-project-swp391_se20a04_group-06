// Nhập hàm createContext và useContext từ thư viện React để khởi tạo và sử dụng Context
import { createContext, useContext } from "react";

// Khởi tạo đối tượng Context nhận hàm thêm thông báo (addToast), mặc định ban đầu là null
export const ToastContext = createContext(null);

// Định nghĩa Custom hook useToast giúp các component con gọi hiển thị thông báo nhanh chóng
export function useToast() {
  // Lấy hàm addToast từ ToastContext thông qua hook useContext
  const addToast = useContext(ToastContext);

  // Nếu không tìm thấy hàm addToast (do gọi hook ngoài phạm vi bao bọc của ToastProvider)
  if (!addToast) {
    // Ném ra lỗi cảnh báo nhà phát triển
    throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  }

  // Trả về một đối tượng chứa các hàm helper để hiển thị thông báo theo từng cấp độ
  return {
    // Hàm hiển thị thông báo chung có truyền tham số kiểu thông báo (type)
    toast: (msg, type) => addToast(msg, type),
    // Hàm hiển thị thông báo thành công (màu xanh lá)
    success: (msg) => addToast(msg, "success"),
    // Hàm hiển thị thông báo lỗi (màu đỏ)
    error: (msg) => addToast(msg, "error"),
    // Hàm hiển thị thông báo cảnh báo (màu vàng)
    warn: (msg) => addToast(msg, "warn"),
    // Hàm hiển thị thông báo thông tin (màu xanh lam)
    info: (msg) => addToast(msg, "info"),
  };
}
