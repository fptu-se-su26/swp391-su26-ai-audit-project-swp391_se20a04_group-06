// ============================================================
// 📦 BƯỚC 1 – NHẬP CÁC CÔNG CỤ CẦN THIẾT
// ============================================================
//
//  • useState    → Lưu giá trị có thể thay đổi (danh sách thông báo, user cũ...)
//  • useEffect   → Chạy code SAU khi render (gọi API, kết nối socket...)
//  • useCallback → Ghi nhớ (cache) hàm, tránh tạo lại mỗi lần render
//
import { useState, useEffect, useCallback } from "react";

// api()      – Hàm tiện ích bọc sẵn fetch: tự thêm token, xử lý lỗi chung
// getSocket()– Hàm trả về Promise<Socket>, kết nối Socket.IO để nhận real-time
import { api } from "../services/api";
import { getSocket } from "../services/socket";

// ============================================================
// 🗄️ CẤU HÌNH CACHE – LocalStorage
// ============================================================
//
// localStorage là bộ nhớ trên trình duyệt của người dùng.
// Dữ liệu lưu ở đây tồn tại kể cả khi tắt tab hoặc đóng trình duyệt.
// Điều này giúp thông báo hiển thị tức thì khi user quay lại trang,
// thay vì phải chờ API trả về (tránh màn hình trắng/flash).
//
// Giới hạn: localStorage chỉ chứa ~5MB → cần giới hạn số lượng.
//

// Tiền tố (prefix) cho key lưu trong localStorage.
// Thêm "v1" để quản lý phiên bản: nếu cấu trúc dữ liệu thay đổi,
// đổi thành "v2" → tự động bỏ qua cache cũ không tương thích.
const STORAGE_KEY = "notifs_v1";

// Giới hạn chỉ lưu 100 thông báo gần nhất.
// localStorage có giới hạn dung lượng (~5MB), lưu quá nhiều
// sẽ gây lỗi "QuotaExceededError" → crash tính năng cache.
const MAX_STORED = 100;

// ============================================================
// 🔧 CÁC HÀM BỔ TRỢ (Helper Functions)
// ============================================================
// Tách logic nhỏ thành hàm riêng giúp code dễ đọc, dễ test,
// tránh lặp code ở nhiều chỗ.

// ----------------------------------------------------------
// storageKey(userId) – Tạo key riêng cho từng user
// ----------------------------------------------------------
// Tại sao cần key riêng?
//   Nếu dùng chung key, user A đăng xuất, user B đăng nhập
//   sẽ thấy thông báo của user A → nghiêm trọng về bảo mật!
//
// Ví dụ:
//   storageKey("123") → "notifs_v1_123"
//   storageKey("456") → "notifs_v1_456"
//
function storageKey(userId) {
  return `${STORAGE_KEY}_${userId}`;
}

// ----------------------------------------------------------
// loadCache(userId) – Đọc thông báo đã lưu từ localStorage
// ----------------------------------------------------------
// localStorage.getItem() trả về:
//   • Chuỗi JSON  → nếu đã từng lưu
//   • null        → nếu chưa có dữ liệu
//
// JSON.parse() chuyển chuỗi → mảng JavaScript.
// Ví dụ: '[ {"id":1}, {"id":2} ]' → [ {id:1}, {id:2} ]
//
// Khối try/catch bảo vệ khỏi 2 tình huống lỗi:
//   1. Chuỗi JSON bị hỏng (lưu dở, trình duyệt crash lúc ghi...)
//   2. localStorage bị tắt (chế độ private/incognito nghiêm ngặt)
// → Thay vì crash app, trả về [] để hook hoạt động bình thường.
//
function loadCache(userId) {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// ----------------------------------------------------------
// saveCache(userId, notifs) – Ghi thông báo vào localStorage
// ----------------------------------------------------------
// notifs.slice(0, MAX_STORED):
//   Cắt lấy đúng 100 phần tử đầu tiên (mới nhất).
//   Vì mảng đã được sắp xếp theo thứ tự mới → cũ, .slice(0, 100)
//   giữ 100 thông báo mới nhất, bỏ những cái quá cũ.
//
// JSON.stringify() chuyển mảng → chuỗi để lưu vào localStorage.
// Ví dụ: [{id:1}, {id:2}] → '[{"id":1},{"id":2}]'
//
// try/catch xử lý lỗi "QuotaExceededError" khi localStorage đầy.
// → Bỏ qua thay vì crash, vì cache chỉ là "nice to have", không bắt buộc.
//
function saveCache(userId, notifs) {
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify(notifs.slice(0, MAX_STORED)),
    );
  } catch {
    // Bộ nhớ đầy → bỏ qua, app vẫn chạy bình thường
  }
}

