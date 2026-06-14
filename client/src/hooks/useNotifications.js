// Nhập các hook useState, useEffect, và useCallback từ React để quản lý state và tác vụ vòng đời
import { useState, useEffect, useCallback } from "react";
// Nhập module tiện ích gọi API chung từ thư mục services
import { api } from "../services/api";
// Nhập hàm getSocket để kết nối real-time lấy thông báo thời gian thực
import { getSocket } from "../services/socket";

// ─── Các hàm bổ trợ làm việc với bộ nhớ đệm localStorage ───

// Khóa dùng để lưu trữ dữ liệu thông báo trong localStorage, thêm suffix v1 để quản lý phiên bản
const STORAGE_KEY = "notifs_v1"; 
// Giới hạn số lượng thông báo tối đa lưu trong cache để tránh vượt quá dung lượng giới hạn của localStorage
const MAX_STORED = 100; 

// Hàm bổ trợ sinh ra key lưu trữ trong localStorage dựa trên ID của từng người dùng
function storageKey(userId) {
  return `${STORAGE_KEY}_${userId}`;
}

// Hàm bổ trợ đọc danh sách thông báo từ bộ nhớ đệm localStorage của người dùng
function loadCache(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    // Nếu có dữ liệu thô thì giải mã từ JSON sang mảng, ngược lại trả về mảng rỗng
    return raw ? JSON.parse(raw) : [];
  } catch {
    // Trả về mảng rỗng nếu xảy ra lỗi trong quá trình đọc hoặc giải mã
    return [];
  }
}

// Hàm bổ trợ ghi danh sách thông báo vào bộ nhớ đệm localStorage của người dùng
function saveCache(userId, notifs) {
  try {
    // Chỉ cắt lấy tối đa MAX_STORED (100) thông báo mới nhất để lưu trữ nhằm tiết kiệm bộ nhớ
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify(notifs.slice(0, MAX_STORED)),
    );
  } catch {
    // Bỏ qua lỗi nếu bộ nhớ localStorage bị đầy (quota exceeded)
  }
}

