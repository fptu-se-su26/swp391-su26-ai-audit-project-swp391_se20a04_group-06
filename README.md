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

| Bài toán | Giải pháp |
|---|---|
| Ngư dân khó tiếp cận thị trường | Đăng bài bán trực tiếp, không qua trung gian |
| Người mua không biết hải sản tươi ở đâu | Tìm kiếm theo GPS, lọc theo bán kính km |
| Thiếu tin tưởng giữa hai bên | Hệ thống đánh giá (Review) & huy hiệu xác minh |
| Liên lạc chậm, bất tiện | Real-time Chat tích hợp theo từng bài đăng |

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

### Backend

| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| Node.js | v20+ | Runtime |
| TypeScript | ^5.5 | Ngôn ngữ lập trình |
| Express | ^4.19 | HTTP Framework |
| Mongoose | ^9.6 | ODM kết nối MongoDB |
| socket.io | ^4.7 | Real-time WebSocket |
| jsonwebtoken | ^9.0 | Tạo & xác minh JWT |
| bcryptjs | ^2.4 | Hash mật khẩu |
| helmet | ^7.1 | Bảo mật HTTP Headers |
| express-rate-limit | ^7.4 | Rate Limiting chống spam |
| multer | ^1.4 | Xử lý file upload |
| cloudinary | ^2.5 | Lưu trữ ảnh trên cloud |
| node-cron | ^3.0 | Tác vụ tự động định kỳ |
| ioredis | — | Redis client (OTP, cache) |
| cookie-parser | ^1.4 | Đọc cookie |

### Frontend

| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| React | ^19.2 | UI Framework |
| Vite | ^8.0 | Build tool / Dev server |
| Bootstrap | 5 | Responsive UI framework |
| react-router-dom | ^6.30 | Client-side routing |
| react-leaflet | ^5.0 | Hiển thị bản đồ (OpenStreetMap) |
| Google Identity Services | CDN | Sign-in with Google / One Tap |

### Infrastructure

| Công nghệ | Mục đích |
|---|---|
| MongoDB | Cơ sở dữ liệu tài liệu (NoSQL) |
| Redis | Cache OTP, session hỗ trợ |
| Cloudinary | CDN lưu trữ & xử lý ảnh |
| Docker + Docker Compose | Container hóa môi trường |

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
| Field | Kiểu | Mô tả |
|---|---|---|
| `_id` | ObjectId | Khóa chính |
| `name` | String | Họ tên |
| `phone` | String (unique) | Số điện thoại (đăng nhập truyền thống) |
| `googleId` | String | Google Account ID (OAuth) |
| `email` | String | Email (Google OAuth) |
| `passwordHash` | String | Mật khẩu đã hash (bcrypt) |
| `role` | `'User'` \| `'Admin'` | Vai trò, mặc định `'User'` |
| `isActive` | Boolean | Tài khoản còn hoạt động (Admin toggle) |
| `isVerified` | Boolean | Huy hiệu xác minh (Admin cấp) |
| `avatar` | String | URL ảnh đại diện (Cloudinary) |
| `createdAt` | Date | Thời điểm đăng ký |

#### `products`
| Field | Kiểu | Mô tả |
|---|---|---|
| `_id` | ObjectId | Khóa chính |
| `sellerId` | ObjectId → User | Người bán |
| `type` | `'Fresh'` \| `'Dried'` | Hải sản tươi / khô |
| `name` | String | Tên sản phẩm |
| `description` | String | Mô tả |
| `price` | Number | Giá (VND/kg) |
| `salesType` | `'Retail'` \| `'Wholesale'` | Bán lẻ / bán sỉ |
| `totalWeight` | Number | Tổng trọng lượng (kg) |
| `remainingWeight` | Number | Còn lại (kg) |
| `status` | `'Active'` \| `'Expired'` \| `'Deleted'` | Trạng thái bài đăng |
| `catchTime` | Date | *(Tươi)* Thời điểm đánh bắt/cập bến |
| `location.lat` | Number | *(Tươi)* Vĩ độ GPS |
| `location.lng` | Number | *(Tươi)* Kinh độ GPS |
| `origin` | String | *(Khô)* Xuất xứ |
| `expiryDate` | Date | *(Khô)* Hạn sử dụng |
| `images` | Array\<{url, publicId}\> | Danh sách ảnh Cloudinary |
| `bumpedAt` | Date | Thời điểm đẩy bài đăng gần nhất |
| `createdAt` | Date | Thời điểm tạo |