// ============================================================
// 🔀 HÀM MERGE: mergeNotifs(fresh, prev)
// ============================================================
//
// Tại sao cần merge?
//   Dữ liệu thông báo đến từ 2 nguồn cùng lúc:
//     1. API      → dữ liệu chính thức từ database, có ID thật
//     2. Socket   → thông báo tức thì, có thể chỉ có ID tạm "tmp_..."
//
//   Vấn đề: Cùng một thông báo có thể xuất hiện ở CẢ HAI nguồn.
//   Ví dụ: Admin đăng sản phẩm mới
//     • Socket gửi ngay lập tức → ta tạo ID "tmp_1718000000000"
//     • API trả về 3 giây sau   → cùng thông báo đó, ID thật "notif_abc123"
//   → Nếu không merge, user thấy thông báo bị nhân đôi!
//
// Thuật toán:
//   Dùng Map<id, notif> làm bộ lọc trùng:
//     Bước 1: Nạp cache cũ (prev)  → ưu tiên thấp
//     Bước 2: Nạp dữ liệu API mới (fresh) đè lên → ưu tiên cao
//     Bước 3: Với mỗi thông báo API có ID thật → tìm và xóa
//             thông báo tạm tmp_ có cùng nội dung (trùng về type,
//             productId, preview) để dọn bản nháp không còn cần.
//
// Tham số:
//   fresh → mảng thông báo vừa lấy từ API (nguồn chuẩn xác nhất)
//   prev  → mảng thông báo hiện có trong state/cache
//
function mergeNotifs(fresh, prev) {
  // Map<string, object>: key = id thông báo, value = object thông báo
  // Map tự động loại bỏ key trùng → đây là cơ chế deduplication cốt lõi.
  const map = new Map();

  // ── Bước 1: Nạp tất cả thông báo cũ (cache / state hiện tại) ──
  // Vòng for...of nhanh và rõ ràng hơn .forEach() cho mảng đơn giản.
  // Cache được nạp TRƯỚC để có ưu tiên thấp hơn → sẽ bị đè bởi API.
  for (const n of prev) {
    map.set(n.id, n); // key = n.id, value = toàn bộ object thông báo
  }

  // ── Bước 2: Nạp thông báo mới từ API, đè lên cache cũ ──
  for (const n of fresh) {
    map.set(n.id, n); // Nếu id đã tồn tại → ghi đè bằng bản mới từ API

    // ── Bước 3: Dọn thông báo tạm tmp_ bị API "thay thế" ──
    //
    // Chỉ xét thông báo API có ID THẬT (không phải tmp_).
    // n.id.startsWith("tmp_") = false → đây là ID thật từ database.
    //
    if (!n.id.startsWith("tmp_")) {
      // Duyệt toàn bộ Map để tìm thông báo tạm có cùng nội dung.
      // "cùng nội dung" = cùng type + cùng productId + cùng preview.
      // Đây là heuristic (suy đoán): nếu 3 trường này khớp, gần như
      // chắc chắn chúng là cùng một thông báo.
      for (const [key, cached] of map) {
        if (
          key.startsWith("tmp_") && // Chỉ xét thông báo tạm
          cached.type === n.type && // Cùng loại thông báo
          cached.productId === n.productId && // Cùng sản phẩm
          cached.preview === n.preview // Cùng nội dung hiển thị
        ) {
          map.delete(key); // Xóa bản tạm → giữ lại bản chính thức của API
        }
      }
    }
  }

  // ── Bước 4: Xuất kết quả, sắp xếp mới nhất lên đầu ──
  //
  // Array.from(map.values()) → lấy tất cả giá trị trong Map thành mảng.
  //
  // .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)):
  //   Sắp xếp giảm dần theo thời gian tạo.
  //   new Date("2024-06-15") - new Date("2024-06-14") = số dương
  //   → b mới hơn a → b đứng trước → danh sách từ mới → cũ.
  //
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
}

