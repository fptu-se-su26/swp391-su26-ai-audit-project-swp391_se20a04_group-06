/**
 * ============================================================
 * FILE: useVideoCall.js
 * ============================================================
 *
 * 🎯 MỤC ĐÍCH CỦA FILE NÀY:
 * File này là một "Proxy Hook" — tức là một hook trung gian,
 * bản thân nó KHÔNG chứa logic nào, chỉ đơn giản "chuyển tiếp"
 * lời gọi đến hook thật ở nơi khác.
 *
 * 💡 HÌNH DUNG DỄ HIỂU:
 * Giống như một ổ CẮM ĐIỆN NỐI DÀI — bản thân nó không tạo ra điện,
 * chỉ giúp nhiều thiết bị ở xa ổ điện gốc vẫn dùng được CÙNG một
 * nguồn điện, thay vì mỗi thiết bị phải tự kéo dây về tận nguồn.
 *
 *   VideoCallContext.jsx   ←── nguồn điện gốc (chứa toàn bộ logic WebRTC)
 *         │
 *   useVideoCall.js        ←── ổ cắm nối dài (file này)
 *         │
 *   ChatBox.jsx            ←── thiết bị sử dụng
 *   HomePage.jsx           ←── thiết bị sử dụng
 *   Dashboard.jsx          ←── thiết bị sử dụng
 *
 * 🐛 VẤN ĐỀ MÀ FILE NÀY GIẢI QUYẾT — LỖI "MÀN HÌNH ĐEN 1 PHÍA":
 *
 * Trước khi có file này, mỗi component tự tạo kết nối WebRTC riêng:
 *
 *   ChatBox.jsx     → tự kết nối WebRTC → có stream camera riêng
 *   HomePage.jsx    → tự kết nối WebRTC → có stream camera riêng
 *   Dashboard.jsx   → tự kết nối WebRTC → có stream camera riêng
 *
 * Hậu quả: Khi điều hướng từ ChatBox → HomePage, component ChatBox bị
 * "unmount" (gỡ khỏi DOM), WebRTC của nó bị huỷ → phía kia thấy màn hình đen.
 * Đồng thời HomePage khởi tạo WebRTC mới → 2 kết nối chồng chéo → xung đột.
 *
 * Sau khi có VideoCallProvider + file proxy này:
 *
 *   ChatBox.jsx     ──┐
 *   HomePage.jsx    ──┼──→ useVideoCall.js → VideoCallContext (DUY NHẤT)
 *   Dashboard.jsx   ──┘
 *
 * Chỉ còn MỘT kết nối WebRTC tồn tại suốt vòng đời ứng dụng,
 * không bị gián đoạn khi chuyển trang → màn hình không còn đen nữa.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// PHẦN 1: IMPORT
// ─────────────────────────────────────────────────────────────

/**
 * Nhập hook useVideoCall từ VideoCallContext — nơi chứa TOÀN BỘ logic thật:
 *  • Quản lý kết nối WebRTC (peer-to-peer, ICE candidates, SDP offer/answer...)
 *  • Quản lý stream camera/microphone (getUserMedia)
 *  • Trạng thái cuộc gọi: đang gọi / đang đổ chuông / đang kết nối / đã kết nối
 *  • Các hàm điều khiển: bắt đầu gọi, chấp nhận, từ chối, kết thúc
 *
 * Chúng ta đổi tên thành "useGlobalVideoCall" khi import để:
 *  1. Tránh trùng tên với hàm mà chúng ta sắp khai báo bên dưới
 *     (cả 2 đều có tên useVideoCall → JavaScript sẽ bị nhầm lẫn)
 *  2. Làm rõ ý nghĩa: đây là hook "toàn cục" (global), khác với
 *     hook "proxy" cục bộ mà file này export ra
 *
 * Cú pháp "import { A as B }" nghĩa là:
 *   "Nhập thứ tên A từ module đó, nhưng đặt tên nó là B trong file này"
 */
import { useVideoCall as useGlobalVideoCall } from "../context/VideoCallContext";

// ─────────────────────────────────────────────────────────────
// PHẦN 2: KHAI BÁO PROXY HOOK
// ─────────────────────────────────────────────────────────────

