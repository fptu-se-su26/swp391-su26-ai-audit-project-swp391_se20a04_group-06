import { Bell } from "lucide-react";
import { useSocket } from "../context/SocketContext";

export default function Notifications() {
  const { notifications = [] } = useSocket() || {};
  return (
    <div className="page-container">
      <header className="page-heading">
        <div>
          <span className="eyebrow">ACTIVITY</span>
          <h1><Bell size={25} /> Thông báo</h1>
          <p>Cập nhật hệ thống và tương tác mới.</p>
        </div>
      </header>
      <section className="dashboard-panel notification-page-list">
        {notifications.map((notification, index) => (
          <article key={notification.id || index}>
            <Bell size={17} />
            <p>{notification.preview || notification.message || "Bạn có thông báo mới."}</p>
          </article>
        ))}
        {notifications.length === 0 && <p className="muted-copy">Chưa có thông báo mới.</p>}
      </section>
    </div>
  );
}
