# Frontend mới

## Role split và đăng nhập

Đã thêm lớp đăng nhập frontend cho 3 loại user: Buyer, Seller và Admin.

- Guest chưa đăng nhập được điều hướng về giao diện Buyer.
- Buyer chỉ thấy frontend chợ biển/public: chợ, ngư dân, bếp biển, cộng đồng.
- Seller chỉ thấy workspace Seller tông cam sáng.
- Admin chỉ thấy control room Admin tông đỏ sáng.
- Session demo dùng `localStorage` key `haisan-demo-user`; đăng xuất sẽ xóa key này và quay về Guest/Buyer.
- Google OAuth backend vẫn giữ sẵn qua `/auth/google`, `/auth/me`, `/auth/logout` để nối credential thật sau.
- Chuông thông báo ở cạnh ô đăng nhập/tài khoản đổi nội dung theo Buyer, Seller, Admin.

## Giai đoạn 1 - Guest và Buyer

Đã triển khai trong `client/` bằng HTML, CSS và JavaScript thuần.

Phạm vi:

- Chợ hải sản public.
- Tìm kiếm, lọc loại hàng, lọc theo nhóm Fresh/Dried, lọc gần tôi.
- Sắp xếp theo mới nhất, xem nhiều, giá thấp, giá cao.
- Xem chi tiết sản phẩm.
- Xem hồ sơ ngư dân public.
- Xem công thức và bài viết cộng đồng public.
- Lưu sản phẩm quan tâm bằng `localStorage`; khi có phiên đăng nhập hợp lệ sẽ thử đồng bộ API favorites.
- Hộp chat Buyer dạng Messenger demo có gửi chữ, tệp, hình ảnh, vị trí, emoji, ghi âm, gọi điện thường và gọi camera.
- Dữ liệu mẫu tự hiển thị khi backend chưa chạy hoặc database chưa có seed.

## Giai đoạn 2 - Seller

Đã triển khai trong `client/`.

Phạm vi:

- Dashboard người bán với trạng thái đồng bộ, mẻ đang bán, tồn kho và giá trị tồn ước tính.
- Tab tổng quan với việc nên làm hôm nay và danh sách mẻ hàng mới nhất.
- Quản lý mẻ hàng: tạo sản phẩm, đẩy tin, xóa sản phẩm, đồng bộ `/products/my` và `/products/today-count`.
- Ảnh khi đăng mẻ hàng/bài viết được chọn từ file trên máy tính hoặc điện thoại, có preview trước khi gửi.
- Quản lý nội dung seller: tạo công thức qua `/recipes`, tạo bài viết qua `/posts`.
- Inbox Seller dạng hộp chat Messenger demo: mở hội thoại buyer, gửi chữ/tệp/hình ảnh/vị trí/emoji/ghi âm, gọi điện thường và gọi camera để chuẩn bị nối Socket.IO/WebRTC ở backend.
- Demo mode tự hoạt động khi chưa có phiên đăng nhập backend.

## Giai đoạn 3 - Admin

Đã triển khai trong `client/`.

Phạm vi:

- Admin control room tông đỏ sáng, tách rõ khỏi Buyer xanh và Seller cam.
- Dashboard tổng quan với thống kê user, listing, message, report, biểu đồ 7 ngày và top seller.
- Quản lý user/seller qua `/admin/users`: tìm kiếm, khóa/mở tài khoản, duyệt/thu hồi xác minh.
- Quản lý sản phẩm toàn sàn qua `/admin/listings`: tìm kiếm, lọc trạng thái, xóa listing vi phạm.
- Xử lý report qua `/reports`: lọc trạng thái, giải quyết hoặc bỏ qua báo cáo.
- Broadcast qua `/admin/notifications/broadcast` và lịch sử `/admin/notifications/broadcasts`.
- Demo mode tự hoạt động khi chưa có phiên đăng nhập Admin.

## Chạy frontend phase 1 + 2 + 3

Docker Compose:

```powershell
docker compose up --build
```

Local static server:

```powershell
cd client
npm run dev
```

Không cần `npm install` vì frontend hiện tại không dùng dependency ngoài. Nếu muốn chạy cả frontend, backend, MongoDB và Redis thì dùng Docker Compose.
