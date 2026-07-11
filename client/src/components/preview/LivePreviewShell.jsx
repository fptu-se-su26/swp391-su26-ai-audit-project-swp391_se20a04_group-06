import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

export default function LivePreviewShell({
  children,
  title = "Xem trước trực tiếp",
  subtext = "Giao diện mô phỏng trước khi đăng",
  badge = "XEM TRƯỚC",
}) {
  const [showMobilePreview, setShowMobilePreview] = useState(false);

  return (
    <div className="live-preview-shell-container" style={{ width: "100%" }}>
      {/* Mobile Toggle Button */}
      <button
        className="button button--secondary mobile-preview-toggle"
        onClick={() => setShowMobilePreview(!showMobilePreview)}
        type="button"
        style={{
          display: "none",
          width: "100%",
          justifyContent: "center",
          alignItems: "center",
          gap: "8px",
          margin: "16px 0",
        }}
      >
        {showMobilePreview ? <EyeOff size={16} /> : <Eye size={16} />}
        <span>{showMobilePreview ? "Ẩn bản xem trước" : "Hiện bản xem trước"}</span>
      </button>

      <div className={`live-preview-shell ${showMobilePreview ? "is-mobile-open" : "is-mobile-hidden"}`}>
        <div className="live-preview-shell__header">
          <div className="live-preview-shell__title-group">
            <h3>{title}</h3>
            <p>{subtext}</p>
          </div>
          <span className="live-preview-shell__badge">{badge}</span>
        </div>
        <div className="live-preview-shell__content">{children}</div>
      </div>
    </div>
  );
}
