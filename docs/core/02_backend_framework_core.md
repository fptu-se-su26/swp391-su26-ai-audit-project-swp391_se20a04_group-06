# Chuyên Đề 02: Phân Tích Mã Nguồn Hạ Tầng Backend (Framework Core)

Chuyên đề này phân tích chi tiết từng dòng code (line-by-line) các thành phần hạ tầng cốt lõi trong Backend của dự án. Đây là xương sống giúp thiết lập máy chủ, kết nối cơ sở dữ liệu, quản lý phiên làm việc realtime và thực thi các cơ chế bảo mật.

---

## 1. app.ts — Trái Tim Điều Phối Toàn Bộ Hệ Thống

Tệp [backend/src/app.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/app.ts) đảm nhận khởi tạo Express Server, kết nối cơ sở dữ liệu, phân luồng Rate Limiter, đăng ký bộ kiểm tra bảo mật và điều khiển quá trình tắt máy an toàn (Graceful Shutdown).

### Phân tích dòng code:

* **Dòng 1-15: Khai báo thư viện & cấu hình ban đầu**
  - Khai báo biến môi trường `dotenv/config` để nạp các khóa cấu hình từ file `.env` vào bộ nhớ RAM (`process.env`).
  - Nạp framework `express` và thư viện tạo server `http`.
  - Nạp các middleware bảo mật: `helmet` (HTTP Headers), `cors` (Cross-Origin Resource Sharing), `cookie-parser` (phân tích cookies).
  - Kết nối Redis Client (`connectRedis`) và kết nối MongoDB (`testConnection`).
  - Khởi tạo module quản lý phòng chat realtime `initSocket` và công cụ đặt lịch chạy ngầm `startCronJobs`.
  - Khởi chạy các middleware chống tấn công giả mạo `generateCsrfToken` và `validateCsrf`.

* **Dòng 35-36: Khởi tạo thực thể ứng dụng**
  ```typescript
  const app = express();
  const server = http.createServer(app);
  ```
  - Tạo thực thể `app` của Express để quản lý định tuyến và middlewares.
  - Sử dụng module `http` để bọc `app` lại, giúp máy chủ vừa xử lý các request HTTP vừa tương thích với kết nối Socket.IO thời gian thực.

* **Dòng 38: Cấu hình trust proxy**
  ```typescript
  app.set("trust proxy", 1);
  ```
  - Thiết lập cho phép Express tin tưởng các header được cấu hình bởi Proxy ngược đứng trước máy chủ (như Nginx, Cloudflare). Điều này cực kỳ quan trọng để thu được địa chỉ IP thực của người dùng (`req.ip`) phục vụ cho việc giới hạn tần suất (Rate Limiting).

* **Dòng 40-56: Cấu hình Middlewares nền tảng**
  - **Helmet**:
    - `crossOriginOpenerPolicy`: Đặt là `same-origin-allow-popups` hỗ trợ cửa sổ popup tương tác (như đăng nhập Google).
    - `crossOriginResourcePolicy`: Đặt là `cross-origin` để các tài nguyên (như ảnh hải sản) được phép hiển thị trên frontend chạy cổng khác.
  - **CORS**: Chỉ định nguồn gốc từ biến môi trường `CLIENT_URL` (hoặc mặc định `http://localhost:3000`), bắt buộc cấu hình `credentials: true` để truyền cookies an toàn.
  - **Express JSON & URL Encoded parser**: Phân tích cú pháp HTTP Body định dạng JSON và URL encoded, thiết lập giới hạn payload tối đa `2mb` chống tấn công từ chối dịch vụ (DoS) bằng payload khổng lồ.

* **Dòng 58-71: Nâng cấp HTTP Request & Response Logger (Đo lường hiệu năng)**
  - Sử dụng sự kiện `res.on("finish")` để ghi lại nhật ký sau khi HTTP request được xử lý xong.
  - Ghi vết phương thức HTTP, đường dẫn, địa chỉ IP của client, mã trạng thái HTTP phản hồi (`res.statusCode`) và thời gian thực thi xử lý (tính bằng mili-giây - ms) giúp nhà quản trị dễ dàng phát hiện các API hoạt động chậm để tối ưu hóa.
  - Tự động gọi hàm cấu hình khởi tạo tài liệu Swagger UI (`setupSwagger`).