// ─── Hàm gộp (merge) thông báo từ API và Cache ───
// Đảm bảo dữ liệu từ API là nguồn chuẩn xác nhất (source of truth), đồng thời giữ lại các thông báo tạm nhận từ socket chưa có trong database
function mergeNotifs(fresh, prev) {
  // Khởi tạo Map để lọc trùng lặp dựa theo ID thông báo làm key
  const map = new Map();

  // BƯỚC 1: Nạp tất cả thông báo cũ từ cache trước (độ ưu tiên thấp hơn)
  for (const n of prev) {
    map.set(n.id, n);
  }

  // BƯỚC 2: Nạp các thông báo mới lấy từ API đè lên (độ ưu tiên cao hơn)
  for (const n of fresh) {
    map.set(n.id, n);
    // Nếu đây là thông báo chính thức có ID thật từ DB (không bắt đầu bằng "tmp_")
    if (!n.id.startsWith("tmp_")) {
      // Tìm và xóa các thông báo tạm thời (tmp_) nhận từ socket có cùng nội dung để tránh hiển thị trùng lặp
      for (const [key, cached] of map) {
        if (
          key.startsWith("tmp_") &&
          cached.type === n.type &&
          cached.productId === n.productId &&
          cached.preview === n.preview
        ) {
          map.delete(key); // Xóa thông báo tạm thời trùng lặp
        }
      }
    }
  }

  // Chuyển Map thành mảng và sắp xếp theo thứ tự thời gian tạo mới nhất lên đầu
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

// ─── Custom Hook chính quản lý thông báo ───
export function useNotifications(user) {
  // Khởi tạo state notifs ngay từ cache localStorage của user (nếu có) để UI hiển thị thông báo tức thì mà không cần chờ gọi API
  const [notifs, setNotifsRaw] = useState(() =>
    user ? loadCache(user.id) : [],
  );

  // Lưu trữ đối tượng user của lần render trước để phát hiện sự thay đổi (đăng nhập/đăng xuất)
  const [prevUser, setPrevUser] = useState(user);

  // So sánh user hiện tại với user lần trước trực tiếp trong thân hàm render để đồng bộ lại cache ngay lập tức
  if (user !== prevUser) {
    setPrevUser(user);
    // Cập nhật lại state danh sách thông báo tương ứng với user mới hoặc rỗng nếu logout
    setNotifsRaw(user ? loadCache(user.id) : []);
  }

  // Hàm setNotifs tùy biến bao bọc hàm setNotifsRaw để tự động lưu danh sách thông báo vào cache sau khi update state
  const setNotifs = useCallback(
    (updater) => {
      setNotifsRaw((prev) => {
        // Hỗ trợ updater là một hàm callback hoặc một giá trị mới trực tiếp
        const next = typeof updater === "function" ? updater(prev) : updater;
        // Nếu user đang đăng nhập thì lưu dữ liệu mới vào cache localStorage
        if (user) saveCache(user.id, next);
        return next;
      });
    },
    [user],
  );

  // ── useEffect 1: Tải danh sách thông báo từ API server khi user thay đổi ──
  useEffect(() => {
    // Nếu chưa đăng nhập thì không làm gì
    if (!user) return;

    // Gọi API lấy toàn bộ thông báo của tài khoản
    api("/notifications")
      .then((res) => {
        const items = res?.data ?? [];
        // Ánh xạ cấu trúc dữ liệu thô từ API sang định dạng hiển thị của client
        const fresh = items.map((item) => ({
          id: item.id,
          type: item.type,
          preview: item.content,
          productId: item.productId,
          reviewId: item.reviewId || null,
          isRead: !!item.isRead,
          createdAt: item.createdAt,
        }));
        // Thực hiện gộp dữ liệu mới tải về với cache hiện có
        setNotifs((prev) => mergeNotifs(fresh, prev));
      })
      .catch((err) => console.error("Lỗi tải thông báo:", err));
  }, [user, setNotifs]);

  // ── useEffect 2: Lắng nghe thông báo real-time qua Socket.IO ──
  useEffect(() => {
    // Nếu chưa đăng nhập thì không mở kết nối lắng nghe
    if (!user) return;
    let active = true; // Cờ kiểm soát component còn mount
    let cleanupSocketListener = null;

    // Lấy instance socket kết nối
    getSocket()
      .then((socket) => {
        // Nếu component đã unmount thì dừng
        if (!active) return;

        // Định nghĩa handler nhận tin nhắn thông báo mới từ socket
        const handler = (data) => {
          // Chỉ xử lý các loại thông báo liên quan (sản phẩm mới, review mới, admin thông báo rộng)
          if (
            data.type !== "new_product" &&
            data.type !== "new_review" &&
            data.type !== "broadcast"
          )
            return;

          // Cập nhật danh sách thông báo
          setNotifs((prev) => {
            // Tránh trùng lặp: nếu thông báo có ID đã tồn tại thì không thêm nữa
            if (data.id && prev.some((n) => n.id === data.id)) return prev;

            // Tạo đối tượng thông báo mới, tự tạo ID tạm thời "tmp_" nếu thiếu ID thật
            const newNotif = {
              id: data.id || `tmp_${Date.now()}`,
              type: data.type,
              preview: data.preview || data.content,
              productId: data.productId,
              reviewId: data.reviewId || null,
              isRead: false,
              createdAt: new Date().toISOString(),
            };

            // Đẩy thông báo mới nhận được lên đầu danh sách
            return [newNotif, ...prev];
          });
        };

        // Đăng ký sự kiện lắng nghe "notification" từ socket
        socket.on("notification", handler);
        // Lưu hàm dọn dẹp để gỡ lắng nghe khi hủy
        cleanupSocketListener = () => socket.off("notification", handler);
      })
      .catch(() => {});

    // Cleanup: Ngắt kết nối lắng nghe socket khi user thay đổi hoặc component unmount
    return () => {
      active = false;
      cleanupSocketListener?.();
    };
  }, [user, setNotifs]);

  // ── Các hàm hành động (Actions) tương tác với thông báo ──

  // Đánh dấu đã đọc tất cả thông báo
  const markAllRead = () => {
    // Gọi API PUT cập nhật trạng thái đã đọc toàn bộ trên server
    api("/notifications/read", { method: "PUT" })
      .then(() =>
        // Cập nhật tất cả các thông báo trong state thành đã đọc (isRead = true)
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true }))),
      )
      .catch((err) => console.error("Lỗi đánh dấu đã đọc:", err));
  };

  // Đánh dấu đã đọc một thông báo cụ thể dựa theo ID
  const markSingleRead = (id) => {
    // Cập nhật lạc quan (optimistic update) trên giao diện trước để tạo cảm giác mượt mà
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    // Gọi API PATCH cập nhật trạng thái đã đọc cho thông báo đó trên server
    api(`/notifications/${id}`, { method: "PATCH" }).catch((err) => {
      console.error("Lỗi đánh dấu đọc thông báo:", err);
      // Nếu API lỗi, hoàn tác trạng thái (rollback) thông báo về chưa đọc (isRead = false)
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
    });
  };

  // Tính số lượng thông báo chưa đọc trong danh sách hiện tại
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  // Trả về danh sách thông báo, số thông báo chưa đọc và các hàm tương tác
  return { notifs, unreadCount, markAllRead, markSingleRead };
}
