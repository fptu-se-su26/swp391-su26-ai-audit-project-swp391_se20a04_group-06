/**
 * AuthContext.jsx
 *
 * PATTERN: Context + Provider Pattern
 *
 * Vấn đề cũ:
 *   - `user` và `setUser` được prop-drill từ AppShell → Navbar → mọi Page
 *   - Mỗi Page cần nhận `user` qua props dù không phải parent trực tiếp
 *
 * Giải pháp:
 *   - Một AuthProvider bọc toàn bộ app
 *   - Mọi component cần user chỉ cần gọi `useAuth()` — không cần prop
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../services/api";
import { disconnectSocket } from "../services/socket";

// ── 1. Tạo Context ──────────────────────────────────────────
const AuthContext = createContext(null);

// ── 2. Provider component ───────────────────────────────────
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // loading phiên ban đầu

  // Khôi phục session từ cookie khi app khởi động
  useEffect(() => {
    api("/auth/me")
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Hàm logout tập trung — không cần truyền callback qua props
  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Bỏ qua lỗi nếu server không có endpoint
    }
    disconnectSocket();
    setUser(null);
  }, []);

  const value = { user, setUser, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ── 3. Custom Hook — đây là interface duy nhất mọi component dùng ──
/**
 * useAuth()
 * @returns {{ user, setUser, logout, loading }}
 *
 * @example
 *   const { user, logout } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  }
  return ctx;
}
