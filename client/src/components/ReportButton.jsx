import { Flag, Send, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { useConfirm } from "../context/ConfirmContext";

const REPORT_REASONS = [
  "Thông tin sai sự thật",
  "Hình ảnh không phù hợp",
  "Nội dung spam/quảng cáo",
  "Ngôn từ xúc phạm",
  "Giá hoặc nguồn gốc đáng ngờ",
  "Nội dung trùng lặp",
  "Khác",
];

export default function ReportButton({ label = "Báo cáo", onSubmit }) {
  const { alert } = useConfirm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [sending, setSending] = useState(false);

  const handleOpen = () => {
    setSelectedReason("");
    setCustomReason("");
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedReason("");
    setCustomReason("");
    setOpen(false);
  };

  const submit = async (event) => {
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
      setOpen(false);
      await alert({
        title: "Báo cáo thành công",
        message: "Báo cáo đã được gửi đến quản trị viên.",
        variant: "success"
      });
    } catch (error) {
      await alert({
        title: "Lỗi gửi báo cáo",
        message: error.message,
        variant: "danger"
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="report-control">
      <button className="button button--ghost" onClick={handleOpen} type="button">
        <Flag size={15} /> {label}
      </button>
      {open && (
        <div className="report-dialog-backdrop" onClick={handleClose}>
          <div className="report-dialog" onClick={(e) => e.stopPropagation()}>
            <header className="report-dialog__header">
              <h3>Báo cáo nội dung</h3>
              <button className="report-dialog__close" onClick={handleClose} type="button" aria-label="Đóng">
                <X size={18} />
              </button>
            </header>
            
            <p className="report-dialog__description">
              Vui lòng chọn lý do phù hợp. Báo cáo của bạn sẽ giúp cộng đồng an toàn hơn.
            </p>

            <div className="report-dialog__reasons">
              {REPORT_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`report-reason-option ${selectedReason === r ? "is-selected" : ""}`}
                  onClick={() => setSelectedReason(r)}
                >
                  {r}
                </button>
              ))}
            </div>

            {selectedReason === "Khác" && (
              <textarea
                className="report-dialog__textarea"
                maxLength={500}
                onChange={(event) => setCustomReason(event.target.value)}
                placeholder="Mô tả lý do báo cáo..."
                required
                rows="3"
                value={customReason}
              />
            )}

            <div className="report-dialog__footer">
              <button className="button button--secondary" onClick={handleClose} type="button">
                Hủy
              </button>
              <button
                className="button button--primary"
                disabled={sending || !selectedReason || (selectedReason === "Khác" && !customReason.trim())}
                onClick={submit}
                type="button"
              >
                <Send size={15} /> {sending ? "Đang gửi..." : "Gửi báo cáo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
