/**
 * AuthContext.jsx — PATTERN: Context + Provider Pattern
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

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // FIX: /auth/me giờ trả 200 + null khi chưa login (không còn 401).
  // setUser(null) khi response là null, setUser(data) khi đã login.
  useEffect(() => {
    api("/auth/me")
      .then((u) => setUser(u ?? null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Bỏ qua lỗi server — vẫn tiếp tục logout ở client side
    }
    disconnectSocket();
    setUser(null);
  }, []);

  const value = { user, setUser, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  return ctx;
}
