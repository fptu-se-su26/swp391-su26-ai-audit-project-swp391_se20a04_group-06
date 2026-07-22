# Prompts — HảiSản.vn (shop_sea)

> Lưu lại các prompt quan trọng đã sử dụng với AI.  
> Mỗi prompt được tham chiếu từ `AI_AUDIT_LOG.md`.

---

## P-001 — Thiết kế cơ sở dữ liệu MongoDB (Mongoose Schemas)

**Công cụ:** Claude Sonnet  
**Ngày:** 19/05/2026  
**Tham chiếu:** AL-001

**Prompt đã gửi:**
```
Tôi đang xây dựng ứng dụng web mua bán hải sản tươi sống tại Việt Nam.
Người dùng có thể đăng ký làm người bán hoặc người mua.
Người bán đăng tin sản phẩm kèm ảnh, giá, vị trí (lat/lng).
Người mua có thể tìm kiếm theo loại hải sản, khu vực, giá; xem chi tiết, đánh giá sản phẩm; chat với người bán.
Hãy đề xuất các MongoDB collections (Schemas dùng Mongoose) với đầy đủ các trường dữ liệu và liên kết giữa chúng.
```

**Output AI trả về (tóm tắt):** AI đề xuất các collection chính: `User`, `Product`, `Message`, `Notification`, `Review` với các schema Mongoose tương ứng.

**Đã chỉnh sửa:** Tích hợp trực tiếp mảng `images` vào trong `Product` schema (thay vì tách collection riêng) để tận dụng cấu trúc lồng nhau của MongoDB; thêm trường `location` kiểu GeoJSON `Point` để hỗ trợ truy vấn không gian ($near).

---

## P-002 — Auth controller với JWT

**Công cụ:** Claude Sonnet  
**Ngày:** 19/05/2026  
**Tham chiếu:** AL-002

**Prompt đã gửi:**
```
Viết auth.controller.ts cho Express + TypeScript + Mongoose với:
- Đăng ký: hash password với bcrypt, lưu vào MongoDB, trả JWT
- Đăng nhập: kiểm tra email + password, trả JWT (expires 7d)
- Middleware verifyToken: kiểm tra Bearer token trong header, gán user vào req
Dùng Mongoose Model để tương tác với DB.
```

**Output AI trả về (tóm tắt):** Code đầy đủ cho register, login, middleware.

**Đã chỉnh sửa:** Thêm kiểm tra email đã tồn tại trước khi tạo user mới; thêm pre-save hook trong User Schema để tự động hash mật khẩu; thêm trường `role` (buyer/seller) vào JWT payload.

---

## P-003 — Product CRUD với filter và pagination

**Công cụ:** GitHub Copilot (inline suggestion)  
**Ngày:** 20/05/2026  
**Tham chiếu:** AL-003

**Prompt / context đã nhập:**
```typescript
// Hàm getProducts nhận query params: category, minPrice, maxPrice,
// keyword, page, limit, sortBy (price_asc, price_desc, newest)
// Trả về danh sách sản phẩm + totalCount để phân trang
async function getProducts(req: Request, res: Response) {
```
*(Copilot tự gợi ý phần còn lại)*

**Output AI trả về (tóm tắt):** Mongoose query object động với các filter `$gte`, `$lte`, `$regex` và `.sort()`, `.skip()`, `.limit()`.

**Đã chỉnh sửa:** Tích hợp truy vấn địa lý sử dụng `$near` của MongoDB để tìm kiếm các sản phẩm lân cận vị trí GPS của người dùng; sử dụng Haversine để tính toán chính xác khoảng cách hiển thị lên giao diện.

---

## P-004 — Socket.io realtime chat

**Công cụ:** Claude Sonnet  
**Ngày:** 20/05/2026  
**Tham chiếu:** AL-004

**Prompt đã gửi:**
```
Thiết kế kiến trúc Socket.io cho tính năng chat 1-1 giữa người mua và người bán.
Backend: Node.js + socket.io 4.x
Frontend: React
Yêu cầu:
- Mỗi cuộc hội thoại có conversationId riêng
- Hiển thị trạng thái online/offline
- Lưu tin nhắn vào MongoDB khi gửi
- Load lịch sử tin nhắn khi mở chat
Liệt kê các event cần dùng và luồng xử lý.
```

**Output AI trả về (tóm tắt):**

Events: `join_conversation`, `send_message`, `receive_message`, `user_online`, `user_offline`, `typing`, `stop_typing`.

