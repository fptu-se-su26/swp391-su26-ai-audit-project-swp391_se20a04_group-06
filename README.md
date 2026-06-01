# HảiSản.vn 🦀🐟

**Nền tảng thương mại điện tử hải sản tươi sống & khô** – Kết nối trực tiếp ngư dân với người mua.

HảiSản.vn giúp người mua tìm được hải sản **tươi sống**, **có vị trí GPS**, **chat realtime** và **gọi video** xác nhận chất lượng với người bán.

---

## ✨ Tính năng nổi bật

### Người mua
- Xem sản phẩm tươi theo **bán kính 20km** (GPS)
- Tìm kiếm & lọc theo loại (Tươi / Khô)
- **Chat realtime** + **Gọi video** với người bán
- Theo dõi người bán, yêu thích sản phẩm
- Đánh giá & xem review
- Thanh toán qua **Sepay** (Webhook)

### Người bán (Ngư dân)
- Đăng bán hải sản tươi & khô
- Giới hạn 10 bài/ngày (tài khoản thường)
- Nâng cấp **Premium** để đăng không giới hạn
- Quản lý đơn hàng, tin nhắn, thông báo

### Admin
- Xác minh người bán
- Quản lý sản phẩm, báo cáo vi phạm
- Thống kê hệ thống

### Chung
- Hệ thống thông báo realtime
- Xác thực Google + Email/Password
- Upload ảnh Cloudinary
- Rate limiting & Bảo mật (CSRF, Helmet, JWT)

---

## 🛠 Công nghệ sử dụng

### Backend
- **Node.js** + **Express**
- **MongoDB** (Mongoose)
- **Redis** (Cache + Rate limit + Socket adapter)
- **Socket.io** (Chat realtime + Video Call)
- **JWT** + **Cookie-based Auth**
- **Cloudinary** (Image upload)
- **Winston** + Daily Rotate Logs

### Frontend
- **React 18** + **Vite**
- **React Router v6**
- **Leaflet** (Bản đồ)
- **Context API** + Custom Hooks
- **Tailwind / CSS Modules**

### DevOps
- **Docker** + **Docker Compose**
- GitHub Actions (AI Audit Log Check)

---

## 🚀 Cài đặt & Chạy dự án

### 1. Clone repository
```bash
git clone <repository-url>
cd haisan.vn
2. Cấu hình môi trường
Backend:
Bashcd backend
cp .env.example .env
Frontend:
Bashcd client/my-app
cp .env.example .env
3. Chạy bằng Docker (Khuyến nghị)
Bashdocker-compose up --build
4. Chạy thủ công
Bash# Backend
cd backend && npm install && npm run dev

# Frontend
cd client/my-app && npm install && npm run dev
5. Seed dữ liệu
Bashmysql -u root -p seafood_db < backend/sql/seed.sql

📁 Cấu trúc dự án
texthaisan.vn/
├── backend/                  # Node.js + Express API
├── client/my-app/            # React + Vite Frontend
├── database/                 # SQL schema & seed
├── docker-compose.yml
├── docs/                     # Tài liệu AI, Prompt, Reflection, Changelog
└── README.md

🔑 Biến môi trường quan trọng
Backend (.env)

JWT_SECRET
MONGODB_URI
REDIS_URL
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
GOOGLE_CLIENT_ID
SEPAY_SECRET_KEY

Frontend (.env)

VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID


📱 Tính năng kỹ thuật nổi bật

Fresh Product Filtering bằng Haversine + MongoDB Geo
WebRTC Video Call qua Socket.io
Sepay Webhook tích hợp nâng cấp Premium
Redis Cache Layer thông minh
GDPR-compliant xóa tài khoản vĩnh viễn
AI Audit Log bắt buộc qua GitHub Actions


🤝 Đóng góp

Fork project
Tạo branch: git checkout -b feature/ten-tinh-nang
Commit thay đổi
Push và mở Pull Request

Yêu cầu khi PR:

Cập nhật docs/AI_AUDIT_LOG.md, docs/CHANGELOG.md
Đảm bảo code chạy không lỗi
