/**
 * ============================================================
 * FILE: AuthProvider.jsx
 * ============================================================
 *
 * 🎯 MỤC ĐÍCH:
 * Đây chính là "trái tim" của hệ thống xác thực — nơi THỰC SỰ
 * lưu trữ và quản lý thông tin đăng nhập của người dùng.
 *
 * Ở file AuthContext.jsx trước đó, chúng ta mới chỉ tạo ra
 * cái "kệ chứa đồ" (createContext) và "cách lấy đồ" (useAuth).
 * Còn file NÀY mới là nơi thực sự "ĐẶT ĐỒ LÊN KỆ" — tức là
 * cung cấp (provide) giá trị thật cho Context đó.
 *
 * 💡 HÌNH DUNG TOÀN CẢNH (3 file phối hợp với nhau):
 *
 *   AuthContext.jsx  →  Định nghĩa "cái kệ" và "cách lấy đồ từ kệ"
 *   AuthProvider.jsx →  Người ĐẶT ĐỒ lên kệ (file này)
 *   App.jsx          →  Người ĐẶT KỆ vào giữa phòng (bọc cả app)
 *
 * AuthProvider sẽ được dùng trong App.jsx như sau:
 *
 *   <AuthProvider>          ← "Đặt kệ vào phòng", chứa user/logout/loading
 *     <App />               ← Toàn bộ ứng dụng nằm BÊN TRONG kệ này
 *   </AuthProvider>
 *
 * Nhờ vậy, MỌI component trong <App /> đều có thể gọi useAuth()
 * để lấy thông tin user mà không cần truyền props qua nhiều tầng.
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
// PHẦN 1: IMPORT
// ─────────────────────────────────────────────────────────────

/**
 * useState     → Tạo và quản lý "biến trạng thái" (state) của component.
 *                Khi state thay đổi, React tự động render lại UI.
 *
 * useEffect    → Chạy code "có tác dụng phụ" (side effect) sau khi
 *                component render — ví dụ: gọi API, đăng ký event listener...
 *                Khác với code render thông thường, useEffect KHÔNG
 *                trả về JSX, nó chỉ "làm việc" ở phía sau.
 *
 * useCallback  → "Ghi nhớ" một hàm để không tạo lại mới mỗi lần render
 *                (đã giải thích chi tiết ở file useViewTransitionNavigate.js)
 */
import { useState, useEffect, useCallback } from "react";

/**
 * AuthContext — "cái kệ" đã được tạo sẵn ở file AuthContext.jsx.
 * File này sẽ dùng AuthContext.Provider để "đặt đồ" lên kệ đó.
 */
import { AuthContext } from "./AuthContext";

/**
 * api — module tiện ích gọi API dùng chung cho cả ứng dụng
 * (thường là một wrapper quanh fetch/axios, tự động gắn base URL,
 * xử lý lỗi chung, gắn token nếu cần...).
 *
 * Việc dùng module "api" chung thay vì gọi fetch() trực tiếp ở mỗi nơi
 * giúp code nhất quán hơn — giống nguyên tắc "proxy hook" đã học ở
 * file useVideoCall.js trước đó.
 */
import { api } from "../services/api";

/**
 * disconnectSocket — hàm chủ động ngắt kết nối WebSocket/socket.io
 * khi người dùng đăng xuất.
 *
 * TẠI SAO CẦN NGẮT SOCKET KHI LOGOUT?
 * Nếu không ngắt, socket vẫn "âm thầm" giữ kết nối với server dưới
 * danh tính user CŨ → có thể gây lỗi bảo mật (nhận tin nhắn/realtime
 * event của người khác) hoặc rò rỉ bộ nhớ (memory leak).
 */
import { disconnectSocket } from "../services/socket";

// ─────────────────────────────────────────────────────────────
// PHẦN 2: COMPONENT AuthProvider
// ─────────────────────────────────────────────────────────────

