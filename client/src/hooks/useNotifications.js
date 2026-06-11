import { useState, useEffect, useCallback } from "react";
import { api } from "../services/api";
import { getSocket } from "../services/socket";

// ─── localStorage helpers ──────────────────────────────────────────────────

const STORAGE_KEY = "notifs_v1"; // bump suffix khi đổi shape
const MAX_STORED = 100; // giới hạn để tránh quota localStorage

function storageKey(userId) {
  return `${STORAGE_KEY}_${userId}`;
}

function loadCache(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCache(userId, notifs) {
  try {
    // Chỉ lưu MAX_STORED thông báo mới nhất
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify(notifs.slice(0, MAX_STORED)),
    );
  } catch {
    // Bỏ qua nếu localStorage đầy (quota exceeded)
  }
}

// ─── Merge: API là source of truth, giữ lại notif từ socket chưa có trong DB ─

function mergeNotifs(fresh, prev) {
  const map = new Map();

  // Ưu tiên thấp: cache cũ (gồm cả notif socket tmp_)
  for (const n of prev) {
    map.set(n.id, n);
  }

  // Ưu tiên cao: dữ liệu từ API
  for (const n of fresh) {
    map.set(n.id, n);
    if (!n.id.startsWith("tmp_")) {
      for (const [key, cached] of map) {
        if (
          key.startsWith("tmp_") &&
          cached.type === n.type &&
          cached.productId === n.productId &&
          cached.preview === n.preview
        ) {
          map.delete(key);
        }
      }
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export function useNotifications(user) {
  // Khởi tạo ngay từ cache → UI hiện thông báo tức thì, không chờ API
  const [notifs, setNotifsRaw] = useState(() =>
    user ? loadCache(user.id) : [],
  );

  // 🌟 KHẮC PHỤC: Điều chỉnh State trực tiếp trong thân hàm Render (Derived State)
  // Đồng bộ và tải lại bộ nhớ đệm ngay khi phát hiện trạng thái người dùng thay đổi (Đăng nhập/Đăng xuất)
  const [prevUser, setPrevUser] = useState(user);

  if (user !== prevUser) {
    setPrevUser(user);
    setNotifsRaw(user ? loadCache(user.id) : []);
  }

  // SỬA ĐỒNG BỘ: Đã xóa hoàn toàn khối useEffect lắng nghe reset khi logout trước đây!

  const setNotifs = useCallback(
    (updater) => {
      setNotifsRaw((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        if (user) saveCache(user.id, next);
        return next;
      });
    },
    [user],
  );

  // ── Load từ API, merge với cache ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    api("/notifications")
      .then((res) => {
        const items = res?.data ?? [];
        const fresh = items.map((item) => ({
          id: item.id,
          type: item.type,
          preview: item.content,
          productId: item.productId,
          reviewId: item.reviewId || null,
          isRead: !!item.isRead,
          createdAt: item.createdAt,
        }));
        setNotifs((prev) => mergeNotifs(fresh, prev));
      })
      .catch((err) => console.error("Lỗi tải thông báo:", err));
  }, [user, setNotifs]);

  // ── Real-time socket ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    let active = true;
    let cleanupSocketListener = null;

    getSocket()
      .then((socket) => {
        if (!active) return;

        const handler = (data) => {
          if (
            data.type !== "new_product" &&
            data.type !== "new_review" &&
            data.type !== "broadcast"
          )
            return;

          setNotifs((prev) => {
            if (data.id && prev.some((n) => n.id === data.id)) return prev;

            const newNotif = {
              id: data.id || `tmp_${Date.now()}`,
              type: data.type,
              preview: data.preview || data.content,
              productId: data.productId,
              reviewId: data.reviewId || null,
              isRead: false,
              createdAt: new Date().toISOString(),
            };

            return [newNotif, ...prev];
          });
        };

        socket.on("notification", handler);
        cleanupSocketListener = () => socket.off("notification", handler);
      })
      .catch(() => {});

    return () => {
      active = false;
      cleanupSocketListener?.();
    };
  }, [user, setNotifs]);

  // ── Actions ───────────────────────────────────────────────────────────────

  const markAllRead = () => {
    api("/notifications/read", { method: "PUT" })
      .then(() =>
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true }))),
      )
      .catch((err) => console.error("Lỗi đánh dấu đã đọc:", err));
  };

  const markSingleRead = (id) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    api(`/notifications/${id}`, { method: "PATCH" }).catch((err) => {
      console.error("Lỗi đánh dấu đọc thông báo:", err);
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
    });
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return { notifs, unreadCount, markAllRead, markSingleRead };
}
