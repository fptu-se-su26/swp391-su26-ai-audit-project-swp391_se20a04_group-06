import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { CheckCircle, XCircle, Loader, X, Info } from "lucide-react";

const ToastContext = createContext(null);

let toastIdCounter = 0;

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  // Dọn dẹp timer khi unmount
  useEffect(() => {
    return () => {
      Object.values(timersRef.current).forEach(clearTimeout);
    };
  }, []);

  // Khóa cuộn trang khi có overlay loading hiển thị
  useEffect(() => {
    const hasLoading = toasts.some((t) => t.variant === "loading");
    if (hasLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [toasts]);

  const dismiss = useCallback((id) => {
    // Thêm class exiting để chạy animation out
    setToasts((current) =>
      current.map((toast) =>
        toast.id === id ? { ...toast, exiting: true } : toast
      )
    );
    // Xóa khỏi DOM sau khi animation kết thúc
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
    }, 340);
  }, []);

  const addToast = useCallback(
    (message, variant, duration) => {
      const id = ++toastIdCounter;
      setToasts((current) => [...current, { id, message, variant, exiting: false }]);

      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => dismiss(id), duration);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback(
    (message) => addToast(message, "success", 4000),
    [addToast]
  );

  const error = useCallback(
    (message) => addToast(message, "error", 6000),
    [addToast]
  );

  const loading = useCallback(
    (message) => addToast(message, "loading", 0),
    [addToast]
  );

  const info = useCallback(
    (message) => addToast(message, "info", 4000),
    [addToast]
  );

  /** Cập nhật toast loading thành success hoặc error */
  const update = useCallback(
    (id, message, variant) => {
      // Xóa timer cũ nếu có
      if (timersRef.current[id]) {
        clearTimeout(timersRef.current[id]);
        delete timersRef.current[id];
      }
      setToasts((current) =>
        current.map((toast) =>
          toast.id === id
            ? { ...toast, message, variant, exiting: false }
            : toast
        )
      );
      // Tự đóng sau thời gian mới
      const duration = variant === "error" ? 6000 : 4000;
      timersRef.current[id] = setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const getIcon = (variant) => {
    switch (variant) {
      case "success":
        return <CheckCircle size={18} />;
      case "error":
        return <XCircle size={18} />;
      case "loading":
        return <Loader size={18} className="toast-spinner" />;
      case "info":
        return <Info size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  const getDuration = (variant) => {
    switch (variant) {
      case "success": return 4000;
      case "error": return 6000;
      case "info": return 4000;
      default: return 0;
    }
  };

  const loadingToast = toasts.find((t) => t.variant === "loading");
  const nonLoadingToasts = toasts.filter((t) => t.variant !== "loading");

  return (
    <ToastContext.Provider value={{ success, error, loading, info, dismiss, update }}>
      {children}

      {loadingToast && (
        <div className="fullscreen-loader-overlay">
          <div className="fullscreen-loader-container">
            <div className="fullscreen-loader-spinner-wrapper">
              <div className="fullscreen-loader-spinner" />
            </div>
            <div className="fullscreen-loader-text">{loadingToast.message}</div>
          </div>
        </div>
      )}

      <div className="toast-container" aria-live="polite" aria-label="Thông báo">
        {nonLoadingToasts.map((toast) => (
          <div
            className={`toast toast--${toast.variant}${toast.exiting ? " toast--exit" : ""}`}
            key={toast.id}
            role="status"
          >
            <span className="toast__icon">{getIcon(toast.variant)}</span>
            <span className="toast__message">{toast.message}</span>
            <button
              aria-label="Đóng thông báo"
              className="toast__close"
              onClick={() => dismiss(toast.id)}
              type="button"
            >
              <X size={14} />
            </button>
            <span
              className="toast__progress"
              style={{ animationDuration: `${getDuration(toast.variant)}ms` }}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