#### `messages`
| Field | Kiểu | Mô tả |
|---|---|---|
| `productId` | ObjectId → Product | Cuộc chat gắn với bài đăng |
| `senderId` | ObjectId → User | Người gửi |
| `receiverId` | ObjectId → User | Người nhận |
| `content` | String | Nội dung tin nhắn |
| `isRead` | Boolean | Đã đọc chưa |
| `sentAt` | Date | Thời điểm gửi |

#### `reviews`
| Field | Kiểu | Mô tả |
|---|---|---|
| `productId` | ObjectId → Product | Sản phẩm được đánh giá |
| `reviewerId` | ObjectId → User | Người viết đánh giá |
| `sellerId` | ObjectId → User | Người bán được đánh giá |
| `rating` | Number (1–5) | Số sao |
| `comment` | String | Nội dung đánh giá |
| `imageURL` | String | Ảnh đính kèm (Cloudinary) |

> **Constraint:** `UNIQUE(reviewerId, productId)` — mỗi người chỉ đánh giá một sản phẩm một lần.

---

## 6. API Reference

**Base URL:** `http://localhost:5000/api`  
**Authentication:** HttpOnly Cookie (`token=<JWT>`)  
**CSRF:** Header `X-CSRF-Token` bắt buộc cho mọi request mutation (POST/PUT/PATCH/DELETE)

---

### 6.1 Authentication — `/api/auth`

| Method | Path | Mô tả | Auth | Rate Limit |
|---|---|---|---|---|
| POST | `/register` | Đăng ký tài khoản mới | ❌ | 5 req/giờ/IP |
| POST | `/login` | Đăng nhập, set HttpOnly Cookie | ❌ | 10 req/15ph/IP |
| POST | `/google` | Đăng nhập/đăng ký qua Google OAuth | ❌ | — |
| POST | `/logout` | Đăng xuất, xóa cookie | ✅ | — |
| GET | `/me` | Lấy thông tin tài khoản hiện tại | ✅ | — |
| PUT | `/profile` | Cập nhật tên, ảnh đại diện | ✅ | — |
| POST | `/change-password` | Đổi mật khẩu | ✅ | — |

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

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/send` | Gửi OTP về số điện thoại | ❌ |
| POST | `/verify` | Xác minh OTP | ❌ |

---

### 6.3 Products — `/api/products`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Danh sách sản phẩm (hỗ trợ lọc đa điều kiện) | ❌ |
| GET | `/my` | Sản phẩm của người dùng đang đăng nhập | ✅ |
| GET | `/:id` | Chi tiết một sản phẩm | ❌ |
| POST | `/` | Đăng bán sản phẩm mới | ✅ |
| PUT | `/:id` | Cập nhật sản phẩm | ✅ (chủ sở hữu) |
| DELETE | `/:id` | Xóa sản phẩm | ✅ (chủ sở hữu) |
| POST | `/:id/bump` | Đẩy bài đăng lên đầu (cooldown 24h) | ✅ (chủ sở hữu) |

#### Query Parameters — `GET /api/products`

| Param | Kiểu | Mô tả |
|---|---|---|
| `type` | `Fresh` \| `Dried` | Lọc theo loại hải sản |
| `search` | string | Full-text search tên/mô tả |
| `lat` | number | Vĩ độ người dùng (GPS) |
| `lng` | number | Kinh độ người dùng (GPS) |
| `radius` | number | Bán kính tìm kiếm (km) |
| `minPrice` | number | Giá tối thiểu (VND) |
| `maxPrice` | number | Giá tối đa (VND) |
| `page` | number | Trang (phân trang) |
| `limit` | number | Số bài/trang |

---

### 6.4 Messages — `/api/messages`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/unread-count` | Số tin nhắn chưa đọc | ✅ |
| GET | `/conversations` | Danh sách tất cả hội thoại | ✅ |
| GET | `/:productId` | Lịch sử chat của một sản phẩm | ✅ |
| POST | `/` | Gửi tin nhắn (REST fallback) | ✅ |

