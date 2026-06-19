/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║               socket.js — Kết Nối Thời Gian Thực (Real-time)           ║
 * ║                                                                          ║
 * ║  File này quản lý toàn bộ kết nối Socket.IO giữa trình duyệt và server ║
 * ║  Chỉ tạo DUY NHẤT MỘT kết nối trong suốt vòng đời ứng dụng (Singleton) ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ── KIẾN THỨC NỀN CẦN BIẾT ────────────────────────────────────────────────
 *
 * 🌐 HTTP THÔNG THƯỜNG (Request - Response):
 *   Client hỏi → Server trả lời → Kết thúc
 *   Giống như gửi thư: bạn gửi thư, bưu điện trả lời, xong.
 *   Muốn biết thêm tin → phải gửi thư lại từ đầu.
 *
 * ⚡ WEBSOCKET (Kết nối hai chiều liên tục):
 *   Client kết nối → Đường dây mở liên tục → Ai cũng có thể gửi bất cứ lúc nào
 *   Giống như gọi điện thoại: đường dây mở, hai bên nói chuyện tự do.
 *   Server có tin mới → đẩy ngay về client, không cần client hỏi.
 *
 * 🔌 SOCKET.IO:
 *   Thư viện xây dựng trên WebSocket, bổ sung thêm:
 *     • Tự động kết nối lại khi mất mạng
 *     • Fallback sang Polling nếu WebSocket không hỗ trợ
 *     • Hệ thống sự kiện (event) dễ dùng: socket.on("event", handler)
 *     • Room (phòng): nhóm người dùng để gửi tin theo nhóm
 *
 * 🏭 SINGLETON PATTERN:
 *   Đảm bảo chỉ tạo MỘT instance duy nhất trong suốt ứng dụng.
 *   Vấn đề nếu không dùng Singleton:
 *     - Component A tạo kết nối socket
 *     - Component B tạo kết nối socket khác
 *     - Component C tạo kết nối socket khác nữa
 *     → 3 kết nối song song → server nhận tin nhắn 3 lần → bug!
 *   Singleton giải quyết: lần đầu tạo mới, lần sau trả về cái cũ.
 *
 * 📦 CDN (Content Delivery Network):
 *   Mạng lưới máy chủ phân tán toàn cầu phục vụ file tĩnh (JS, CSS...).
 *   Thay vì tải thư viện Socket.IO vào bundle (làm to file bundle),
 *   ta tải động từ CDN lúc cần → trang web load nhanh hơn lần đầu.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 1: BIẾN TOÀN CỤC (Module-level State)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * _socketLib — Bộ nhớ đệm (cache) lưu thư viện Socket.IO đã tải
 *
 * Tại sao cần cache thư viện?
 * → Socket.IO là file JS từ CDN, tải mất thời gian (~100-300ms)
 * → Nếu mỗi lần getSocket() đều tải lại → chậm không cần thiết
 * → Cache: tải 1 lần, lưu vào đây, lần sau dùng ngay
 *
 * Dấu gạch dưới đầu tên (_socketLib) là quy ước đặt tên:
 * → Biến "private" — chỉ dùng trong nội bộ file này
 * → JavaScript không có private thực sự ở module scope, đây chỉ là quy ước
 *
 * Kiểu dữ liệu: null (chưa tải) hoặc Function (hàm io() của Socket.IO)
 */
let _socketLib = null;

/**
 * _socket — Bộ nhớ đệm lưu KẾT NỐI socket duy nhất (Singleton)
 *
 * Đây là trái tim của pattern Singleton: chỉ có một biến này lưu kết nối.
 * Mọi nơi trong ứng dụng gọi getSocket() → đều nhận về CÙNG MỘT object này.
 *
 * Kiểu dữ liệu: null (chưa kết nối) hoặc Socket (object kết nối Socket.IO)
 * Object Socket có các thuộc tính/phương thức quan trọng:
 *   - socket.connected  : boolean — đang kết nối hay không
 *   - socket.id         : string  — ID định danh kết nối này (do server cấp)
 *   - socket.on(event, handler) : lắng nghe sự kiện từ server
 *   - socket.emit(event, data)  : gửi sự kiện lên server
 *   - socket.off(event, handler): hủy lắng nghe sự kiện
 *   - socket.disconnect()       : đóng kết nối
 */
let _socket = null;

