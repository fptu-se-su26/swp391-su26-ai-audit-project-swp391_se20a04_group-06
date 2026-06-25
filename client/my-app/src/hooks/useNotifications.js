import { useState, useEffect } from 'react';
import { api, getToken } from '../services/api';
import { getSocket } from '../services/socket';

/**
 * Hook quản lý thông báo real-time.
 * Tách ra khỏi Navbar để Navbar không phải kiêm nhiệm logic này.
 */
export function useNotifications(user) {
  const [notifs, setNotifs] = useState([]);

  // Tải thông báo khi đăng nhập
  useEffect(() => {
    if (!user) {
      setNotifs([]);
      return;
    }
    api('/notifications')
      .then((data) =>
        setNotifs(
          data.map((item) => ({
            id: item.id,
            type: item.type,
            preview: item.content,
            productId: item.productId,
            reviewId: item.reviewId || null,
            isRead: !!item.isRead,
            createdAt: item.createdAt,
          })),
        ),
      )
      .catch((err) => console.error('Lỗi tải thông báo:', err));
  }, [user]);

  // Lắng nghe thông báo real-time từ socket
  useEffect(() => {
    if (!user) return;
    let active = true;
    getSocket(getToken())
      .then((socket) => {
        if (!active) return;
        const handler = (data) => {
          if (data.type === 'new_product' || data.type === 'new_review') {
            setNotifs((prev) => [
              {
                id: data.id || Date.now(),
                type: data.type,
                preview: data.preview || data.content,
                productId: data.productId,
                reviewId: data.reviewId || null,
                isRead: false,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          }
        };
        socket.on('notification', handler);
        return () => socket.off('notification', handler);
      })
      .catch(() => {});
    return () => { active = false; };
  }, [user]);

  const markAllRead = () => {
    api('/notifications/read', { method: 'PUT' })
      .then(() => setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true }))))
      .catch((err) => console.error('Lỗi đánh dấu đã đọc:', err));
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return { notifs, unreadCount, markAllRead };
}
