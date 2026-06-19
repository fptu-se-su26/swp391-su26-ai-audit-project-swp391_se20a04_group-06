/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     api.js — Cầu Nối Client ↔ Server                   ║
 * ║                                                                          ║
 * ║  File này đóng vai trò "bưu điện" của ứng dụng:                        ║
 * ║    • Đóng gói mọi yêu cầu HTTP gửi lên server                          ║
 * ║    • Tự động đính kèm thông tin bảo mật (CSRF token, cookie)            ║
 * ║    • Tự động gia hạn phiên đăng nhập khi token hết hạn                 ║
 * ║    • Xếp hàng các yêu cầu chờ trong khi đang gia hạn token             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 *
 * ── KIẾN THỨC NỀN CẦN BIẾT ────────────────────────────────────────────────
 *
 * 🍪 COOKIE là gì?
 *   Mẩu dữ liệu nhỏ trình duyệt lưu trữ và TỰ ĐỘNG gửi kèm mọi request.
 *   Server dùng cookie để nhận ra "ôi, đây là người dùng đã đăng nhập rồi".
 *
 * 🔑 ACCESS TOKEN vs REFRESH TOKEN:
 *   - Access Token  : "Thẻ vào cửa" ngắn hạn (VD: hết hạn sau 15 phút).
 *                     Dùng để xác thực mọi API call.
 *   - Refresh Token : "Thẻ gia hạn" dài hạn (VD: 7 ngày).
 *                     Chỉ dùng để lấy Access Token mới khi cũ hết hạn.
 *   Cả hai đều được lưu trong cookie (không lưu trong localStorage để an toàn hơn).
 *
 * 🛡️ CSRF TOKEN là gì?
 *   Viết tắt của Cross-Site Request Forgery (Tấn công giả mạo yêu cầu).
 *   Hãy tưởng tượng: bạn đang đăng nhập web ngân hàng, đồng thời mở một
 *   trang web xấu. Trang xấu đó có thể ngầm gửi request đến ngân hàng
 *   với cookie của bạn → chuyển tiền mà bạn không hay biết!
 *   CSRF Token giải quyết: server cấp cho mỗi tab trình duyệt một mã bí mật
 *   ngẫu nhiên, mọi request phải kèm mã này. Trang web xấu không biết mã → bị chặn.
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 1: HÀM ĐỌC COOKIE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * getCookie — Đọc giá trị của một cookie theo tên
 *
 * @param {string} name - Tên cookie cần tìm (VD: "csrfToken", "theme", "lang")
 * @returns {string|null} - Giá trị cookie nếu tìm thấy, null nếu không có
 *
 * ── CHUỖI COOKIE TRÔNG NHƯ THẾ NÀO? ──
 * document.cookie trả về tất cả cookies của trang dưới dạng một chuỗi liên tục:
 *   "theme=dark; csrfToken=abc123xyz; lang=vi"
 * Mỗi cookie cách nhau bằng "; " (dấu chấm phẩy + khoảng trắng).
 *
 * ── THUẬT TOÁN PHÂN TÁCH ──
 * Thay vì dùng vòng lặp, hàm này dùng kỹ thuật "split hai lần" thông minh:
 *
 * Bước 1: Thêm "; " vào đầu chuỗi cookie để chuẩn hóa
 *   "; theme=dark; csrfToken=abc123xyz; lang=vi"
 *
 * Bước 2: Tách theo "; csrfToken="
 *   Mảng: ["; theme=dark", "abc123xyz; lang=vi"]
 *   Nếu mảng có ĐÚNG 2 phần tử → tìm thấy cookie!
 *
 * Bước 3: Lấy phần tử thứ 2 ("abc123xyz; lang=vi"), tách theo ";" lấy phần đầu
 *   Kết quả: "abc123xyz" ← Đây là giá trị cookie cần tìm
 */
