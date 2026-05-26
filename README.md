# HảiSản.vn — Tài Liệu Kỹ Thuật (Technical Documentation)

> **Phiên bản:** Phase 3 · **Cập nhật:** 2026-05-27  
> **Loại:** Đồ án Web Application — Marketplace kết nối ngư dân & người mua

---

## Mục Lục

1. [Tổng Quan Dự Án](#1-tổng-quan-dự-án)
2. [Kiến Trúc Hệ Thống](#2-kiến-trúc-hệ-thống)
3. [Tech Stack](#3-tech-stack)
4. [Cấu Trúc Thư Mục](#4-cấu-trúc-thư-mục)
5. [Database Schema](#5-database-schema)
6. [API Reference](#6-api-reference)
7. [Tính Năng Bảo Mật](#7-tính-năng-bảo-mật)
8. [Cài Đặt & Chạy (Local)](#8-cài-đặt--chạy-local)
9. [Triển Khai Docker](#9-triển-khai-docker)
10. [Tính Năng Chi Tiết](#10-tính-năng-chi-tiết)
11. [Biến Môi Trường](#11-biến-môi-trường)

---

## 1. Tổng Quan Dự Án

**HảiSản.vn** là ứng dụng web marketplace giúp kết nối trực tiếp ngư dân (người bán) và người mua hải sản dựa trên khoảng cách địa lý (GPS). Hệ thống tích hợp đầy đủ các tính năng của một nền tảng thương mại điện tử hiện đại.

### Mục Tiêu

| Bài toán | Giải pháp |
|---|---|
| Ngư dân khó tiếp cận thị trường | Đăng bài bán trực tiếp, không qua trung gian |
| Người mua không biết hải sản tươi ở đâu | Tìm kiếm theo GPS, lọc theo bán kính km |
| Thiếu tin tưởng giữa hai bên | Hệ thống đánh giá (Review) & huy hiệu xác minh |
| Liên lạc chậm, bất tiện | Real-time Chat tích hợp theo từng bài đăng |

### Phạm Vi Chức Năng (Scope)

- Đăng ký / Đăng nhập bằng số điện thoại
- Đăng bán hải sản (tươi / khô) kèm ảnh, GPS, thời gian đánh bắt
- Tìm kiếm sản phẩm theo GPS bán kính, full-text search, lọc loại/giá
- Chat thời gian thực (Socket.IO) gắn với từng bài đăng
- Đẩy bài đăng lên đầu (Bump — cooldown 24h)
- Đánh giá người bán sau giao dịch (1–5 sao, kèm ảnh)
- Follow người bán yêu thích
- Yêu thích (Favorite) bài đăng
- Thông báo real-time (Notification)
- Báo cáo vi phạm (Report)
- Bảng điều khiển Admin: quản lý người dùng, sản phẩm, báo cáo, thống kê
- Dashboard cá nhân: quản lý bài đăng, hội thoại, thông báo

---

## 2. Kiến Trúc Hệ Thống

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                       │
│  React 19 + Vite · React Router v6 · React-Leaflet       │
│  Lazy Loading · Error Boundary · CSS Modules             │
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
│  │         Middlewares (Auth · CSRF · Rate Limit)        │ │
│  └──────────────────────┬──────────────────────────────┘ │
└─────────────────────────┼───────────────────────────────┘
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐  ┌────────────┐  ┌─────────────┐
   │  MySQL 8.0  │  │ Cloudinary │  │  Node-Cron  │
   │  (Database) │  │  (Images)  │  │  (Scheduler)│
   └─────────────┘  └────────────┘  └─────────────┘
```

### Luồng Xác Thực (Auth Flow)

```
[Client] → POST /api/auth/login
         ← Set-Cookie: token=<JWT>; HttpOnly; SameSite=Strict
         ← Set-Cookie: csrf_token=<random>; SameSite=Strict

[Client] → POST /api/* (mutation)
           Header: X-CSRF-Token: <từ cookie csrf_token>
           Cookie: token=<JWT> (tự động đính kèm)
         ← 200 OK | 403 Forbidden (nếu CSRF không khớp)
```

---

## 3. Tech Stack

### Backend

| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| Node.js | v20+ | Runtime |
| TypeScript | ^5.5 | Ngôn ngữ lập trình |
| Express | ^4.19 | HTTP Framework |
| mysql2 | ^3.10 | Kết nối MySQL (Connection Pool) |
| socket.io | ^4.7 | Real-time WebSocket |
| jsonwebtoken | ^9.0 | Tạo & xác minh JWT |
| bcryptjs | ^2.4 | Hash mật khẩu |
| helmet | ^7.1 | Bảo mật HTTP Headers |
| express-rate-limit | ^7.4 | Rate Limiting chống spam |
| multer | ^1.4 | Xử lý file upload (Memory Storage) |
| cloudinary | ^2.5 | Lưu trữ ảnh trên cloud |
| node-cron | ^3.0 | Tác vụ tự động định kỳ |
| cookie-parser | ^1.4 | Đọc cookie |

### Frontend

| Thư viện | Phiên bản | Vai trò |
|---|---|---|
| React | ^19.2 | UI Framework |
| Vite | ^8.0 | Build tool / Dev server |
| react-router-dom | ^6.30 | Client-side routing |
| react-leaflet | ^5.0 | Hiển thị bản đồ (OpenStreetMap) |
| leaflet | ^1.9 | Map engine |

### Infrastructure

| Công nghệ | Mục đích |
|---|---|
| MySQL 8.0 | Cơ sở dữ liệu quan hệ |
| Cloudinary | CDN lưu trữ & xử lý ảnh |
| Docker + Docker Compose | Container hóa môi trường phát triển |

---

## 4. Cấu Trúc Thư Mục

```
shop_sea_fixed/
├── backend/
│   ├── src/
│   │   ├── controllers/          # Business logic
│   │   │   ├── auth.controller.ts       # Đăng ký, đăng nhập, profile
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
│   │   ├── db.ts                 # Connection Pool MySQL
│   │   ├── db.migrations.ts      # Auto-migration khi khởi động
│   │   ├── socket.ts             # Socket.IO server (chat + notifications)
│   │   └── cron.ts               # Cron job tự động hết hạn sản phẩm
│   ├── sql/
│   │   ├── schema.sql            # DDL: tạo bảng, index, constraints
│   │   └── seed.sql              # Dữ liệu mẫu
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
│
├── client/my-app/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.jsx           # Trang chủ + bản đồ + danh sách sản phẩm
│   │   │   ├── AuthPage.jsx           # Đăng nhập / Đăng ký
│   │   │   ├── ProductDetailPage.jsx  # Chi tiết sản phẩm + chat + review
│   │   │   ├── PostListingPage.jsx    # Đăng / chỉnh sửa bài đăng
│   │   │   ├── DashboardPage.jsx      # Dashboard cá nhân
│   │   │   ├── ProfilePage.jsx        # Trang hồ sơ cá nhân
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
│   └── seafood_db.sql            # Full database dump (dùng cho Docker init)
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
 │           └──< Review (ReviewerID, SellerID)
 │           └──< Favorite
 │           └──< Report
 │
 └──< Follow (FollowerID → SellerID)
 └──< Notification
```

### Chi Tiết Bảng

#### `User`
| Cột | Kiểu | Mô tả |
|---|---|---|
| UserID | INT PK AUTO_INCREMENT | Khóa chính |
| Name | VARCHAR(100) NOT NULL | Họ tên |
| Phone | VARCHAR(15) UNIQUE NOT NULL | Số điện thoại (dùng đăng nhập) |
| PasswordHash | VARCHAR(255) NOT NULL | Mật khẩu đã hash (bcrypt) |
| Role | ENUM('User','Admin') | Vai trò, mặc định 'User' |
| IsActive | TINYINT(1) | Tài khoản còn hoạt động (Admin toggle) |
| Avatar | VARCHAR(255) | URL ảnh đại diện (Cloudinary) |
| CreatedAt | DATETIME | Thời điểm đăng ký |

#### `Product`
| Cột | Kiểu | Mô tả |
|---|---|---|
| ProductID | INT PK AUTO_INCREMENT | Khóa chính |
| SellerID | INT FK → User | Người bán |
| Type | ENUM('Fresh','Dried') | Hải sản tươi / khô |
| Name | VARCHAR(150) | Tên sản phẩm |
| Description | TEXT | Mô tả |
| Price | INT | Giá (VND/kg) |
| SalesType | ENUM('Retail','Wholesale') | Bán lẻ / bán sỉ |
| TotalWeight | DECIMAL(8,2) | Tổng trọng lượng (kg) |
| RemainingWeight | DECIMAL(8,2) | Còn lại (kg) |
| Status | ENUM('Active','Expired','Deleted') | Trạng thái bài đăng |
| CatchTime | DATETIME | *(Tươi)* Thời điểm đánh bắt/cập bến |
| Lat, Lng | DECIMAL(10,7) | *(Tươi)* Tọa độ GPS |
| Origin | VARCHAR(100) | *(Khô)* Xuất xứ |
| ExpiryDate | DATE | *(Khô)* Hạn sử dụng |
| BumpedAt | DATETIME | Thời điểm đẩy bài đăng gần nhất |
| CreatedAt | DATETIME | Thời điểm tạo |

#### `ProductImage`
| Cột | Kiểu | Mô tả |
|---|---|---|
| ImageID | INT PK | Khóa chính |
| ProductID | INT FK | Bài đăng chứa ảnh |
| CloudinaryURL | VARCHAR(500) | URL ảnh đã upload |
| PublicID | VARCHAR(300) | Cloudinary public_id (để xóa) |
| SortOrder | TINYINT | Thứ tự hiển thị |

#### `Message`
| Cột | Kiểu | Mô tả |
|---|---|---|
| MessageID | INT PK | Khóa chính |
| ProductID | INT FK | Cuộc chat gắn với bài đăng nào |
| SenderID | INT FK → User | Người gửi |
| ReceiverID | INT FK → User | Người nhận |
| Content | TEXT | Nội dung tin nhắn |
| IsRead | TINYINT(1) | Đã đọc chưa |
| SentAt | DATETIME | Thời điểm gửi |

#### `Review`
| Cột | Kiểu | Mô tả |
|---|---|---|
| ReviewID | INT PK | Khóa chính |
| ProductID | INT FK | Sản phẩm được đánh giá |
| ReviewerID | INT FK → User | Người viết đánh giá |
| SellerID | INT FK → User | Người bán được đánh giá |
| Rating | TINYINT CHECK(1–5) | Số sao |
| Comment | TEXT | Nội dung đánh giá |
| ImageURL | VARCHAR(500) | Ảnh đính kèm đánh giá |
| CreatedAt | DATETIME | Thời điểm đánh giá |

> **Constraint:** `UNIQUE(ReviewerID, ProductID)` — mỗi người chỉ được đánh giá một sản phẩm một lần.

#### `Follow`
| Cột | Kiểu | Mô tả |
|---|---|---|
| FollowID | INT PK | Khóa chính |
| FollowerID | INT FK → User | Người theo dõi |
| SellerID | INT FK → User | Người bán được theo dõi |
| CreatedAt | DATETIME | Thời điểm follow |

> **Constraint:** `UNIQUE(FollowerID, SellerID)` — tránh follow trùng lặp.

### Indexes Quan Trọng

```sql
-- Tìm kiếm theo loại & trạng thái (thường dùng nhất)
INDEX idx_product_type_status ON Product(Type, Status)

-- Sắp xếp theo BumpedAt (tính năng đẩy bài)
INDEX idx_product_bumpedat ON Product(BumpedAt)
INDEX idx_product_status_type_bumped ON Product(Status, Type, BumpedAt)

-- Full-text search tên & mô tả sản phẩm
FULLTEXT INDEX idx_product_fulltext ON Product(Name, Description)

-- Tra cứu đánh giá theo người bán
INDEX idx_review_seller ON Review(SellerID)
```

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

**PUT `/profile`** — `multipart/form-data`
```
name: string (tùy chọn)
avatar: File (JPEG/PNG/WEBP, tối đa 5MB)
```

---

### 6.2 User — `/api/users`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/:id` | Lấy profile công khai của người dùng | ❌ |

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

#### Request Body — `POST /api/products` — `multipart/form-data`

```
type: "Fresh" | "Dried"
name: string
description: string
price: number (VND/kg)
salesType: "Retail" | "Wholesale"
totalWeight: number (kg)

# Nếu type = "Fresh":
catchTime: string (ISO 8601)
lat: number
lng: number

# Nếu type = "Dried":
origin: string
expiryDate: string (YYYY-MM-DD)

images[]: File[] (tối đa 5 ảnh, JPEG/PNG/WEBP, mỗi ảnh ≤ 5MB)
```

---

### 6.4 Images — `/api/images`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/upload` | Upload ảnh lên Cloudinary | ✅ |
| DELETE | `/:id` | Xóa ảnh (tự động xóa trên Cloudinary) | ✅ |

---

### 6.5 Messages — `/api/messages`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/unread-count` | Số tin nhắn chưa đọc | ✅ |
| GET | `/conversations` | Danh sách tất cả hội thoại | ✅ |
| GET | `/:productId` | Lịch sử chat của một sản phẩm | ✅ |
| POST | `/` | Gửi tin nhắn (REST fallback) | ✅ |

> **Lưu ý:** Luồng chat chính chạy qua Socket.IO. REST endpoint dùng như fallback hoặc load lịch sử.

---

### 6.6 Reviews — `/api/reviews`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/` | Đăng đánh giá người bán (kèm ảnh tùy chọn) | ✅ |
| GET | `/seller/:sellerId` | Lấy tất cả đánh giá của một người bán | ❌ |

#### Request Body — `POST /api/reviews` — `multipart/form-data`

```
productId: number
sellerId: number
rating: number (1–5)
comment: string
image: File (tùy chọn, JPEG/PNG/WEBP, ≤ 5MB)
```

---

### 6.7 Notifications — `/api/notifications`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| GET | `/` | Lấy danh sách thông báo | ✅ |
| PUT | `/read` | Đánh dấu tất cả đã đọc | ✅ |
| PATCH | `/:id` | Đánh dấu một thông báo đã đọc | ✅ |

---

### 6.8 Follow — `/api/follows`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/:sellerId` | Follow người bán | ✅ |
| DELETE | `/:sellerId` | Unfollow người bán | ✅ |
| GET | `/` | Danh sách người bán đang follow | ✅ |

---

### 6.9 Favorites — `/api/favorites`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/:productId` | Thêm vào yêu thích | ✅ |
| DELETE | `/:productId` | Xóa khỏi yêu thích | ✅ |
| GET | `/` | Danh sách bài đăng yêu thích | ✅ |

---

### 6.10 Reports — `/api/reports`

| Method | Path | Mô tả | Auth |
|---|---|---|---|
| POST | `/:productId` | Tạo báo cáo vi phạm | ✅ |
| GET | `/` | Xem danh sách báo cáo | ✅ + Admin only |
| PATCH | `/:id` | Xử lý báo cáo (resolve/dismiss) | ✅ + Admin only |

---

### 6.11 Admin — `/api/admin`

> **Yêu cầu:** `Role = 'Admin'` — toàn bộ các endpoint dưới đây đều bị chặn nếu không phải Admin.

| Method | Path | Mô tả |
|---|---|---|
| GET | `/stats` | Thống kê tổng quan (users, products, reports...) |
| GET | `/users` | Danh sách tất cả người dùng |
| PATCH | `/users/:id/toggle` | Kích hoạt / vô hiệu hóa tài khoản |
| PATCH | `/users/:id/verify` | Cấp huy hiệu xác minh (Verified) cho người bán |
| GET | `/listings` | Danh sách tất cả bài đăng |
| DELETE | `/listings/:id` | Xóa bài đăng vi phạm |

---

### 6.12 Real-time — Socket.IO Events

**Namespace:** `/` (default)  
**Auth:** Cookie `token` tự động gửi khi kết nối

#### Client → Server

| Event | Payload | Mô tả |
|---|---|---|
| `join_room` | `{ productId: number }` | Tham gia phòng chat của sản phẩm |
| `leave_room` | `{ productId: number }` | Rời khỏi phòng chat |
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

Khi server trả về response, nó set thêm một cookie `csrf_token` (không HttpOnly, có thể đọc bởi JS). Với mọi request mutation, frontend đọc cookie đó và đính kèm vào header `X-CSRF-Token`. Backend so sánh giá trị header với cookie — nếu không khớp trả về `403 Forbidden`. Cơ chế này bảo vệ chống Cross-Site Request Forgery vì trang web độc hại không thể đọc cookie từ domain khác.

**Các endpoint miễn CSRF** (public, chỉ GET hoặc không cần auth):
- `POST /api/auth/login`
- `POST /api/auth/register`
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

### 7.5 SQL Parameterization

Toàn bộ câu lệnh SQL sử dụng prepared statements của `mysql2` với placeholder `?`, ngăn chặn hoàn toàn tấn công SQL Injection.

### 7.6 Helmet Security Headers

Helmet tự động thiết lập các HTTP security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security`
- `X-XSS-Protection`
- v.v.

---

## 8. Cài Đặt & Chạy (Local)

### Yêu Cầu Hệ Thống

- Node.js v20 trở lên
- MySQL Server 8.0
- npm v9+

### Bước 1 — Chuẩn bị Database

```bash
# Tạo database và import schema
mysql -u root -p < backend/sql/schema.sql

# (Tùy chọn) Import dữ liệu mẫu
mysql -u root -p seafood_db < backend/sql/seed.sql
```

### Bước 2 — Cấu hình Backend

```bash
cd backend
cp .env.example .env
# Chỉnh sửa .env với thông tin database và Cloudinary của bạn
npm install
npm run dev
# Backend chạy tại http://localhost:5000
# Migrations tự động chạy khi khởi động
```

### Bước 3 — Cấu hình Frontend

```bash
cd ../client/my-app
cp .env.example .env
# Chỉnh sửa VITE_SOCKET_URL=http://localhost:5000
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
# Output tại dist/ — serve bằng nginx hoặc bất kỳ static server nào
```

---

## 9. Triển Khai Docker

Docker Compose tự động hóa toàn bộ môi trường phát triển với 3 container.

### Khởi Động

```bash
# Từ thư mục gốc (nơi có docker-compose.yml)
docker-compose up --build
```

### Các Container

| Container | Image | Port | Chú thích |
|---|---|---|---|
| `seafood_db` | mysql:8.0 | 3306 | Có health check trước khi backend khởi động |
| `seafood_backend` | Node.js build | 5000 | Chờ DB healthy, tự động `npm run dev` |
| `seafood_frontend` | Node.js build | 3000 | Chờ backend sẵn sàng |

### Health Check

Database container được kiểm tra bằng `mysqladmin ping` với:
- `interval: 10s`
- `timeout: 5s`
- `retries: 10`
- `start_period: 60s`

Backend chỉ khởi động khi `db` có trạng thái `healthy` — tránh lỗi kết nối database khi container MySQL chưa sẵn sàng.

### Persistent Storage

```yaml
volumes:
  mysql_data:  # Dữ liệu MySQL không bị mất khi restart container
```

### Dừng & Dọn Dẹp

```bash
docker-compose down          # Dừng container, giữ dữ liệu
docker-compose down -v       # Dừng container, XÓA volumes (reset DB)
```

---

## 10. Tính Năng Chi Tiết

### 10.1 Tìm Kiếm GPS (Haversine)

Khi người dùng cung cấp tọa độ (`lat`, `lng`) và bán kính (`radius`), hệ thống tính khoảng cách giữa người dùng và từng bài đăng hải sản tươi bằng **công thức Haversine**. Chỉ những bài đăng nằm trong bán kính được trả về. Kết quả sắp xếp theo `BumpedAt` DESC (bài đẩy lên đầu).

```
d = 2R × arcsin(√(sin²(Δlat/2) + cos(lat₁)×cos(lat₂)×sin²(Δlng/2)))
```

### 10.2 Bump (Đẩy Bài Đăng)

Người bán có thể "bump" bài đăng của mình lên đầu danh sách. Hệ thống cập nhật `BumpedAt = NOW()`. Cooldown 24h được enforce ở backend: nếu `NOW() - BumpedAt < 24h`, server trả về lỗi.

### 10.3 Cron Job Tự Động Hết Hạn

`node-cron` chạy định kỳ kiểm tra và cập nhật `Status = 'Expired'` cho các bài đăng hải sản tươi có `CatchTime` quá 48 giờ (hoặc logic tương tự được cấu hình trong `cron.ts`).

### 10.4 Real-time Chat

Chat được tổ chức theo **phòng** (`productId`). Khi người dùng mở trang chi tiết sản phẩm, client tự động join room tương ứng. Tin nhắn gửi qua `send_message` event và được broadcast đến tất cả thành viên trong room qua `receive_message`.

Xác thực Socket.IO: server đọc cookie `token` từ handshake request, xác minh JWT, gắn thông tin user vào socket.

### 10.5 Notification Service

`notification.service.ts` tạo notification records trong DB và emit Socket.IO event `new_notification` đến room cá nhân (`user_<id>`) của người nhận. Đảm bảo người dùng nhận thông báo real-time ngay cả khi đang ở trang khác.

### 10.6 Lazy Loading & Performance

Frontend dùng `React.lazy()` + `Suspense` để tách bundle: mỗi page chỉ được tải khi người dùng thực sự truy cập, giảm thời gian tải trang ban đầu.

---

## 11. Biến Môi Trường

### Backend (`backend/.env`)

```env
# Server
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=root123
DB_NAME=seafood_db

# Authentication
JWT_SECRET=<chuỗi bí mật ngẫu nhiên dài ≥ 32 ký tự>
JWT_EXPIRES_IN=7d

# Cloudinary (https://cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=<cloud name>
CLOUDINARY_API_KEY=<api key>
CLOUDINARY_API_SECRET=<api secret>
```

### Frontend (`client/my-app/.env`)

```env
VITE_SOCKET_URL=http://localhost:5000
```

> **Lưu ý bảo mật:** Không commit file `.env` thực lên git. File `.env.example` đã được include để tham khảo cấu trúc.

---

*Tài liệu được tạo tự động từ codebase — cần bổ sung phần thông tin nhóm và demo screenshots.*
