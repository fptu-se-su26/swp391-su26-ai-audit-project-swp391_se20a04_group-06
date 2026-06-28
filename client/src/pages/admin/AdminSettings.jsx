import { Settings } from "lucide-react";

export default function AdminSettings() {
  return (
    <div className="workspace-page">
      <header className="page-heading page-heading--compact">
        <div>
          <span className="eyebrow">SYSTEM SETTINGS</span>
          <h1>Settings</h1>
          <p>Cấu hình frontend quản trị. Không có thay đổi backend nào được thực hiện tại đây.</p>
        </div>
      </header>
      <section className="dashboard-panel settings-placeholder">
        <Settings size={28} />
        <div>
          <h2>Chưa có cấu hình khả dụng</h2>
          <p>Backend hiện chưa cung cấp API settings, vì vậy màn hình này chỉ giữ đúng cấu trúc điều hướng.</p>
        </div>
      </section>
    </div>
  );
}
