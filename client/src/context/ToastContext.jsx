import { createContext, useContext } from "react";
// 1. Tạo và xuất Context (Named Export)
export const ToastContext = createContext(null);

// 2. Custom hook để gọi nhanh
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
