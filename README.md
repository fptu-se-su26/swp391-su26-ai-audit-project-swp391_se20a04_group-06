# 🐟 HảiSản.vn — Phase 3

> **Marketplace kết nối ngư dân & người mua hải sản theo GPS thời gian thực**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=flat-square&logo=bootstrap)](https://getbootstrap.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://docs.docker.com/compose/)

---

## 📋 Mục Lục

1. [Tổng Quan](#1-tổng-quan)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Tech Stack](#3-tech-stack)
4. [Cấu Trúc Thư Mục](#4-cấu-trúc-thư-mục)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Tính Năng Bảo Mật](#7-tính-năng-bảo-mật)
8. [Cài Đặt & Chạy Local](#8-cài-đặt--chạy-local)
9. [Triển Khai Docker](#9-triển-khai-docker)
10. [Tính Năng Chi Tiết](#10-tính-năng-chi-tiết)
11. [Biến Môi Trường](#11-biến-môi-trường)

---

## 1. Tổng Quan

**HảiSản.vn** là ứng dụng web marketplace giúp kết nối trực tiếp ngư dân (người bán) và người mua hải sản dựa trên khoảng cách địa lý (GPS). Hệ thống tích hợp đầy đủ các tính năng của một nền tảng thương mại điện tử hiện đại.

### Bài Toán & Giải Pháp

| Bài toán                                | Giải pháp                                      |
| --------------------------------------- | ---------------------------------------------- |
| Ngư dân khó tiếp cận thị trường         | Đăng bài bán trực tiếp, không qua trung gian   |
| Người mua không biết hải sản tươi ở đâu | Tìm kiếm theo GPS, lọc theo bán kính km        |
| Thiếu tin tưởng giữa hai bên            | Hệ thống đánh giá (Review) & huy hiệu xác minh |
| Liên lạc chậm, bất tiện                 | Real-time Chat tích hợp theo từng bài đăng     |

### Phạm Vi Chức Năng

- ✅ Đăng ký / Đăng nhập bằng số điện thoại (OTP) hoặc Google OAuth 2.0
- ✅ Đăng bán hải sản (tươi / khô) kèm ảnh, GPS, thời gian đánh bắt
- ✅ Tìm kiếm theo GPS bán kính, full-text search, lọc loại/giá
- ✅ Chat thời gian thực (Socket.IO) gắn với từng bài đăng
- ✅ Đẩy bài đăng lên đầu — Bump (cooldown 24h)
- ✅ Đánh giá người bán sau giao dịch (1–5 sao, kèm ảnh)
- ✅ Follow người bán yêu thích
- ✅ Yêu thích (Favorite) bài đăng
- ✅ Thông báo real-time (Notification)
- ✅ Báo cáo vi phạm (Report)
- ✅ Bảng điều khiển Admin: quản lý người dùng, sản phẩm, báo cáo, thống kê
- ✅ Dashboard cá nhân: quản lý bài đăng, hội thoại, thông báo

---

## 2. Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                       │
│  React 19 + Vite · React Router v6 · React-Leaflet       │
│  Bootstrap 5 · Lazy Loading · Error Boundary             │
└───────────────┬─────────────────────┬───────────────────┘
                │  REST API (Fetch)   │  WebSocket (Socket.IO)
                │  + HttpOnly Cookie  │  + Cookie Auth
                ▼                     ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js / Express)              │
│  TypeScript · Express 4 · Socket.IO 4                    │
│  ┌─────────────┐ ┌──────────────┐ ┌──────────────────┐  │
│  │  REST API   │ │  Socket.IO   │ │   Cron Jobs      │  │
│  │  /api/*     │ │  Server      │ │  (auto-expire)   │  │
│  └──────┬──────┘ └──────┬───────┘ └──────────────────┘  │
│         │               │                                  │
│  ┌──────▼───────────────▼──────────────────────────────┐ │
│  │   Middlewares (Auth JWT · CSRF · Rate Limit)          │ │
│  └──────────────────────┬──────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────┘
                           │
          ┌────────────────┼───────────────────┐
          ▼                ▼                   ▼
    ┌─────────────┐  ┌────────────┐  ┌─────────────────┐
    │   MongoDB   │  │   Redis    │  │   Cloudinary    │
    │  (Database) │  │  (Cache)   │  │  (Image CDN)    │
    └─────────────┘  └────────────┘  └─────────────────┘
```

### Luồng Xác Thực (Auth Flow)

**Phone/Password:**

```
[Client] → POST /api/auth/login
         ← Set-Cookie: token=<JWT>; HttpOnly; SameSite=Strict
         ← Set-Cookie: csrf_token=<random>; SameSite=Strict

[Client] → POST /api/* (mutation)
           Header: X-CSRF-Token: <từ cookie csrf_token>
           Cookie: token=<JWT> (tự động đính kèm)
         ← 200 OK | 403 Forbidden (nếu CSRF không khớp)
```

**Google OAuth (Sign-in with Google):**

```
[Client] → Google Identity Services (One Tap / Button)
         ← Google trả về id_token (JWT)

[Client] → POST /api/auth/google { id_token }
         ← Verify token với Google → Set-Cookie (same as above)
```

---

## 3. Tech Stack

### Backend — Thư viện & lý do chọn

| Thư viện / Công nghệ               | Vai trò             | Lý do chọn                                                                                                                                 |
| ---------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Node.js (v20+)                     | Runtime             | Non-blocking I/O phù hợp cho ứng dụng real-time, hệ sinh thái npm phong phú, cùng ngôn ngữ JS/TS giữa client & server giúp tăng năng suất. |
| TypeScript                         | Ngôn ngữ            | Kiểm tra kiểu tĩnh, tăng tính an toàn khi refactor, hỗ trợ IDE thông minh, giảm lỗi runtime.                                               |
| Express                            | HTTP framework      | Nhẹ, linh hoạt, ecosystem middleware rộng, dễ mở rộng cho REST API.                                                                        |
| Mongoose                           | ODM cho MongoDB     | Định nghĩa schema, validation, hooks và tiện lợi cho thao tác tài liệu (documents).                                                        |
| socket.io                          | Real-time WebSocket | Cung cấp abstraction cho WebSocket + fallback, rooms, dễ tích hợp chat/notification.                                                       |
| jsonwebtoken (JWT)                 | Xác thực            | Hỗ trợ auth stateless kết hợp HttpOnly cookie để bảo mật.                                                                                  |
| bcryptjs                           | Hash mật khẩu       | Mã hóa mật khẩu an toàn, thư viện đơn giản và phổ biến.                                                                                    |
| helmet, express-rate-limit         | Bảo mật             | Cải thiện HTTP headers, chống brute-force và các tấn công cơ bản.                                                                          |
| multer, streamifier                | File upload         | Xử lý upload an toàn, stream ảnh trực tiếp lên Cloudinary để giảm I/O trên server.                                                         |
| cloudinary                         | Lưu ảnh & CDN       | Xử lý ảnh (resize, format), CDN giảm tải cho backend và tăng tốc tải ảnh.                                                                  |
| ioredis + @socket.io/redis-adapter | Redis & scaling     | Lưu OTP, cache, pub/sub cho socket adapter để scale nhiều instance Socket.IO.                                                              |
| node-cron                          | Cron job            | Chạy tác vụ định kỳ (auto-expire bài đăng, báo cáo thống kê).                                                                              |
| winston, winston-daily-rotate-file | Logging             | Ghi log có cấu trúc, rotate theo ngày hỗ trợ vận hành.                                                                                     |

### Frontend — Thư viện & lý do chọn

| Thư viện / Công nghệ          | Vai trò               | Lý do chọn                                                                            |
| ----------------------------- | --------------------- | ------------------------------------------------------------------------------------- |
| React (v19)                   | UI Framework          | Component-driven giúp tái sử dụng UI, cộng đồng lớn, phù hợp app SPA.                 |
| Vite                          | Build tool/dev server | Khởi động nhanh, HMR nhanh, thời gian build ngắn so với bundlers cũ.                  |
| React-Leaflet (OpenStreetMap) | Bản đồ                | Hỗ trợ hiển thị vị trí sản phẩm, tìm kiếm theo bán kính, không phụ thuộc Google Maps. |
| Bootstrap                     | UI kit                | Thiết kế responsive nhanh, dễ áp dụng layout sẵn.                                     |
| Google Identity Services      | OAuth                 | One Tap & OAuth tiêu chuẩn giúp đăng nhập nhanh, giảm friction cho người dùng.        |

### Hạ tầng & lý do chọn

| Công nghệ               | Vai trò              | Lý do chọn                                                                                                                                     |
| ----------------------- | -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| MongoDB                 | Database             | Mô hình document linh hoạt phù hợp dữ liệu sản phẩm thay đổi (images, priceHistory, location); hỗ trợ GeoJSON & tìm kiếm văn bản (text index). |
| Redis                   | Cache / OTP / PubSub | Lưu trữ tạm thời (OTP), cache kết quả truy vấn, pub/sub giúp scale Socket.IO.                                                                  |
| Cloudinary              | Image CDN            | Tối ưu hóa ảnh, bảo mật public_id, delivery qua CDN.                                                                                           |
| Docker + Docker Compose | Container            | Tái tạo môi trường dev/test dễ dàng, triển khai nhất quán giữa máy dev và server.                                                              |

### Tóm tắt lý do phối hợp

Node.js + MongoDB phù hợp cho workload real-time, nhiều kết nối đồng thời, và dữ liệu bán cấu trúc (hải sản có nhiều thuộc tính khác nhau). Redis làm nhiệm vụ giảm độ trễ cho OTP và scale giao tiếp realtime; Cloudinary giảm bẩn tải backend từ xử lý ảnh. TypeScript xuyên suốt giúp giảm lỗi và tăng tốc phát triển tính năng.

---

## 4. Cấu Trúc Thư Mục

```
shop_sea_fixed/
├── backend/
│   ├── src/
│   │   ├── controllers/          # Business logic
│   │   │   ├── auth.controller.ts       # Đăng ký, đăng nhập, Google OAuth, profile
│   │   │   ├── product.controller.ts    # CRUD sản phẩm, tìm kiếm GPS
│   │   │   ├── message.controller.ts    # Lịch sử chat, danh sách hội thoại
│   │   │   ├── review.controller.ts     # Đánh giá người bán
│   │   │   ├── admin.controller.ts      # Quản trị hệ thống
│   │   │   ├── notification.controller.ts # Thông báo
│   │   │   ├── favorite.controller.ts   # Yêu thích bài đăng
│   │   │   ├── follow.controller.ts     # Theo dõi người bán
│   │   │   ├── image.controller.ts      # Upload ảnh Cloudinary
│   │   │   ├── report.controller.ts     # Báo cáo vi phạm
│   │   │   └── user.controller.ts       # Profile công khai người dùng
│   │   ├── middlewares/
│   │   │   ├── auth.ts           # Xác thực JWT + phân quyền Admin
│   │   │   ├── csrf.ts           # Double-submit CSRF protection
│   │   │   └── upload.ts         # Multer: giới hạn 5MB, 5 ảnh, JPEG/PNG/WEBP
│   │   ├── routes/               # Định nghĩa API endpoints
│   │   ├── services/
│   │   │   └── notification.service.ts  # Logic tạo thông báo
│   │   ├── utils/
│   │   │   └── haversine.ts      # Tính khoảng cách GPS (km)
│   │   ├── helpers/
│   │   │   └── response.helper.ts  # Chuẩn hóa response format
│   │   ├── app.ts                # Entry point, khởi tạo Express & Middleware
│   │   ├── db.ts                 # Kết nối MongoDB thông qua Mongoose
│   │   ├── socket.ts             # Socket.IO server (chat + notifications)
│   │   └── cron.ts               # Cron job tự động hết hạn sản phẩm
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── client/my-app/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx           # Trang chủ + bản đồ + danh sách sản phẩm
│   │   │   ├── AuthPage.jsx           # Đăng nhập / Đăng ký + Google OAuth
│   │   │   ├── ProductDetailPage.jsx  # Chi tiết sản phẩm + chat + review
│   │   │   ├── PostListingPage.jsx    # Đăng / chỉnh sửa bài đăng
│   │   │   ├── DashboardPage.jsx      # Dashboard cá nhân
│   │   │   ├── ProfilePage.jsx        # Trang hồ sơ cá nhân
│   │   │   ├── ForgotPasswordPage.jsx # Quên mật khẩu (OTP)
│   │   │   ├── SellerProfilePage.jsx  # Trang hồ sơ công khai người bán
│   │   │   └── AdminPage.jsx          # Bảng điều khiển Admin
│   │   ├── components/
│   │   │   ├── ChatBox.jsx            # Giao diện chat real-time
│   │   │   ├── ChatPopover.jsx        # Hộp chat nổi (popover)
│   │   │   ├── ProductCard.jsx        # Card hiển thị sản phẩm
│   │   │   ├── ReviewList.jsx         # Danh sách đánh giá
│   │   │   ├── NotificationBell.jsx   # Chuông thông báo
│   │   │   ├── MapExplore.jsx         # Bản đồ khám phá GPS
│   │   │   ├── MapMini.jsx            # Bản đồ thu nhỏ trên card
│   │   │   ├── ImageSlider.jsx        # Trình chiếu ảnh sản phẩm
│   │   │   ├── InboxTab.jsx           # Hộp thư đến
│   │   │   ├── VerifiedBadge.jsx      # Huy hiệu xác minh
│   │   │   └── ErrorBoundary.jsx      # Bắt lỗi React toàn cục
│   │   ├── hooks/
│   │   │   ├── useNotifications.js    # Hook quản lý thông báo real-time
│   │   │   ├── useSEO.js              # Hook SEO meta tags động
│   │   │   ├── useCountdown.js        # Hook đếm ngược (cooldown bump)
│   │   │   └── useViewTransitionNavigate.js  # Hook chuyển trang mượt mà
│   │   ├── services/
│   │   │   ├── api.js                 # Fetch wrapper (tự động gắn CSRF token)
│   │   │   └── socket.js              # Socket.IO client (cookie-based auth)
│   │   └── utils/
│   │       ├── cloudinary.js          # Cloudinary upload helper
│   │       ├── format.jsx             # Format tiền tệ, ngày giờ
│   │       └── theme.js               # Quản lý dark/light theme
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── database/
│   └── seafood_db.sql             # Full database dump (dùng cho Docker init)
├── docker-compose.yml
└── README.md
```

---

## 5. Database Schema

### Entity Relationship Overview

```
User ──< Product ──< ProductImage
 │           │
 │           └──< Message (SenderID, ReceiverID)
 │           └──< Review  (ReviewerID, SellerID)
 │           └──< Favorite
 │           └──< Report
 │
 └──< Follow (FollowerID → SellerID)
 └──< Notification
```

> **Lưu ý:** Dự án dùng **MongoDB** (NoSQL). Các "bảng" bên dưới là Mongoose collections. Kiểu dữ liệu được ánh xạ tương đương.

### Collections Chi Tiết

#### `users`

| Field          | Kiểu                  | Mô tả                                  |
| -------------- | --------------------- | -------------------------------------- |
| `_id`          | ObjectId              | Khóa chính                             |
| `name`         | String                | Họ tên                                 |
| `phone`        | String (unique)       | Số điện thoại (đăng nhập truyền thống) |
| `googleId`     | String                | Google Account ID (OAuth)              |
| `email`        | String                | Email (Google OAuth)                   |
| `passwordHash` | String                | Mật khẩu đã hash (bcrypt)              |
| `role`         | `'User'` \| `'Admin'` | Vai trò, mặc định `'User'`             |
| `isActive`     | Boolean               | Tài khoản còn hoạt động (Admin toggle) |
| `isVerified`   | Boolean               | Huy hiệu xác minh (Admin cấp)          |
| `avatar`       | String                | URL ảnh đại diện (Cloudinary)          |
| `createdAt`    | Date                  | Thời điểm đăng ký                      |

#### `products`

| Field             | Kiểu                                     | Mô tả                               |
| ----------------- | ---------------------------------------- | ----------------------------------- |
| `_id`             | ObjectId                                 | Khóa chính                          |
| `sellerId`        | ObjectId → User                          | Người bán                           |
| `type`            | `'Fresh'` \| `'Dried'`                   | Hải sản tươi / khô                  |
| `name`            | String                                   | Tên sản phẩm                        |
| `description`     | String                                   | Mô tả                               |
| `price`           | Number                                   | Giá (VND/kg)                        |
| `salesType`       | `'Retail'` \| `'Wholesale'`              | Bán lẻ / bán sỉ                     |
| `totalWeight`     | Number                                   | Tổng trọng lượng (kg)               |
| `remainingWeight` | Number                                   | Còn lại (kg)                        |
| `status`          | `'Active'` \| `'Expired'` \| `'Deleted'` | Trạng thái bài đăng                 |
| `catchTime`       | Date                                     | _(Tươi)_ Thời điểm đánh bắt/cập bến |
| `location.lat`    | Number                                   | _(Tươi)_ Vĩ độ GPS                  |
| `location.lng`    | Number                                   | _(Tươi)_ Kinh độ GPS                |
| `origin`          | String                                   | _(Khô)_ Xuất xứ                     |
| `expiryDate`      | Date                                     | _(Khô)_ Hạn sử dụng                 |
| `images`          | Array\<{url, publicId}\>                 | Danh sách ảnh Cloudinary            |
| `bumpedAt`        | Date                                     | Thời điểm đẩy bài đăng gần nhất     |
| `createdAt`       | Date                                     | Thời điểm tạo                       |

#### `messages`

| Field        | Kiểu               | Mô tả                      |
| ------------ | ------------------ | -------------------------- |
| `productId`  | ObjectId → Product | Cuộc chat gắn với bài đăng |
| `senderId`   | ObjectId → User    | Người gửi                  |
| `receiverId` | ObjectId → User    | Người nhận                 |
| `content`    | String             | Nội dung tin nhắn          |
| `isRead`     | Boolean            | Đã đọc chưa                |
| `sentAt`     | Date               | Thời điểm gửi              |

#### `reviews`

| Field        | Kiểu               | Mô tả                     |
| ------------ | ------------------ | ------------------------- |
| `productId`  | ObjectId → Product | Sản phẩm được đánh giá    |
| `reviewerId` | ObjectId → User    | Người viết đánh giá       |
| `sellerId`   | ObjectId → User    | Người bán được đánh giá   |
| `rating`     | Number (1–5)       | Số sao                    |
| `comment`    | String             | Nội dung đánh giá         |
| `imageURL`   | String             | Ảnh đính kèm (Cloudinary) |

> **Constraint:** `UNIQUE(reviewerId, productId)` — mỗi người chỉ đánh giá một sản phẩm một lần.

---

## 6. API Reference

**Base URL:** `http://localhost:5000/api`  
**Authentication:** HttpOnly Cookie (`token=<JWT>`)  
**CSRF:** Header `X-CSRF-Token` bắt buộc cho mọi request mutation (POST/PUT/PATCH/DELETE)

---

### 6.1 Authentication — `/api/auth`

| Method | Path               | Mô tả                              | Auth | Rate Limit     |
| ------ | ------------------ | ---------------------------------- | ---- | -------------- |
| POST   | `/register`        | Đăng ký tài khoản mới              | ❌   | 5 req/giờ/IP   |
| POST   | `/login`           | Đăng nhập, set HttpOnly Cookie     | ❌   | 10 req/15ph/IP |
| POST   | `/google`          | Đăng nhập/đăng ký qua Google OAuth | ❌   | —              |
| POST   | `/logout`          | Đăng xuất, xóa cookie              | ✅   | —              |
| GET    | `/me`              | Lấy thông tin tài khoản hiện tại   | ✅   | —              |
| PUT    | `/profile`         | Cập nhật tên, ảnh đại diện         | ✅   | —              |
| POST   | `/change-password` | Đổi mật khẩu                       | ✅   | —              |

#### Request Bodies

**POST `/register`**

```json
{
  "name": "Nguyễn Văn A",
  "phone": "0901234567",
  "password": "matkhau123"
}
```

**POST `/login`**

```json
{
  "phone": "0901234567",
  "password": "matkhau123"
}
```

**POST `/google`**

```json
{
  "id_token": "<Google JWT trả về từ GIS>"
}
```

**PUT `/profile`** — `multipart/form-data`

```
name: string (tùy chọn)
avatar: File (JPEG/PNG/WEBP, tối đa 5MB)
```

---

### 6.2 OTP — `/api/otp`

| Method | Path      | Mô tả                    | Auth |
| ------ | --------- | ------------------------ | ---- |
| POST   | `/send`   | Gửi OTP về số điện thoại | ❌   |
| POST   | `/verify` | Xác minh OTP             | ❌   |

---

### 6.3 Products — `/api/products`

| Method | Path        | Mô tả                                        | Auth            |
| ------ | ----------- | -------------------------------------------- | --------------- |
| GET    | `/`         | Danh sách sản phẩm (hỗ trợ lọc đa điều kiện) | ❌              |
| GET    | `/my`       | Sản phẩm của người dùng đang đăng nhập       | ✅              |
| GET    | `/:id`      | Chi tiết một sản phẩm                        | ❌              |
| POST   | `/`         | Đăng bán sản phẩm mới                        | ✅              |
| PUT    | `/:id`      | Cập nhật sản phẩm                            | ✅ (chủ sở hữu) |
| DELETE | `/:id`      | Xóa sản phẩm                                 | ✅ (chủ sở hữu) |
| POST   | `/:id/bump` | Đẩy bài đăng lên đầu (cooldown 24h)          | ✅ (chủ sở hữu) |

#### Query Parameters — `GET /api/products`

| Param      | Kiểu               | Mô tả                      |
| ---------- | ------------------ | -------------------------- |
| `type`     | `Fresh` \| `Dried` | Lọc theo loại hải sản      |
| `search`   | string             | Full-text search tên/mô tả |
| `lat`      | number             | Vĩ độ người dùng (GPS)     |
| `lng`      | number             | Kinh độ người dùng (GPS)   |
| `radius`   | number             | Bán kính tìm kiếm (km)     |
| `minPrice` | number             | Giá tối thiểu (VND)        |
| `maxPrice` | number             | Giá tối đa (VND)           |
| `page`     | number             | Trang (phân trang)         |
| `limit`    | number             | Số bài/trang               |

---

### 6.4 Messages — `/api/messages`

| Method | Path             | Mô tả                         | Auth |
| ------ | ---------------- | ----------------------------- | ---- |
| GET    | `/unread-count`  | Số tin nhắn chưa đọc          | ✅   |
| GET    | `/conversations` | Danh sách tất cả hội thoại    | ✅   |
| GET    | `/:productId`    | Lịch sử chat của một sản phẩm | ✅   |
| POST   | `/`              | Gửi tin nhắn (REST fallback)  | ✅   |

> **Lưu ý:** Luồng chat chính chạy qua Socket.IO. REST endpoint dùng như fallback hoặc load lịch sử.

---

### 6.5 Reviews — `/api/reviews`

| Method | Path                | Mô tả                                      | Auth |
| ------ | ------------------- | ------------------------------------------ | ---- |
| POST   | `/`                 | Đăng đánh giá người bán (kèm ảnh tùy chọn) | ✅   |
| GET    | `/seller/:sellerId` | Lấy tất cả đánh giá của một người bán      | ❌   |

---

### 6.6 Notifications — `/api/notifications`

| Method | Path    | Mô tả                         | Auth |
| ------ | ------- | ----------------------------- | ---- |
| GET    | `/`     | Lấy danh sách thông báo       | ✅   |
| PUT    | `/read` | Đánh dấu tất cả đã đọc        | ✅   |
| PATCH  | `/:id`  | Đánh dấu một thông báo đã đọc | ✅   |

---

### 6.7 Follow — `/api/follows`

| Method | Path         | Mô tả                           | Auth |
| ------ | ------------ | ------------------------------- | ---- |
| POST   | `/:sellerId` | Follow người bán                | ✅   |
| DELETE | `/:sellerId` | Unfollow người bán              | ✅   |
| GET    | `/`          | Danh sách người bán đang follow | ✅   |

---

### 6.8 Favorites — `/api/favorites`

| Method | Path          | Mô tả                        | Auth |
| ------ | ------------- | ---------------------------- | ---- |
| POST   | `/:productId` | Thêm vào yêu thích           | ✅   |
| DELETE | `/:productId` | Xóa khỏi yêu thích           | ✅   |
| GET    | `/`           | Danh sách bài đăng yêu thích | ✅   |

---

### 6.9 Reports — `/api/reports`

| Method | Path          | Mô tả                           | Auth          |
| ------ | ------------- | ------------------------------- | ------------- |
| POST   | `/:productId` | Tạo báo cáo vi phạm             | ✅            |
| GET    | `/`           | Xem danh sách báo cáo           | ✅ Admin only |
| PATCH  | `/:id`        | Xử lý báo cáo (resolve/dismiss) | ✅ Admin only |

---

### 6.10 Admin — `/api/admin`

> **Yêu cầu:** `role = 'Admin'` — toàn bộ các endpoint dưới đây đều bị chặn nếu không phải Admin.

| Method | Path                | Mô tả                                            |
| ------ | ------------------- | ------------------------------------------------ |
| GET    | `/stats`            | Thống kê tổng quan (users, products, reports...) |
| GET    | `/users`            | Danh sách tất cả người dùng                      |
| PATCH  | `/users/:id/toggle` | Kích hoạt / vô hiệu hóa tài khoản                |
| PATCH  | `/users/:id/verify` | Cấp huy hiệu xác minh cho người bán              |
| GET    | `/listings`         | Danh sách tất cả bài đăng                        |
| DELETE | `/listings/:id`     | Xóa bài đăng vi phạm                             |

---

### 6.11 Real-time — Socket.IO Events

**Namespace:** `/` (default)  
**Auth:** Cookie `token` tự động gửi khi kết nối

#### Client → Server

| Event          | Payload                              | Mô tả                            |
| -------------- | ------------------------------------ | -------------------------------- |
| `join_room`    | `{ productId: string }`              | Tham gia phòng chat của sản phẩm |
| `leave_room`   | `{ productId: string }`              | Rời khỏi phòng chat              |
| `send_message` | `{ productId, receiverId, content }` | Gửi tin nhắn                     |

#### Server → Client

| Event              | Payload                   | Mô tả                         |
| ------------------ | ------------------------- | ----------------------------- |
| `receive_message`  | `{ message object }`      | Nhận tin nhắn mới             |
| `new_notification` | `{ notification object }` | Nhận thông báo mới            |
| `unread_count`     | `{ count: number }`       | Cập nhật số tin nhắn chưa đọc |

---

## 7. Tính Năng Bảo Mật

### 7.1 HttpOnly Cookie JWT

JWT token được lưu trong cookie với cờ `HttpOnly` và `SameSite=Strict`, **không thể bị đọc bởi JavaScript** trên trình duyệt. Điều này ngăn chặn tấn công XSS lấy cắp session token thường gặp khi lưu token trong `localStorage`.

### 7.2 Double-Submit Cookie CSRF

Khi server trả về response, nó set thêm một cookie `csrf_token` (không HttpOnly, có thể đọc bởi JS). Với mọi request mutation, frontend đọc cookie đó và đính kèm vào header `X-CSRF-Token`. Backend so sánh giá trị header với cookie — nếu không khớp trả về `403 Forbidden`.

**Các endpoint miễn CSRF** (public, chỉ GET hoặc không cần auth):

- `POST /api/auth/login`
- `POST /api/auth/register`
- `POST /api/auth/google`
- `GET /api/health`
- Tất cả GET requests

### 7.3 Rate Limiting

| Phạm vi                   | Giới hạn               | Mục đích                      |
| ------------------------- | ---------------------- | ----------------------------- |
| Toàn bộ `/api/*`          | 100 req / 15 phút / IP | Chống spam API                |
| `POST /api/auth/login`    | 10 req / 15 phút / IP  | Chống brute-force mật khẩu    |
| `POST /api/auth/register` | 5 req / giờ / IP       | Chống tạo tài khoản hàng loạt |
| `POST /:id/bump`          | Cooldown 24h / bài     | Logic trong controller        |

### 7.4 Upload Validation

Multer middleware kiểm tra chặt chẽ:

- Định dạng cho phép: JPEG, PNG, WEBP (từ chối các định dạng khác)
- Dung lượng tối đa: 5MB mỗi ảnh
- Số lượng tối đa: 5 ảnh mỗi request

### 7.5 Google OAuth (ID Token Verification)

Khi người dùng đăng nhập bằng Google, `id_token` được gửi lên server. Backend xác minh token này với Google API trước khi cấp JWT nội bộ. Điều này ngăn chặn token giả mạo.

### 7.6 Helmet Security Headers

Helmet tự động thiết lập các HTTP security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `X-XSS-Protection`

---

## 8. Cài Đặt & Chạy Local

### Yêu Cầu Hệ Thống

- **Node.js** v20 trở lên
- **MongoDB** Community Server 7.0 trở lên
- **Redis** Server 7 trở lên (hoặc dùng Docker)
- **npm** v9+

### Bước 1 — Clone Repository

```bash
git clone <repo-url>
cd shop_sea_fixed
```

### Bước 2 — Cấu hình Backend

```bash
cd backend
cp .env.example .env
# Chỉnh sửa .env với thông tin thực của bạn (xem mục 11)
npm install
npm run dev
# Backend chạy tại http://localhost:5000
```

### Bước 3 — Cấu hình Frontend

```bash
cd client/my-app
cp .env.example .env
# Chỉnh sửa VITE_GOOGLE_CLIENT_ID nếu dùng Google OAuth
npm install
npm run dev
# Frontend chạy tại http://localhost:3000
```

### Build Production

```bash
# Backend
cd backend && npm run build
npm start  # Chạy từ dist/app.js

# Frontend
cd client/my-app && npm run build
# Output tại dist/ — serve bằng nginx hoặc static server
```

---

## 9. Triển Khai Docker

Docker Compose tự động hóa toàn bộ môi trường với 4 container.

### Khởi Động

```bash
# Từ thư mục gốc (nơi có docker-compose.yml)
# Lần đầu hoặc khi có thay đổi code:
docker compose up --build -d

# Chạy lại không cần build:
docker compose up -d
```

### Các Container

| Container          | Image            | Port  | Chú thích           |
| ------------------ | ---------------- | ----- | ------------------- |
| `seafood_mongo`    | `mongo:latest`   | 27017 | MongoDB database    |
| `seafood_redis`    | `redis:7-alpine` | 6379  | Redis cache         |
| `seafood_backend`  | Node.js build    | 5000  | Express + Socket.IO |
| `seafood_frontend` | Node.js build    | 3000  | React dev server    |

> **Lưu ý:** Trong môi trường Docker, backend nhận `MONGO_URI=mongodb://db:27017/seafood_db` và `REDIS_HOST=redis` — dùng tên service thay vì `localhost`.

### Persistent Storage

```yaml
volumes:
  mongo_data: # Dữ liệu MongoDB không bị mất khi restart container
```

### Xem Logs

```bash
docker compose logs -f backend     # Log backend real-time
docker compose logs -f frontend    # Log frontend real-time
```

### Dừng & Dọn Dẹp

```bash
docker compose down          # Dừng container, giữ dữ liệu
docker compose down -v       # Dừng container, XÓA volumes (reset DB)
```

---

## 10. Tính Năng Chi Tiết

### 10.1 Tìm Kiếm GPS (Haversine)

Khi người dùng cung cấp tọa độ (`lat`, `lng`) và bán kính (`radius`), hệ thống tính khoảng cách giữa người dùng và từng bài đăng hải sản tươi bằng **công thức Haversine**. Chỉ những bài đăng nằm trong bán kính được trả về. Kết quả sắp xếp theo `bumpedAt` DESC.

```
d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat₁)×cos(lat₂)×sin²(Δlng/2)))
```

### 10.2 Bump (Đẩy Bài Đăng)

Người bán có thể "bump" bài đăng của mình lên đầu danh sách. Hệ thống cập nhật `bumpedAt = NOW()`. Cooldown 24h được enforce ở backend: nếu `NOW() - bumpedAt < 24h`, server trả về lỗi.

### 10.3 Cron Job Tự Động Hết Hạn

`node-cron` chạy định kỳ kiểm tra và cập nhật `status = 'Expired'` cho các bài đăng hải sản tươi có `catchTime` quá 48 giờ (hoặc logic tương tự được cấu hình trong `cron.ts`).

### 10.4 Real-time Chat (Socket.IO)

Chat được tổ chức theo **phòng** (`productId`). Khi người dùng mở trang chi tiết sản phẩm, client tự động join room tương ứng. Tin nhắn gửi qua `send_message` event và được broadcast đến tất cả thành viên trong room qua `receive_message`.

Xác thực Socket.IO: server đọc cookie `token` từ handshake request, xác minh JWT, gắn thông tin user vào socket.

### 10.5 Google Sign-in (One Tap & Button)

Frontend tích hợp **Google Identity Services** (GIS):

- **One Tap**: tự động hiện popup chọn tài khoản Google đang đăng nhập trên máy
- **Sign In with Google Button**: nút đăng nhập chuẩn của Google

Khi người dùng chọn tài khoản, GIS trả về `id_token`, frontend gửi token này lên `POST /api/auth/google`. Backend xác minh với Google → tạo/tìm user trong DB → trả về JWT cookie như luồng login thông thường.

### 10.6 Notification Service

`notification.service.ts` tạo notification records trong DB và emit Socket.IO event `new_notification` đến room cá nhân (`user_<id>`) của người nhận. Đảm bảo người dùng nhận thông báo real-time ngay cả khi đang ở trang khác.

### 10.7 Lazy Loading & Performance

Frontend dùng `React.lazy()` + `Suspense` để tách bundle: mỗi page chỉ được tải khi người dùng thực sự truy cập, giảm thời gian tải trang ban đầu. Bootstrap 5 được import qua CDN để tận dụng browser cache.

---

## 11. Biến Môi Trường

### Backend (`backend/.env`)

```env
# ─── Database & Redis ────────────────────────
MONGO_URI=mongodb://localhost:27017/seafood_db
REDIS_HOST=localhost
REDIS_PORT=6379

# ─── Auth ────────────────────────────────────
JWT_SECRET=<chuỗi bí mật ngẫu nhiên dài ≥ 32 ký tự>
JWT_EXPIRES_IN=7d
OTP_SECRET=<chuỗi bí mật OTP dài ≥ 32 ký tự>

# ─── Server ──────────────────────────────────
PORT=5000
CLIENT_URL=http://localhost:3000

# ─── Cloudinary (https://cloudinary.com/console) ─
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>

# ─── ESMS SMS Gateway (https://esms.vn) ──────
ESMS_API_KEY=<lấy tại esms.vn>
ESMS_SECRET_KEY=<lấy tại esms.vn>
ESMS_SMS_TYPE=4         # 4 = SMS thường, 2 = Brandname
ESMS_BRANDNAME=HaiSan   # Chỉ cần khi SMS_TYPE=2
```

### Frontend (`client/my-app/.env`)

```env
# Socket.IO server URL
VITE_SOCKET_URL=http://localhost:5000

# Google OAuth Client ID (lấy tại https://console.cloud.google.com)
VITE_GOOGLE_CLIENT_ID=<your-google-client-id>.apps.googleusercontent.com

# Khi chạy Docker: trỏ API proxy về container backend
# VITE_API_TARGET=http://backend:5000
```

> **Lưu ý về Docker:** Khi chạy qua `docker compose`, biến `VITE_API_TARGET=http://backend:5000` được set tự động trong `docker-compose.yml` để Vite proxy `/api` requests tới container backend nội bộ.

---

## 12. Hướng Dẫn Đóng Góp

## Use Case Specifications (Đặc tả Use Case)

Tài liệu này mô tả các Use Case chính của hệ thống dưới dạng actor / precondition / main flow / alternative / postcondition.

- **Use Case 1 — Đăng ký / Đăng nhập bằng OTP**
  - Actor: Guest / User
  - Precondition: Có số điện thoại hợp lệ, không vượt quá giới hạn gửi OTP
  - Main Flow:
    1. Client gọi `POST /api/otp/send` với `phone`.
    2. Server tạo mã OTP, lưu tạm vào Redis với TTL, gửi SMS qua ESMS.
    3. Client nhập mã OTP và gọi `POST /api/otp/verify`.
    4. Server kiểm tra mã (Redis), nếu hợp lệ tạo/đăng nhập user, cấp JWT (HttpOnly cookie) và `csrf_token` cookie.
  - Alternative Flows: OTP sai/timeout → trả lỗi 400, giới hạn gửi vượt quá → trả 429.
  - Postcondition: Người dùng đã đăng nhập, cookie JWT set.

- **Use Case 2 — Google Sign-in (OAuth)**
  - Actor: Guest / User
  - Precondition: Có id_token từ Google Identity Services
  - Main Flow:
    1. Frontend nhận `id_token` từ Google.
    2. Gọi `POST /api/auth/google` gửi `id_token`.
    3. Backend xác minh token với Google, lấy thông tin email/googleId.
    4. Tạo hoặc tìm user trong DB, cấp JWT cookie và `csrf_token`.
  - Postcondition: Người dùng đã đăng nhập (Google account liên kết nếu mới đăng ký).

- **Use Case 3 — Đăng bán sản phẩm**
  - Actor: Seller (authenticated)
  - Precondition: Seller đã đăng nhập (JWT cookie hợp lệ)
  - Main Flow:
    1. Seller điền thông tin sản phẩm, upload ảnh (multipart/form-data).
    2. Backend nhận file bằng Multer, stream ảnh lên Cloudinary, nhận `url` & `public_id`.
    3. Tạo document `Product` trong MongoDB (gồm `location` nếu có GPS).
    4. Trả về 201 Created và tài liệu sản phẩm.
  - Alternative Flows: Ảnh quá lớn/định dạng không hợp lệ → trả lỗi 415/400.
  - Postcondition: Sản phẩm hiển thị trong danh sách; có thể tìm thấy bằng search/GPS.

- **Use Case 4 — Tìm kiếm & Lọc theo GPS (Buyer)**
  - Actor: Buyer (guest hoặc authenticated)
  - Precondition: (Tùy chọn) client cung cấp `lat` & `lng`
  - Main Flow:
    1. Client gọi `GET /api/products?lat=&lng=&radius=`.
    2. Backend sử dụng `location` 2dsphere index hoặc Haversine để lọc theo bán kính, hỗ trợ full-text search và các filter khác.
    3. Trả về danh sách sản phẩm theo trang (pagination) sắp xếp theo `bumpedAt`.
  - Postcondition: Client nhận danh sách sản phẩm hợp lệ.

- **Use Case 5 — Chat theo sản phẩm (Real-time)**
  - Actor: Buyer, Seller (authenticated)
  - Precondition: Kết nối Socket.IO với cookie JWT hợp lệ
  - Main Flow:
    1. Client join room `product_<productId>` bằng event `join_room`.
    2. Người gửi emit `send_message` với payload {productId, receiverId, content}.
    3. Server xác minh, lưu message vào collection `messages`, emit `receive_message` tới room tương ứng.
  - Alternative: Kết nối mất, client fallback sử dụng REST `POST /api/messages`.
  - Postcondition: Tin nhắn được deliver near-real-time và persist trong DB.

- **Use Case 6 — Thanh toán / Nâng cấp Premium (Sepay Webhook)**
  - Actor: Buyer (who pays), Sepay (payment gateway)
  - Precondition: Người dùng thực hiện chuyển khoản qua Sepay offsite, Sepay cấu hình webhook tới `/api/payment/sepay-webhook`.
  - Main Flow:
    1. Sepay gửi webhook chứa `transferAmount` và `content` (chuỗi mô tả có chứa MongoDB userId).
    2. Backend kiểm tra Authorization header (API key), trích userId từ `content`, tìm user trong DB.
    3. Nếu xác thực hợp lệ, cập nhật user lên `isPremium = true`.
    4. Trả 200 OK cho Sepay.
  - Postcondition: User được nâng cấp Premium.

- **Use Case 7 — Quản trị / Xử lý báo cáo (Admin)**
  - Actor: Admin
  - Precondition: Admin đã đăng nhập và có `role = 'Admin'`.
  - Main Flow:
    1. Admin mở `GET /api/admin/reports`, xem danh sách báo cáo.
    2. Admin có thể `PATCH /api/reports/:id` để resolve/dismiss hoặc `DELETE /api/listings/:id` để gỡ bài.
  - Postcondition: Báo cáo được xử lý, hệ thống cập nhật trạng thái, có thể gửi notification tới người liên quan.

---

```bash
# 1. Fork & clone
git clone <your-fork>

# 2. Tạo branch từ develop
git checkout -b feature/ten-tinh-nang

# 3. Commit theo Conventional Commits
git commit -m "feat: thêm tính năng X"
git commit -m "fix: sửa lỗi Y"
git commit -m "docs: cập nhật README"

# 4. Push & mở Pull Request
git push origin feature/ten-tinh-nang
```

---
# Đặc tả Cơ sở Dữ liệu — Sàn Giao Dịch Hải Sản

> **Công nghệ:** MongoDB + Mongoose  
> **Phiên bản:** 1.0  

---

## 1. Tổng quan

Hệ thống là một sàn giao dịch hải sản trực tuyến, cho phép người dùng đăng bán và mua các loại hải sản tươi sống hoặc khô. Người bán có thể đăng sản phẩm kèm vị trí địa lý, người mua có thể tìm kiếm theo khoảng cách, nhắn tin trực tiếp với người bán, đánh giá sản phẩm và báo cáo nội dung vi phạm. Hệ thống gồm **7 entity**, trong đó `PRICE_HISTORY` là embedded document (mảng nhúng trong `PRODUCT`, không phải collection riêng).

---

## 2. Danh sách Entity

### 2.1 USER — Người dùng

Đại diện cho tất cả tài khoản trong hệ thống, bao gồm người mua, người bán và quản trị viên. Một tài khoản có thể đồng thời vừa mua vừa bán.

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | Định danh duy nhất |
| `name` | String | Required, trim | Tên hiển thị của người dùng |
| `email` | String | Required, unique, lowercase, index | Email đăng nhập (duy nhất toàn hệ thống) |
| `passwordHash` | String | Required | Mật khẩu đã được hash (bcrypt) |
| `role` | Enum | Required, default: `"User"` | `"User"` hoặc `"Admin"` |
| `isActive` | Boolean | Default: `true` | Tài khoản có đang hoạt động không (Admin có thể khoá) |
| `isVerified` | Boolean | Default: `false` | Tài khoản đã xác thực email chưa |
| `isPremium` | Boolean | Default: `false` | Tài khoản premium (được đẩy sản phẩm ưu tiên) |
| `avatar` | String | Nullable | URL ảnh đại diện |
| `favorites` | ObjectId[] | Ref: `Product` | Danh sách sản phẩm đã yêu thích (mảng nhúng) |
| `following` | ObjectId[] | Ref: `User` | Danh sách người dùng đang theo dõi (self-referential) |
| `createdAt` | Date | Auto (timestamps) | Thời điểm tạo tài khoản |
| `updatedAt` | Date | Auto (timestamps) | Thời điểm cập nhật gần nhất |

**Index:**

| Tên index | Trường | Loại | Mục đích |
|---|---|---|---|
| `email_1` | `email` | Unique | Đăng nhập, tránh trùng email |

---

### 2.2 PRODUCT — Sản phẩm hải sản

Đại diện cho một lô hàng hải sản mà người bán đăng lên sàn. Mỗi sản phẩm thuộc về một người bán duy nhất và có thể có vị trí địa lý để hỗ trợ tìm kiếm theo khoảng cách.

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | Định danh duy nhất |
| `sellerId` | ObjectId | Required, FK → User, index | Người đăng bán |
| `type` | Enum | Required | `"Fresh"` (tươi sống) hoặc `"Dried"` (khô) |
| `category` | Enum | Required | `"Fish"`, `"Shrimp"`, `"Squid"`, `"Crab"`, `"Shellfish"`, `"Others"` |
| `name` | String | Required, trim | Tên sản phẩm |
| `description` | String | Nullable | Mô tả chi tiết |
| `price` | Number | Required | Giá hiện tại (VNĐ/kg) |
| `salesType` | Enum | Default: `"Retail"` | `"Retail"` (bán lẻ) hoặc `"Wholesale"` (bán sỉ) |
| `totalWeight` | Number | Required | Tổng khối lượng ban đầu (kg) |
| `remainingWeight` | Number | Required | Khối lượng còn lại (kg) |
| `status` | Enum | Default: `"Active"` | `"Active"`, `"Expired"`, `"Deleted"` |
| `location` | GeoJSON Point | Optional | Vị trí địa lý `{ type: "Point", coordinates: [lng, lat] }`. Bắt buộc đặt index 2dsphere. Không set `default: "Point"` để tránh lỗi MongoDB khi sản phẩm khô không có toạ độ. |
| `catchTime` | Date | Optional | Thời điểm đánh bắt |
| `origin` | String | Optional | Xuất xứ / vùng biển |
| `expiryDate` | Date | Optional | Hạn sử dụng |
| `images` | String[] | — | Danh sách URL ảnh sản phẩm |
| `priceHistory` | PriceHistory[] | Embedded | Lịch sử thay đổi giá (xem mục 2.3) |
| `viewCount` | Number | Default: `0` | Lượt xem |
| `bumpedAt` | Date | Default: `now` | Thời điểm đẩy bài gần nhất (dùng để sắp xếp) |
| `createdAt` | Date | Auto (timestamps) | Thời điểm đăng |
| `updatedAt` | Date | Auto (timestamps) | Thời điểm cập nhật |

**Index:**

| Tên index | Trường | Loại | Mục đích |
|---|---|---|---|
| `location_2dsphere` | `location` | 2dsphere | Tìm kiếm sản phẩm trong bán kính (vd. 20km) |
| `sellerId_1` | `sellerId` | Thường | Lấy tất cả sản phẩm của một seller |
| `status_type_bumpedAt_createdAt` | `status, type, bumpedAt DESC, createdAt DESC` | Compound | Sắp xếp feed sản phẩm theo thứ tự hiển thị |
| `name_text_description_text` | `name, description` | Text | Tìm kiếm full-text theo tên và mô tả |

---

### 2.3 PRICE_HISTORY — Lịch sử giá (Embedded Document)

**Không phải collection riêng.** Được lưu dưới dạng mảng nhúng (`priceHistory[]`) trực tiếp trong mỗi document `PRODUCT`. Mỗi phần tử ghi lại một lần thay đổi giá.

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `oldPrice` | Number | Required | Giá cũ trước khi thay đổi |
| `newPrice` | Number | Required | Giá mới sau khi thay đổi |
| `changedAt` | Date | Default: `now` | Thời điểm thay đổi giá |

---

### 2.4 MESSAGE — Tin nhắn

Lưu trữ các tin nhắn được gửi giữa người mua và người bán trong ngữ cảnh của một sản phẩm cụ thể. Một cuộc hội thoại được xác định bởi bộ ba `(productId, senderId, receiverId)`.

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | Định danh duy nhất |
| `productId` | ObjectId | Required, FK → Product | Sản phẩm mà cuộc hội thoại liên quan đến |
| `senderId` | ObjectId | Required, FK → User | Người gửi |
| `receiverId` | ObjectId | Required, FK → User | Người nhận |
| `content` | String | Nullable | Nội dung văn bản (null nếu chỉ gửi ảnh) |
| `imageUrl` | String | Nullable | URL ảnh đính kèm (null nếu chỉ gửi văn bản) |
| `isRead` | Boolean | Default: `false` | Người nhận đã đọc chưa |
| `createdAt` | Date | Auto (timestamps) | Thời điểm gửi |
| `updatedAt` | Date | Auto (timestamps) | Thời điểm cập nhật |

> Mỗi tin nhắn phải có ít nhất một trong hai: `content` hoặc `imageUrl`.

**Index:**

| Tên index | Trường | Loại | Mục đích |
|---|---|---|---|
| `productId_senderId_receiverId` | `productId, senderId, receiverId` | Compound | Tải toàn bộ cuộc hội thoại theo ngữ cảnh sản phẩm |
| `senderId_createdAt` | `senderId, createdAt DESC` | Compound | Lịch sử tin nhắn đã gửi |
| `receiverId_createdAt` | `receiverId, createdAt DESC` | Compound | Lịch sử tin nhắn đã nhận / hộp thư đến |

---

### 2.5 REVIEW — Đánh giá sản phẩm

Ghi nhận đánh giá của người mua về một sản phẩm và người bán tương ứng. Ràng buộc duy nhất: mỗi người dùng chỉ được đánh giá mỗi sản phẩm **một lần duy nhất**.

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | Định danh duy nhất |
| `productId` | ObjectId | Required, FK → Product | Sản phẩm được đánh giá |
| `reviewerId` | ObjectId | Required, FK → User | Người viết đánh giá |
| `sellerId` | ObjectId | Required, FK → User, index | Người bán nhận đánh giá (denormalized để truy vấn nhanh hơn) |
| `rating` | Number | Required, min: 1, max: 5 | Điểm đánh giá (1–5 sao) |
| `comment` | String | Nullable | Nhận xét văn bản |
| `imageUrl` | String | Nullable | URL ảnh minh hoạ |
| `createdAt` | Date | Auto (timestamps) | Thời điểm đánh giá |

**Index:**

| Tên index | Trường | Loại | Mục đích |
|---|---|---|---|
| `reviewerId_productId` | `reviewerId, productId` | Unique | Mỗi user chỉ review mỗi sản phẩm 1 lần |
| `sellerId_1` | `sellerId` | Thường | Lấy tất cả đánh giá nhận được của một seller |

---

### 2.6 REPORT — Báo cáo vi phạm

Cho phép người dùng báo cáo sản phẩm vi phạm quy định. Admin xử lý và ghi chú kết quả vào trường `adminNote`.

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | Định danh duy nhất |
| `reporterId` | ObjectId | Required, FK → User | Người gửi báo cáo |
| `productId` | ObjectId | Required, FK → Product | Sản phẩm bị báo cáo |
| `reason` | String | Required | Lý do báo cáo |
| `status` | Enum | Default: `"Pending"` | `"Pending"`, `"Resolved"`, `"Dismissed"` |
| `adminNote` | String | Nullable | Ghi chú của Admin sau khi xử lý |
| `createdAt` | Date | Auto (timestamps) | Thời điểm gửi báo cáo |

---

### 2.7 NOTIFICATION — Thông báo

Lưu trữ thông báo gửi đến người dùng. Có thể liên kết tuỳ chọn với một `Product` hoặc một `Review` để tạo deep link điều hướng trong ứng dụng.

| Thuộc tính | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | Định danh duy nhất |
| `userId` | ObjectId | Required, FK → User, index | Người nhận thông báo |
| `type` | String | Required | Loại thông báo (vd. `"new_message"`, `"new_review"`, `"product_reported"`) |
| `content` | String | Required | Nội dung thông báo hiển thị cho người dùng |
| `isRead` | Boolean | Default: `false` | Đã đọc chưa |
| `productId` | ObjectId | Optional, FK → Product | Sản phẩm liên quan (nullable) |
| `reviewId` | ObjectId | Optional, FK → Review | Đánh giá liên quan (nullable) |
| `createdAt` | Date | Auto (timestamps) | Thời điểm tạo thông báo |

**Index:**

| Tên index | Trường | Loại | Mục đích |
|---|---|---|---|
| `userId_1` | `userId` | Thường | Lấy thông báo của một user |
| `userId_createdAt` | `userId, createdAt DESC` | Compound | Phân trang thông báo theo thứ tự mới nhất |

---

## 3. Sơ đồ quan hệ

| Từ entity | Quan hệ | Đến entity | Diễn giải |
|---|---|---|---|
| USER | `\|\|--o{` | PRODUCT | Một user bán nhiều sản phẩm; mỗi sản phẩm có đúng một seller |
| USER | `\|\|--o{` | MESSAGE | Một user gửi nhiều tin nhắn (senderId) |
| USER | `\|\|--o{` | MESSAGE | Một user nhận nhiều tin nhắn (receiverId) |
| PRODUCT | `\|\|--o{` | MESSAGE | Một sản phẩm có nhiều tin nhắn liên quan |
| USER | `\|\|--o{` | REVIEW | Một user viết nhiều đánh giá (reviewerId) |
| USER | `\|\|--o{` | REVIEW | Một user nhận nhiều đánh giá với tư cách seller (sellerId) |
| PRODUCT | `\|\|--o{` | REVIEW | Một sản phẩm có nhiều đánh giá |
| USER | `\|\|--o{` | REPORT | Một user gửi nhiều báo cáo |
| PRODUCT | `\|\|--o{` | REPORT | Một sản phẩm có thể bị báo cáo nhiều lần |
| USER | `\|\|--o{` | NOTIFICATION | Một user nhận nhiều thông báo |
| PRODUCT | `\|o--o{` | NOTIFICATION | Một thông báo có thể liên kết đến một sản phẩm (optional) |
| REVIEW | `\|o--o{` | NOTIFICATION | Một thông báo có thể liên kết đến một review (optional) |
| USER | `}o--o{` | USER | Quan hệ tự thân N:N — danh sách following (nhúng trong User) |
| USER | `}o--o{` | PRODUCT | Quan hệ N:N — danh sách yêu thích (nhúng trong User) |
| PRODUCT | `\|\|--o{` | PRICE_HISTORY | Embedded: lịch sử giá nhúng trong Product |

---

## 4. Ràng buộc nghiệp vụ

### Tài khoản (USER)
- Email phải duy nhất trong toàn hệ thống, lưu lowercase.
- Chỉ Admin (`role: "Admin"`) mới được xử lý Report hoặc khoá tài khoản.
- `isPremium` cho phép sản phẩm được đẩy lên đầu feed (`bumpedAt`).

### Sản phẩm (PRODUCT)
- `remainingWeight` không được vượt quá `totalWeight`.
- `remainingWeight == 0` hoặc `expiryDate < now` thì nên chuyển `status` sang `"Expired"`.
- Trường `location` chỉ nên có mặt khi sản phẩm có toạ độ hợp lệ. Tuyệt đối **không** set `default: "Point"` trên sub-field `type` để tránh MongoDB ghi `{ type: "Point" }` thiếu `coordinates`, gây lỗi index 2dsphere.
- Khi cập nhật `price`, phải append một bản ghi mới vào mảng `priceHistory`.

### Tin nhắn (MESSAGE)
- Mỗi tin nhắn phải chứa ít nhất `content` hoặc `imageUrl` (không được null cả hai).
- `senderId` và `receiverId` phải khác nhau (không tự nhắn cho mình).
- Cuộc hội thoại được nhóm bởi `(productId, senderId, receiverId)` — cần chuẩn hoá chiều (luôn để `min(userId)` là senderId) nếu muốn tra cứu 2 chiều.

### Đánh giá (REVIEW)
- Unique index `{ reviewerId, productId }` đảm bảo mỗi user chỉ đánh giá mỗi sản phẩm đúng một lần.
- `sellerId` được denormalize từ `Product.sellerId` tại thời điểm tạo review để tránh join khi lấy danh sách đánh giá của seller.
- `rating` hợp lệ: số nguyên từ 1 đến 5.

### Thông báo (NOTIFICATION)
- `productId` và `reviewId` đều là optional — một thông báo có thể không liên kết với entity nào, liên kết với một trong hai, nhưng không nên liên kết cả hai cùng lúc (tuỳ logic nghiệp vụ).

---

## 5. Tổng hợp index toàn hệ thống

| Collection | Index | Loại | Mục đích |
|---|---|---|---|
| `users` | `{ email: 1 }` | Unique | Đăng nhập, kiểm tra trùng |
| `products` | `{ location: "2dsphere" }` | Địa lý | Tìm kiếm trong bán kính |
| `products` | `{ sellerId: 1 }` | Thường | Sản phẩm của seller |
| `products` | `{ status: 1, type: 1, bumpedAt: -1, createdAt: -1 }` | Compound | Feed sản phẩm, sort |
| `products` | `{ name: "text", description: "text" }` | Text | Tìm kiếm full-text |
| `messages` | `{ productId: 1, senderId: 1, receiverId: 1 }` | Compound | Tải cuộc hội thoại |
| `messages` | `{ senderId: 1, createdAt: -1 }` | Compound | Hộp thư đã gửi |
| `messages` | `{ receiverId: 1, createdAt: -1 }` | Compound | Hộp thư đến |
| `reviews` | `{ reviewerId: 1, productId: 1 }` | Unique | Chặn review trùng |
| `reviews` | `{ sellerId: 1 }` | Thường | Đánh giá của seller |
| `notifications` | `{ userId: 1 }` | Thường | Thông báo của user |
| `notifications` | `{ userId: 1, createdAt: -1 }` | Compound | Phân trang thông báo |

<p align="center">
  Made with ❤️ by the HảiSản.vn Team · Phase 3 · 2026
</p>