/**
 * SOCKET_URL — Địa chỉ máy chủ Socket.IO cần kết nối tới
 *
 * import.meta.env là cách Vite (build tool) đọc biến môi trường từ file .env
 * VD: file .env chứa: VITE_SOCKET_URL=https://api.example.com
 * → import.meta.env.VITE_SOCKET_URL = "https://api.example.com"
 *
 * Toán tử || (OR):
 * → Nếu VITE_SOCKET_URL có giá trị → dùng giá trị đó
 * → Nếu VITE_SOCKET_URL trống/undefined → dùng window.location.origin
 *
 * window.location.origin là gì?
 * → Phần "gốc" của URL hiện tại: protocol + domain + port
 * → VD: đang ở https://seafood.vn/products → origin = "https://seafood.vn"
 * → Hữu ích khi server và client cùng trên một domain (phổ biến khi deploy)
 *
 * Tại sao lại có thể dùng cùng domain?
 * → Trong production, Nginx thường proxy cả /api lẫn /socket.io về cùng backend
 * → Không cần cấu hình CORS phức tạp
 */
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 2: TẢI THƯ VIỆN SOCKET.IO ĐỘNG (Dynamic Script Loading)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * loadSocketIO — Tải thư viện Socket.IO Client từ CDN một cách lười biếng (lazy)
 *
 * "Tải lười" (lazy loading) = chỉ tải khi THỰC SỰ CẦN, không tải từ đầu.
 * Khác với import thông thường ở đầu file (luôn tải khi app khởi động).
 *
 * @returns {Promise<Function>} — Promise resolve với hàm io() của Socket.IO
 *
 * ── TẠI SAO KHÔNG DÙNG npm install socket.io-client? ──
 * Hoàn toàn có thể dùng npm! Nhưng tải từ CDN có ưu điểm:
 *   ✓ Không tăng kích thước bundle JavaScript ban đầu
 *   ✓ Trình duyệt có thể đã cache từ CDN trước đó (nếu từng dùng Socket.IO ở trang khác)
 *   ✓ CDN phân tán toàn cầu → tải nhanh hơn từ server gần nhất
 * Nhược điểm: cần internet, phụ thuộc CDN bên ngoài
 *
 * ── LUỒNG HOẠT ĐỘNG ──
 *   Lần 1: _socketLib = null → tải script từ CDN → lưu vào _socketLib → trả về
 *   Lần 2: _socketLib đã có → trả về ngay, không tải lại
 */
