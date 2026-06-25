# HaiSan.vn Frontend Phase 1

Frontend mới cho giai đoạn 1: Guest và Buyer dùng chung giao diện.

## Chạy local

Từ thư mục `client`:

```powershell
npm run dev
```

Mở `http://localhost:3000`.

Không cần `npm install` vì phase 1 không dùng dependency frontend.

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

## Phạm vi phase 1

- Chợ hải sản public cho guest/buyer.
- Tìm kiếm, lọc loại hàng, lọc gần tôi, sắp xếp.
- Hồ sơ ngư dân public.
- Công thức và bài viết cộng đồng public.
- Lưu sản phẩm quan tâm bằng localStorage; nếu có phiên đăng nhập thì thử đồng bộ API favorites.
