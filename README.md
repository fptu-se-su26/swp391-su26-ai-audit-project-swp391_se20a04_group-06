# HảiSản.vn — Hệ Thống Kết Nối Ngư Dân & Người Mua Thời Gian Thực

HảiSản.vn là một ứng dụng web hiện đại giúp kết nối trực tiếp ngư dân (người bán) và người mua hải sản theo khoảng cách địa lý (GPS), tích hợp tính năng trò chuyện thời gian thực (Real-time Chat), đánh giá độ uy tín và hệ thống đẩy tin bài đăng tự động.

---

## 🛠️ Công Nghệ Sử Dụng

### Backend

- **Runtime:** Node.js (v20+) & TypeScript
- **Framework:** Express.js
- **Database:** MySQL 8.0 (Sử dụng Connection Pooling & Migrations tự động)
- **Real-time:** Socket.IO (Xác thực trực tiếp bằng HttpOnly Cookie)
- **Bảo mật:** Helmet, CORS, Double-submit Cookie CSRF, Rate Limiting
- **File Upload:** Multer (Memory Storage) & Cloudinary SDK (Stream upload)

### Frontend

- **Framework:** ReactJS (Vite)
- **Đóng gói mã nguồn:** Lazy Loading (React.lazy & Suspense) để tối ưu hóa bundle
- **Xử lý lỗi:** React Error Boundaries tránh trắng trang
- **Giao tiếp API:** Fetch API tích hợp credentials (cookie-session) & tự động đính kèm CSRF token

---

## 📁 Cấu Trúc Thư Mục Chính

```text
seafood-project/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Logic nghiệp vụ (Auth, Product, Message,...)
│   │   ├── middlewares/      # Bảo mật & Tải file (Auth, CSRF, Upload)
│   │   ├── routes/           # Định tuyến API
│   │   ├── utils/            # Công cụ tính khoảng cách Haversine GPS
│   │   ├── app.ts            # Khởi chạy Express & Global Error Handling
│   │   └── db.ts             # Connection Pooling & Khởi chạy MySQL
│   ├── sql/                  # Script khởi tạo Database Schema & Seed
│   ├── Dockerfile
│   └── .env.example
├── client/
│   └── my-app/
│       ├── src/
│       │   ├── components/   # ChatBox, Map, ErrorBoundary, Shimmer Loading
│       │   ├── services/     # API Client & Socket.IO client (Cookie-based)
│       │   └── App.jsx       # Quản lý định tuyến và Lazy Loading
│       ├── Dockerfile
│       └── .env.example
├── docker-compose.yml        # Cấu hình container hóa Dev Environment
└── README.md
🔑 Cấu Hình Biến Môi Trường (.env)
Bạn cần tạo các file .env tương ứng dựa trên cấu trúc bên dưới:
1. Backend (/backend/.env)
code
Env
PORT=5000
CLIENT_URL=http://localhost:3000

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root123
DB_NAME=seafood_db

# Security
JWT_SECRET=thay_the_bang_chuoi_bi_mat_cua_ban_tai_day
JWT_EXPIRES_IN=7d

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=ten_cloud_cua_ban
CLOUDINARY_API_KEY=api_key_cua_ban
CLOUDINARY_API_SECRET=api_secret_cua_ban
2. Frontend (/client/my-app/.env)
code
Env
VITE_SOCKET_URL=http://localhost:5000
🚀 Hướng Dẫn Cài Đặt & Chạy Thử Nghiệm (Local Development)
Cách 1: Chạy trực tiếp bằng Node/npm
Yêu cầu hệ thống của bạn đã cài đặt sẵn Node.js v20+ và MySQL Server 8.0.
Khởi động Database:
Tạo cơ sở dữ liệu seafood_db trong MySQL của bạn và import file cấu trúc:
code
Bash
mysql -u root -p < backend/sql/schema.sql
Cài đặt & Khởi động Backend:
code
Bash
cd backend
npm install
npm run dev
Hệ thống sẽ tự động thực hiện migrations cơ sở dữ liệu khi khởi động thành công.
Cài đặt & Khởi động Frontend:
code
Bash
cd ../client/my-app
npm install
npm run dev
Mở trình duyệt truy cập: http://localhost:3000
Cách 2: Triển khai nhanh bằng Docker Compose
Môi trường phát triển đã được cấu hình tự động hóa toàn bộ bằng Docker (đã tích hợp cơ chế kiểm tra trạng thái của database trước khi khởi chạy backend).
Từ thư mục gốc chứa file docker-compose.yml, bạn chỉ cần chạy lệnh sau:
code
Bash
docker-compose up --build
Hệ thống sẽ tự động khởi chạy 3 container:
seafood_db (Port 3306)
seafood_backend (Port 5000)
seafood_frontend (Port 3000)
🔒 Các Tính Năng Bảo Mật Đã Triển Khai
HttpOnly Cookie JWT: Chống tấn công XSS lấy cắp token lưu trữ trong LocalStorage [1, 2].
Double-Submit Cookie CSRF: Phòng tránh tấn công giả mạo yêu cầu từ trang web trung gian thông qua việc kiểm soát mã CSRF ngẫu nhiên trên Header và Cookie.
Vệ sinh dữ liệu file tải lên: Giới hạn dung lượng ảnh cứng 5MB, giới hạn số lượng ảnh tối đa 5, và lọc nghiêm ngặt định dạng (chỉ cho phép JPEG, PNG, WEBP) [3].
Rate Limiting: Giới hạn tần suất 100 yêu cầu / 15 phút từ một địa chỉ IP để phòng chống Spam API và Brute-force mật khẩu [3, 4].
SQL Parameterization: Phòng chống tấn công SQL Injection bằng cách biên dịch trước toàn bộ dữ liệu đầu vào [2].
🌐 Danh Sách Các API Endpoints Chính
Phương thức	Đường dẫn API	Mô tả	Yêu cầu xác thực
POST	/api/auth/register	Đăng ký tài khoản mới	Không
POST	/api/auth/login	Đăng nhập hệ thống (Sinh HttpOnly Cookie)	Không
GET	/api/auth/me	Lấy thông tin tài khoản hiện tại	Có
PUT	/api/auth/profile	Cập nhật thông tin & Ảnh đại diện	Có
POST	/api/auth/logout	Đăng xuất (Xóa cookie token)	Có
GET	/api/products	Lấy danh sách sản phẩm (Hỗ trợ lọc GPS/search)	Không
GET	/api/products/:id	Xem chi tiết sản phẩm	Không
POST	/api/products	Đăng bán hải sản mới	Có
POST	/api/products/:id/bump	Đẩy bài đăng lên đầu (Cooldown 24h)	Có (Chủ bài)
GET	/api/messages/:productId	Lấy lịch sử trò chuyện theo sản phẩm	Có
GET	/api/messages/conversations	Lấy danh sách các cuộc hội thoại (Dashboard)	Có
```
