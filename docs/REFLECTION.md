# Reflection — HảiSản.vn (shop_sea)

> Phản ánh quá trình học tập, quyết định kỹ thuật và bài học rút ra trong dự án.

---

## 1. Tổng quan dự án

**Tên dự án:** HảiSản.vn — Nền tảng mua bán hải sản tươi sống trực tuyến  
**Tech stack:**
- Backend: Node.js + TypeScript + Express + MongoDB (Mongoose) + Socket.io + Cloudinary
- Frontend: React (Vite) + Tailwind CSS + Leaflet.js
- Công cụ AI: Claude Sonnet, GitHub Copilot, ChatGPT

---

## 2. Quyết định kỹ thuật quan trọng

### 2.1 Tại sao chọn TypeScript cho backend thay vì JavaScript thuần?

TypeScript giúp phát hiện lỗi kiểu dữ liệu sớm, đặc biệt hữu ích khi làm việc với dữ liệu từ MongoDB (tránh các lỗi thuộc tính không tồn tại hoặc sai kiểu dữ liệu). Ban đầu nhóm nghĩ TypeScript sẽ tốn thêm thời gian setup, nhưng thực tế nó tiết kiệm nhiều thời gian debug hơn.

### 2.2 Tại sao dùng Mongoose ODM thay vì Driver MongoDB thuần?

Nhóm chọn sử dụng Mongoose ODM vì:
- Hỗ trợ định nghĩa Schema rõ ràng cho các Collection (User, Product, Message, etc.) và tự động validate dữ liệu ở mức ứng dụng.
- Dễ dàng thực hiện các truy vấn địa lý như `$near` hoặc `$geoWithin` (hỗ trợ tìm kiếm GPS).
- Quản lý các liên kết giữa các collection thông qua `.populate()` một cách tiện lợi.
- Hỗ trợ middleware (pre/post hooks) hữu ích cho việc mã hóa mật khẩu hoặc ghi vết dữ liệu.

### 2.3 Tại sao dùng Leaflet thay vì Google Maps?

Google Maps API yêu cầu thẻ tín dụng để lấy key. Leaflet hoàn toàn miễn phí, đủ dùng cho tính năng hiển thị vị trí sản phẩm theo khu vực.

### 2.4 Upload ảnh: Memory storage thay vì Disk storage

Dùng `multer` memory storage + `streamifier` để stream trực tiếp lên Cloudinary, tránh để lại file tạm trên server. Cách này sạch hơn và phù hợp với môi trường deployment không có persistent disk.

---

## 3. Những gì AI giúp được tốt

- **Boilerplate code:** Tạo nhanh controller, route, middleware — tiết kiệm ~40% thời gian setup
- **Kiến trúc:** Gợi ý pattern tốt cho Socket.io, Cloudinary stream
- **Debug gợi ý:** Khi paste lỗi vào, AI thường đề xuất đúng nguyên nhân

---

## 4. Những gì AI làm không tốt / cần kiểm tra lại

- **Lỗi Leaflet icon trên Vite:** AI không biết bug nổi tiếng này, phải tự tìm giải pháp
- **Mongoose Schema & Types:** AI hay dùng cast `as any` khi định nghĩa các trường liên kết (`Types.ObjectId`) thay vì sử dụng type đúng — phải sửa lại
- **Context-specific logic:** Haversine filter, business rules riêng của dự án — AI không biết, phải tự viết
- **Security edge cases:** AI không luôn nhắc tới rate limiting, input sanitization — phải chủ động thêm

**Bài học:** AI là công cụ hỗ trợ, không phải người replace. Phải đọc, hiểu, và kiểm tra mọi output trước khi dùng.

---

## 5. Khó khăn gặp phải và cách giải quyết

| Khó khăn | Cách giải quyết |
|---|---|
| Merge conflict lần đầu push (thấy trong git log) | Giải quyết conflict thủ công, hiểu cách đọc `<<<<`, `====`, `>>>>` |
| Socket.io không kết nối được do CORS | Thêm `cors` config vào socket server với origin cụ thể |
| Leaflet icon lỗi 404 trên Vite | Override `L.Icon.Default` prototype, set iconUrl thủ công |
| Mongoose Schema populate không nhận kiểu đúng | Dùng generic hoặc custom interface kế thừa `Document` của Mongoose |
| Cloudinary upload không trả về URL | Phải wrap `upload_stream` trong Promise đúng cách |

---

## 6. Nếu làm lại, nhóm sẽ thay đổi gì?

1. **Dùng branch ngay từ đầu** — commit đầu tiên thẳng lên main là sai workflow, nên tạo branch `feature/` từ đầu
2. **Viết `.env.example`** — để thành viên khác biết cần config những biến nào mà không lộ secret
3. **Viết test đơn giản** — ít nhất test các API endpoint chính bằng Postman Collection hoặc Jest
4. **Tách docs sớm hơn** — không để cuối mới viết AI_AUDIT_LOG, nên log ngay khi dùng

---

## 7. Kỹ năng tích lũy được

- Hiểu được quy trình Git workflow thực tế (branch → PR → merge)
- Biết cách tích hợp Cloudinary, Socket.io, Leaflet vào dự án thực
- Biết đánh giá output AI: khi nào tin, khi nào phải kiểm tra lại
- Kinh nghiệm debug TypeScript + MongoDB / Mongoose trong môi trường thực tế

---

*Document này được cập nhật trong quá trình phát triển và hoàn thiện sau khi kết thúc sprint.*
