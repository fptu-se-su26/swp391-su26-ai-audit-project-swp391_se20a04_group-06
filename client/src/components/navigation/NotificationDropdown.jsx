import { useState } from "react";
import { Bell, MessageSquare, MoreHorizontal, ShoppingBag, Users, Heart } from "lucide-react";
import { Link } from "react-router-dom";

function notificationText(notification) {
  return notification?.preview || notification?.message || "Bạn có thông báo mới";
}

function getTimeAgo(notification) {
  if (notification?.timeAgo) return notification.timeAgo;
  if (notification?.createdAt) {
    const diffHours = Math.round((new Date() - new Date(notification.createdAt)) / (1000 * 60 * 60));
    if (diffHours < 1) return "Vừa xong";
    if (diffHours < 24) return `${diffHours} giờ`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} ngày`;
  }
  return "Vừa xong";
}

function getSubIcon(type) {
  switch (type) {
    case "new_message":
      return <div className="fb-subicon bg-blue-500 text-white"><MessageSquare size={10} /></div>;
    case "order":
    case "batch":
      return <div className="fb-subicon bg-amber-500 text-white"><ShoppingBag size={10} /></div>;
    case "community":
      return <div className="fb-subicon bg-emerald-500 text-white"><Users size={10} /></div>;
    default:
      return <div className="fb-subicon bg-purple-500 text-white"><Bell size={10} /></div>;
  }
}

export default function NotificationDropdown({ notifications = [], onClose }) {
  const [filter, setFilter] = useState("all"); // "all" | "unread"

  const filteredNotifications = notifications.filter((item) => {
    if (filter === "unread") return !item.read && !item.isRead;
    return true;
  });

  const newest = filteredNotifications.slice(0, 3);
  const earlier = filteredNotifications.slice(3, 8);

  const renderNotificationItem = (notification, index) => {
    const isUnread = !notification.read && !notification.isRead;
    const target = notification.landingBatchId
      ? `/landing-batches/${notification.landingBatchId}`
      : notification.productId
      ? `/product/${notification.productId}`
      : notification.postId
      ? `/community`
      : "";

    const content = (
      <div className={`fb-notif-item ${isUnread ? "is-unread" : ""}`}>
        <div className="fb-notif-avatar-box">
          {notification.senderAvatar ? (
            <img src={notification.senderAvatar} alt="" className="fb-notif-avatar" />
          ) : (
            <div className="fb-notif-avatar-fallback">
              {(notification.senderName || "H").slice(0, 1).toUpperCase()}
            </div>
          )}
          {getSubIcon(notification.type)}
        </div>
        <div className="fb-notif-body">
          <p className="fb-notif-text">
            <strong>{notification.senderName || "Hệ thống"}</strong> {notificationText(notification)}
          </p>
          <span className="fb-notif-time">{getTimeAgo(notification)}</span>
        </div>
        {isUnread && <span className="fb-unread-dot" />}
      </div>
    );

    return target ? (
      <Link
        key={notification.id || `${notification.type}-${index}`}
        onClick={onClose}
        to={target}
        className="fb-notif-link"
      >
        {content}
      </Link>
    ) : (
      <div key={notification.id || `${notification.type}-${index}`} className="fb-notif-link">
        {content}
      </div>
    );
  };

  return (
    <section className="nav-dropdown fb-notif-dropdown" aria-label="Thông báo">
      <header className="fb-notif-header">
        <div className="fb-notif-title-row">
          <h3>Thông báo</h3>
          <button type="button" className="fb-circle-sm-btn" aria-label="Tùy chọn thông báo">
            <MoreHorizontal size={18} />
          </button>
        </div>
        <div className="fb-notif-filter-pills">
          <button
            type="button"
            className={`fb-pill-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`fb-pill-btn ${filter === "unread" ? "active" : ""}`}
            onClick={() => setFilter("unread")}
          >
            Chưa đọc
          </button>
        </div>
      </header>

      <div className="fb-notif-content-scroll">
        {filteredNotifications.length === 0 ? (
          <p className="nav-dropdown__empty">Không có thông báo nào.</p>
        ) : (
          <>
            {newest.length > 0 && (
              <div className="fb-notif-group">
                <div className="fb-notif-group-title">Mới nhất</div>
                {newest.map((item, idx) => renderNotificationItem(item, idx))}
              </div>
            )}

            {earlier.length > 0 && (
              <div className="fb-notif-group">
                <div className="fb-notif-group-title">Trước đó</div>
                {earlier.map((item, idx) => renderNotificationItem(item, idx + 3))}
              </div>
            )}
          </>
        )}
      </div>

      <footer className="fb-notif-footer">
        <Link to="/notifications" onClick={onClose} className="fb-see-all-link">
          Xem tất cả trong Thông báo
        </Link>
      </footer>
    </section>
  );
}

