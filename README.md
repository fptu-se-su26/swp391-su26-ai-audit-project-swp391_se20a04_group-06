# 🐟 HảiSản.vn — Ứng dụng mua bán hải sản

> Nền tảng kết nối người mua và người bán hải sản tươi sống / khô, hỗ trợ chat realtime, bản đồ địa lý, upload ảnh và quản trị hệ thống.

---

## 📋 Thông tin dự án

| Mục        | Chi tiết           |
| ---------- | ------------------ |
| Môn học    | SWP391             |
| Lớp        | SE20A04            |
| Học kỳ     | SU26               |
| Nhóm       | 06                 |
| Loại dự án | E-commerce website |

### 👥 Thành viên nhóm

| STT | MSSV     | Họ tên             | GitHub             | Vai trò |
| --- | -------- | ------------------ | ------------------ | ------- |
| 1   | DE191087 | Tô Minh Cường      | ToMinhCuong0430    | Leader  |
| 2   | HE186165 | Đậu Đình Bút       | butdaudau          | Member  |
| 3   | DE191012 | Nguyễn Thành Thuận | thanhthuanDEXXXX12 | Member  |
| 4   | DE190058 | Trần Minh Đức      | tran-ducc          | Member  |

---

## 🚀 Tính năng chính

### Người dùng (Buyer / Seller)

- **Đăng ký / Đăng nhập** bằng số điện thoại + mật khẩu, xác thực JWT
- **Đăng bài bán hải sản** — hỗ trợ 2 loại: `Tươi sống` và `Khô`
- **Upload ảnh sản phẩm** lên Cloudinary (tối đa 5 ảnh / bài)
- **Bộ lọc theo GPS** — lọc hải sản tươi trong bán kính 20km (công thức Haversine)
- **Tìm kiếm** theo tên sản phẩm, phân trang
- **Xem bản đồ** vị trí sản phẩm trực quan (Leaflet)
- **Chat realtime** 1-1 người mua ↔ người bán (Socket.IO)
- **Thông báo realtime** — tin nhắn mới, người theo dõi mới
- **Theo dõi người bán** (Follow / Unfollow)
- **Đánh giá sao** người bán sau giao dịch
- **Dashboard** quản lý bài đăng của bản thân
- **Tự động hết hạn** — hải sản tươi quá 24h tự chuyển sang `Expired` (Cron job mỗi giờ)

### Quản trị viên (Admin)

- Xem thống kê tổng quan hệ thống
- Quản lý danh sách người dùng, khoá / mở khoá tài khoản
- Duyệt và xoá tất cả bài đăng (kèm xoá ảnh trên Cloudinary)

---

## 🛠️ Công nghệ sử dụng

### Backend

| Lớp         | Công nghệ                     |
| ----------- | ----------------------------- |
| Runtime     | Node.js 20                    |
| Framework   | Express 4 + TypeScript 5      |
| Database    | MySQL 8                       |
| Auth        | JWT (jsonwebtoken) + bcryptjs |
| Real-time   | Socket.IO 4                   |
| File upload | Multer (memory) → Cloudinary  |
| Cron job    | node-cron                     |
| GPS filter  | Haversine formula             |

### Frontend

| Lớp       | Công nghệ               |
| --------- | ----------------------- |
| Framework | React 19 + Vite 8       |
| Bản đồ    | Leaflet + React-Leaflet |
| HTTP      | Fetch API (native)      |
| Real-time | Socket.IO client        |
| Styling   | CSS thuần               |

### DevOps

| Công cụ                 | Mục đích                    |
| ----------------------- | --------------------------- |
| Docker + Docker Compose | Container hoá toàn bộ stack |
| MySQL 8 (Docker)        | Database                    |
| Cloudinary              | Lưu trữ ảnh sản phẩm        |

---

## 📁 Cấu trúc thư mục

