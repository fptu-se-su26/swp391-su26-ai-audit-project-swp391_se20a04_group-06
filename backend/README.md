# 🐟 HảiSản.vn — Backend

Backend cho ứng dụng mua bán hải sản, xây dựng bằng **Node.js + Express + TypeScript + MongoDB + Mongoose + Socket.IO + Redis**.

---

## 🛠️ Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 + TypeScript |
| Database | MongoDB (thông qua Mongoose ODM) |
| Cache | Redis (Rate limiting & Session recovery) |
| Auth | JWT (jsonwebtoken) + CSRF + OTP |
| Real-time | Socket.IO 4 |
| File upload | Multer (memory) → Cloudinary |
| Cron job | node-cron (mỗi giờ expire hải sản tươi) |
| GPS filter | GeoJSON 2dsphere index (bán kính 20km) |

---

## ⚡ Cài đặt nhanh

### 1. Cài dependencies

```bash
npm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
# Mở .env và điền thông tin MongoDB, Redis, và Cloudinary của bạn
```

Các biến cần thiết:
```env
MONGO_URI=mongodb://localhost:27017/seafood_db
REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your_super_secret_key
OTP_SECRET=your_otp_secret_key_32_chars

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

CLIENT_URL=http://localhost:3000
PORT=5000
```

### 3. Khởi tạo Database

MongoDB tự động khởi tạo cơ sở dữ liệu và cấu trúc các collections khi hệ thống chạy lần đầu tiên.
Mongoose tự động đồng bộ và xây dựng các chỉ mục (`2dsphere` cho tìm kiếm vị trí, `text` cho tìm kiếm tên/mô tả).

> Tài khoản admin mặc định: SĐT `0000000000` / mật khẩu `password123`

### 4. Chạy ở chế độ dev

```bash
npm run dev
```

Server khởi động tại: `http://localhost:5000`

### 5. Build production

```bash
npm run build
npm start
```

---

## 📡 API Endpoints

### Auth
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/auth/register` | Đăng ký tài khoản mới |
| POST | `/api/auth/login` | Đăng nhập, nhận JWT |
| GET | `/api/auth/me` | Thông tin user hiện tại 🔒 |

**Body đăng ký:** `{ name, phone, password }`
**Body đăng nhập:** `{ phone, password }`

---

## 📁 Cấu trúc thư mục

```
seafood-backend/
├── src/
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── product.controller.ts
│   │   ├── image.controller.ts
│   │   ├── message.controller.ts
│   │   └── admin.controller.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── product.routes.ts
│   │   ├── image.routes.ts
│   │   ├── message.routes.ts
│   │   └── admin.routes.ts
│   ├── middlewares/
│   │   ├── auth.ts          ← JWT guard
│   │   └── upload.ts        ← Multer + Cloudinary
│   ├── utils/
│   │   └── haversine.ts     ← Công thức tính khoảng cách GPS
│   ├── db.ts                ← MongoDB Connection (Mongoose)
│   ├── socket.ts            ← Socket.IO real-time chat
│   ├── cron.ts              ← Auto-expire hải sản tươi 24h
│   └── app.ts               ← Entry point
├── .env.example
├── package.json
└── tsconfig.json
```
