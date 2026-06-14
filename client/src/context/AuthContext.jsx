// Nhập hàm createContext và useContext từ thư viện React để khởi tạo và sử dụng Context
import { createContext, useContext } from "react";

// Khởi tạo đối tượng Context nhận dữ liệu xác thực, mặc định giá trị ban đầu là null
export const AuthContext = createContext(null);

// Định nghĩa Custom hook useAuth giúp các component con lấy thông tin đăng nhập nhanh chóng
export function useAuth() {
  // Lấy giá trị context hiện tại của AuthContext từ cây component
  const ctx = useContext(AuthContext);
  // Nếu context không tồn tại (component gọi hook nằm ngoài AuthProvider) thì ném ra lỗi cảnh báo
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  }
  // Trả về đối tượng chứa thông tin xác thực và các phương thức đăng nhập/đăng xuất
  return ctx;
}