/**
 * Custom Hook: useVideoCall (Proxy / Re-export)
 *
 * ĐÂY LÀ HOOK MÀ CÁC COMPONENT TRONG DỰ ÁN SẼ GỌI.
 * Nó đóng vai trò "người trung gian" — nhận yêu cầu từ component
 * và chuyển thẳng đến hook toàn cục mà không thay đổi gì.
 *
 * ─────────────────────────────────────────────────────────────
 * TẠI SAO KHÔNG IMPORT THẲNG useGlobalVideoCall VÀO COMPONENT?
 * ─────────────────────────────────────────────────────────────
 *
 * CÓ THỂ import thẳng, nhưng dùng proxy hook mang lại nhiều lợi ích:
 *
 * LỢI ÍCH 1 — TỪ CHỐI PHỤ THUỘC TRỰC TIẾP (Decoupling):
 *   Các component chỉ biết đến useVideoCall từ hooks/useVideoCall.js.
 *   Nếu mai này bạn đổi thư viện, chuyển từ VideoCallContext sang
 *   một giải pháp khác (ví dụ: LiveKit, Agora SDK...), bạn chỉ cần
 *   sửa file này — KHÔNG cần tìm và sửa tất cả component đang dùng.
 *
 *   TRƯỚC (phụ thuộc trực tiếp — dễ vỡ):
 *     ChatBox.jsx     → import từ "../context/VideoCallContext"
 *     HomePage.jsx    → import từ "../context/VideoCallContext"
 *     Dashboard.jsx   → import từ "../context/VideoCallContext"
 *     ↑ Đổi context → phải sửa CẢ 3 file
 *
 *   SAU (qua proxy — linh hoạt):
 *     ChatBox.jsx     → import từ "../hooks/useVideoCall"
 *     HomePage.jsx    → import từ "../hooks/useVideoCall"
 *     Dashboard.jsx   → import từ "../hooks/useVideoCall"
 *     ↑ Đổi context → chỉ sửa file proxy này, 3 component không đổi gì
 *
 * LỢI ÍCH 2 — DỄ MỞ RỘNG (Extensibility):
 *   Về sau muốn thêm logic trước/sau khi gọi video call (logging, analytics,
 *   kiểm tra quyền...), chỉ cần thêm vào file proxy này:
 *
 *   export function useVideoCall() {
 *     const result = useGlobalVideoCall();
 *     useEffect(() => {
 *       analytics.track("video_call_hook_used"); // thêm vào sau này
 *     }, []);
 *     return result;
 *   }
 *
 * LỢI ÍCH 3 — NHẤT QUÁN TRONG DỰ ÁN (Consistency):
 *   Tất cả developer trong team đều import từ cùng một chỗ.
 *   Ít nhầm lẫn, ít lỗi "import nhầm context" hơn.
 *
 * LỢI ÍCH 4 — DỄ MOCK KHI TEST:
 *   Khi viết unit test, bạn có thể mock (giả lập) đúng một file
 *   thay vì mock cả Context — giúp test nhanh và đơn giản hơn.
 */
export function useVideoCall() {
  /**
   * Gọi hook toàn cục và trả về NGUYÊN VẸN kết quả của nó.
   *
   * useGlobalVideoCall() trả về một object chứa mọi thứ component cần,
   * ví dụ (tuỳ cách VideoCallContext định nghĩa):
   * {
   *   localStream,        // Stream video/audio từ camera/mic của mình
   *   remoteStream,       // Stream video/audio từ camera/mic của đối phương
   *   callStatus,         // "idle" | "calling" | "ringing" | "connected"
   *   startCall,          // hàm: bắt đầu gọi cho người khác
   *   acceptCall,         // hàm: chấp nhận cuộc gọi đến
   *   rejectCall,         // hàm: từ chối cuộc gọi đến
   *   endCall,            // hàm: kết thúc cuộc gọi
   *   toggleMute,         // hàm: bật/tắt microphone
   *   toggleCamera,       // hàm: bật/tắt camera
   * }
   *
   * Component sử dụng sẽ destructure những gì cần:
   *   const { localStream, startCall, endCall } = useVideoCall();
   */
  return useGlobalVideoCall();
}
