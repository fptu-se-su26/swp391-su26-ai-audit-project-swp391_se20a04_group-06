# Báo cáo review và tối ưu Frontend

Ngày hoàn thành: 28/06/2026  
Phạm vi: `client/` (React + Vite)  
Backend, REST API, authentication, database schema, business logic và Socket event không bị chỉnh sửa.

## 1. Những gì đã sửa

- Chuẩn hóa cấu trúc route, menu và workspace theo ba vai trò Buyer, Seller và Admin.
- Tập trung luồng Buyer vào xem sản phẩm, lưu, giữ chỗ và trao đổi trực tiếp qua Chat; không có Cart, Checkout hay Order.
- Hoàn thiện Product Card với ảnh, tên, giá/kg, khoảng cách, độ tươi `Fresh Today`, nguồn gốc, Premium, Verified, trạng thái, nhắn người bán, giữ chỗ và lưu.
- Chuẩn bị UI cho bốn trạng thái `Available`, `Reserved`, `Sold Out`, `Expired` mà không đổi enum hoặc schema backend.
- Vô hiệu hóa nút giữ chỗ khi sản phẩm không còn ở trạng thái `Available`.
- Thay danh sách emoji hardcode bằng `emoji-picker-react`, có tìm kiếm và tải emoji theo nhu cầu.
- Xóa hoàn toàn nhãn `Đang nhập...` giả vì backend chưa có typing Socket event.
- Sửa Socket ở môi trường development kết nối qua origin của Vite để sử dụng proxy `/socket.io`; production vẫn đọc `VITE_API_URL`.
- Chuyển Boat Log từ hành động xóa sang lưu trữ/khôi phục. Frontend không còn gọi API xóa Boat Log.
- Thu gọn Seller Dashboard còn đúng sáu nhóm dữ liệu: lượt xem, tin nhắn, bài đăng, Boat Log, follower và thông báo.
- Chuẩn hóa trạng thái sản phẩm dùng chung giữa Product Card, Product Detail, Seller Products và Seller Dashboard.
- Giữ Google OAuth Client ID trong `VITE_GOOGLE_CLIENT_ID`; HTTP development đi qua Vite proxy `/api`.
- Bổ sung responsive cho cụm hành động Boat Log, emoji picker, dashboard, bảng và lưới sản phẩm.

## 2. Những gì đã xóa

- `apiRecipes` và toàn bộ phần Recipe trên trang Home.
- `apiReviews` chưa được sử dụng.
- Các method service không được gọi: auth login/register/update profile cũ, follow toggle cũ, Boat Log like/delete.
- Typing indicator không có dữ liệu Socket thật.
- Emoji array hardcode.
- CSS của Recipe đã bị loại khỏi giao diện.
- Thư mục source legacy gồm `legacy_src/app.js`, `legacy_src/index.html`, `legacy_src/styles.css`.
- Asset SVG sprite `public/icons.svg` không được tham chiếu.
- Comment giải thích response shape cũ và dead code liên quan.

## 3. Những gì đã tối ưu

- Route-level lazy loading và code splitting cho toàn bộ page chính.
- `ProductCard` và `MessageBubble` dùng memo để giảm render lại khi danh sách lớn.
- Nâng `lucide-react` lên bản hỗ trợ React 19 để `npm install` không còn xung đột peer dependency.
- Ảnh Product Card, Boat Log và ảnh Chat dùng lazy loading khi phù hợp.
- Helper dùng chung xử lý ID, ảnh, tiền tệ, ngày, độ tươi, khoảng cách và marketplace status.
- Không có inline CSS trong `src/`.
- Không có file JavaScript/JSX vượt 300 dòng.
- Không có HTTP call trực tiếp ngoài `services/api.js`.
- Chat và Leaflet tiếp tục nằm trong chunk riêng, không chặn bundle trang Home.
- CSS thuần được giữ nguyên; không thêm Tailwind hay Bootstrap component.

## 4. Vấn đề còn tồn tại

- Archive Boat Log đang lưu trong `localStorage`. Đây là cơ chế hide/restore an toàn phía UI nhưng chưa đồng bộ giữa thiết bị vì backend không có trường soft-delete/archive.
- `Reserved` và `Sold Out` được suy ra từ dữ liệu frontend (`isReserved`, `reserved`, `remainingWeight` hoặc status nếu có). Backend hiện chưa lưu hai trạng thái này.
- Backend chưa có typing event nên frontend chủ động không hiển thị typing indicator.
- Notification history chưa có API; dashboard chỉ đếm thông báo nhận được trong phiên Socket hiện tại.
- Khi QA, backend/API không hoạt động nên chưa thể chạy end-to-end Google Login, dữ liệu sản phẩm và Chat đã xác thực. Frontend dev server và các route vẫn khởi động bình thường.
- Hai ảnh PNG cũ trong `src/assets/` không còn được import và không đi vào production bundle; có thể xóa khỏi repository khi xác nhận không cần lưu làm tư liệu.

## 5. Đề xuất cải thiện trong tương lai

- Thêm trường archive/soft-delete và API restore cho Boat Log nếu muốn đồng bộ nhiều thiết bị.
- Mở rộng product status ở backend khi nghiệp vụ `Reserved`/`Sold Out` được chốt.
- Bổ sung Socket event typing và read receipt, sau đó mới bật UI tương ứng.
- Cung cấp notification history API.
- Thêm Error Boundary và test tự động cho status mapping, Chat, routing và responsive navigation.
- Khắc phục môi trường backend (MongoDB/Redis/API) rồi chạy lại kiểm thử OAuth và Chat end-to-end.

## Kết quả xác minh

- `npm run lint`: đạt, không lỗi.
- `npm run build`: đạt, 235 module được build.
- `npm install --package-lock-only`: đạt, lockfile hợp lệ và 0 lỗ hổng được báo cáo.
- `npm run dev`: HTTP 200 tại `http://127.0.0.1:5173/`.
- Browser desktop: không có console error và không tràn ngang.
- Browser tablet 768 px: lưới Seller 2 cột, không tràn ngang.
- Browser mobile 390 px: menu mobile hoạt động theo breakpoint, không tràn ngang.
- Boat Log: có nút lưu trữ, không có nút xóa.
- Seller Dashboard: đúng 6 metric yêu cầu, không có doanh thu/order/kho.
- Inline style: 0.
- File JS/JSX trên 300 dòng: 0.
- Backend file bị chỉnh sửa: 0.