* **Dòng 63-117: Thiết lập phân tầng Rate Limiters (Chống Brute-force & DDoS)**
  - Tách biệt 4 bộ cấu hình rate limiter:
    1. **`authLimiter`**: Áp dụng cho đăng nhập/đăng ký. Giới hạn tối đa 20 request trong 15 phút. Nếu vượt quá sẽ phản hồi lỗi `429 Too Many Requests`.
    2. **`pollingLimiter`**: Áp dụng cho endpoint kiểm tra tin nhắn chưa đọc và thông báo (vốn được client tự động gọi lại sau mỗi chu kỳ ngắn). Giới hạn tối đa 120 request/phút.
    3. **`adminLimiter`**: Dành cho quản trị viên, có giới hạn cao hơn hẳn (300 request/phút) để tránh nghẽn khi tải lượng dữ liệu Dashboard khổng lồ.
    4. **`globalLimiter`**: Hạn mức chung áp dụng cho toàn bộ các API khác trong tiền tố `/api`. Đặt là 1500 request/phút (~25 request/giây cho mỗi địa chỉ IP).

* **Dòng 119-143: Đăng ký CSRF Protection Middleware**
  - Gọi middleware `generateCsrfToken` để tự động sinh và đính kèm token bảo mật vào Cookie của người duyệt web.
  - Bộ kiểm tra `validateCsrf` được áp dụng cho mọi đường dẫn bắt đầu bằng `/api`.
  - **Logic loại trừ (Exclusion Logic):** Khởi tạo danh sách `publicPaths` (như đăng nhập, đăng xuất, sức khỏe hệ thống `/health`, chatbot) và các request có phương thức đọc dữ liệu `GET` (vốn an toàn) để bỏ qua không yêu cầu kiểm tra token CSRF.

* **Dòng 172-192: Bộ Xử Lý Lỗi Tập Trung (Global Error Handler) & Sentry Integration**
  - Bắt toàn bộ lỗi phát sinh không mong muốn trong chu kỳ sống của Request.
  - Ghi nhận lỗi chi tiết kèm call-stack qua Winston Logger.
  - **Giám sát thời gian thực Sentry:** Bổ sung hook tự động kiểm tra biến môi trường `SENTRY_DSN` và chuyển tiếp lỗi runtime nghiêm trọng trực tiếp lên hệ thống quản lý lỗi tập trung Sentry.
  - Phản hồi mã lỗi chuẩn HTTP 500 Internal Server Error với thông điệp chung để bảo vệ mã nguồn, tránh rò rỉ thông tin hạ tầng ra bên ngoài.

* **Dòng 204-227: Quy trình bootstrap khởi chạy ứng dụng**
  - **Bước 1**: Kiểm tra các biến môi trường cấu hình bắt buộc (`MONGO_URI`, `JWT_SECRET`, `OTP_SECRET`). Nếu thiếu, máy chủ sẽ ghi log lỗi CRITICAL và lập tức thoát chương trình (`process.exit(1)`).
  - **Bước 2**: Thực thi kết nối cơ sở dữ liệu MongoDB và Redis.
  - **Bước 3**: Khởi tạo cấu hình Socket.IO và bắt đầu lịch chạy cronjob.
  - **Bước 4**: Mở cổng lắng nghe HTTP trên biến môi trường `PORT` (hoặc 5000).

* **Dòng 229-264: Quá trình tắt máy an toàn (Graceful Shutdown)**
  - Lắng nghe tín hiệu `SIGINT` (nhấn Ctrl+C) và `SIGTERM` (tín hiệu tắt từ Docker/OS).
  - Ngừng tiếp nhận các kết nối HTTP mới.
  - Đóng kết nối các client Socket.IO đang hoạt động.
  - Đóng kết nối Redis và Mongoose MongoDB một cách sạch sẽ, giải phóng hoàn toàn bộ nhớ RAM.
  - Thiết lập bộ đếm thời gian tối đa (Timeout) là 10 giây. Nếu sau thời gian này các kết nối chưa kịp giải phóng hết, hệ thống sẽ thực thi cưỡng chế tắt chương trình (`process.exit(1)`) để tránh treo ứng dụng.

