import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Flag, Send, X, AlertTriangle, ShieldAlert, FileWarning } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useConfirm } from "../context/ConfirmContext";

const REPORT_REASONS = [
  { text: "Thông tin sai sự thật", icon: <AlertTriangle size={15} /> },
  { text: "Hình ảnh không phù hợp", icon: <FileWarning size={15} /> },
  { text: "Nội dung spam/quảng cáo", icon: <ShieldAlert size={15} /> },
  { text: "Ngôn từ xúc phạm", icon: <AlertTriangle size={15} /> },
  { text: "Giá hoặc nguồn gốc đáng ngờ", icon: <FileWarning size={15} /> },
  { text: "Nội dung trùng lặp", icon: <ShieldAlert size={15} /> },
  { text: "Khác", icon: <Flag size={15} /> },
];

export default function ReportDialog({ open, onClose, onSubmit }) {
  const { alert } = useConfirm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [sending, setSending] = useState(false);

  // Lock background scroll when open
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  // Handle ESC key press to close
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") handleCancel();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  if (!open) return null;

  const handleCancel = () => {
    setSelectedReason("");
    setCustomReason("");
    onClose();
  };

  const submitReport = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate("/login", { state: { message: "Bạn cần đăng nhập để gửi báo cáo." } });
      return;
    }
    if (!selectedReason) return;
    if (selectedReason === "Khác" && !customReason.trim()) return;

    const finalReason = selectedReason === "Khác" ? customReason.trim() : selectedReason;

    setSending(true);
    try {
      await onSubmit(finalReason);
      setSelectedReason("");
      setCustomReason("");
      onClose();
      await alert({
        title: "Báo cáo thành công",
        message: "Báo cáo đã được gửi đến quản trị viên.",
        variant: "success",
      });
    } catch (error) {
      await alert({
        title: "Lỗi gửi báo cáo",
        message: error.message,
        variant: "danger",
      });
    } finally {
      setSending(false);
    }
  };

  const isSubmitDisabled =
    sending ||
    !selectedReason ||
    (selectedReason === "Khác" && !customReason.trim());

  return createPortal(
    <div className="report-dialog-overlay" onClick={handleCancel}>
      <div className="report-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="report-dialog__header">
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Flag size={20} className="report-dialog__icon" style={{ color: "#22f3ff" }} />
              <h3 className="report-dialog__title">Báo cáo nội dung</h3>
            </div>
            <p className="report-dialog__description">
              Chọn lý do phù hợp để chúng tôi kiểm tra nội dung này.
            </p>
          </div>
          <button className="report-dialog__close" onClick={handleCancel} type="button" aria-label="Đóng">
            <X size={20} />
          </button>
        </header>

        <div className="report-dialog__body">
          <div className="report-reason-grid">
            {REPORT_REASONS.map((r) => (
              <button
                key={r.text}
                type="button"
                className={`report-reason-option ${selectedReason === r.text ? "is-selected" : ""}`}
                onClick={() => setSelectedReason(r.text)}
              >
                {r.icon}
                <span>{r.text}</span>
              </button>
            ))}
          </div>

          {selectedReason === "Khác" && (
            <textarea
              className="report-dialog__textarea"
              maxLength={500}
              onChange={(event) => setCustomReason(event.target.value)}
              placeholder="Mô tả lý do báo cáo cụ thể..."
              required
              rows="4"
              value={customReason}
            />
          )}
        </div>

        <div className="report-dialog__footer">
          <button className="report-dialog__cancel" onClick={handleCancel} type="button">
            Hủy
          </button>
          <button
            className="report-dialog__submit"
            disabled={isSubmitDisabled}
            onClick={submitReport}
            type="button"
          >
            {sending ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
