# 🐟 HảiSản.vn — Hệ Thống Chợ Hải Sản Bản Địa Kết Nối Thời Gian Thực Theo Vị Trí (GPS)

> **Dự án thuộc Phase 3: Nền tảng thương mại điện tử kết nối trực tiếp ngư dân (Seller) và người mua (Buyer) tối ưu hóa theo định vị bản đồ và cuộc gọi video thời gian thực.**

---

## 📋 Cẩm Nang Tài Liệu Kỹ Thuật (Developer Portal)

Để đáp ứng nhu cầu tìm hiểu sâu và chi tiết về toàn bộ hệ thống cũng như cấu trúc từng dòng code của dự án, tài liệu kỹ thuật được phân chia khoa học thành **5 chuyên đề chuyên sâu** nằm trong thư mục `docs/`. 

Hãy truy cập các liên kết dưới đây để học và nghiên cứu hệ thống như một chuyên gia:

1. **[Chuyên đề 01: Kiến Trúc & Thiết Kế Hệ Thống](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/docs/01_architecture_and_design.md)**
   - Phân tích chi tiết cách web hoạt động, luồng truyền tải dữ liệu Client-Server.
   - Cơ chế cuộc gọi video ngang hàng P2P (WebRTC Signaling, SDP, ICE Candidates).
   - Cơ chế Auth bảo mật (JWT stateless + Refresh Token Rotation + Blacklist trong Redis).
   - Cơ chế Cổng chuyển khoản VietQR tự động qua Sepay Webhook.
   - Sơ đồ Cơ sở dữ liệu (ERD) và đặc tả chi tiết 11 collections của MongoDB.
   - Cơ chế hoạt động của các Index nâng cao (GeoJSON `2dsphere`, Text Index, Compound Indexes).
   - Giải pháp bảo mật (Rate Limiting, CSRF, NoSQL Injection, XSS, CORS).

2. **[Chuyên đề 02: Phân Tích Mã Nguồn Hạ Tầng Backend](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/docs/02_backend_framework_core.md)**
   - Giải thích chi tiết từng dòng code (Line-by-line) của các file điều phối trung tâm backend:
     - `app.ts` (Bootstrap, Middlewares, Rate Limiters, Graceful Shutdown).
     - `db.ts` (Mongoose connection, Index builder).
     - `socket.ts` (Socket.IO server, Redis Adapter, Room Isolation, WebRTC signaling).
     - `cron.ts` (Tiến trình chạy ngầm node-cron).
     - Các middlewares bảo mật: `csrf.ts`, `auth.ts`, `validate.ts`, `upload.ts`.

3. **[Chuyên đề 03: Bản Đồ Nghiệp Vụ & Hệ Thống Kiểm Thử Backend](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/docs/03_backend_business_logic.md)**
   - Bản đồ hóa toàn bộ các thư mục nghiệp vụ backend. Giải thích công dụng của **tất cả** các file controllers, services, repositories, routes, validations.
   - Giải thích từng dòng code (Line-by-line) nghiệp vụ mẫu:
     - `user.service.ts` (Logic xóa tài khoản cascade GDPR nâng cao).
     - `product.service.ts` & `product.controller.ts` (Truy vấn GeoJSON `$near` GPS và logic cooldown 24h đẩy bài).
     - `payment.controller.ts` (Nhận & verify webhook Sepay).
   - **Hệ thống Kiểm thử tự động (Jest Tests):** Danh sách 16 file `.test.ts`, cấu hình Jest và giải thích line-by-line file test `admin.service.test.ts`.

4. **[Chuyên đề 04: Phân Tích Mã Nguồn Nền Tảng Client (React)](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/docs/04_client_architecture_and_core.md)**
   - Giải thích chi tiết từng dòng code (Line-by-line) cấu trúc React App:
     - `App.jsx` (Routes, lazy loading Suspense, route guards, unread message state sync).
     - Contexts: `AuthProvider.jsx` (Stateless JWT token sync & refresh), `VideoCallProvider.jsx` (WebRTC peer connection state).
     - Custom Hooks: `useApiFetch.js`, `useNotifications.js`, `useSEO.js`.
     - Services & Utils: `api.js` (Fetch API wrapper), `socket.js` (Singleton Socket client).

