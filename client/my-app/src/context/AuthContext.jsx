/**
 * AuthContext.jsx — PATTERN: Context + Provider Pattern
 *
 * FIXES:
 *   1. `logout` useCallback không cần deps vì `disconnectSocket` và `api` là stable
 *      references (module-level functions). Thêm `[]` deps tường minh để ESLint không cảnh báo.
 *
 *   2. Thêm AbortController cho `/auth/me` fetch khi unmount (edge case StrictMode
 *      double-invoke effect trong dev).
 *
 *   3. Export `AuthContext` trực tiếp để các advanced use case có thể dùng
 *      `useContext(AuthContext)` với type checking tốt hơn.
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

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    api("/auth/me", { signal: controller.signal })
      .then((u) => {
        if (!controller.signal.aborted) {
          setUser(u ?? null);
        }
      })
      .catch((e) => {
        // AbortError khi StrictMode double-invoke — bỏ qua
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

  // stable reference — không cần deps vì api/disconnectSocket là module-level
  const logout = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Server error khi logout không cần block client-side cleanup
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
