# Changelog — HảiSản.vn (shop_sea)

> Theo dõi toàn bộ thay đổi của dự án theo thời gian.  
> Format dựa trên [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

*(Các tính năng đang phát triển — chưa merge vào main)*

---

## [0.3.0] — 2026-05-20

### Added
- **Admin panel** (`AdminPage.jsx`): quản lý người dùng, sản phẩm, duyệt/xóa tin đăng
- **Notification system**: thông báo realtime khi có tin nhắn mới, người theo dõi mới
- **Review system** (`ReviewList.jsx`): đánh giá sao, phân bố rating, submit review
- **Follow system**: người mua có thể theo dõi người bán
- **Seller profile page** (`SellerProfilePage.jsx`): trang hồ sơ người bán với danh sách sản phẩm

### Changed
- Refactor `product.controller.ts`: tách logic filter/pagination vào helper riêng
- Cải thiện UI `ProductCard.jsx`: thêm badge "Còn hàng / Hết hàng", hiển thị khoảng cách

### Fixed
- Lỗi Leaflet marker icon 404 trên Vite — override `L.Icon.Default` prototype
- Socket.io CORS error khi deploy — thêm origin config rõ ràng
- SQL injection risk trong search query — chuyển sang prepared statements

### AI Usage
- `AL-007`: Claude hỗ trợ viết `ReviewList.jsx`
- `AL-005` (fix): tự debug lỗi Leaflet icon, không có AI hỗ trợ phần này

---

## [0.2.0] — 2026-05-20

### Added
- **Realtime chat** (`ChatBox.jsx`, `ChatPopover.jsx`): chat 1-1 người mua ↔ người bán qua Socket.io
- **Image upload**: upload ảnh sản phẩm lên Cloudinary qua memory stream
- **Map integration** (`MapMini.jsx`, `MapExplore.jsx`): hiển thị vị trí sản phẩm trên bản đồ Leaflet
- **Haversine distance filter**: tìm sản phẩm theo bán kính địa lý
- `ImageSlider.jsx`: slide ảnh sản phẩm trên trang chi tiết
- `useCountdown.js` hook: đếm ngược cho sản phẩm flash sale

### Changed
- Chuyển từ JavaScript sang TypeScript hoàn toàn phía backend
- Tái cấu trúc thư mục: tách `src/` (TypeScript) và `dist/` (compiled)

### Fixed
- Lỗi multer không nhận multipart form khi thiếu `Content-Type` header

### AI Usage
- `AL-003`: Copilot hỗ trợ product CRUD filter + pagination
- `AL-004`: Claude thiết kế kiến trúc Socket.io
- `AL-005`: Claude hướng dẫn Leaflet + React
- `AL-006`: ChatGPT hướng dẫn Cloudinary stream upload

---

## [0.1.0] — 2026-05-19

### Added
- **Khởi tạo dự án**: setup backend Express + TypeScript, frontend React + Vite
- **Database schema** (`sql/schema.sql`): 9 bảng — users, products, categories, orders, reviews, messages, notifications, follows, images
- **Seed data** (`sql/seed.sql`): dữ liệu mẫu để test
- **Authentication**: đăng ký, đăng nhập, JWT, middleware `verifyToken`
- **Product API**: CRUD cơ bản (tạo, xem, sửa, xóa sản phẩm)
- **Navbar** (`Navbar.jsx`): điều hướng responsive với Tailwind
- **Auth page** (`AuthPage.jsx`): form đăng ký / đăng nhập
- **Dashboard** (`DashboardPage.jsx`): trang quản lý sản phẩm của người bán
- Cấu hình CORS, dotenv, Cloudinary

### AI Usage
- `AL-001`: Claude thiết kế database schema
- `AL-002`: Claude viết auth controller + JWT middleware

---

## Ghi chú định dạng

```
### Added    — tính năng mới
### Changed  — thay đổi tính năng đã có
### Fixed    — sửa bug
### Removed  — xóa tính năng
### AI Usage — ghi rõ các log AL-xxx liên quan
```
