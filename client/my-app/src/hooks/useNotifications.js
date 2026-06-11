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

/**
 * Kết hợp danh sách từ API (fresh) và cache cũ (prev):
 * - API thắng nếu cùng id (isRead chính xác hơn)
 * - Notif socket-only (id tạm "tmp_...") được giữ lại nếu chưa có bản thật
 * - Kết quả sắp xếp mới nhất lên đầu
 */
function mergeNotifs(fresh, prev) {
  const map = new Map();

  // Ưu tiên thấp: cache cũ (gồm cả notif socket tmp_)
  for (const n of prev) {
    map.set(n.id, n);
  }

  // Ưu tiên cao: dữ liệu từ API
  for (const n of fresh) {
    map.set(n.id, n);
    // Nếu notif API này trùng nội dung với một tmp_ entry → xoá tmp_
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

  /**
   * Wrapper: mỗi lần cập nhật state cũng đồng thời ghi localStorage.
   * Dùng thay thế hoàn toàn cho setNotifsRaw bên trong hook này.
   */
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

  // ── Reset khi logout ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) {
      setNotifsRaw([]);
    }
  }, [user]);

  // ── Load từ API, merge với cache ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    api("/notifications")
      .then((data) => {
        const fresh = data.map((item) => ({
          id: item.id,
          type: item.type,
          preview: item.content,
          productId: item.productId,
          reviewId: item.reviewId || null,
          isRead: !!item.isRead,
          createdAt: item.createdAt,
        }));
        // Merge: giữ notif socket chưa đồng bộ, xoá trùng
        setNotifs((prev) => mergeNotifs(fresh, prev));
      })
      .catch((err) => console.error("Lỗi tải thông báo:", err));
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps
  // (setNotifs stable nhờ useCallback, bỏ qua warning lint là hợp lý)

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
            // Bỏ qua nếu đã có id thật từ DB (server đã emit id đúng)
            if (data.id && prev.some((n) => n.id === data.id)) return prev;

            const newNotif = {
              id: data.id || `tmp_${Date.now()}`, // FIX: server cần gửi id
              type: data.type,
              preview: data.preview || data.content,
              productId: data.productId,
              reviewId: data.reviewId || null,
              isRead: false,
              createdAt: new Date().toISOString(),
            };

            // Đẩy lên đầu danh sách
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
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Actions ───────────────────────────────────────────────────────────────

  const markAllRead = () => {
    api("/notifications/read", { method: "PUT" })
      .then(() =>
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true }))),
      )
      .catch((err) => console.error("Lỗi đánh dấu đã đọc:", err));
  };

  const markSingleRead = (id) => {
    // Optimistic update trước, rollback nếu API lỗi
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    api(`/notifications/${id}`, { method: "PATCH" }).catch((err) => {
      console.error("Lỗi đánh dấu đọc thông báo:", err);
      // Rollback
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
    });
  };

  const unreadCount = notifs.filter((n) => !n.isRead).length;

  return { notifs, unreadCount, markAllRead, markSingleRead };
}
