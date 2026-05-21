# Prompts — HảiSản.vn (shop_sea)

> Lưu lại các prompt quan trọng đã sử dụng với AI.  
> Mỗi prompt được tham chiếu từ `AI_AUDIT_LOG.md`.

---

## P-001 — Thiết kế database schema

**Công cụ:** Claude Sonnet  
**Ngày:** 19/05/2026  
**Tham chiếu:** AL-001

**Prompt đã gửi:**
```
Tôi đang xây dựng ứng dụng web mua bán hải sản tươi sống tại Việt Nam.
Người dùng có thể đăng ký làm người bán hoặc người mua.
Người bán đăng tin sản phẩm kèm ảnh, giá, vị trí (lat/lng).
Người mua có thể tìm kiếm theo loại hải sản, khu vực, giá; xem chi tiết, đánh giá sản phẩm; chat với người bán.
Hãy đề xuất database schema (MySQL) với đầy đủ các bảng, cột, quan hệ khóa ngoại.
```

**Output AI trả về (tóm tắt):** AI đề xuất 9 bảng với đầy đủ quan hệ 1-n và n-n.

**Đã chỉnh sửa:** Thêm cột `lat`, `lng`, `address` vào `users` và `products`; thêm bảng `images` riêng để một sản phẩm có nhiều ảnh.

---

## P-002 — Auth controller với JWT

**Công cụ:** Claude Sonnet  
**Ngày:** 19/05/2026  
**Tham chiếu:** AL-002

**Prompt đã gửi:**
```
Viết auth.controller.ts cho Express + TypeScript + MySQL với:
- Đăng ký: hash password với bcrypt, lưu vào DB, trả JWT
- Đăng nhập: kiểm tra email + password, trả JWT (expires 7d)
- Middleware verifyToken: kiểm tra Bearer token trong header, gán user vào req
Dùng mysql2 pool, không dùng ORM.
```

**Output AI trả về (tóm tắt):** Code đầy đủ cho register, login, middleware.

**Đã chỉnh sửa:** Thêm kiểm tra email đã tồn tại trước khi insert; thêm try-catch chi tiết hơn; thêm trường `role` (buyer/seller) vào JWT payload.

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

**Output AI trả về (tóm tắt):** SQL query động với WHERE clause và ORDER BY.

**Đã chỉnh sửa:** Thêm filter khoảng cách địa lý (Haversine) khi user truyền `lat`, `lng`, `radius` — phần này tự viết theo `utils/haversine.ts`.

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
- Lưu tin nhắn vào MySQL khi gửi
- Load lịch sử tin nhắn khi mở chat
Liệt kê các event cần dùng và luồng xử lý.
```

**Output AI trả về (tóm tắt):**

Events: `join_conversation`, `send_message`, `receive_message`, `user_online`, `user_offline`, `typing`, `stop_typing`.

Luồng: Client join room → emit send_message → server lưu DB → emit receive_message đến room.

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

*Thêm prompt mới khi có phiên làm việc AI tiếp theo.*
