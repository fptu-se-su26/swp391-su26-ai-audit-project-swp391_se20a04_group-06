/**
 * ============================================================
 * FILE: ToastContext.jsx
 * ============================================================
 *
 * 🎯 MỤC ĐÍCH:
 * File này xây dựng hệ thống "Thông báo nổi" (Toast Notification) —
 * những hộp thông báo nhỏ thường xuất hiện ở góc màn hình rồi
 * tự biến mất sau vài giây, ví dụ: "Lưu thành công!", "Lỗi mạng!".
 *
 * 💡 BẠN ĐÃ TỪNG THẤY TOAST Ở ĐÂU?
 * Khi bạn lưu một bài viết trên Facebook và thấy dòng chữ nhỏ
 * "Đã lưu" hiện ra rồi biến mất — đó chính là TOAST.
 *
 * ─────────────────────────────────────────────────────────────
 * 🔄 SO SÁNH VỚI AuthContext.jsx (đã học ở file trước):
 * ─────────────────────────────────────────────────────────────
 *
 * AuthContext lưu một OBJECT chứa nhiều thông tin:
 *   value = { user, setUser, logout, loading }
 *
 * ToastContext ở đây lưu TRỰC TIẾP MỘT HÀM (function) duy nhất:
 *   value = addToast   ← chỉ là 1 hàm, không phải object
 *
 * Đây là điểm khác biệt thú vị: Context KHÔNG BẮT BUỘC phải chứa
 * object — nó có thể chứa BẤT KỲ kiểu giá trị nào trong JavaScript:
 * string, number, function, array, object... miễn là bạn cần
 * "chia sẻ" giá trị đó cho nhiều component.
 *
 * Hàm "addToast" thật sự được định nghĩa ở ToastProvider.jsx
 * (không nằm trong file này) — file đó mới là nơi:
 *   • Lưu danh sách các toast đang hiển thị (state: toasts = [])
 *   • Định nghĩa addToast(msg, type) để thêm 1 toast mới vào danh sách
 *   • Tự động xoá toast sau X giây (setTimeout)
 *   • Render ra các hộp thông báo trên màn hình (UI thật)
 *
 * Còn file NÀY chỉ là "cổng giao tiếp" (interface) — định nghĩa
 * CÁCH các component khác GỌI ĐẾN addToast đó một cách tiện lợi.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// PHẦN 1: IMPORT
// ─────────────────────────────────────────────────────────────

/**
 * createContext: tạo "kênh phát" dữ liệu dùng chung toàn app
 * (đã giải thích chi tiết ở file AuthContext.jsx)
 *
 * useContext: hook để "bắt sóng" dữ liệu từ kênh phát đó
 */
import { createContext, useContext } from "react";

// ─────────────────────────────────────────────────────────────
// PHẦN 2: KHỞI TẠO CONTEXT
// ─────────────────────────────────────────────────────────────

/**
 * ToastContext — "Kênh phát" hàm addToast cho toàn ứng dụng.
 *
 * createContext(null):
 * Giá trị mặc định là null — ÁP DỤNG ĐÚNG KỸ THUẬT "Fail Fast"
 * đã học ở AuthContext.jsx: nếu component nào gọi useToast() mà
 * KHÔNG nằm trong <ToastProvider>, ta MUỐN phát hiện lỗi NGAY,
 * thay vì để app chạy "âm thầm sai" (gọi toast nhưng không có gì
 * hiện ra, không hiểu vì sao).
 *
 * export: để ToastProvider.jsx (không có trong đoạn code này)
 * có thể import ToastContext và dùng <ToastContext.Provider>
 * để "đặt" hàm addToast thật vào kênh phát này.
 */
export const ToastContext = createContext(null);

// ─────────────────────────────────────────────────────────────
// PHẦN 3: CUSTOM HOOK useToast
// ─────────────────────────────────────────────────────────────

/**
 * Custom Hook: useToast
 *
 * Đây là hook mà MỌI component trong app sẽ gọi để hiển thị
 * thông báo, ví dụ trong LoginPage.jsx:
 *
 *   const { success, error } = useToast();
 *
 *   async function handleLogin() {
 *     try {
 *       await api("/auth/login", {...});
 *       success("Đăng nhập thành công!");   // 🟢 hiện toast xanh
 *     } catch {
 *       error("Sai tài khoản hoặc mật khẩu"); // 🔴 hiện toast đỏ
 *     }
 *   }
 */