---

## 2. db.ts — Quản Lý Kết Nối & Đồng Bộ Cơ Sở Dữ Liệu

Tệp [backend/src/db.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/db.ts) quản lý tiến trình kết nối MongoDB thông qua Mongoose ODM.

### Phân tích dòng code:

* **Dòng 10-12: Kết nối MongoDB**
  ```typescript
  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
  ```
  - Gọi hàm `connect` của Mongoose để khởi tạo vùng kết nối (Connection Pool).
  - Cấu hình `autoIndex: true` hướng dẫn Mongoose tự động quét qua các khai báo Schema trong mã nguồn và đồng bộ hóa việc xây dựng các chỉ mục địa lý (`2dsphere`) và chỉ mục tìm kiếm văn bản (`text`) khi máy chủ khởi chạy.

* **Dòng 15-26: Cơ chế dọn dẹp chỉ mục thừa (Legacy Index)**
  - Kết nối trực tiếp vào collection `users` ở mức driver thô.
  - Quét qua danh sách chỉ mục hiện tại của database.
  - Nếu tồn tại chỉ mục cũ `phone_1` (vốn được dùng làm ràng buộc duy nhất trong các phiên bản trước khi đổi sang Email đăng nhập), hệ thống sẽ chủ động xóa bỏ (`dropIndex("phone_1")`). Điều này giúp giải quyết lỗi trùng lặp khi người dùng đăng ký nhiều tài khoản có số điện thoại rỗng hoặc trùng nhau.

---

## 3. socket.ts — Động Cơ Thời Gian Thực & Signaling WebRTC

Tệp [backend/src/socket.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/socket.ts) đóng vai trò làm máy chủ WebSocket chính, điều phối luồng thông báo, cô lập phòng chat và truyền tải tín hiệu kết nối WebRTC.

### Phân tích dòng code:

* **Dòng 38-49: Thiết lập Redis Adapter hỗ trợ Mở rộng quy mô (Scaling-out)**
  - Khởi tạo hai bản sao kết nối của Redis Client: `pubClientInstance` (đăng ký phát tin) và `subClientInstance` (lắng nghe nhận tin).
  - Gọi hàm `io.adapter(createAdapter(...))` để bọc Socket.IO Server lại.
  - **Mục đích:** Khi hệ thống mở rộng lên nhiều Pods/Servers chạy song song dưới bộ cân bằng tải (Load Balancer), Redis Adapter sẽ đồng bộ hóa các sự kiện WebSocket. Một sự kiện phát tin từ Server A sẽ được Redis phát sóng sang Server B thông qua kênh Pub/Sub, đảm bảo người dùng kết nối ở bất kỳ Server nào cũng nhận được tin nhắn thời gian thực của nhau.

* **Dòng 51-82: Middleware Xác thực Handshake kết nối Socket**
  - Để ngăn chặn kết nối lậu, Socket.IO sử dụng middleware bắt buộc xác thực khi kết nối được tạo dựng.
  - Trích xuất JWT token từ cookie của trình duyệt gửi lên (`socket.handshake.headers.cookie`). Nếu không thấy, hệ thống sẽ fallback tìm trong query string (`socket.handshake.query?.token`).
  - Giải mã chữ ký token bằng `jwt.verify` với `JWT_SECRET`.
  - Kiểm tra xem người dùng có tồn tại trong cơ sở dữ liệu và đang trong trạng thái hoạt động (`isActive = true`) hay không. Nếu không, lập tức từ chối bắt tay kết nối bằng cách gọi hàm `next(new Error())`.
  - Nếu hợp lệ, gán payload thông tin người dùng vào đối tượng socket (`(socket as any).user = payload`) để sử dụng trong suốt phiên.

* **Dòng 87-109: Sự kiện join_room (Cô Lập Kênh Trò Chuyện)**
  - Lắng nghe khi client phát ra sự kiện `join_room` kèm ID sản phẩm (`productId`) và ID người mua (`buyerId`).
  - **Quy tắc bảo mật:** Để tránh việc người dùng A đọc trộm tin nhắn của người dùng B, server truy vấn sản phẩm.
  - Hệ thống chỉ cho phép client tham gia (join) vào phòng chat có định dạng `product_${productId}_${buyerId}` nếu người kết nối hiện tại là **chủ sở hữu sản phẩm (Seller)** hoặc chính là **người mua (Buyer)**. Các tài khoản khác truy cập sẽ bị từ chối trực tiếp.