```
shop_sea/
├── docker-compose.yml          # Khởi chạy toàn bộ stack (DB + Backend + Frontend)
├── database/
│   └── seafood_db.sql          # SQL dump khởi tạo database
├── backend/
│   ├── Dockerfile
│   ├── .env                    # Biến môi trường (tạo từ .env.example)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── app.ts              # Entry point
│   │   ├── db.ts               # MySQL connection pool
│   │   ├── socket.ts           # Socket.IO realtime chat
│   │   ├── cron.ts             # Auto-expire hải sản tươi 24h
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── product.controller.ts
│   │   │   ├── image.controller.ts
│   │   │   ├── message.controller.ts
│   │   │   ├── review.controller.ts
│   │   │   ├── follow.controller.ts
│   │   │   ├── notification.controller.ts
│   │   │   └── admin.controller.ts
│   │   ├── routes/
│   │   ├── middlewares/
│   │   │   ├── auth.ts         # JWT guard
│   │   │   └── upload.ts       # Multer + Cloudinary
│   │   ├── services/
│   │   ├── utils/
│   │   │   └── haversine.ts    # Tính khoảng cách GPS
│   │   └── helpers/
│   └── sql/
│       ├── schema.sql          # Tạo bảng
│       └── seed.sql            # Dữ liệu mẫu
└── client/
    └── my-app/
        ├── Dockerfile
        ├── vite.config.js
        ├── package.json
        └── src/
            ├── App.jsx
            ├── main.jsx
            ├── pages/
            │   ├── HomePage.jsx
            │   ├── AuthPage.jsx
            │   ├── ProductDetailPage.jsx
            │   ├── PostListingPage.jsx
            │   ├── DashboardPage.jsx
            │   ├── SellerProfilePage.jsx
            │   └── AdminPage.jsx
            ├── components/
            │   ├── ProductCard.jsx
            │   ├── ChatBox.jsx
            │   ├── ChatPopover.jsx
            │   ├── NotificationBell.jsx
            │   ├── ReviewList.jsx
            │   ├── ImageSlider.jsx
            │   ├── MapMini.jsx
            │   └── MapExplore.jsx
            ├── hooks/
            ├── services/
            └── utils/
```

---

## ⚙️ Yêu cầu hệ thống