export function useToast() {
  // ── BƯỚC 1: Lấy hàm addToast từ Context ───────────────────
  /**
   * useContext(ToastContext) trả về GIÁ TRỊ mà <ToastContext.Provider
   * value={...}> gần nhất (ở ToastProvider.jsx) đang "phát" ra.
   *
   * Ở đây giá trị đó chính là HÀM addToast (không phải object),
   * nên ta đặt tên biến nhận về luôn là "addToast" cho dễ hiểu —
   * tên biến này KHÔNG nhất thiết phải giống tên gốc, chỉ là quy
   * ước đặt tên cho rõ nghĩa.
   *
   * Kết quả:
   *   • Nếu trong <ToastProvider>: addToast = function(msg, type) {...}
   *   • Nếu NGOÀI <ToastProvider>: addToast = null (giá trị mặc định)
   */
  const addToast = useContext(ToastContext);

  // ── BƯỚC 2: Bảo vệ — kiểm tra trước khi dùng ──────────────
  /**
   * Giống hệt nguyên lý "Guard Clause" đã học ở useAuth():
   * Nếu addToast là null (falsy) → nghĩa là không có ToastProvider
   * bao bọc bên ngoài → ném lỗi NGAY để developer biết và sửa,
   * thay vì để lỗi xảy ra mơ hồ kiểu "addToast is not a function"
   * ở một dòng code xa tận bên dưới (rất khó debug).
   *
   * THÔNG ĐIỆP LỖI RÕ RÀNG giúp developer sửa NGAY:
   * → Thêm <ToastProvider> bao quanh App ở App.jsx
   */
  if (!addToast) {
    throw new Error("useToast phải được dùng bên trong <ToastProvider>");
  }

  // ── BƯỚC 3: Trả về bộ "helper" tiện lợi ──────────────────
  /**
   * Đây là phần THÚ VỊ NHẤT của file này — một kỹ thuật thiết kế
   * gọi là "FACADE PATTERN" (Mẫu thiết kế Lớp Vỏ Bọc).
   *
   * 💡 FACADE PATTERN LÀ GÌ — HÌNH DUNG DỄ HIỂU:
   * Hãy nghĩ addToast(msg, type) giống như một CÁI MÁY PHA CHẾ
   * đa năng — bạn phải tự chọn "công thức" (type) mỗi lần dùng:
   *
   *   addToast("Lưu thành công!", "success")
   *   addToast("Có lỗi xảy ra!", "error")
   *   addToast("Cẩn thận nhé!", "warn")
   *
   * → Cách gọi này HOẠT ĐỘNG TỐT, nhưng dễ gõ SAI chính tả
   *   chuỗi "type" (lỡ gõ "succes" thiếu chữ "s" → toast không
   *   hiện màu xanh như mong đợi, mà JavaScript KHÔNG báo lỗi gì,
   *   vì đây chỉ là string thường, không phải hằng số được kiểm tra).
   *
   * GIẢI PHÁP: Tạo ra những "NÚT BẤM CÓ SẴN" cho từng loại thông
   * báo phổ biến — success(), error(), warn(), info() — để gọi
   * ngắn gọn hơn và TRÁNH ĐƯỢC lỗi gõ sai "type":
   *
   *   toast.success("Lưu thành công!")   ← rõ ràng, gọn, không lỗi
   *   toast.error("Có lỗi xảy ra!")
   *   toast.warn("Cẩn thận nhé!")
   *
   * Đây giống như việc thay vì phải tự pha "cà phê đen, không đường,
   * thêm chút sữa" mỗi lần (dễ pha sai công thức), quán cafe cho bạn
   * MỘT NÚT BẤM CÓ SẴN ghi rõ "Bạc xỉu" — bấm 1 lần, đúng công thức,
   * không cần nhớ chi tiết bên trong.
   */
  return {
    /**
     * toast(msg, type) — hàm "đa năng" gốc, vẫn giữ lại cho trường
     * hợp ĐẶC BIỆT cần truyền type LINH HOẠT theo biến (không cố
     * định trước, ví dụ: type lấy từ kết quả API trả về).
     *
     * Ví dụ dùng khi cần linh hoạt:
     *   const severity = response.level; // "warn" | "error" | ...
     *   toast(response.message, severity);
     */
    toast: (msg, type) => addToast(msg, type),

    /**
     * success(msg) — phiên bản "đóng sẵn" type = "success".
     * Người gọi KHÔNG cần biết/nhớ đến khái niệm "type" nữa,
     * chỉ cần gọi success("nội dung") là xong.
     *
     * (msg) => addToast(msg, "success")
     * ↑ Đây là ARROW FUNCTION — cú pháp ngắn gọn của function.
     * Tương đương với cách viết dài hơn:
     *   function success(msg) {
     *     return addToast(msg, "success");
     *   }
     */
    success: (msg) => addToast(msg, "success"),

    /** error(msg) — thông báo lỗi, type cố định = "error" (thường màu đỏ) */
    error: (msg) => addToast(msg, "error"),

    /** warn(msg) — thông báo cảnh báo, type cố định = "warn" (thường màu vàng/cam) */
    warn: (msg) => addToast(msg, "warn"),

    /** info(msg) — thông báo thông tin chung, type cố định = "info" (thường màu xanh lam) */
    info: (msg) => addToast(msg, "info"),
  };

  /**
   * 🤔 TẠI SAO KHÔNG ĐỂ TOASTPROVIDER TỰ TẠO SẴN success/error/warn/info
   * RỒI ĐƯA HẾT VÀO CONTEXT LUÔN, KHỎI CẦN "BỌC LẠI" Ở ĐÂY?
   *
   * Có thể làm vậy, nhưng cách hiện tại (Context chỉ giữ addToast,
   * còn các helper được TẠO MỚI mỗi lần useToast() chạy) có lợi ích:
   *
   *  1. TÁCH BIỆT TRÁCH NHIỆM (Separation of Concerns):
   *     ToastProvider chỉ cần lo phần "lõi" — LƯU & HIỂN THỊ toast.
   *     useToast lo phần "API tiện lợi" cho developer dùng.
   *     → Mỗi file một nhiệm vụ rõ ràng, dễ bảo trì.
   *
   *  2. DỄ THÊM HELPER MỚI VỀ SAU mà KHÔNG ĐỘNG ĐẾN ToastProvider:
   *     Muốn thêm loading() hay confirm() chỉ cần sửa file này,
   *     không cần sửa logic lưu trữ/hiển thị toast ở ToastProvider.
   */
}
