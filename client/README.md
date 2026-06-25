# HaiSan.vn Frontend Phase 2

Frontend mới cho giai đoạn 1 và 2: Guest/Buyer dùng chung giao diện, Seller có workspace quản lý riêng.

## Chạy local

Từ thư mục `client`:

```powershell
npm run dev
```

Mở `http://localhost:3000`.

Không cần `npm install` vì frontend hiện tại không dùng dependency ngoài.

Backend mặc định được gọi ở `http://localhost:5000/api`. Nếu cần đổi API:

```js
localStorage.setItem("haisan-api-base", "http://localhost:5000/api");
```

## Chạy bằng Docker Compose

Từ thư mục gốc dự án:

```powershell
docker compose up --build
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:5000`

## Phạm vi hiện tại

- Chợ hải sản public cho guest/buyer.
- Tìm kiếm, lọc loại hàng, lọc gần tôi, sắp xếp.
- Hồ sơ ngư dân public.
- Công thức và bài viết cộng đồng public.
- Lưu sản phẩm quan tâm bằng localStorage; nếu có phiên đăng nhập thì thử đồng bộ API favorites.
- Seller workspace với dashboard tổng quan, tồn kho, hạn mức đăng bài trong ngày.
- Quản lý mẻ hàng: tạo sản phẩm, đẩy tin, xóa sản phẩm; có demo mode khi chưa đăng nhập.
- Seller tạo công thức và bài viết cộng đồng.
- Mock inbox/thông báo để chuẩn bị nối realtime message/video call.