Luồng: Client join room → emit send_message → server lưu MongoDB qua Message repository → emit receive_message đến room.

**Đã chỉnh sửa:** Thêm logic `isRead` flag; thêm event `message_read` để hiển thị tick đã đọc.

---

## P-005 — Leaflet map trong React

**Công cụ:** Claude Sonnet  
**Ngày:** 20/05/2026  
**Tham chiếu:** AL-005

**Prompt đã gửi:**
```
Hướng dẫn tích hợp Leaflet.js vào React (Vite) mà không dùng react-leaflet.
Cần:
- Init map trong useEffect, cleanup khi component unmount
- Thêm markers từ mảng products (có lat, lng, title)
- Click vào marker hiện popup với tên sản phẩm và giá
- Tránh lỗi "map container already initialized"
```

**Output AI trả về (tóm tắt):** Code dùng `useRef` để giữ instance map, kiểm tra `mapRef.current` trước khi init.

**Đã chỉnh sửa:** Phải fix thêm lỗi icon Leaflet trên Vite bằng cách import và gán lại `L.Icon.Default.prototype._getIconUrl = undefined` và set iconUrl thủ công — vấn đề này AI không đề cập.

---

## P-006 — Upload ảnh Cloudinary qua stream

**Công cụ:** ChatGPT  
**Ngày:** 20/05/2026  
**Tham chiếu:** AL-006

**Prompt đã gửi:**
```
Tôi dùng multer (memory storage) + streamifier để upload ảnh lên Cloudinary
mà không lưu file tạm local trên server.
Viết hàm uploadToCloudinary(buffer: Buffer): Promise<string> trả về secure_url.
Dùng cloudinary v2, TypeScript.
```

**Output AI trả về (tóm tắt):** Hàm wrap `upload_stream` trong Promise, pipe buffer qua streamifier.

**Đã chỉnh sửa:** Thêm option `folder` để phân loại ảnh theo sản phẩm/avatar; thêm `transformation` resize ảnh trước khi lưu.

---

## P-007 — Review component với rating sao

**Công cụ:** Claude Sonnet  
**Ngày:** 20/05/2026  
**Tham chiếu:** AL-007

**Prompt đã gửi:**
```
Viết React component ReviewList hiển thị danh sách đánh giá sản phẩm.
Props: productId
Tính năng:
- Fetch reviews từ API /api/reviews/:productId
- Hiển thị avatar, tên user, số sao (1-5), nội dung, ngày đánh giá
- Hiển thị tổng điểm trung bình + thanh phân bố sao (5 sao: X%, 4 sao: Y%, ...)
- Cho phép người dùng đã đăng nhập submit review mới
- Dùng Tailwind CSS
```

**Output AI trả về (tóm tắt):** Component hoàn chỉnh với state management, form submit, tính toán phân bố sao.

**Đã chỉnh sửa:** Thêm kiểm tra "user đã review rồi thì ẩn form"; thêm xác nhận xóa review của chính mình.

---

## P-008 — Cải thiện DatePicker, Format Tiền VND & Audit Dự án trước khi nộp

**Công cụ:** Antigravity AI  
**Ngày:** 22/07/2026  
**Tham chiếu:** AL-009

**Prompt đã gửi:**
```
Sửa lại 2 ô nhập thông tin trong ảnh dễ dùng dễ nhập thông tin hơn, giá của sản phẩm hiển thị cần chuẩn format việt nam đồng. Sau đó review toàn bộ dự án trước khi nộp đồ án và tiến hành fix các lỗi được phát hiện.
```

**Output AI trả về (tóm tắt):**
1. Thay thế text-mask `DateTimePicker` và `DatePicker` bằng browser native `datetime-local` và `date` input, bổ sung CSS icon calendar teal theme.
2. Cập nhật `formatCurrency` trong `product.js` và toàn bộ các trang AdminDashboard, ProductLivePreview, Premium sử dụng `Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })`.
3. Audit dự án: Khôi phục `authLimiter` max từ 1000 về 20, loại bỏ tracking folder `backend/dist/`, xóa file tạm `.docx`, sửa `playwright.config.ts` port 5173 và kiểm tra build `npx tsc --noEmit` thành công.

**Đã chỉnh sửa:** Giữ nguyên các cải tiến trực tiếp, chạy kiểm thử lại toàn bộ ứng dụng.

---

*Thêm prompt mới khi có phiên làm việc AI tiếp theo.*
