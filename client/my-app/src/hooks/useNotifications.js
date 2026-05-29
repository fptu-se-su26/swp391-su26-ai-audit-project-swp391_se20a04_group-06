import { useState, useEffect } from "react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";

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
    api("/notifications")
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
      .catch((err) => console.error("Lỗi tải thông báo:", err));
  }, [user]);

  // Lắng nghe thông báo real-time từ socket
  useEffect(() => {
    if (!user) return;
    let active = true;
    // BUG FIX: trước đây `return () => socket.off(...)` bên trong .then() bị bỏ qua hoàn toàn
    // (return value của Promise callback không phải là cleanup function của useEffect).
    // Hậu quả: mỗi lần re-render thêm một listener mới mà không bao giờ bị gỡ → memory leak + gọi N lần.
    let cleanupSocketListener = null;

    getSocket()
      .then((socket) => {
        if (!active) return;
        const handler = (data) => {
          if (data.type === "new_product" || data.type === "new_review") {
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
        socket.on("notification", handler);
        cleanupSocketListener = () => socket.off("notification", handler);
      })
      .catch(() => {});

    return () => {
      active = false;
      cleanupSocketListener?.(); // gỡ listener đúng cách
    };
  }, [user]);

  const markAllRead = () => {
    api("/notifications/read", { method: "PUT" })
      .then(() =>
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true }))),
      )
      .catch((err) => console.error("Lỗi đánh dấu đã đọc:", err));
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return { notifs, unreadCount, markAllRead };
}
