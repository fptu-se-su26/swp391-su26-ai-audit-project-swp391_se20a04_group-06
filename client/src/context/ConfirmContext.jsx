import { createContext, useContext, useState, useRef, useEffect } from "react";
import { AlertTriangle, Info, CheckCircle, Trash2, X } from "lucide-react";

const ConfirmContext = createContext(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState({
    open: false,
    title: "",
    message: "",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    variant: "info", // "info" | "danger" | "warning" | "success"
    isAlert: false,  // true for alert, false for confirm
  });

  const resolverRef = useRef(null);

  const show = (options) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({
        open: true,
        title: options.title || "Xác nhận",
        message: options.message || "",
        confirmText: options.confirmText || (options.isAlert ? "Đóng" : "Xác nhận"),
        cancelText: options.cancelText || "Hủy",
        variant: options.variant || "info",
        isAlert: options.isAlert || false,
      });
    });
  };

  const confirm = (options) => {
    return show({ ...options, isAlert: false });
  };

  const alert = (options) => {
    return show({ ...options, isAlert: true });
  };

  const handleConfirm = () => {
    setDialog((prev) => ({ ...prev, open: false }));
    if (resolverRef.current) resolverRef.current(true);
  };

  const handleCancel = () => {
    setDialog((prev) => ({ ...prev, open: false }));
    if (resolverRef.current) resolverRef.current(false);
  };

  // Close dialog on ESC keypress
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && dialog.open) {
        handleCancel();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [dialog.open]);

  // Determine icon based on variant
  const getIcon = () => {
    switch (dialog.variant) {
      case "danger":
        return <Trash2 size={24} className="confirm-dialog-icon is-danger" />;
      case "warning":
        return <AlertTriangle size={24} className="confirm-dialog-icon is-warning" />;
      case "success":
        return <CheckCircle size={24} className="confirm-dialog-icon is-success" />;
      default:
        return <Info size={24} className="confirm-dialog-icon is-info" />;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog.open && (
        <div className="confirm-dialog-overlay" onClick={handleCancel}>
          <div
            className={`confirm-dialog-content is-${dialog.variant}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
          >
            <button
              className="confirm-dialog-close"
              onClick={handleCancel}
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="confirm-dialog-header">
              {getIcon()}
              <h2 id="confirm-dialog-title">{dialog.title}</h2>
            </div>

            <div className="confirm-dialog-body">
              <p>{dialog.message}</p>
            </div>

            <div className="confirm-dialog-footer">
              {!dialog.isAlert && (
                <button
                  className="button button--ghost confirm-dialog-btn-cancel"
                  onClick={handleCancel}
                >
                  {dialog.cancelText}
                </button>
              )}
              <button
                className={`button confirm-dialog-btn-confirm is-${dialog.variant}`}
                onClick={handleConfirm}
                autoFocus
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
