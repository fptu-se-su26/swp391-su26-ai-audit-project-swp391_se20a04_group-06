import { useState, useCallback } from "react";
// Đảm bảo import chính xác đường dẫn và cú pháp named import:
import { ToastContext } from "./ToastContext";

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);

    // Tự động xóa thông báo sau 3 giây
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      {/* Giao diện hiển thị danh sách thông báo */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 99999,
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "12px 20px",
              background:
                t.type === "success"
                  ? "#22C55E"
                  : t.type === "error"
                    ? "#EF4444"
                    : "#3B82F6",
              color: "#fff",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