* **Dòng 124-258: Sự kiện send_message (Gửi tin nhắn thời gian thực)**
  - **Dòng 142-147: Ngăn chặn tự chat**
    - Kiểm tra nếu `receiverId` trùng với người gửi hiện tại (`userId`), server chặn và trả về lỗi.
  - **Dòng 164-185: Bộ Giới Hạn Tần Suất Gửi Tin (Rate Limiting qua Redis)**
    - Để tránh việc bot gửi tin spam làm treo ứng dụng, server sử dụng Redis để đếm.
    - Khóa đếm dạng: `ratelimit:socket:msg:${userId}`.
    - Sử dụng lệnh `pipeline()` để tăng biến đếm (`incr`) và thiết lập thời hạn hết hạn khóa là 2 giây (`expire`).
    - Nếu trong vòng 2 giây người dùng gửi nhiều hơn 5 tin nhắn, server sẽ chặn việc gửi và phát ra sự kiện `"error"` báo lỗi.
  - **Dòng 207-212: Khử độc ký tự đầu vào (XSS Prevention)**
    - Dùng biểu thức chính quy (regex) `/<[^>]*>/g` để lọc sạch toàn bộ các thẻ HTML nằm trong nội dung tin nhắn (`content`). Điều này loại bỏ hoàn toàn các đoạn script độc hại do kẻ xấu gửi lên trình duyệt của đối phương.
    - Cắt chuỗi ký tự tối đa `1000` để tối ưu dung lượng lưu trữ của database.
  - **Dòng 214-236: Lưu trữ & Phát tán tin nhắn**
    - Gọi repository để lưu tin nhắn mới vào MongoDB.
    - Sử dụng hàm `io.to(roomName).emit("new_message", messageResponse)` phát tin nhắn tới phòng chat cô lập. Cả người mua và người bán đang trong phòng này sẽ lập tức nhận được tin.
    - **Dòng 247-252: Thông báo đẩy toàn cục (Global Push Notification)**
      - Phát tín hiệu đến phòng riêng của người nhận `user_${receiverId}` để hiển thị huy hiệu thông báo tin nhắn chưa đọc (unread badge) ngay cả khi họ đang duyệt các trang khác không ở trong phòng chat này.

* **Dòng 260-312: Nhóm sự kiện WebRTC Signaling (Báo hiệu kết nối)**
  - Các sự kiện `call_user`, `answer_call`, `ice_candidate`, `end_call` hoạt động như một kênh chuyển tiếp tín hiệu.
  - Server không giải mã hay can thiệp vào dữ liệu offer/answer/candidate, mà chỉ định tuyến chuyển tiếp chúng đến đúng ID phòng riêng của đối tác nhận cuộc gọi (`user_${to}`), cho phép hai trình duyệt trao đổi thông số hạ tầng và tự động kết nối ngang hàng.

---

## 4. cron.ts — Tiến Trình Quét Dọn Định Kỳ

Tệp [backend/src/cron.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/cron.ts) sử dụng thư viện `node-cron` để lập lịch dọn dẹp cơ sở dữ liệu ngầm.

### Phân tích dòng code:

* **Dòng 11-30: Khóa phân tán (Distributed Lock) sử dụng Redis**
  - **Vấn đề của môi trường Cloud/Docker:** Khi mở rộng ứng dụng chạy trên nhiều containers song song, mỗi thực thể ứng dụng đều kích hoạt một tiến trình cronjob riêng. Nếu không khóa, các container sẽ đồng thời quét cơ sở dữ liệu, gây ra tranh chấp tài nguyên (race condition) và tải cao không đáng có cho database.
  - **Giải pháp:** Sử dụng lệnh `redis.set(lockKey, uniqueValue, "EX", 3300, "NX")`.
    - `NX`: Chỉ ghi khóa nếu khóa chưa tồn tại.
    - `EX 3300`: Khóa tự động biến mất sau 55 phút (đảm bảo dọn sạch trước khi chu kỳ 1 giờ tiếp theo bắt đầu).
  - Container nào thực thi lệnh này trước và giành được khóa thành công (`lockAcquired = true`) sẽ là thực thể duy nhất được phép chạy logic dọn dẹp. Các container khác sẽ bỏ qua chu kỳ đó.

