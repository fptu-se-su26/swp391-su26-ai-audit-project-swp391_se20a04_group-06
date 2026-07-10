import { Flag, Send, X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import { useConfirm } from "../context/ConfirmContext";

export default function ReportButton({ label = "Báo cáo", onSubmit }) {
  const { alert } = useConfirm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!user) {
      navigate("/login", { state: { message: "Bạn cần đăng nhập để gửi báo cáo." } });
      return;
    }
    setSending(true);
    try {
      await onSubmit(reason.trim());
      setReason("");
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
      <button className="button button--ghost" onClick={() => setOpen(true)} type="button">
        <Flag size={15} /> {label}
      </button>
      {open && (
        <form className="report-popover" onSubmit={submit}>
          <header>
            <strong>Lý do báo cáo</strong>
            <button aria-label="Đóng" onClick={() => setOpen(false)} type="button"><X size={15} /></button>
          </header>
          <textarea
            maxLength={500}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Mô tả nội dung vi phạm..."
            required
            rows="3"
            value={reason}
          />
          <button className="button button--primary" disabled={sending} type="submit">
            <Send size={15} /> {sending ? "Đang gửi..." : "Gửi báo cáo"}
          </button>
        </form>
      )}
    </div>
  );
}
