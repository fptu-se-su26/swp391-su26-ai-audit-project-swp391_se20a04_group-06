import { Flag } from "lucide-react";
import { useState } from "react";
import ReportDialog from "./ReportDialog";

export default function ReportButton({ label = "Báo cáo", onSubmit }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="report-control">
      <button className="button button--ghost" onClick={() => setOpen(true)} type="button">
        <Flag size={15} /> {label}
      </button>
      <ReportDialog
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={onSubmit}
      />
    </div>
  );
}