/**
 * AuthProvider — Component bao bọc (Wrapper Component)
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 *   "children" là PROP ĐẶC BIỆT trong React — nó đại diện cho
 *   TẤT CẢ những gì được đặt BÊN TRONG cặp thẻ mở/đóng của component
 *   khi sử dụng nó.
 *
 *   Ví dụ:
 *     <AuthProvider>
 *       <Router>           ← Toàn bộ phần này
 *         <App />          ← chính là "children"
 *       </Router>          ← được truyền vào AuthProvider
 *     </AuthProvider>
 *
 *   Đây là PATTERN "Wrapper Component" rất phổ biến trong React —
 *   component không quan tâm BÊN TRONG nó là gì, nó chỉ "bọc thêm"
 *   một lớp logic/dữ liệu rồi render children ra như bình thường.
 */
export function AuthProvider({ children }) {
  // ── STATE 1: Thông tin người dùng ─────────────────────────
  /**
   * user: lưu thông tin người đang đăng nhập.
   *
   * Giá trị có thể là:
   *   • null              → chưa đăng nhập / đã đăng xuất
   *   • { id, name, ... } → object thông tin user khi đã đăng nhập
   *
   * setUser: hàm dùng để CẬP NHẬT giá trị user.
   * Mỗi khi gọi setUser(...), React sẽ tự động render lại
   * TẤT CẢ component đang dùng useAuth() để lấy "user" này.
   */
  const [user, setUser] = useState(null);

  // ── STATE 2: Trạng thái đang kiểm tra phiên đăng nhập ─────
  /**
   * loading: TRUE trong lúc ứng dụng đang hỏi server "tôi đã đăng
   * nhập chưa?" (ngay khi tải trang lần đầu). Sau khi có câu trả
   * lời (có hoặc không có user), loading chuyển về FALSE.
   *
   * TẠI SAO CẦN BIẾN NÀY? — TRÁNH HIỆU ỨNG "NHÁY MÀN HÌNH LOGIN":
   *
   * Khi người dùng F5 lại trang, ban đầu React CHƯA BIẾT user
   * đã đăng nhập hay chưa (vì chưa kịp gọi API /auth/me xong).
   *
   * NẾU KHÔNG CÓ "loading" để chặn lại:
   *   1. Trang render lần đầu → user = null (giá trị khởi tạo)
   *   2. Component bảo vệ route thấy user = null → ĐIỀU HƯỚNG
   *      NGAY về trang /login (oan uổng! User THỰC RA đã đăng nhập)
   *   3. 0.5 giây sau, API /auth/me trả về → user thật được set
   *   4. Nhưng đã quá muộn — màn hình đã "nháy" qua trang login rồi
   *
   * CÓ "loading" để chặn lại:
   *   1. loading = true → hiển thị Spinner/Loading, CHƯA điều hướng gì cả
   *   2. Khi API trả về xong → loading = false
   *   3. Component bảo vệ route lúc này MỚI kiểm tra user
   *      → quyết định đúng: vào thẳng Dashboard nếu đã đăng nhập
   *
   * Mặc định ban đầu là TRUE vì NGAY khi component này được tạo ra,
   * chúng ta CHƯA gọi xong API kiểm tra — phải coi như "đang tải".
   */
  const [loading, setLoading] = useState(true);

  // ── EFFECT: Kiểm tra phiên đăng nhập khi tải trang ────────
  /**
   * useEffect với mảng dependency RỖNG [] nghĩa là:
   * "Chỉ chạy DUY NHẤT MỘT LẦN, ngay sau khi component này được
   * render lần đầu tiên (mount), không chạy lại dù component có
   * re-render bao nhiêu lần sau đó."
   *
   * Đây là nơi lý tưởng để làm việc "khởi tạo dữ liệu ban đầu"
   * như: kiểm tra session, lấy cấu hình app, đăng ký event...
   */
  useEffect(() => {
    /**
     * AbortController — "Công cụ huỷ bỏ yêu cầu đang chạy"
     *
     * 🐛 VẤN ĐỀ MÀ AbortController GIẢI QUYẾT — "RACE CONDITION":
     *
     * Hãy tưởng tượng tình huống sau (KHÔNG có AbortController):
     *
     *   1. User vào trang Login → component AuthProvider mount
     *      → useEffect bắt đầu gọi api("/auth/me")
     *      → Request này đi qua mạng, MẤT 2 GIÂY mới có phản hồi
     *
     *   2. Trong lúc đang chờ (1 giây sau), user bấm nút Back,
     *      rời khỏi trang → component AuthProvider bị UNMOUNT
     *      (gỡ khỏi cây DOM, không còn tồn tại nữa)
     *
     *   3. 1 giây sau nữa, API /auth/me CUỐI CÙNG cũng trả về
     *      → code chạy setUser(...) ← NHƯNG COMPONENT ĐÃ BIẾN MẤT!
     *
     *   → React cảnh báo lỗi: "Can't perform a React state update
     *     on an unmounted component" (memory leak warning)
     *   → Tệ hơn: nếu app đã chuyển sang "phiên" khác (user khác
     *     đăng nhập), dữ liệu cũ trả về muộn có thể GHI ĐÈ NHẦM
     *     lên state hiện tại → BUG dữ liệu sai người dùng!
     *
     * GIẢI PHÁP — DÙNG AbortController:
     *
     *   • new AbortController() tạo ra một "công cụ huỷ" có 2 phần:
     *       - controller.signal  → "tín hiệu" gửi kèm request
     *       - controller.abort() → "nút bấm" để huỷ request đó
     *
     *   • Khi gọi api("/auth/me", { signal: controller.signal }),
     *     ta đang "gắn dây" giữa request và công cụ huỷ này.
     *
     *   • Nếu component unmount TRƯỚC KHI api trả lời xong,
     *     React sẽ tự gọi hàm cleanup (return ở cuối useEffect)
     *     → controller.abort() được gọi → request bị huỷ giữa đường
     *     → .catch() nhận lỗi có tên "AbortError" → code BỎ QUA lỗi này
     *     → KHÔNG có setUser/setLoading nào chạy trên component đã chết
     *
     * 💡 HÌNH DUNG: AbortController giống như một "sợi dây diều" —
     * nếu bạn (component) phải rời đi giữa đường, bạn giật dây để
     * "thu hồi" con diều (request) lại, không để nó bay lung tung
     * rồi rơi trúng ai đó (gây lỗi ở nơi không còn liên quan).
     */
    const controller = new AbortController();

    /**
     * Gọi API GET '/auth/me' — endpoint thường dùng để hỏi server:
     * "Cookie/token mà trình duyệt đang gửi kèm có hợp lệ không?
     *  Nếu có, tài khoản đó là ai?"
     *
     * Vì request này dùng cookie phiên làm việc (session cookie) có
     * sẵn trong trình duyệt, ta KHÔNG cần tự truyền email/password —
     * server tự đọc cookie và trả về thông tin user tương ứng.
     *
     * { signal: controller.signal } — gắn "sợi dây diều" vào request này.
     *
     * api(...) trả về một PROMISE — vì vậy ta dùng .then/.catch/.finally
     * (cách viết "truyền thống" thay cho async/await, cũng hợp lệ
     * và phù hợp khi không cần dùng try/catch/finally lồng nhiều cấp).
     */
    api("/auth/me", { signal: controller.signal })
      // ── TRƯỜNG HỢP THÀNH CÔNG ─────────────────────────────
      .then((u) => {
        /**
         * "u" là dữ liệu user mà server trả về (nếu hợp lệ).
         *
         * Kiểm tra "!controller.signal.aborted" trước khi setUser:
         * Đây là LỚP BẢO VỆ THỨ HAI (phòng hờ) — đảm bảo dù request
         * có lỡ hoàn thành ĐÚNG NGAY LÚC component unmount (trường
         * hợp hiếm, do race condition cực nhỏ), ta vẫn không setState
         * trên component đã "chết".
         */
        if (!controller.signal.aborted) {
          /**
           * u ?? null — TOÁN TỬ NULLISH COALESCING (??):
           * Trả về "u" nếu u KHÁC null và KHÁC undefined.
           * Nếu u là null hoặc undefined → trả về null thay thế.
           *
           * TẠI SAO KHÔNG VIẾT THẲNG setUser(u)?
           * Để đảm bảo state "user" LUÔN LUÔN chỉ là 1 trong 2 dạng:
           * object hợp lệ HOẶC null — không bao giờ là undefined.
           * Điều này giúp các component khác kiểm tra dễ dàng và
           * nhất quán hơn: if (user) {...} else {...}
           */
          setUser(u ?? null);
        }
      })
      // ── TRƯỜNG HỢP CÓ LỖI ─────────────────────────────────
      .catch((e) => {
        /**
         * e?.name !== "AbortError":
         *
         * "?." là OPTIONAL CHAINING — nếu "e" là null/undefined,
         * biểu thức sẽ trả về undefined NGAY mà không bị crash
         * (thay vì cố đọc .name trên giá trị null → lỗi runtime).
         *
         * Khi ta TỰ CHỦ ĐỘNG abort() request (vì component unmount),
         * Promise sẽ reject với một lỗi có name = "AbortError".
         * Đây là lỗi "VÔ HẠI" — không phải lỗi mạng/server thật,
         * mà CHÍNH chúng ta tạo ra khi huỷ request → nên cần BỎ QUA,
         * không coi đó là "đăng nhập thất bại".
         *
         * Nếu là LỖI THẬT (vd: mất mạng, server lỗi 500, session
         * hết hạn → server trả 401 Unauthorized...) và component
         * vẫn còn tồn tại (chưa bị abort) → coi như user CHƯA đăng
         * nhập, set về null để hiển thị giao diện khách (guest).
         */
        if (e?.name !== "AbortError" && !controller.signal.aborted) {
          setUser(null);
        }
      })
      // ── LUÔN LUÔN CHẠY (DÙ THÀNH CÔNG HAY LỖI) ───────────
      .finally(() => {
        /**
         * .finally() chạy SAU CÙNG, bất kể .then() hay .catch()
         * đã xảy ra — giống như khối "finally" trong try/catch/finally.
         *
         * Tắt loading TRỪ KHI request đã bị abort (component đã unmount,
         * không còn ý nghĩa gì để cập nhật state nữa).
         *
         * Đây là bước QUAN TRỌNG để màn hình Loading/Spinner biến mất,
         * cho dù kết quả là "có user" hay "không có user".
         */
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    /**
     * CLEANUP FUNCTION của useEffect — đây là hàm được return ra.
     *
     * React sẽ TỰ ĐỘNG gọi hàm này trong 2 trường hợp:
     *   1. Component bị UNMOUNT (rời khỏi màn hình, ví dụ chuyển trang)
     *   2. (Không áp dụng ở đây vì deps=[], nhưng về lý thuyết):
     *      Trước khi effect chạy LẠI lần kế tiếp do dependency đổi
     *
     * controller.abort() → kích hoạt "huỷ request" như giải thích ở trên.
     * Đây CHÍNH LÀ cơ chế ngăn chặn race condition đã mô tả phía trên.
     */
    return () => {
      controller.abort();
    };
  }, []); // ← Mảng dependency rỗng: effect này CHỈ chạy 1 lần khi mount

  // ── HÀM: Đăng xuất ─────────────────────────────────────────
  /**
   * logout — Hàm xử lý đăng xuất, được bọc trong useCallback để
   * GIỮ NGUYÊN tham chiếu hàm giữa các lần render (không tạo hàm
   * mới mỗi lần AuthProvider re-render).
   *
   * TẠI SAO ĐIỀU NÀY QUAN TRỌNG Ở ĐÂY?
   * Vì "logout" sẽ được đưa vào object "value" truyền xuống Context.
   * Nếu logout bị tạo MỚI mỗi lần render, "value" cũng bị coi là
   * "thay đổi" mỗi lần → TẤT CẢ component dùng useAuth() sẽ
   * re-render KHÔNG CẦN THIẾT, gây lãng phí hiệu năng trong app lớn.
   */
  const logout = useCallback(async () => {
    try {
      /**
       * Gọi API POST '/auth/logout' để YÊU CẦU SERVER xoá cookie
       * phiên làm việc (session) ở phía server.
       *
       * TẠI SAO PHẢI GỌI SERVER, KHÔNG CHỈ XOÁ Ở CLIENT?
       * Vì cookie phiên thường là HttpOnly (JavaScript phía client
       * KHÔNG đọc/xoá được trực tiếp vì lý do bảo mật chống XSS).
       * Chỉ có SERVER mới có quyền xoá cookie đó thật sự.
       */
      await api("/auth/logout", { method: "POST" });
    } catch {
      /**
       * Khối catch RỖNG (không có biến lỗi, không xử lý gì) —
       * đây là lựa chọn CÓ CHỦ ĐÍCH: dù API logout có lỗi (mất mạng,
       * server quá tải...), ta vẫn MUỐN người dùng được "đăng xuất"
       * ở phía client ngay lập tức (trải nghiệm tốt hơn là báo lỗi
       * và giữ họ "mắc kẹt" ở trạng thái đăng nhập).
       *
       * Trường hợp thực tế: cookie có thời gian hết hạn riêng, nên
       * dù request logout thất bại, session cũ rồi cũng tự hết hạn.
       */
    }

    /**
     * Ngắt kết nối socket real-time NGAY SAU KHI gọi API logout
     * (hoặc dù API đó lỗi) — đảm bảo không còn nhận dữ liệu realtime
     * dưới danh tính user cũ nữa.
     */
    disconnectSocket();

    /**
     * Đặt user về null → MỌI component dùng useAuth() sẽ NGAY LẬP TỨC
     * thấy user = null → tự động re-render thành giao diện "khách"
     * (ví dụ: ẩn nút "Hồ sơ cá nhân", hiện nút "Đăng nhập").
     */
    setUser(null);
  }, []); // Mảng dependency rỗng vì hàm không đọc state/props nào khác bên ngoài

  // ── ĐÓNG GÓI GIÁ TRỊ ĐỂ "PHÁT" RA CONTEXT ──────────────────
  /**
   * value — object chứa TẤT CẢ những gì các component con có thể
   * lấy được thông qua useAuth(). Đây chính là "món đồ" được đặt
   * lên "kệ chứa" (AuthContext) đã tạo ở file AuthContext.jsx.
   *
   * { user, setUser, logout, loading }
   *
   *   • user     → thông tin người dùng hiện tại (hoặc null)
   *   • setUser  → CHO PHÉP component khác (ví dụ trang Login)
   *                tự cập nhật user SAU KHI đăng nhập thành công,
   *                mà không cần gọi lại API /auth/me.
   *                Ví dụ trong LoginPage.jsx:
   *                  const { setUser } = useAuth();
   *                  const userData = await api("/auth/login", {...});
   *                  setUser(userData); // cập nhật ngay, không cần F5
   *   • logout   → hàm đăng xuất đã định nghĩa ở trên
   *   • loading  → cho component cha (ví dụ App.jsx hoặc PrivateRoute)
   *                biết để hiển thị Spinner trong lúc đang kiểm tra
   *                phiên đăng nhập ban đầu
   *
   * ⚠️ LƯU Ý NHỎ VỀ HIỆU NĂNG (nâng cao, không bắt buộc với người mới):
   * Object "value" này được tạo MỚI mỗi lần AuthProvider render
   * (vì đây là object literal viết trực tiếp, không bọc useMemo).
   * Với ứng dụng nhỏ/vừa, điều này KHÔNG đáng lo. Với ứng dụng lớn,
   * có thể bọc thêm useMemo(() => ({ user, setUser, logout, loading }),
   * [user, loading, logout]) để tránh re-render thừa cho các component
   * con dùng useAuth() khi AuthProvider render lại vì lý do khác.
   */
  const value = { user, setUser, logout, loading };

  // ── RENDER: "Phát sóng" giá trị xuống toàn bộ children ────
  /**
   * <AuthContext.Provider value={value}>
   *
   * Đây là cú pháp ĐẶC BIỆT của Context API — mọi Context được tạo
   * bằng createContext() đều có sẵn một component con tên ".Provider".
   *
   * Component Provider này có NHIỆM VỤ DUY NHẤT: lấy prop "value"
   * và "phát" nó xuống cho TẤT CẢ component cháu/chắt (con của con...)
   * nằm bên trong {children}, bất kể chúng nằm sâu bao nhiêu tầng.
   *
   * {children} — render lại nguyên vẹn những gì được truyền vào
   * AuthProvider khi sử dụng nó (đã giải thích ở phần "PHẦN 2" trên).
   *
   * KẾT QUẢ CUỐI CÙNG:
   * Bất kỳ component nào nằm trong {children} (dù cách bao nhiêu
   * tầng component cha) chỉ cần gọi useAuth() là LẤY NGAY được
   * { user, setUser, logout, loading } — không cần truyền props
   * qua từng cấp trung gian.
   */
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
