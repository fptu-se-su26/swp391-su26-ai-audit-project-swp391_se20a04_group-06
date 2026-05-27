/**
 * ToastContext.jsx
 *
 * PATTERN: Observer / Publisher-Subscriber Pattern
 *
 * Vấn đề cũ:
 *   - Hệ thống toast đã được xây dựng trong `client.jsx` (file cũ/orphan)
 *   - Nhưng trong app mới (`my-app/src/`) KHÔNG được dùng
 *   - DashboardPage, ProductDetailPage, AdminPage... vẫn dùng `alert()` và `confirm()`
 *   - alert() chặn UI thread, không có animation, trông rất thô
 *
 * Giải pháp:
 *   - ToastProvider: "publisher" — lắng nghe lệnh addToast
 *   - useToast(): "subscriber" — bất kỳ component nào cũng có thể trigger toast
 *   - Không cần truyền callback qua props
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useId,
} from "react";

const ToastContext = createContext(null);

// ── Màu sắc theo type ───────────────────────────────────────
const STYLES = {
  success: { bg: "#EAF5EE", border: "#2D7D46", icon: "✅", color: "#1a5c30" },
  error: { bg: "#FEE2E2", border: "#DC2626", icon: "❌", color: "#991B1B" },
  warn: { bg: "#FEF3C7", border: "#D97706", icon: "⚠️", color: "#92400E" },
  info: { bg: "#E6F4F9", border: "#1A7FA0", icon: "ℹ️", color: "#0B4F6C" },
};

// ── Toast Item (internal) ────────────────────────────────────
function ToastItem({ id, message, type, onRemove }) {
  const [visible, setVisible] = useState(false);
  const s = STYLES[type] ?? STYLES.info;

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, 3500);
    return () => clearTimeout(timer);
  }, [id, onRemove]);

  return (
    <div
      onClick={() => {
        setVisible(false);
        setTimeout(() => onRemove(id), 300);
      }}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 10,
        background: s.bg,
        border: `1.5px solid ${s.border}`,
        color: s.color,
        borderRadius: 10,
        padding: "12px 16px",
        minWidth: 260,
        maxWidth: 360,
        boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
        cursor: "pointer",
        fontFamily: "inherit",
        fontSize: 14,
        fontWeight: 500,
        lineHeight: 1.4,
        transition: "all 0.3s cubic-bezier(0.4,0,0.2,1)",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(110%)",
      }}
    >
      <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>
        {s.icon}
      </span>
      <span style={{ flex: 1 }}>{message}</span>
    </div>
  );
}

// ── Provider ─────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}

      {/* Toast container — cố định góc phải dưới màn hình */}
      <div
        aria-live="polite"
        aria-label="Thông báo hệ thống"
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <ToastItem {...t} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ── Custom Hook ───────────────────────────────────────────────
/**
 * useToast()
 *
 * @returns {{ toast, success, error, warn, info }}
 *
 * @example
 *   const { toast } = useToast();
 *   toast.success("Lưu thành công!");
 *   toast.error("Có lỗi xảy ra");
 */
export function useToast() {
  const addToast = useContext(ToastContext);
  if (!addToast) {
    throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  }

  return {
    toast: (msg, type) => addToast(msg, type),
    success: (msg) => addToast(msg, "success"),
    error: (msg) => addToast(msg, "error"),
    warn: (msg) => addToast(msg, "warn"),
    info: (msg) => addToast(msg, "info"),
  };
}
