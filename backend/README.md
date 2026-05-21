<<<<<<< HEAD
# 🐟 HảiSản.vn — Backend

Backend cho ứng dụng mua bán hải sản, xây dựng bằng **Node.js + Express + TypeScript + MySQL + Socket.IO**.

---

## 🛠️ Công nghệ sử dụng

| Lớp | Công nghệ |
|---|---|
| Runtime | Node.js 18+ |
| Framework | Express 4 + TypeScript |
| Database | MySQL 8 (mysql2/promise) |
| Auth | JWT (jsonwebtoken) + bcryptjs |
| Real-time | Socket.IO 4 |
| File upload | Multer (memory) → Cloudinary |
| Cron job | node-cron (mỗi giờ expire hải sản tươi) |
| GPS filter | Haversine formula (bán kính 20km) |

---

## ⚡ Cài đặt nhanh

### 1. Cài dependencies

```bash
cd seafood-backend
npm install
```

### 2. Cấu hình môi trường

```bash
cp .env.example .env
# Mở .env và điền thông tin MySQL + Cloudinary
```

Các biến cần thiết:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=yourpassword
DB_NAME=seafood_db

JWT_SECRET=your_super_secret_key

CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...

CLIENT_URL=http://localhost:3000
PORT=5000
```

### 3. Tạo database và bảng

```bash
mysql -u root -p < sql/schema.sql
mysql -u root -p seafood_db < sql/seed.sql
```

> Tài khoản seed mẫu dùng mật khẩu: **password123**
> Admin: SĐT `0000000000` / mật khẩu `password123`

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

### Products
| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/products` | Danh sách sản phẩm (public) |
| GET | `/api/products/my` | Bài đăng của tôi (Dashboard) 🔒 |
| GET | `/api/products/:id` | Chi tiết sản phẩm (public) |
| POST | `/api/products` | Tạo bài đăng mới 🔒 |
| PUT | `/api/products/:id` | Cập nhật bài đăng 🔒 |
| DELETE | `/api/products/:id` | Xoá bài đăng 🔒 |

**Query params GET /api/products:**
- `type` = `Fresh` | `Dried`
- `lat` + `lng` = GPS của buyer → lọc hải sản tươi trong 20km (Haversine)
- `search` = tìm theo tên (LIKE)
- `page`, `limit` = phân trang

---

### Images
| Method | Path | Mô tả |
|---|---|---|
| POST | `/api/products/:id/images` | Upload ảnh (multipart, field: `images`, tối đa 5) 🔒 |
| DELETE | `/api/images/:id` | Xoá ảnh (Cloudinary + DB) 🔒 |

---

### Messages (REST + Socket.IO)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/messages/unread-count` | Số tin chưa đọc 🔒 |
| GET | `/api/messages/:productId` | Lịch sử chat của 1 bài đăng 🔒 |
| POST | `/api/messages` | Gửi tin (REST fallback) 🔒 |

---

### Admin (Admin only 🔐)
| Method | Path | Mô tả |
|---|---|---|
| GET | `/api/admin/stats` | Thống kê tổng quan |
| GET | `/api/admin/users` | Danh sách người dùng |
| PATCH | `/api/admin/users/:id/toggle` | Khoá / Mở khoá tài khoản |
| GET | `/api/admin/listings` | Tất cả bài đăng |
| DELETE | `/api/admin/listings/:id` | Xoá bài (kèm ảnh Cloudinary) |

---

## 🔌 Socket.IO

Kết nối với `?token=<JWT>`:

```js
import { io } from 'socket.io-client';
const socket = io('http://localhost:5000', { auth: { token: 'your_jwt' } });

// Vào room chat của product
socket.emit('join_room', productId);

// Gửi tin
socket.emit('send_message', { productId, receiverId, content: 'Cá còn không?' });

// Nhận tin mới
socket.on('new_message', (msg) => { /* cập nhật UI */ });

// Nhận thông báo (khi không trong room)
socket.on('notification', (data) => { /* hiện badge */ });
```

---

## ⏰ Cronjob

Chạy **mỗi giờ**, tự động chuyển hải sản tươi quá 24h từ lúc cập bến sang `Status = 'Expired'`.
Bài expired không xuất hiện trên trang chủ (API lọc `WHERE Status = 'Active'`).

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
│   ├── db.ts                ← MySQL pool
│   ├── socket.ts            ← Socket.IO real-time chat
│   ├── cron.ts              ← Auto-expire hải sản tươi 24h
│   └── app.ts               ← Entry point
├── sql/
│   ├── schema.sql
│   └── seed.sql
├── .env.example
├── package.json
└── tsconfig.json
```
=======
# seafood
>>>>>>> 345cc18aecc3a0b2f9f33a22e939a3c0f63e2eaf