| Công cụ            | Phiên bản tối thiểu | Ghi chú                                                       |
| ------------------ | ------------------- | ------------------------------------------------------------- |
| Docker Desktop     | 4.x trở lên         | [Tải tại đây](https://www.docker.com/products/docker-desktop) |
| Git                | Bất kỳ              | Để clone repo                                                 |
| Cloudinary account | —                   | Cần API key để upload ảnh                                     |

> Không cần cài Node.js hay MySQL thủ công nếu chạy bằng Docker.

---

## 🐳 Cách chạy bằng Docker (Khuyến nghị)

### Bước 1 — Clone repository

```bash
git clone <repository-url>
cd shop_sea
```

### Bước 2 — Cấu hình biến môi trường backend

```bash
cd backend
cp .env.example .env
```

Mở file `backend/.env` và điền thông tin:

```env
# ─── Database (Docker tự điền, không cần sửa) ────
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=
DB_NAME=seafood_db

# ─── Auth ────────────────────────────────────────
JWT_SECRET=haiSanVn_super_secret_2024
JWT_EXPIRES_IN=7d

# ─── Server ──────────────────────────────────────
PORT=5000
CLIENT_URL=http://localhost:3000

# ─── Cloudinary (BẮT BUỘC điền) ─────────────────
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

> ⚠️ Cloudinary dùng để lưu ảnh sản phẩm. Đăng ký miễn phí tại [cloudinary.com](https://cloudinary.com), vào **Dashboard** lấy `Cloud Name`, `API Key`, `API Secret`.

### Bước 3 — Khởi động Docker Desktop

Mở **Docker Desktop** và đợi icon taskbar chuyển trạng thái **Running**.

Kiểm tra:

```bash
docker info
```

### Bước 4 — Build và chạy toàn bộ stack

```bash
# Trở về thư mục gốc shop_sea
cd ..

# Lần đầu chạy (build image)
docker compose up --build

# Những lần sau (không cần build lại)
docker compose up
```

Docker sẽ khởi động theo thứ tự:

1. `seafood_db` — MySQL 8, healthcheck tự động
2. `seafood_backend` — Express + TypeScript, chờ DB healthy
3. `seafood_frontend` — React + Vite

### Bước 5 — Truy cập ứng dụng

| Dịch vụ            | URL                   |
| ------------------ | --------------------- |
| **Frontend (Web)** | http://localhost:3000 |
| **Backend API**    | http://localhost:5000 |
| **Database**       | localhost:3306        |

### Dừng ứng dụng

```bash
# Dừng container (giữ data)
docker compose stop

# Dừng và xoá container (giữ database volume)
docker compose down

# Dừng và xoá tất cả kể cả data DB
docker compose down -v
```

---

## 💻 Cách chạy thủ công (Không dùng Docker)

> Yêu cầu: Node.js 20+, MySQL 8 đã cài sẵn và đang chạy.

### Bước 1 — Clone và cài dependencies

```bash
git clone <repository-url>
cd shop_sea
```

### Bước 2 — Thiết lập database

Đăng nhập MySQL và tạo database:

```bash
mysql -u root -p
```

```sql
CREATE DATABASE seafood_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

Import schema và seed data:

```bash
mysql -u root -p seafood_db < database/seafood_db.sql

# Hoặc dùng file riêng trong backend/sql/
mysql -u root -p < backend/sql/schema.sql
mysql -u root -p seafood_db < backend/sql/seed.sql
```

### Bước 3 — Chạy Backend

```bash
cd backend
cp .env.example .env
# Điền thông tin DB và Cloudinary vào .env

npm install
npm run dev
```

Server chạy tại: `http://localhost:5000`

### Bước 4 — Chạy Frontend

Mở terminal mới:

```bash
cd client/my-app
npm install
npm run dev
```

Frontend chạy tại: `http://localhost:3000`

---

## 🔑 Tài khoản mẫu (Seed data)

| Loại       | Số điện thoại                  | Mật khẩu      |
| ---------- | ------------------------------ | ------------- |
| Admin      | `0000000000`                   | `password123` |
| Người dùng | _(xem `backend/sql/seed.sql`)_ | `password123` |

---

## 📡 API Endpoints

### Auth

| Method | Endpoint             | Mô tả                   | Auth |
| ------ | -------------------- | ----------------------- | ---- |
| POST   | `/api/auth/register` | Đăng ký tài khoản       | ❌   |
| POST   | `/api/auth/login`    | Đăng nhập, nhận JWT     | ❌   |
| GET    | `/api/auth/me`       | Thông tin user hiện tại | ✅   |

```json
// POST /api/auth/register
{ "name": "Nguyễn Văn A", "phone": "0123456789", "password": "password123" }

// POST /api/auth/login
{ "phone": "0123456789", "password": "password123" }
```

### Products

| Method | Endpoint            | Mô tả              | Auth |
| ------ | ------------------- | ------------------ | ---- |
| GET    | `/api/products`     | Danh sách sản phẩm | ❌   |
| GET    | `/api/products/my`  | Bài đăng của tôi   | ✅   |
| GET    | `/api/products/:id` | Chi tiết sản phẩm  | ❌   |
| POST   | `/api/products`     | Tạo bài đăng       | ✅   |
| PUT    | `/api/products/:id` | Cập nhật bài đăng  | ✅   |
| DELETE | `/api/products/:id` | Xoá bài đăng       | ✅   |

Query params cho `GET /api/products`:

```
?type=Fresh         # Lọc theo loại: Fresh | Dried
&lat=10.76&lng=106.69  # GPS để lọc trong 20km (chỉ áp dụng type=Fresh)
&search=cá ngừ     # Tìm kiếm theo tên
&page=1&limit=12   # Phân trang
```

### Images

| Method | Endpoint                   | Mô tả                                          | Auth |
| ------ | -------------------------- | ---------------------------------------------- | ---- |
| POST   | `/api/products/:id/images` | Upload ảnh (multipart, field: `images`, max 5) | ✅   |
| DELETE | `/api/images/:id`          | Xoá ảnh                                        | ✅   |

### Messages

| Method | Endpoint                     | Mô tả                   | Auth |
| ------ | ---------------------------- | ----------------------- | ---- |
| GET    | `/api/messages/unread-count` | Số tin chưa đọc         | ✅   |
| GET    | `/api/messages/:productId`   | Lịch sử chat của 1 bài  | ✅   |
| POST   | `/api/messages`              | Gửi tin (REST fallback) | ✅   |

### Reviews & Follow

| Method | Endpoint                 | Mô tả                  | Auth |
| ------ | ------------------------ | ---------------------- | ---- |
| GET    | `/api/reviews/:sellerId` | Đánh giá của người bán | ❌   |
| POST   | `/api/reviews`           | Gửi đánh giá           | ✅   |
| POST   | `/api/follow/:sellerId`  | Theo dõi người bán     | ✅   |
| DELETE | `/api/follow/:sellerId`  | Huỷ theo dõi           | ✅   |

### Admin (🔐 Admin only)

| Method | Endpoint                      | Mô tả                        |
| ------ | ----------------------------- | ---------------------------- |
| GET    | `/api/admin/stats`            | Thống kê tổng quan           |
| GET    | `/api/admin/users`            | Danh sách người dùng         |
| PATCH  | `/api/admin/users/:id/toggle` | Khoá / Mở khoá tài khoản     |
| GET    | `/api/admin/listings`         | Tất cả bài đăng              |
| DELETE | `/api/admin/listings/:id`     | Xoá bài (kèm ảnh Cloudinary) |

---

## 🔌 Socket.IO — Realtime Chat

```js
import { io } from "socket.io-client";

const socket = io("http://localhost:5000", {
  auth: { token: "your_jwt_token" },
});

// Vào room chat của sản phẩm
socket.emit("join_room", productId);

// Gửi tin nhắn
socket.emit("send_message", {
  productId: 1,
  receiverId: 5,
  content: "Cá còn không anh?",
});

// Nhận tin nhắn mới
socket.on("new_message", (msg) => {
  console.log(msg);
});

// Nhận thông báo (khi không trong room)
socket.on("notification", (data) => {
  // Hiện badge thông báo
});
```

---

## ⏰ Cron Job — Tự động hết hạn

Chạy **mỗi giờ một lần**, tự động chuyển tất cả sản phẩm loại `Fresh` quá 24h kể từ khi đăng lên trạng thái `Expired`. Sản phẩm expired sẽ không xuất hiện trên trang chủ.

---

## 🐛 Xử lý lỗi thường gặp

**`ERR_EMPTY_RESPONSE` khi vào localhost:3000**
→ Thêm `host: '0.0.0.0'` vào `vite.config.js`, restart frontend container.

**`open //./pipe/dockerDesktopLinuxEngine: The system cannot find the file specified`**
→ Docker Desktop chưa mở. Khởi động Docker Desktop và chờ Running.

**Backend không kết nối được DB**
→ Kiểm tra healthcheck MySQL đã passed chưa bằng `docker compose logs db`.

**Ảnh không upload được**
→ Kiểm tra lại `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` trong `backend/.env`.

---

## 📂 Tài liệu AI Audit

| File                   | Nội dung                          |
| ---------------------- | --------------------------------- |
| `docs/AI_AUDIT_LOG.md` | Nhật ký sử dụng AI theo từng task |
| `docs/PROMPTS.md`      | Các prompt đã dùng                |
| `docs/REFLECTION.md`   | Phản ánh về quá trình dùng AI     |
| `docs/CHANGELOG.md`    | Lịch sử thay đổi dự án            |

---

## 🔀 Quy trình làm việc nhóm

```
Issue → Branch → Commit → Pull Request → Review → Merge
```

**Đặt tên branch:**

```
feature/studentid-ten-tinh-nang
bugfix/studentid-ten-loi
docs/studentid-cap-nhat-tai-lieu
```

**Commit message:**

```
[MSSV] feat: mô tả ngắn
[MSSV] fix: sửa lỗi gì
[MSSV] docs: cập nhật tài liệu gì
```
