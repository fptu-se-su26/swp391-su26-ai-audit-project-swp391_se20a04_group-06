import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { apiNotifications } from "../services/api";

export default function Notifications() {
  const { notifications: realtime = [] } = useSocket() || {};
  const [stored, setStored] = useState([]);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await apiNotifications.getAll({ limit: 100 });
      setStored(Array.isArray(result) ? result : result?.data || []);
    } catch (error) {
      setNotice(error.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const notifications = useMemo(() => {
    const normalizedRealtime = realtime.map((item, index) => ({
      ...item,
      id: item.id || `realtime-${index}-${item.createdAt || ""}`,
      content: item.content || item.preview || item.message || "Bạn có thông báo mới.",
      isRead: 0,
      createdAt: item.createdAt || new Date().toISOString(),
    }));
    const seen = new Set(normalizedRealtime.map((item) => String(item.id)));
    return [...normalizedRealtime, ...stored.filter((item) => !seen.has(String(item.id)))];
  }, [realtime, stored]);

  const markAll = async () => {
    try {
      await apiNotifications.markAllRead();
      setStored((current) => current.map((item) => ({ ...item, isRead: 1 })));
      setNotice("Đã đánh dấu tất cả là đã đọc.");
    } catch (error) {
      setNotice(error.message);
    }
  };

  const markOne = async (item) => {
    if (String(item.id).startsWith("realtime-") || item.isRead) return;
    try {
      await apiNotifications.markRead(item.id);
      setStored((current) => current.map((row) => row.id === item.id ? { ...row, isRead: 1 } : row));
    } catch (error) {
      setNotice(error.message);
    }
  };

  return (
    <div className="page-container">
      <header className="page-heading">
        <div>
          <span className="eyebrow">ACTIVITY</span>
          <h1><Bell size={25} /> Thông báo</h1>
          <p>Cập nhật hệ thống, tin nhắn và tương tác mới.</p>
        </div>
        <button className="button button--ghost" onClick={markAll} type="button"><CheckCheck size={16} /> Đánh dấu đã đọc</button>
      </header>
      {notice && <p className="inline-notice">{notice}</p>}
      <section className="dashboard-panel notification-page-list">
        {notifications.map((notification) => {
          const body = <><Bell size={17} /><div><p>{notification.content}</p><time>{new Date(notification.createdAt).toLocaleString("vi-VN")}</time></div>{!notification.isRead && <span className="notification-unread-dot" />}</>;
          return notification.landingBatchId ? (
            <Link className={notification.isRead ? "" : "is-unread"} key={notification.id} onClick={() => markOne(notification)} to={`/landing-batches/${notification.landingBatchId}`}>{body}</Link>
          ) : notification.productId ? (
            <Link className={notification.isRead ? "" : "is-unread"} key={notification.id} onClick={() => markOne(notification)} to={`/product/${notification.productId}`}>{body}</Link>
          ) : (
            <article className={notification.isRead ? "" : "is-unread"} key={notification.id} onClick={() => markOne(notification)}>{body}</article>
          );
        })}
        {notifications.length === 0 && <p className="muted-copy">Chưa có thông báo mới.</p>}
      </section>
    </div>
  );
}