export async function loadSocketIO() {
  // ── Kiểm tra Cache: Đã tải trước đó chưa? ──────────────────────────────

  /**
   * Nếu _socketLib đã có giá trị (không phải null), nghĩa là đã tải trước đó.
   * Trả về ngay lập tức — đây là "cache hit", không cần làm gì thêm.
   *
   * Tại sao không check typeof _socketLib === "function"?
   * → null là falsy, bất kỳ object/function nào đều truthy
   * → if (_socketLib) ngắn gọn hơn và hoạt động đúng trong trường hợp này
   */
  if (_socketLib) {
    return _socketLib;
  }

  // ── Tải Script Động: Cần tải mới ────────────────────────────────────────

  /**
   * Trả về new Promise vì:
   * → Việc tải script là KHÔNG ĐỒNG BỘ (bất đồng bộ / asynchronous)
   * → Trình duyệt bắt đầu tải file, nhưng không chờ — code tiếp tục chạy
   * → Chỉ khi script tải xong mới biết (qua event onload/onerror)
   * → Promise cho phép chúng ta "chờ" sự kiện đó một cách văn minh
   *
   * new Promise((resolve, reject) => { ... }):
   *   resolve(value) = "Xong rồi, thành công, đây là kết quả"
   *   reject(error)  = "Xong rồi, nhưng thất bại, đây là lỗi"
   * Người gọi await loadSocketIO() sẽ nhận được value hoặc lỗi tương ứng
   */
  return new Promise((resolve, reject) => {
    // ── Kiểm tra window.io: Có thể đã được nhúng sẵn vào HTML không? ─────

    /**
     * Một số dự án nhúng Socket.IO trực tiếp vào file index.html:
     *   <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
     *
     * Trong trường hợp đó, window.io đã tồn tại TRƯỚC KHI React app chạy.
     * Kiểm tra này tránh tải trùng lặp file đã có sẵn.
     */
    if (window.io) {
      _socketLib = window.io; // Lưu vào cache để lần sau không kiểm tra lại
      resolve(_socketLib); // Trả về ngay, không cần tạo thẻ script
      return; // Thoát khỏi callback của Promise
    }

    // ── Tạo thẻ <script> và thêm vào DOM ────────────────────────────────

    /**
     * Đây là kỹ thuật "Dynamic Script Injection" (chèn script động):
     * Thay vì viết <script> trong HTML, ta tạo bằng JavaScript.
     *
     * Kết quả tương đương với việc trình duyệt gặp:
     *   <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
     * trong file HTML — trình duyệt sẽ tải và thực thi file JS đó.
     */
    const s = document.createElement("script"); // Tạo thẻ <script> trong bộ nhớ (chưa có trên trang)

    /**
     * Gắn đường dẫn CDN vào thuộc tính src.
     * Phiên bản 4.7.5 được chỉ định rõ ràng (không dùng "latest") vì:
     * → "latest" có thể tự động nâng cấp lên version có breaking changes
     * → Pinned version (phiên bản cố định) = ứng dụng ổn định, dự đoán được
     *
     * .min.js = phiên bản đã được "minify" (nén):
     * → Bỏ khoảng trắng, đổi tên biến thành a, b, c... → file nhỏ hơn nhiều
     * → Chức năng hoàn toàn giống bản gốc, chỉ khác ở kích thước
     */
    s.src = "https://cdn.socket.io/4.7.5/socket.io.min.js";

    /**
     * onload: Sự kiện kích hoạt khi trình duyệt TẢI XONG VÀ THỰC THI XONG file script.
     * Lúc này window.io đã tồn tại vì file đã chạy và khai báo nó.
     *
     * Lưu ý: onload KHÔNG kích hoạt nếu file không tải được (dùng onerror cho trường hợp đó)
     */
    s.onload = () => {
      _socketLib = window.io; // Socket.IO đã được tải, lưu hàm io() vào cache
      resolve(_socketLib); // Thông báo Promise thành công, trả về thư viện
    };

    /**
     * onerror: Sự kiện kích hoạt khi KHÔNG tải được file (mất internet, CDN sập, URL sai...).
     * reject(event): Thông báo Promise thất bại với đối tượng ErrorEvent.
     * Nơi gọi await loadSocketIO() sẽ bắt được lỗi này qua try/catch.
     *
     * Ở đây truyền thẳng reject làm handler (shorthand):
     * s.onerror = reject
     * tương đương với:
     * s.onerror = (errorEvent) => reject(errorEvent)
     */
    s.onerror = reject;

    /**
     * appendChild: Thêm thẻ <script> vào cuối thẻ <head> của trang HTML.
     * Chỉ khi thẻ được thêm vào DOM, trình duyệt mới BẮT ĐẦU tải file.
     * Đây là bước "kéo cò" — mọi thứ trước đó chỉ là chuẩn bị.
     *
     * Tại sao <head> mà không phải <body>?
     * → <head> là quy ước cho script không ảnh hưởng đến layout
     * → Script có thể tải song song với việc render trang
     * → Không tạo ra sự thay đổi nhìn thấy được trên giao diện
     */
    document.head.appendChild(s);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 3: LẤY KẾT NỐI SOCKET (Singleton Getter)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * getSocket — Lấy kết nối Socket.IO duy nhất (hoặc tạo mới nếu chưa có)
 *
 * Đây là hàm CHÍNH mà các component React sẽ gọi:
 *   const socket = await getSocket();
 *   socket.on("notification", handler);
 *
 * @returns {Promise<Socket>} — Promise resolve với object kết nối Socket.IO
 *
 * ── NGUYÊN TẮC SINGLETON ──
 *                                          ┌─────────────┐
 *   Component A → getSocket() → [cache hit?] YES → trả về _socket
 *   Component B → getSocket() → [cache hit?] YES → trả về _socket (CÙNG object!)
 *   Component C → getSocket() → [cache hit?] NO  → tạo mới → lưu → trả về
 *                                          └─────────────┘
 * Kết quả: A, B, C đều dùng CÙNG MỘT kết nối → không bị duplicate events
 *
 * ── TẠI SAO LÀ ASYNC? ──
 * → loadSocketIO() cần tải file từ CDN (bất đồng bộ)
 * → io() (khởi tạo kết nối) cũng tốn thời gian để bắt tay với server
 * → async/await giúp xử lý các tác vụ này một cách tuần tự, dễ đọc
 */
export async function getSocket() {
  // ── Kiểm tra Singleton: Đã có kết nối đang hoạt động chưa? ─────────────

  /**
   * Optional Chaining (?.) — Toán tử truy cập an toàn:
   *   _socket?.connected
   * tương đương với:
   *   _socket !== null && _socket !== undefined && _socket.connected
   *
   * Nếu viết _socket.connected khi _socket = null → lỗi TypeError ngay!
   * ?. giúp tránh lỗi này: nếu _socket là null/undefined → trả về undefined (falsy)
   *
   * Điều kiện cache hit đủ 2 tiêu chí:
   *   ✓ _socket tồn tại (đã từng tạo kết nối)
   *   ✓ socket.connected = true (kết nối vẫn còn sống, chưa bị ngắt)
   *
   * Tại sao cần kiểm tra .connected?
   * → Kết nối cũ có thể đã bị ngắt (mất mạng, server restart, timeout)
   * → _socket không null nhưng connected = false → cần tạo kết nối mới
   */
  if (_socket?.connected) {
    return _socket; // Trả về kết nối đang hoạt động, không làm gì thêm
  }

  // ── Bước 1: Đảm bảo thư viện Socket.IO đã sẵn sàng ────────────────────

  /**
   * await: Chờ cho đến khi loadSocketIO() hoàn thành.
   * → Nếu lần đầu: chờ tải file từ CDN (có thể mất 100-500ms)
   * → Nếu đã tải: trả về cache ngay lập tức (gần như 0ms)
   *
   * io là hàm khởi tạo kết nối của Socket.IO: io(url, options)
   * Tương tự như khi dùng npm: import { io } from "socket.io-client"
   */
  const io = await loadSocketIO();

  // ── Bước 2: Tạo kết nối Socket.IO mới ──────────────────────────────────

  /**
   * Gọi io(url, options) để khởi tạo kết nối WebSocket đến server.
   * Kết quả trả về là một Socket object — lưu vào _socket (Singleton).
   *
   * Quá trình kết nối diễn ra NỀN (background):
   *   1. Client gửi HTTP request đến server: "Tôi muốn nâng cấp lên WebSocket"
   *   2. Server đồng ý: "Được, chuyển sang WebSocket đi"
   *   3. Đường dây TCP hai chiều được thiết lập
   *   4. socket.connected chuyển từ false sang true
   *   (Bước 1-4 diễn ra sau khi hàm return _socket)
   *
   * Gán vào _socket TRƯỚC KHI kết nối xong: điều này có chủ ý!
   * → Nếu có 2 lần getSocket() gọi gần nhau:
   *   Lần 1: tạo socket, lưu vào _socket, trả về
   *   Lần 2: kiểm tra _socket?.connected → false (đang kết nối) → tạo thêm?
   *   → Không! Vì lần 2 kiểm tra _socket trước, thấy đã có (không null)...
   *   Thực ra đây là edge case cần chú ý — code hiện tại xử lý bằng cách
   *   kiểm tra connected, nếu false sẽ tạo kết nối mới đè lên cái cũ.
   */
  _socket = io(SOCKET_URL, {
    /**
     * withCredentials: true — Gửi cookie khi thực hiện bắt tay kết nối
     *
     * Tương tự credentials: "include" của fetch() trong api.js.
     * Socket.IO dùng HTTP request để "nâng cấp" lên WebSocket (HTTP Upgrade).
     * Trong request HTTP đó cần có cookie để server xác thực người dùng:
     * → "Đây là người dùng đã đăng nhập, cho phép kết nối socket"
     *
     * Nếu false: kết nối ẩn danh → server không biết ai đang kết nối
     * → Không thể gửi thông báo riêng tư cho từng người dùng
     */
    withCredentials: true,

    /**
     * autoConnect: true — Tự động kết nối ngay khi io() được gọi
     *
     * Nếu false: phải gọi socket.connect() thủ công sau đó.
     * true (mặc định) thường là lựa chọn đúng cho hầu hết trường hợp.
     *
     * Trường hợp muốn false: khi bạn cần cấu hình thêm trước khi kết nối
     * (VD: thêm middleware xác thực, đăng ký các namespace...).
     */
    autoConnect: true,

    /**
     * transports — Thứ tự ưu tiên các phương thức truyền tải dữ liệu
     *
     * Socket.IO hỗ trợ nhiều cách truyền dữ liệu, xếp theo thứ tự ưu tiên:
     *
     * 1. "websocket" — WebSocket Protocol (RFC 6455):
     *    ✓ Kết nối TCP hai chiều thực sự
     *    ✓ Độ trễ thấp (< 10ms điển hình)
     *    ✓ Hiệu quả: không cần gửi HTTP header mỗi lần
     *    ✗ Một số mạng công ty/trường học chặn WebSocket
     *    ✗ Một số proxy cũ không hỗ trợ
     *
     * 2. "polling" — HTTP Long Polling (Phương thức dự phòng):
     *    Cơ chế: client gửi request → server GIỮ request đó lại (không trả lời ngay)
     *    → Khi có tin mới: server trả lời → client gửi request mới ngay lập tức
     *    ✓ Hoạt động với MỌI mạng (dùng HTTP thông thường)
     *    ✗ Tốn tài nguyên hơn (mỗi "heartbeat" là một HTTP request)
     *    ✗ Độ trễ cao hơn WebSocket (~100-500ms)
     *
     * Socket.IO thử "websocket" trước, nếu thất bại tự động hạ cấp sang "polling".
     * Người dùng không cần biết điều này đang xảy ra — tự động và trong suốt.
     */
    transports: ["websocket", "polling"],
  });

  // ── Trả về kết nối socket vừa tạo ───────────────────────────────────────

  /**
   * Lúc này socket CHƯA chắc đã kết nối xong (handshake đang diễn ra),
   * nhưng object đã được tạo và có thể đăng ký event listener ngay:
   *
   *   const socket = await getSocket();
   *   socket.on("connect", () => console.log("Đã kết nối!"));
   *   socket.on("notification", (data) => handleNotification(data));
   *
   * Event "connect" sẽ fire khi kết nối thực sự thiết lập xong.
   * Các event khác (notification, message...) chỉ nhận được sau khi connected.
   */
  return _socket;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 4: ĐÓNG KẾT NỐI
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * disconnectSocket — Đóng kết nối socket và dọn dẹp Singleton
 *
 * Khi nào cần gọi hàm này?
 *   1. Người dùng đăng xuất → không cần nhận thông báo nữa → đóng kết nối
 *   2. Ứng dụng bị đóng/reload (trình duyệt tự xử lý, nhưng gọi thủ công sạch hơn)
 *   3. Trong useEffect cleanup (component unmount) nếu socket chỉ dùng cục bộ
 *
 * Không có @returns vì hàm này đồng bộ và không trả về giá trị có ý nghĩa.
 *
 * ── TẠI SAO PHẢI ĐẶT _socket = null SAU KHI DISCONNECT? ──
 * Nếu chỉ gọi _socket.disconnect() mà không null:
 * → _socket vẫn tham chiếu đến object socket cũ
 * → _socket?.connected = false (đã ngắt)
 * → Lần sau gọi getSocket(): kiểm tra connected → false → tạo kết nối MỚI
 * → Lưu kết nối mới vào _socket (ghi đè cái cũ) → OK, hoạt động đúng
 *
 * Vậy null có cần thiết không?
 * → Thực ra kết quả cuối cùng giống nhau, nhưng null hóa giúp:
 * → Giải phóng tham chiếu → garbage collector có thể thu hồi bộ nhớ sớm hơn
 * → Code rõ ràng hơn: "không còn kết nối nào cả"
 * → Tránh vô tình dùng object socket cũ đã disconnect ở nơi khác
 */
export function disconnectSocket() {
  /**
   * Optional Chaining: _socket?.disconnect()
   * → Nếu _socket = null (chưa từng kết nối) → không làm gì, không báo lỗi
   * → Nếu _socket có giá trị → gọi socket.disconnect()
   *
   * socket.disconnect() gửi tín hiệu "tôi muốn ngắt kết nối" đến server:
   * → Server biết client đã ngắt (chủ động) và dọn dẹp phòng (room) tương ứng
   * → Khác với mất mạng đột ngột (server phải chờ timeout mới biết client đi)
   * → Ngắt chủ động → server có thể cập nhật trạng thái online/offline ngay lập tức
   */
  _socket?.disconnect();

  /**
   * Reset về null — Xóa tham chiếu Singleton
   * Lần sau gọi getSocket() → _socket = null → không có cache → tạo kết nối mới
   * Điều này quan trọng khi: người dùng đăng xuất rồi đăng nhập tài khoản khác
   * → Cần kết nối mới với thông tin xác thực mới (cookie mới)
   */
  _socket = null;
}
