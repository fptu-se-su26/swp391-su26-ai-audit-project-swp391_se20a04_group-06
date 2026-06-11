import { useState, useEffect, useCallback } from "react";
import { AuthContext } from "./AuthContext"; // Nhập Context từ file AuthContext.js vừa tách
import { api } from "../services/api";
import { disconnectSocket } from "../services/socket";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Khôi phục phiên đăng nhập khi vừa tải trang
  useEffect(() => {
    const controller = new AbortController();

    api("/auth/me", { signal: controller.signal })
      .then((u) => {
        if (!controller.signal.aborted) {
          setUser(u ?? null);
        }
      })
      .catch((e) => {
        // Bỏ qua AbortError khi StrictMode render nháp 2 lần lúc phát triển
        if (e?.name !== "AbortError" && !controller.signal.aborted) {
          setUser(null);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, []);

  // Hàm đăng xuất tài khoản
  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Bỏ qua lỗi kết nối máy chủ khi đăng xuất
    }
    disconnectSocket();
    setUser(null);
  }, []);

  const value = { user, setUser, logout, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