const getCookie = (name) => {
  // Guard clause: Kiểm tra môi trường server-side (Next.js SSR, Node.js...)
  // Trong Node.js không có trình duyệt → không có 'document' → cần thoát sớm
  // typeof document === "undefined" là cách an toàn để kiểm tra (không gây lỗi ReferenceError)
  if (typeof document === "undefined") {
    return null;
  }

  // Thêm "; " vào đầu để COOKIE ĐẦU TIÊN cũng có thể được tìm thấy đúng cách
  // Nếu không làm vậy: "csrfToken=abc123" (đầu chuỗi, không có "; ") sẽ bị bỏ sót
  // khi tách theo "; csrfToken="
  const value = `; ${document.cookie}`;

  // Tách chuỗi thành 2 phần bằng cách dùng "; tên_cookie=" làm dấu phân cách
  // VD: tìm "csrfToken" → tách theo "; csrfToken="
  //   Input:  "; theme=dark; csrfToken=abc123; lang=vi"
  //   Output: ["; theme=dark", "abc123; lang=vi"]
  const parts = value.split(`; ${name}=`);

  // Nếu split tạo ra ĐÚNG 2 phần tử → cookie tồn tại
  // (0 phần = không tìm thấy ký tự phân cách → cookie không tồn tại)
  // (1 phần = split không hoạt động → cookie không tồn tại)
  // (2 phần = tìm thấy đúng 1 lần → cookie tồn tại)
  if (parts.length === 2) {
    // parts.pop()  → Lấy và xóa phần tử CUỐI CÙNG khỏi mảng → "abc123; lang=vi"
    // .split(";")  → Tách theo ";" → ["abc123", " lang=vi"]
    // .shift()     → Lấy và xóa phần tử ĐẦU TIÊN → "abc123"
    // Kết quả: chỉ lấy phần giá trị của cookie, bỏ phần còn lại phía sau
    return parts.pop().split(";").shift();
  }

  // Cookie không tồn tại → trả về null (không phải undefined hay chuỗi rỗng)
  return null;
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 2: CƠ CHẾ XẾP HÀNG TOKEN REFRESH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * ── VẤN ĐỀ: ĐỒNG THỜI REFRESH TOKEN ──
 *
 * Tình huống thực tế:
 * Người dùng vào một trang web phức tạp → trình duyệt gửi đồng thời 5 request API.
 * Access Token vừa hết hạn → TẤT CẢ 5 request đều nhận lỗi 401.
 *
 * Nếu không có cơ chế kiểm soát:
 *   Request 1: nhận 401 → gọi /auth/refresh
 *   Request 2: nhận 401 → gọi /auth/refresh (song song!)
 *   Request 3: nhận 401 → gọi /auth/refresh (song song!)
 *   → Server nhận 5 yêu cầu refresh cùng lúc → race condition → hỗn loạn
 *
 * ── GIẢI PHÁP: PATTERN "QUEUE + LOCK" ──
 *
 *   isRefreshing = KHÓA: Chỉ cho phép MỘT tiến trình refresh chạy tại một thời điểm
 *   refreshSubscribers = HÀNG ĐỢI: Các request còn lại xếp hàng chờ
 *
 * Luồng hoạt động:
 *   Request 1: thấy 401 → đặt lock (isRefreshing=true) → gọi /auth/refresh
 *   Request 2: thấy 401 → thấy lock → vào hàng đợi, chờ...
 *   Request 3: thấy 401 → thấy lock → vào hàng đợi, chờ...
 *   [Refresh xong] → mở khóa → giải phóng hàng đợi → Request 2, 3 chạy lại
 */

/**
 * isRefreshing — Cờ hiệu "đang có người đang refresh token"
 *
 * Kiểu: boolean (true/false)
 * Là biến MODULE-LEVEL (khai báo ngoài hàm) để:
 * → Tồn tại xuyên suốt vòng đời ứng dụng (không bị reset khi hàm kết thúc)
 * → Được chia sẻ giữa tất cả các lần gọi hàm api()
 * → Hoạt động như "semaphore" (đèn tín hiệu) cho tiến trình refresh
 */
let isRefreshing = false;

/**
 * refreshSubscribers — Hàng đợi các callback của request đang chờ
 *
 * Kiểu: Array<Function>
 * Mỗi phần tử là một hàm callback, đại diện cho một request đang "xếp hàng".
 * Khi refresh xong → gọi tất cả callback → mỗi request tự chạy lại.
 *
 * VD khi có 3 request chờ:
 *   refreshSubscribers = [
 *     (err) => { /* chạy lại request 2 *\/ },
 *     (err) => { /* chạy lại request 3 *\/ },
 *     (err) => { /* chạy lại request 4 *\/ },
 *   ]
 */
let refreshSubscribers = [];

/**
 * subscribeTokenRefresh — Đăng ký một callback vào hàng đợi
 *
 * Được gọi bởi mỗi request khi phát hiện "đang có refresh đang chạy".
 * Thay vì chạy refresh lại (gây trùng lặp), request này "đăng ký"
 * để được thông báo khi refresh hoàn thành.
 *
 * @param {Function} cb - Hàm callback nhận tham số err (null = thành công, Error = thất bại)
 *
 * Ví dụ callback:
 *   (err) => {
 *     if (err) reject(err);      // Refresh thất bại → từ chối promise của request này
 *     else resolve(await api(path, options)); // Refresh thành công → chạy lại request
 *   }
 */
function subscribeTokenRefresh(cb) {
  refreshSubscribers.push(cb);
}

/**
 * onRefreshed — Giải phóng hàng đợi sau khi refresh hoàn thành
 *
 * Được gọi một lần duy nhất sau khi tiến trình refresh kết thúc
 * (dù thành công hay thất bại).
 *
 * @param {Error|null} err - null nếu refresh thành công, Error nếu thất bại
 *
 * LUỒNG:
 *   1. Duyệt qua mọi callback trong hàng đợi
 *   2. Gọi từng callback với kết quả (err = null → thành công, err = Error → thất bại)
 *   3. Xóa sạch hàng đợi (sẵn sàng cho lần sau)
 */
function onRefreshed(err) {
  // forEach: duyệt qua từng phần tử, gọi hàm callback với tham số err
  // Nếu err = null → callback biết "thành công rồi, chạy lại request đi"
  // Nếu err = Error → callback biết "thất bại rồi, báo lỗi cho người dùng"
  refreshSubscribers.forEach((cb) => cb(err));

  // Reset hàng đợi về mảng rỗng để sẵn sàng cho chu kỳ refresh tiếp theo
  // (không dùng refreshSubscribers.length = 0 vì gán mảng mới rõ ràng hơn)
  refreshSubscribers = [];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PHẦN 3: HÀM API CHÍNH
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * api — Hàm gọi HTTP request dùng chung cho toàn bộ ứng dụng
 *
 * @param {string} path    - Đường dẫn endpoint API (không cần viết "/api")
 *                           VD: "/products", "/users/123", "/auth/login"
 * @param {object} options - Cấu hình tùy chọn (giống options của fetch() gốc)
 *                           VD: { method: "POST", body: { name: "Cá hồi" } }
 *                           Thuộc tính đặc biệt: _isRetry (nội bộ, không truyền thủ công)
 * @returns {Promise<any>} - Dữ liệu JSON từ server nếu thành công
 * @throws {Error}         - Ném lỗi nếu server phản hồi lỗi hoặc mạng gặp sự cố
 *
 * ── CÁCH DÙNG ──
 * // GET: lấy danh sách sản phẩm
 * const products = await api("/products");
 *
 * // POST: tạo sản phẩm mới
 * const newProduct = await api("/products", {
 *   method: "POST",
 *   body: { name: "Cá thu", price: 150000 } // Tự động chuyển thành JSON
 * });
 *
 * // Upload file: gửi FormData (ảnh, video...)
 * const formData = new FormData();
 * formData.append("image", file);
 * await api("/products/upload", { method: "POST", body: formData });
 */
export async function api(path, options = {}) {
  // ── BƯỚC 1: Đọc CSRF Token ──────────────────────────────────────────────

  /**
   * Lấy CSRF token từ cookie trình duyệt.
   * Server đã gửi token này khi người dùng tải trang lần đầu.
   * Chúng ta phải gửi lại nó trong header của mọi request thay đổi dữ liệu
   * (POST, PUT, DELETE) để server xác nhận "đây là request hợp lệ từ trang này".
   */
  const csrfToken = getCookie("csrfToken");

  // ── BƯỚC 2: Xử lý Request Body ──────────────────────────────────────────

  /**
   * Body là dữ liệu gửi lên server (chỉ có ở POST, PUT, PATCH — không có ở GET).
   * Có 2 loại body phổ biến:
   *   1. Object JavaScript → cần chuyển thành chuỗi JSON
   *   2. FormData (upload file) → KHÔNG chuyển, để nguyên (trình duyệt tự xử lý)
   */
  let body = options.body;

  // instanceof: kiểm tra xem body có phải được tạo từ class FormData không
  // FormData được dùng khi upload file/ảnh vì cần gửi dữ liệu nhị phân
  const isFormData = body instanceof FormData;

  // Điều kiện đủ 3 điều kiện để chuyển sang JSON:
  //   ✓ body có tồn tại (không phải null/undefined)
  //   ✓ body là kiểu object (không phải string, number...)
  //   ✓ body KHÔNG phải FormData (FormData đã là object nhưng có cơ chế riêng)
  if (body && typeof body === "object" && !isFormData) {
    // JSON.stringify: chuyển { name: "Cá thu", price: 150000 }
    // thành '{"name":"Cá thu","price":150000}'
    // Server mới có thể đọc được dữ liệu này trong request body
    body = JSON.stringify(body);
  }

  // ── BƯỚC 3: Xây dựng HTTP Headers ───────────────────────────────────────

  /**
   * Headers là "thông tin bổ sung" đính kèm mỗi request, không phải dữ liệu chính.
   * Giống như phong bì thư: chứa địa chỉ, tem, loại bưu kiện...
   *
   * Sử dụng Spread Operator (...) để gộp nhiều object header lại:
   *   { ...obj1, ...obj2, ...obj3 }
   * Nếu các object có key trùng nhau, object ĐỨC SAU sẽ ghi đè (overwrite) object trước.
   */
  const headers = {
    // "Content-Type" nói với server "dữ liệu tôi gửi là kiểu gì?"
    // - FormData: KHÔNG đặt Content-Type, trình duyệt tự thêm kèm "boundary"
    //   (boundary là ký tự phân cách giữa các file trong FormData)
    //   VD: "Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWx"
    // - Còn lại: đặt "application/json" để server biết parse body thành JSON
    ...(isFormData ? {} : { "Content-Type": "application/json" }),

    // Đính kèm CSRF token vào header nếu có (tên header là "x-csrf-token")
    // Server sẽ đọc header này và đối chiếu với token đã cấp
    // Nếu không có CSRF token (VD: chưa đăng nhập) → bỏ qua, không thêm header
    ...(csrfToken ? { "x-csrf-token": csrfToken } : {}),

    // Gộp thêm bất kỳ header tùy chỉnh nào được truyền từ nơi gọi hàm
    // VD: api("/upload", { headers: { "X-Upload-Type": "avatar" } })
    // Đặt SAU CÙNG để có thể ghi đè các header mặc định nếu cần
    ...options.headers,
  };

  // ── BƯỚC 4: Tổng hợp cấu hình Request ──────────────────────────────────

  /**
   * Gộp tất cả thành một object config hoàn chỉnh để truyền vào fetch().
   * Thứ tự spread quan trọng:
   *   1. ...options  → kế thừa các cài đặt gốc (method, cache, mode...)
   *   2. body        → ghi đè body đã được chuẩn hóa (JSON.stringify hoặc FormData)
   *   3. headers     → ghi đè headers đã được xây dựng ở trên
   *   4. credentials → luôn đặt cuối cùng, không cho phép bị ghi đè
   */
  const config = {
    ...options,
    body,
    headers,

    // credentials: "include" bắt buộc trình duyệt gửi kèm cookie trong mọi request
    // Mặc định fetch() KHÔNG gửi cookie (credentials: "omit")
    // Nếu không có dòng này → server không nhận được JWT cookie → không xác thực được
    // "include" = gửi cookie kể cả request cross-origin (khác domain)
    credentials: "include",
  };

  // ── BƯỚC 5: Gửi Request và nhận Response ────────────────────────────────

  /**
   * fetch() là API gốc của trình duyệt để thực hiện HTTP request.
   * await = chờ cho đến khi nhận được phản hồi (response headers)
   * Lưu ý: chỉ chờ đến khi nhận HEADERS, chưa phải toàn bộ dữ liệu body.
   *
   * Template literal: `/api${path}` tự động ghép chuỗi
   * VD: path = "/products/123" → fetch url = "/api/products/123"
   *
   * 'let' thay vì 'const' vì biến res có thể được gán lại nếu cần retry.
   */
  let res = await fetch(`/api${path}`, config);

  // ── BƯỚC 6: Xử lý lỗi 401 (Token hết hạn) ──────────────────────────────

  /**
   * HTTP 401 Unauthorized: Server nói "Tôi không biết bạn là ai" hoặc
   * "Thẻ xác thực của bạn đã hết hạn".
   *
   * Trong hệ thống JWT (JSON Web Token):
   *   - Access Token ngắn hạn → sau 15-60 phút sẽ hết hạn → server trả 401
   *   - Giải pháp: dùng Refresh Token để lấy Access Token mới MÀ KHÔNG cần đăng nhập lại
   *
   * Đây là cơ chế "im lặng gia hạn" (silent refresh / token rotation):
   * → Người dùng không biết token hết hạn
   * → Không cần đăng xuất và đăng nhập lại
   * → Trải nghiệm người dùng liền mạch
   */
  if (
    res.status === 401 && // Server phản hồi "không có quyền truy cập"
    !options._isRetry && // CHƯA thử refresh lần nào (tránh vòng lặp vô hạn)
    // Nếu sau khi refresh vẫn 401 → không refresh lại nữa

    path !== "/auth/login" && // Không refresh khi gọi chính endpoint đăng nhập
    // (nếu đăng nhập sai mật khẩu cũng trả 401, không phải token hết hạn)

    path !== "/auth/register" // Tương tự với đăng ký (chưa có tài khoản thì không có token)
  ) {
    // ── Nhánh A: Chưa có ai đang refresh → Trở thành người refresh ────────
    if (!isRefreshing) {
      // Đặt cờ khóa: báo cho các request khác biết "đang có refresh đang chạy"
      isRefreshing = true;

      try {
        // Gửi request đến endpoint refresh để lấy Access Token mới
        // Server đọc Refresh Token từ cookie (chúng ta không cần gửi thủ công)
        // và trả về Access Token mới (cũng qua cookie, không phải response body)
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST", // POST vì đây là hành động, không phải lấy dữ liệu

          // Vẫn cần gửi CSRF token để bảo mật endpoint refresh
          headers: csrfToken ? { "x-csrf-token": csrfToken } : {},

          credentials: "include", // Quan trọng! Phải có để gửi Refresh Token cookie
        });

        if (refreshRes.ok) {
          // ── Refresh THÀNH CÔNG ──
          // ok = true khi status code là 200-299
          // Server đã set cookie mới với Access Token mới

          // Mở khóa: cho phép các refresh tiếp theo trong tương lai
          isRefreshing = false;

          // Giải phóng hàng đợi với err=null (báo hiệu thành công)
          // → Tất cả request đang chờ sẽ tự chạy lại
          onRefreshed(null);
        } else {
          // ── Refresh THẤT BẠI ── (VD: Refresh Token cũng đã hết hạn/bị thu hồi)
          // Kịch bản này thường xảy ra khi:
          //   - Người dùng bị đăng xuất từ thiết bị khác
          //   - Phiên đăng nhập hết hạn hoàn toàn (VD: sau 7 ngày)
          //   - Admin thu hồi quyền truy cập

          isRefreshing = false;

          // Tạo đối tượng Error để truyền vào hàng đợi
          const sessionError = new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          );

          // Thông báo lỗi cho tất cả request đang chờ trong hàng đợi
          onRefreshed(sessionError);

          // Ném lỗi để code gọi api() có thể bắt và xử lý
          // (VD: hiển thị thông báo, chuyển hướng về trang đăng nhập)
          throw sessionError;
        }
      } catch (err) {
        // Bắt lỗi mạng (VD: mất kết nối internet trong khi refresh)
        // Không phải lỗi logic server, mà là lỗi hạ tầng

        isRefreshing = false; // Mở khóa dù thất bại (để các lần gọi sau không bị block mãi)
        onRefreshed(err); // Thông báo lỗi cho hàng đợi
        throw err; // Ném lỗi ra ngoài
      }
    }

    // ── Nhánh B: Đã có người đang refresh → Vào hàng đợi chờ ─────────────

    /**
     * Code chạy vào đây khi:
     * - Request này nhận 401
     * - Nhưng isRefreshing = true (đã có request khác đang refresh)
     *
     * Giải pháp: Trả về một Promise "treo lơ lửng" và đăng ký callback.
     * Promise này sẽ được resolve/reject khi onRefreshed() được gọi.
     *
     * Đây là kỹ thuật "Promise Queue" — biến async race condition thành
     * chuỗi thực thi có trật tự.
     */
    return new Promise((resolve, reject) => {
      // subscribeTokenRefresh thêm callback này vào mảng refreshSubscribers
      // Callback sẽ được gọi bởi onRefreshed() khi refresh hoàn thành
      subscribeTokenRefresh(async (err) => {
        if (err) {
          // Refresh thất bại → từ chối Promise → request này cũng thất bại
          reject(err);
          return; // Dừng thực thi callback
        }

        // Refresh thành công → cập nhật CSRF token mới (server có thể đã đổi)
        const updatedCsrf = getCookie("csrfToken");

        // Cập nhật header trong config (config là object được tham chiếu, không phải copy)
        // Chỉ cập nhật nếu:
        //   ✓ Có CSRF token mới
        //   ✓ Không phải FormData (FormData không cần header này theo cách này)
        if (updatedCsrf && !isFormData) {
          config.headers["x-csrf-token"] = updatedCsrf;
        }

        try {
          // Chạy lại request BAN ĐẦU (cùng path và options)
          // _isRetry: true → đánh dấu "đây là lần thử lại sau refresh"
          // → Nếu lần này vẫn 401 (hiếm gặp), sẽ KHÔNG refresh nữa, tránh loop
          resolve(await api(path, { ...options, _isRetry: true }));
        } catch (e) {
          // Chạy lại thất bại → từ chối Promise
          reject(e);
        }
      });
    });
  }

  // ── BƯỚC 7: Xử lý Response ──────────────────────────────────────────────

  /**
   * Đến đây có nghĩa là:
   * - Response không phải 401, HOẶC
   * - Đã xử lý xong 401 (refresh thành công, request đã được chạy lại)
   *
   * Tiếp theo: đọc body của response dưới dạng JSON.
   *
   * res.json() là bất đồng bộ vì body response được stream (truyền từng chunk)
   * .catch(() => ({})) đề phòng:
   *   - Server trả về body rỗng (VD: 204 No Content)
   *   - Body không phải JSON hợp lệ
   *   → Thay vì crash, trả về object rỗng {}
   */
  const data = await res.json().catch(() => ({}));

  /**
   * res.ok = true khi status code nằm trong khoảng 200-299 (thành công)
   * res.ok = false khi status code là 400, 403, 404, 500... (thất bại)
   *
   * Nguyên nhân phổ biến:
   *   400 Bad Request  : Dữ liệu gửi lên sai định dạng
   *   403 Forbidden    : Có token nhưng không có quyền thực hiện hành động
   *   404 Not Found    : Không tìm thấy tài nguyên
   *   422 Unprocessable: Dữ liệu không hợp lệ (VD: email sai định dạng)
   *   500 Server Error : Lỗi phía server (bug của backend)
   */
  if (!res.ok) {
    // Ưu tiên dùng thông điệp lỗi từ server (data.message) vì nó cụ thể hơn
    // Fallback về thông báo chung kèm mã lỗi HTTP nếu server không gửi message
    throw new Error(data.message || `Lỗi hệ thống (Mã lỗi: ${res.status})`);
  }

  // ── BƯỚC 8: Trả về dữ liệu ──────────────────────────────────────────────

  /**
   * Mọi thứ ok → trả về dữ liệu JSON đã parse cho nơi gọi hàm.
   *
   * Nơi gọi nhận được object JavaScript đã parse sẵn (không phải chuỗi JSON):
   *   const products = await api("/products");
   *   // products là array: [{ id: 1, name: "Cá thu" }, { id: 2, ... }]
   *   // (không phải '[{"id":1,"name":"Cá thu"},...]')
   */
  return data;
}
