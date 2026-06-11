import { createContext, useContext } from "react";

// 1. Khởi tạo đối tượng Context nhận dữ liệu xác thực
export const AuthContext = createContext(null);

// 2. Custom hook để các component con lấy thông tin đăng nhập nhanh chóng
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  }
  return ctx;
}