// ============================================================
// 🔔 CUSTOM HOOK CHÍNH: useNotifications(user)
// ============================================================
//
// Hook tổng hợp quản lý toàn bộ vòng đời thông báo:
//   ① Hiển thị ngay từ cache khi mở trang
//   ② Đồng bộ dữ liệu mới nhất từ API
//   ③ Nhận thông báo tức thì qua Socket.IO
//   ④ Cho phép đánh dấu đã đọc (đơn lẻ hoặc tất cả)
//
// Tham số:
//   user → object người dùng đang đăng nhập, hoặc null nếu chưa đăng nhập
//          Ví dụ: { id: "123", name: "Nguyễn Văn A" }
//
export function useNotifications(user) {
  // ----------------------------------------------------------
  // 📌 STATE: notifs – Danh sách thông báo
  // ----------------------------------------------------------
  //
  // Dùng dạng "lazy initializer": truyền hàm vào useState thay vì giá trị.
  //   useState(() => loadCache(user.id))  ← hàm, chỉ gọi 1 lần khi mount
  //   useState(loadCache(user.id))        ← giá trị, gọi mỗi lần render!
  //
  // Lợi ích của lazy initializer:
  //   loadCache() đọc localStorage → có thể chậm nếu dữ liệu lớn.
  //   Dùng hàm → React chỉ gọi đúng 1 lần lúc khởi tạo, tiết kiệm tài nguyên.
  //
  // Luồng hoạt động khi user mở trang:
  //   → notifs = loadCache() = thông báo từ lần trước (hiển thị ngay lập tức!)
  //   → API trả về dữ liệu mới → merge → notifs cập nhật
  //   → Không có màn hình trắng, UX mượt mà hơn!
  //
  const [notifs, setNotifsRaw] = useState(() =>
    user ? loadCache(user.id) : [],
  );

  // ----------------------------------------------------------
  // 📌 STATE: prevUser – Lưu user của lần render trước
  // ----------------------------------------------------------
  // Kỹ thuật "derived state": phát hiện user thay đổi TRONG lúc render,
  // không cần đợi useEffect chạy sau. Xem giải thích ở block if bên dưới.
  //
  const [prevUser, setPrevUser] = useState(user);

  // ----------------------------------------------------------
  // ⚡ Xử lý thay đổi user ngay trong lúc render
  // ----------------------------------------------------------
  //
  // Tình huống: User A đăng xuất, User B đăng nhập vào.
  //
  // Nếu dùng useEffect: React render xong → useEffect chạy sau
  // → Trong khoảnh khắc đó, notifs vẫn là của User A → lộ dữ liệu!
  //
  // Giải pháp: So sánh và reset NGAY TRONG lần render hiện tại.
  //   → user !== prevUser → đổi user → load cache của user mới ngay.
  //   → React sẽ re-render lại với dữ liệu đúng TRƯỚC KHI vẽ lên màn hình.
  //
  if (user !== prevUser) {
    setPrevUser(user); // Cập nhật "snapshot" user cũ thành user mới
    setNotifsRaw(user ? loadCache(user.id) : []);
    // user có giá trị  → load cache của user mới
    // user = null      → đăng xuất, xóa sạch danh sách thông báo
  }

  // ----------------------------------------------------------
  // 🔧 setNotifs – Hàm setter tùy biến (bao bọc setNotifsRaw)
  // ----------------------------------------------------------
  //
  // Tại sao không dùng setNotifsRaw trực tiếp?
  //   Mỗi lần cập nhật state notifs đều cần lưu vào cache.
  //   Nếu dùng setNotifsRaw trực tiếp ở 5-6 chỗ trong code,
  //   ta phải nhớ gọi saveCache() ở TẤT CẢ các chỗ đó → dễ quên.
  //
  //   Giải pháp: Bọc lại thành setNotifs → tự động saveCache() mỗi lần.
  //   Đây là pattern "single source of truth" cho việc cập nhật state.
  //
  // updater có thể là:
  //   1. Hàm callback: setNotifs(prev => [...prev, newItem])
  //   2. Giá trị trực tiếp: setNotifs([])
  //
  // useCallback với dependency [user]:
  //   → Tái tạo hàm khi user thay đổi (để saveCache dùng đúng user.id mới).
  //   → Ổn định khi user không đổi → tránh re-render không cần thiết ở
  //     các component/hook nhận setNotifs làm dependency.
  //
  const setNotifs = useCallback(
    (updater) => {
      setNotifsRaw((prev) => {
        // Tính next: dữ liệu sau khi cập nhật
        const next = typeof updater === "function" ? updater(prev) : updater;

        // Lưu vào cache localStorage NGAY LẬP TỨC (đồng bộ trong setter)
        if (user) saveCache(user.id, next);

        return next; // Trả về cho React để cập nhật state
      });
    },
    [user],
  );

  // ============================================================
  // 🌐 useEffect 1 – Tải thông báo từ API
  // ============================================================
  //
  // Mục tiêu: Đồng bộ dữ liệu chính thức từ server vào state.
  //   Cache cho tốc độ, API cho độ chính xác.
  //
  // Chạy lại khi: user hoặc setNotifs thay đổi.
  //   • user thay đổi → cần tải thông báo của user mới
  //   • setNotifs thay đổi → user thay đổi → cũng cần tải lại
  //
  useEffect(() => {
    // Chưa đăng nhập → không có gì để tải
    if (!user) return;

    api("/notifications")
      .then((res) => {
        // res?.data ?? []:
        //   res?.data → optional chaining: không lỗi nếu res = null/undefined
        //   ?? []     → nullish coalescing: dùng [] nếu res.data là null/undefined
        const items = res?.data ?? [];

        // Ánh xạ (map) cấu trúc dữ liệu API → cấu trúc dữ liệu client
        // Tại sao cần bước này?
        //   API trả về field tên "content", client muốn tên "preview".
        //   Tách biệt cấu trúc API và UI: nếu API thay đổi, chỉ sửa ở đây.
        const fresh = items.map((item) => ({
          id: item.id,
          type: item.type,
          preview: item.content, // "content" từ API → đổi tên thành "preview" cho client
          productId: item.productId,
          reviewId: item.reviewId || null, // Đảm bảo null thay vì undefined nếu không có
          isRead: !!item.isRead, // !! ép kiểu về boolean (0 → false, 1 → true)
          createdAt: item.createdAt,
        }));

        // Merge thay vì replace: giữ lại thông báo socket tạm thời chưa có trong DB
        // (Ví dụ: socket vừa gửi thông báo 2 giây trước, API chưa kịp có)
        setNotifs((prev) => mergeNotifs(fresh, prev));
      })
      .catch((err) => console.error("Lỗi tải thông báo:", err));
    // Không có AbortController ở đây: nếu cần, có thể thêm tương tự useApiFetch.
    // Hiện tại chấp nhận đánh đổi: đơn giản hơn, nguy cơ memory leak thấp.
  }, [user, setNotifs]);

  // ============================================================
  // 🔌 useEffect 2 – Kết nối Socket.IO để nhận thông báo real-time
  // ============================================================
  //
  // Tại sao cần socket thay vì chỉ dùng API polling?
  //   API polling = gọi API mỗi N giây → tốn bandwidth, chậm trễ.
  //   Socket.IO = server CHỦ ĐỘNG đẩy dữ liệu khi có sự kiện → tức thì.
  //
  // Luồng hoạt động:
  //   1. getSocket() → kết nối đến server WebSocket (trả về Promise<Socket>)
  //   2. socket.on("notification", handler) → đăng ký lắng nghe sự kiện
  //   3. Server đẩy notification → handler() chạy → cập nhật notifs
  //   4. Cleanup: socket.off() → hủy đăng ký để không nhận nữa
  //
  useEffect(() => {
    if (!user) return;

    // Cờ active: kiểm tra component có còn "sống" không.
    // Tương tự AbortController, nhưng dùng cho Promise thay vì fetch.
    // Nếu getSocket() mất vài giây mới resolve, component có thể đã unmount.
    let active = true;

    // Lưu hàm cleanup socket để gọi trong return() dù socket có kết nối được hay không.
    let cleanupSocketListener = null;

    getSocket()
      .then((socket) => {
        // Kiểm tra cờ: component đã unmount trước khi socket kết nối xong
        // → Không làm gì thêm, tránh memory leak
        if (!active) return;

        // ──────────────────────────────────────────────────────
        // handler – Xử lý từng thông báo real-time nhận được
        // ──────────────────────────────────────────────────────
        const handler = (data) => {
          // Lọc loại thông báo: Chỉ xử lý 3 loại quan trọng.
          // Các sự kiện socket khác (ping, status...) sẽ bị bỏ qua.
          if (
            data.type !== "new_product" && // Sản phẩm mới từ người bán
            data.type !== "new_review" && // Đánh giá mới cho sản phẩm
            data.type !== "broadcast" // Thông báo hệ thống diện rộng
          )
            return;

          setNotifs((prev) => {
            // Kiểm tra trùng lặp: Đôi khi server gửi lại cùng 1 thông báo.
            // Nếu đã có ID này trong danh sách → bỏ qua, không thêm.
            if (data.id && prev.some((n) => n.id === data.id)) return prev;

            // Tạo object thông báo mới.
            // data.id || `tmp_${Date.now()}`:
            //   Server gửi ID thật → dùng luôn
            //   Server chưa có ID → tạo ID tạm dựa vào timestamp hiện tại
            //   "tmp_1718000123456" → đủ unique trong thực tế
            const newNotif = {
              id: data.id || `tmp_${Date.now()}`,
              type: data.type,
              preview: data.preview || data.content, // Hỗ trợ 2 tên field khác nhau từ server
              productId: data.productId,
              reviewId: data.reviewId || null,
              isRead: false, // Thông báo mới luôn chưa đọc
              createdAt: new Date().toISOString(), // Đánh dấu thời điểm nhận
            };

            // Thêm vào ĐẦU mảng (mới nhất trên cùng)
            // [newNotif, ...prev] thay vì [...prev, newNotif]
            return [newNotif, ...prev];
          });
        };

        // Đăng ký lắng nghe sự kiện "notification" trên socket
        socket.on("notification", handler);

        // Lưu lại hàm cleanup để dùng trong return() bên dưới
        cleanupSocketListener = () => socket.off("notification", handler);
      })
      .catch(() => {
        // Socket không kết nối được (mất mạng, server down...)
        // → Bỏ qua, app vẫn chạy bình thường với API polling
      });

    // ──────────────────────────────────────────────────────────
    // 🧹 Cleanup – Chạy khi user thay đổi hoặc component unmount
    // ──────────────────────────────────────────────────────────
    //
    // active = false: báo cho .then() đang chờ biết "đừng làm gì nữa"
    // cleanupSocketListener?.(): gọi socket.off() nếu đã đăng ký lắng nghe
    //   Cú pháp ?. (optional chaining): không lỗi nếu biến còn là null
    //
    return () => {
      active = false;
      cleanupSocketListener?.();
    };
  }, [user, setNotifs]);

  // ============================================================
  // ✅ CÁC HÀM HÀNH ĐỘNG (Actions)
  // ============================================================

  // ----------------------------------------------------------
  // markAllRead() – Đánh dấu ĐỌC TẤT CẢ thông báo
  // ----------------------------------------------------------
  // Chiến lược: Gọi API trước, rồi cập nhật UI khi API thành công.
  // (Ngược với markSingleRead dùng optimistic update – xem bên dưới)
  //
  // .map((n) => ({ ...n, isRead: true })):
  //   Tạo mảng MỚI: mỗi thông báo được copy ra ({...n}) rồi
  //   ghi đè isRead = true. KHÔNG sửa trực tiếp object gốc
  //   vì React cần object mới để nhận ra state đã thay đổi.
  //
  const markAllRead = () => {
    api("/notifications/read", { method: "PUT" })
      .then(() =>
        setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true }))),
      )
      .catch((err) => console.error("Lỗi đánh dấu đã đọc:", err));
  };

  // ----------------------------------------------------------
  // markSingleRead(id) – Đánh dấu đọc MỘT thông báo theo ID
  // ----------------------------------------------------------
  //
  // ⚡ Optimistic Update (Cập nhật lạc quan):
  //   Kỹ thuật UX quan trọng: Cập nhật UI NGAY LẬP TỨC mà KHÔNG
  //   chờ API xác nhận → trải nghiệm người dùng mượt mà hơn nhiều.
  //
  // Luồng:
  //   1. User click "Đã đọc"
  //   2. UI cập nhật ngay: notification chuyển sang đã đọc ✓
  //   3. API gọi trong nền...
  //      • Thành công → giữ nguyên (không cần làm gì thêm)
  //      • Thất bại   → Rollback: hoàn tác UI về trạng thái chưa đọc
  //
  // Tại sao cần rollback?
  //   Nếu API lỗi mà không rollback, UI nói "đã đọc" nhưng DB vẫn
  //   là "chưa đọc" → dữ liệu không nhất quán giữa client và server.
  //
  const markSingleRead = (id) => {
    // BƯỚC 1: Cập nhật lạc quan – UI thay đổi tức thì
    setNotifs((prev) =>
      // Với mỗi thông báo: nếu đúng ID cần đánh dấu → đổi isRead thành true
      //                    nếu ID khác → giữ nguyên không thay đổi
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );

    // BƯỚC 2: Gọi API cập nhật trên server
    api(`/notifications/${id}`, { method: "PATCH" }).catch((err) => {
      console.error("Lỗi đánh dấu đọc thông báo:", err);

      // BƯỚC 3 (chỉ khi lỗi): Rollback về trạng thái chưa đọc
      // Đây chính xác là thao tác ngược lại với BƯỚC 1.
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
      );
    });
    // Không có .then() vì: API thành công → không cần làm gì thêm,
    // UI đã đúng rồi nhờ optimistic update ở BƯỚC 1.
  };

  // ============================================================
  // 🔢 unreadCount – Đếm số thông báo chưa đọc
  // ============================================================
  //
  // .filter((n) => !n.isRead): Lọc chỉ lấy thông báo có isRead = false
  // .length: Đếm số phần tử sau khi lọc
  //
  // Ví dụ: notifs = [{isRead:true}, {isRead:false}, {isRead:false}]
  //   → unreadCount = 2
  //
  // Giá trị này tính lại mỗi khi notifs thay đổi, dùng để:
  //   • Hiển thị badge đỏ trên icon chuông: 🔔 2
  //   • Tab title: "(2) Cửa hàng hải sản"
  //
  const unreadCount = notifs.filter((n) => !n.isRead).length;

  // ============================================================
  // 📤 Trả về các giá trị và hàm cho component sử dụng
  // ============================================================
  //
  //  const { notifs, unreadCount, markAllRead, markSingleRead }
  //    = useNotifications(currentUser);
  //
  //  • notifs          → mảng thông báo, dùng để render danh sách
  //  • unreadCount     → số thông báo chưa đọc, dùng cho badge
  //  • markAllRead     → hàm, gắn vào nút "Đánh dấu tất cả đã đọc"
  //  • markSingleRead  → hàm, gắn vào từng item thông báo khi click
  //
  return { notifs, unreadCount, markAllRead, markSingleRead };
}

// ============================================================
// 💡 VÍ DỤ SỬ DỤNG TRONG COMPONENT
// ============================================================
//
//  function NotificationBell({ currentUser }) {
//    const { notifs, unreadCount, markAllRead, markSingleRead }
//      = useNotifications(currentUser);
//
//    return (
//      <div>
//        {/* Badge hiển thị số thông báo chưa đọc */}
//        <button>
//          🔔 {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
//        </button>
//
//        {/* Nút đánh dấu tất cả đã đọc */}
//        <button onClick={markAllRead}>Đánh dấu tất cả đã đọc</button>
//
//        {/* Danh sách thông báo */}
//        <ul>
//          {notifs.map((n) => (
//            <li
//              key={n.id}
//              style={{ fontWeight: n.isRead ? "normal" : "bold" }}
//              onClick={() => markSingleRead(n.id)}
//            >
//              {n.preview}
//            </li>
//          ))}
//        </ul>
//      </div>
//    );
//  }
//
// ============================================================
