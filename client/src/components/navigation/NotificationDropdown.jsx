import { Bell, MessageSquare } from "lucide-react";
import { Link } from "react-router-dom";

function notificationText(notification) {
  return notification?.preview || notification?.message || "Bạn có thông báo mới";
}

export default function NotificationDropdown({ notifications = [], onClose }) {
  const recentNotifications = notifications.slice(0, 4);

  return (
    <section className="nav-dropdown notification-dropdown" aria-label="Thông báo gần đây">
      <header className="nav-dropdown__header">
        <strong>Thông báo</strong>
        <Link to="/notifications" onClick={onClose}>
          Xem tất cả
        </Link>
      </header>

      {recentNotifications.length > 0 ? (
        recentNotifications.map((notification, index) => (
          <div className="notification-item" key={notification.id || `${notification.type}-${index}`}>
            <span className="notification-item__icon" aria-hidden="true">
              {notification.type === "new_message" ? <MessageSquare size={16} /> : <Bell size={16} />}
            </span>
            <div>
              <p>{notificationText(notification)}</p>
              <small>Vừa nhận</small>
            </div>
          </div>
        ))
      ) : (
        <p className="nav-dropdown__empty">Chưa có thông báo mới.</p>
      )}
    </section>
  );
}