5. **[Chuyên đề 05: Bản Đồ Trang & Các Thành Phần Giao Diện React](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/docs/05_client_pages_and_components.md)**
   - Bản đồ hóa toàn bộ các thư mục React client, giải thích vai trò của **tất cả** các tệp tin trong `components/` và `pages/`.
   - Phân tích chi tiết dòng code (Line-by-line) của các chức năng giao diện quan trọng:
     - `MapExplore.jsx` hoặc `HomePage.jsx` (Tích hợp bản đồ Leaflet, GPS Geolocation API).
     - `ChatBox.jsx` (Giao diện hội thoại realtime, upload ảnh, gửi vị trí).
     - `VideoCallOverlay.jsx` (Hiển thị video stream WebRTC và bảng điều khiển).

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Local

### Yêu cầu ban đầu:
- **Node.js** v20 trở lên.
- **MongoDB** Community Server 7.0 trở lên (đã kích hoạt service).
- **Redis** Server 7.0 trở lên (đã kích hoạt service).

### 9.1 Cài đặt Backend:
1. Di chuyển vào thư mục backend và cài đặt dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Tạo file cấu hình môi trường `.env`:
   ```bash
   # Tạo file .env và điền đầy đủ thông tin (Xem mục Biến môi trường bên dưới)
   # File mẫu nằm ở backend/.env.example
   ```
3. Chạy backend ở chế độ Development (mặc định tại cổng `5000`):
   ```bash
   npm run dev
   ```

### 9.2 Cài đặt Frontend:
1. Di chuyển vào thư mục client và cài đặt:
   ```bash
   cd client
   npm install
   ```
2. Tạo file cấu hình môi trường `.env`:
   ```bash
   # Tạo file .env dựa trên file .env.example của client
   ```
3. Chạy frontend ở chế độ Development (mặc định tại cổng `3000`):
   ```bash
   npm run dev
   ```

---

## 🐳 Triển Khai Nhanh Bằng Docker Compose

Docker Compose giúp tự động dựng toàn bộ môi trường (gồm cả MongoDB và Redis) chỉ với một câu lệnh:

1. Đảm bảo đã cài đặt và chạy **Docker Desktop** trên máy.
2. Tại thư mục gốc của dự án (nơi chứa tệp `docker-compose.yml`), chạy lệnh:
   ```bash
   docker-compose up --build -d
   ```
3. Các cổng truy cập sau khi container khởi chạy thành công:
   - **Frontend**: [http://localhost:3000](http://localhost:3000)
   - **Backend**: [http://localhost:5000](http://localhost:5000)
   - **MongoDB**: Chạy nội bộ tại cổng `27017`
   - **Redis**: Chạy nội bộ tại cổng `6379`
4. Để dừng hệ thống:
   ```bash
   docker-compose down
   ```

---

## 🧪 Hướng Dẫn Chạy Kiểm Thử Tự Động (Tests)

Hệ thống backend tích hợp bộ kiểm thử đơn vị (Unit Tests) toàn diện sử dụng Jest:

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Chạy toàn bộ các test suites:
   ```bash
   npm run test
   ```
3. Chạy test và xuất báo cáo độ bao phủ mã nguồn (Coverage Report):
   ```bash
   npm run test:cov
   ```
   *Báo cáo HTML sẽ được xuất ra thư mục `backend/coverage/lcov-report/index.html`. Bạn có thể mở tệp này bằng trình duyệt để xem tỷ lệ bao phủ của code.*

---

## 🔑 Danh Sách Các Biến Môi Trường (.env)

### Backend Configuration (`backend/.env`)
```env
# Database & Redis Configuration
MONGO_URI=mongodb://localhost:27017/seafood_db
REDIS_HOST=localhost
REDIS_PORT=6379

# Security Secrets
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
OTP_SECRET=your_otp_secret_key_here

# OAuth Google API
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Server Ports
PORT=5000
CLIENT_URL=http://localhost:3000

# Sepay Webhook API Key
SEPAY_WEBHOOK_KEY=your_sepay_webhook_api_key_here

# Cloudinary Media CDN
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# ESMS SMS Gateway (OTP)
ESMS_API_KEY=your_esms_api_key
ESMS_SECRET_KEY=your_esms_secret_key
ESMS_SMS_TYPE=4
ESMS_BRANDNAME=your_brandname

# Email SMTP (Gmail fallback)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password

# AI Chatbot Config (Groq Cloud)
GROQ_API_KEY=your_groq_api_key_here
```

### Frontend Configuration (`client/.env`)
```env
# Socket.IO Server Address
VITE_SOCKET_URL=http://localhost:5000

# Google Client ID for OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---
<p align="center">
  Made with ❤️ by the HảiSản.vn Development Team · Phase 3 · 2026
</p>
