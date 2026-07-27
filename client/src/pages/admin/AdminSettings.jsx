import { useState } from "react";
import { Save, Settings, ShieldCheck, Sliders, Bell } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("systemSettings");
      return saved ? JSON.parse(saved) : {
        siteName: "HảiSản.vn",
        contactEmail: "hotro@haisan.vn",
        supportHotline: "1900 6868",
        announcementBanner: "Hệ thống kết nối trực tiếp Người mua & Ngư dân bán hải sản tươi sống chất lượng.",
        maintenanceMode: false,
        requireVerificationToPost: true,
      };
    } catch {
      return {
        siteName: "HảiSản.vn",
        contactEmail: "hotro@haisan.vn",
        supportHotline: "1900 6868",
        announcementBanner: "Hệ thống kết nối trực tiếp Người mua & Ngư dân bán hải sản tươi sống chất lượng.",
        maintenanceMode: false,
        requireVerificationToPost: true,
      };
    }
  });

  const [savedNotice, setSavedNotice] = useState("");

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    try {
      localStorage.setItem("systemSettings", JSON.stringify(settings));
      setSavedNotice("Đã lưu cài đặt hệ thống thành công!");
      setTimeout(() => setSavedNotice(""), 3000);
    } catch {
      setSavedNotice("Không thể lưu cài đặt.");
    }
  };

  return (
    <div className="workspace-page">
      <header className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">CÀI ĐẶT HỆ THỐNG</span>
          <h1><Settings size={22} /> Cài Đặt Hệ Thống</h1>
          <p>Cấu hình thông số vận hành toàn hệ thống HảiSản.vn.</p>
        </div>
      </header>

      {savedNotice && <p className="inline-notice" style={{ color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "10px", borderRadius: "8px" }}>{savedNotice}</p>}

      <form onSubmit={handleSave} className="dashboard-panel" style={{ display: "flex", flexDirection: "column", gap: "20px", padding: "20px" }}>
        <h3 style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}><Sliders size={18} /> Cấu hình thông tin chung</h3>

        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
          <label className="form-field">
            <span>Tên thương hiệu hệ thống</span>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => handleChange("siteName", e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </label>

          <label className="form-field">
            <span>Email hỗ trợ khách hàng</span>
            <input
              type="email"
              value={settings.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </label>

          <label className="form-field">
            <span>Hotline tổng đài hỗ trợ</span>
            <input
              type="text"
              value={settings.supportHotline}
              onChange={(e) => handleChange("supportHotline", e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </label>

          <label className="form-field">
            <span>Thông báo chạy Banner đầu trang</span>
            <input
              type="text"
              value={settings.announcementBanner}
              onChange={(e) => handleChange("announcementBanner", e.target.value)}
              style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
            />
          </label>
        </div>

        <h3 style={{ margin: "16px 0 0 0", display: "flex", alignItems: "center", gap: "8px" }}><ShieldCheck size={18} /> Chính sách & Bảo mật</h3>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.requireVerificationToPost}
              onChange={(e) => handleChange("requireVerificationToPost", e.target.checked)}
            />
            <span>Yêu cầu ngư dân phải được Xác minh tài khoản mới được niêm yết bán hải sản.</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={settings.maintenanceMode}
              onChange={(e) => handleChange("maintenanceMode", e.target.checked)}
            />
            <span style={{ color: settings.maintenanceMode ? "#dc2626" : "inherit", fontWeight: settings.maintenanceMode ? "700" : "normal" }}>
              Bật chế độ bảo trì hệ thống (Tạm thời khóa chợ để nâng cấp).
            </span>
          </label>
        </div>

        <footer style={{ marginTop: "12px", display: "flex", justifyContent: "flex-end" }}>
          <button type="submit" className="button button--primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}>
            <Save size={16} /> Lưu cài đặt hệ thống
          </button>
        </footer>
      </form>
    </div>
  );
}