* **Dòng 36-55: Quét hết hạn sản phẩm tươi**
  - Tính toán hai mốc thời gian: `yesterday` (24 tiếng trước) và `twoDaysAgo` (48 tiếng trước).
  - Sử dụng toán tử `updateMany` tìm các sản phẩm thỏa mãn điều kiện:
    - Loại hải sản tươi (`type: "Fresh"`), đang ở trạng thái hoạt động (`status: "Active"`).
    - Có thời điểm đánh bắt đã quá 48 tiếng (`catchTime <= twoDaysAgo`) HOẶC thời gian tạo tin đăng đã quá 24 tiếng (`createdAt <= yesterday`).
  - Chuyển trạng thái của chúng sang hết hạn (`status: "Expired"`).
  - Tăng giá trị phiên bản cache (`redis.incr("product:list:version:Fresh")`) để các truy vấn lọc sản phẩm của khách duyệt web biết được danh sách đã thay đổi và tiến hành xóa cache cũ, truy vấn lại thông tin mới nhất.

---

## 5. csrf.ts — Middleware Chống Giả Mạo Yêu Cầu Từ Trang Thứ Ba

Tệp [backend/src/middlewares/csrf.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/middlewares/csrf.ts) thực thi cơ chế an toàn Double Submit Cookie.

### Phân tích dòng code:

* **Dòng 7-25: generateCsrfToken (Tạo token)**
  - Kiểm tra xem cookie `csrfToken` đã tồn tại trong trình duyệt chưa.
  - Nếu chưa, sử dụng hàm `crypto.randomBytes(32)` để tạo ra một chuỗi ngẫu nhiên dài 64 ký tự (hệ thập lục phân).
  - Gửi cookie này về trình duyệt của khách hàng với tùy chọn `httpOnly: false` (bởi ứng dụng React SPA cần đọc được cookie này để gửi kèm trong HTTP Headers khi thao tác dữ liệu), cấu hình `sameSite: "strict"` để đảm bảo trình duyệt không tự động gửi cookie này trong các request chuyển tiếp từ trang web khác.

* **Dòng 27-35: validateCsrf (Kiểm tra token)**
  - Lấy giá trị token do React Client gửi lên trong Header `x-csrf-token` và đối chiếu với token lưu trong Cookie của người dùng (`req.cookies.csrfToken`).
  - Sử dụng hàm kiểm tra an toàn chống tấn công Timing Attack `safeCompare` để so khớp:
    ```typescript
    if (!clientToken || !serverToken || !safeCompare(clientToken, serverToken)) {
       return res.status(403).json({ message: "CSRF token không hợp lệ" });
    }
    ```
    *(Tấn công Timing Attack đo lường thời gian xử lý so sánh chuỗi của CPU để đoán các ký tự đúng. safeCompare thực hiện so sánh có thời gian cố định bất kể chuỗi khớp bao nhiêu ký tự).*
  - Nếu không khớp hoặc thiếu token, lập tức chặn đứng request và trả về lỗi `403 Forbidden`.

---

## 6. swagger.ts — Tài Liệu Hóa API Tự Động (Swagger / OpenAPI 3.0)

Tệp [backend/src/config/swagger.ts](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/config/swagger.ts) cấu hình tự động quét mã nguồn các route để hiển thị tài liệu tương tác Swagger UI:
* Sử dụng `swagger-jsdoc` để định nghĩa cấu hình OpenAPI 3.0 bao gồm tiêu đề, phiên bản, server thử nghiệm và các sơ đồ bảo mật (Security Schemes) sử dụng cookie chứa JWT token.
* Chỉ dẫn đường dẫn quét JSDoc tại `./src/routes/*.ts` và các tệp tin JS tương ứng sau khi biên dịch giúp Swagger UI luôn hoạt động chính xác cả ở môi trường local development và production.
* Tích hợp Route `/api-docs` phục vụ giao diện HTML trực quan.