> **Lưu ý:** Luồng chat chính chạy qua Socket.IO. REST endpoint dùng như fallback hoặc load lịch sử.

---

### 6.5 Reviews — `/api/reviews`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/` | Đăng đánh giá người bán (kèm ảnh tùy chọn) | ✅ |
| GET | `/seller/:sellerId` | Lấy tất cả đánh giá của một người bán | ❌ |

---

### 6.6 Notifications — `/api/notifications`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Lấy danh sách thông báo | ✅ |
| PUT | `/read` | Đánh dấu tất cả đã đọc | ✅ |
| PATCH | `/:id` | Đánh dấu một thông báo đã đọc | ✅ |

---

### 6.7 Follow — `/api/follows`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/:sellerId` | Follow người bán | ✅ |
| DELETE | `/:sellerId` | Unfollow người bán | ✅ |
| GET | `/` | Danh sách người bán đang follow | ✅ |

---

### 6.8 Favorites — `/api/favorites`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/:productId` | Thêm vào yêu thích | ✅ |
| DELETE | `/:productId` | Xóa khỏi yêu thích | ✅ |
| GET | `/` | Danh sách bài đăng yêu thích | ✅ |

---

### 6.9 Reports — `/api/reports`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/:productId` | Tạo báo cáo vi phạm | ✅ |
| GET | `/` | Xem danh sách báo cáo | ✅ Admin only |
| PATCH | `/:id` | Xử lý báo cáo (resolve/dismiss) | ✅ Admin only |

---

### 6.10 Admin — `/api/admin`

> **Yêu cầu:** `role = 'Admin'` — toàn bộ các endpoint dưới đây đều bị chặn nếu không phải Admin.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/stats` | Thống kê tổng quan (users, products, reports...) |
| GET | `/users` | Danh sách tất cả người dùng |
| PATCH | `/users/:id/toggle` | Kích hoạt / vô hiệu hóa tài khoản |
| PATCH | `/users/:id/verify` | Cấp huy hiệu xác minh cho người bán |
| GET | `/listings` | Danh sách tất cả bài đăng |
| DELETE | `/listings/:id` | Xóa bài đăng vi phạm |

---

### 6.11 Real-time — Socket.IO Events

**Namespace:** `/` (default)  
**Auth:** Cookie `token` tự động gửi khi kết nối

#### Client → Server

| Event | Payload | Mô tả |
|---|---|---|
| `join_room` | `{ productId: string }` | Tham gia phòng chat của sản phẩm |
| `leave_room` | `{ productId: string }` | Rời khỏi phòng chat |
| `send_message` | `{ productId, receiverId, content }` | Gửi tin nhắn |

#### Server → Client

| Event | Payload | Mô tả |
|---|---|---|
| `receive_message` | `{ message object }` | Nhận tin nhắn mới |
| `new_notification` | `{ notification object }` | Nhận thông báo mới |
| `unread_count` | `{ count: number }` | Cập nhật số tin nhắn chưa đọc |

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

| Phạm vi | Giới hạn | Mục đích |
|---|---|---|
| Toàn bộ `/api/*` | 100 req / 15 phút / IP | Chống spam API |
| `POST /api/auth/login` | 10 req / 15 phút / IP | Chống brute-force mật khẩu |
| `POST /api/auth/register` | 5 req / giờ / IP | Chống tạo tài khoản hàng loạt |
| `POST /:id/bump` | Cooldown 24h / bài | Logic trong controller |

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

| Container | Image | Port | Chú thích |
|---|---|---|---|
| `seafood_mongo` | `mongo:latest` | 27017 | MongoDB database |
| `seafood_redis` | `redis:7-alpine` | 6379 | Redis cache |
| `seafood_backend` | Node.js build | 5000 | Express + Socket.IO |
| `seafood_frontend` | Node.js build | 3000 | React dev server |

> **Lưu ý:** Trong môi trường Docker, backend nhận `MONGO_URI=mongodb://db:27017/seafood_db` và `REDIS_HOST=redis` — dùng tên service thay vì `localhost`.

### Persistent Storage

```yaml
volumes:
  mongo_data:  # Dữ liệu MongoDB không bị mất khi restart container
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

<p align="center">
  Made with ❤️ by the HảiSản.vn Team · Phase 3 · 2026
</p>
