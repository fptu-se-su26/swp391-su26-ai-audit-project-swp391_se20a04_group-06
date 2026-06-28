# AI Audit Log — HảiSản.vn (shop_sea)

> Tài liệu này ghi lại **tất cả các lần sử dụng AI có ý nghĩa** trong quá trình phát triển dự án.  
> Cập nhật sau mỗi phiên làm việc với AI.

---

## Hướng dẫn điền log

| Trường | Nội dung |
|---|---|
| **ID** | Số thứ tự (AL-001, AL-002, ...) |
| **Ngày** | DD/MM/YYYY |
| **Sinh viên** | Họ tên + MSSV |
| **Công cụ AI** | Claude / ChatGPT / Copilot / Gemini / ... |
| **Nhiệm vụ** | Tên task / feature đang làm |
| **Mục đích** | Lý do dùng AI |
| **Kết quả** | AI trả về gì, đã dùng hay chỉnh sửa không |
| **Đánh giá** | Chất lượng output (Tốt / Cần chỉnh sửa / Không dùng được) |

---

## Log

### AL-001

| | |
|---|---|
| **Ngày** | 19/05/2026 |
| **Sinh viên** | HE186165 |
| **Công cụ AI** | Claude Sonnet |
| **Branch** | `docs/HE186165-add-personal-folder` |
| **Nhiệm vụ** | Thiết kế database schema cho hệ thống mua bán hải sản |
| **Mục đích** | Gợi ý các collection cần thiết và quan hệ giữa chúng |
| **Prompt tham chiếu** | PROMPTS.md → P-001 |
| **Kết quả** | AI đề xuất các collection chính: `User`, `Product`, `Message`, `Notification`, `Review`. Đã điều chỉnh lưu trực tiếp mảng `images` trong Product schema để tận dụng cấu trúc lồng nhau của MongoDB |
| **Đánh giá** | ✅ Tốt — dùng làm nền, tự chỉnh sửa ~30% |

---

### AL-002

| | |
|---|---|
| **Ngày** | 19/05/2026 |
| **Sinh viên** | HE186165 |
| **Công cụ AI** | Claude Sonnet |
| **Branch** | `docs/HE186165-add-personal-folder` |
| **Nhiệm vụ** | Xây dựng API đăng ký / đăng nhập với JWT |
| **Mục đích** | Tạo nhanh boilerplate cho `auth.controller.ts` và middleware xác thực |
| **Prompt tham chiếu** | PROMPTS.md → P-002 |
| **Kết quả** | AI sinh ra controller với bcrypt hash password, tạo JWT, middleware `verifyToken`. Đã thêm pre-save hook trong Schema để tự động hash mật khẩu |
| **Đánh giá** | ✅ Tốt — dùng trực tiếp, thêm xử lý lỗi chi tiết hơn |

---

### AL-003

| | |
|---|---|
| **Ngày** | 20/05/2026 |
| **Sinh viên** | HE186165 |
| **Công cụ AI** | GitHub Copilot |
| **Branch** | `docs/HE186165-add-personal-folder` |
| **Nhiệm vụ** | Viết CRUD cho sản phẩm (product.controller.ts) |
| **Mục đích** | Autocomplete và gợi ý xử lý query MongoDB phức tạp (filter, pagination, search) |
| **Prompt tham chiếu** | PROMPTS.md → P-003 |
| **Kết quả** | Copilot gợi ý truy vấn có `$regex`, `$gte`, `$lte` và `.sort()`. Đã kiểm tra lại logic và thêm truy vấn khoảng cách địa lý sử dụng `$near` của MongoDB |
| **Đánh giá** | ✅ Tốt — hỗ trợ tốt phần MongoDB query |

---

### AL-004

| | |
|---|---|
| **Ngày** | 20/05/2026 |
| **Sinh viên** | HE186165 |
| **Công cụ AI** | Claude Sonnet |
| **Branch** | `docs/HE186165-add-personal-folder` |
| **Nhiệm vụ** | Tích hợp Socket.io cho chat realtime giữa người mua và người bán |
| **Mục đích** | Thiết kế kiến trúc room/event của Socket.io cho use-case 1-1 messaging |
| **Prompt tham chiếu** | PROMPTS.md → P-004 |
| **Kết quả** | AI đề xuất pattern: join room theo `conversationId`, emit/listen các event `sendMessage`, `receiveMessage`, `userOnline`. Đã tích hợp vào `socket.ts` và lưu chat vào MongoDB |
| **Đánh giá** | ✅ Tốt — kiến trúc rõ ràng, ít phải chỉnh sửa |

---

### AL-005

| | |
|---|---|
| **Ngày** | 20/05/2026 |
| **Sinh viên** | HE186165 |
| **Công cụ AI** | Claude Sonnet |
| **Branch** | `docs/HE186165-add-personal-folder` |
| **Nhiệm vụ** | Tích hợp bản đồ Leaflet vào trang khám phá sản phẩm theo vị trí |
| **Mục đích** | Gợi ý cách dùng Leaflet với React (không dùng react-leaflet) |
| **Prompt tham chiếu** | PROMPTS.md → P-005 |
| **Kết quả** | AI hướng dẫn cách init map trong `useEffect`, cleanup khi unmount, thêm marker, popup. Đã áp dụng vào `MapMini.jsx` và `MapExplore.jsx` |
| **Đánh giá** | ⚠️ Cần chỉnh sửa — AI dùng `L.marker` nhưng icon bị lỗi trên Vite, phải cấu hình thêm icon path thủ công |

---

### AL-006

| | |
|---|---|
| **Ngày** | 20/05/2026 |
| **Sinh viên** | HE186165 |
| **Công cụ AI** | ChatGPT |
| **Branch** | `docs/HE186165-add-personal-folder` |
| **Nhiệm vụ** | Upload ảnh sản phẩm lên Cloudinary qua backend |
| **Mục đích** | Cách dùng multer + streamifier để upload stream lên Cloudinary (không lưu file local) |
| **Prompt tham chiếu** | PROMPTS.md → P-006 |
| **Kết quả** | AI giải thích rõ pattern upload-to-buffer, pipe qua `streamifier.createReadStream`, gọi `cloudinary.uploader.upload_stream`. Dùng được trực tiếp |
| **Đánh giá** | ✅ Tốt — dùng trực tiếp, không cần chỉnh sửa nhiều |

---

### AL-007

| | |
|---|---|
| **Ngày** | 20/05/2026 |
| **Sinh viên** | HE186165 |
| **Công cụ AI** | Claude Sonnet |
| **Branch** | `docs/HE186165-add-personal-folder` |
| **Nhiệm vụ** | Hệ thống đánh giá sản phẩm với xếp hạng sao và bình luận |
| **Mục đích** | Thiết kế UI component ReviewList và logic tính trung bình sao |
| **Prompt tham chiếu** | PROMPTS.md → P-007 |
| **Kết quả** | AI tạo component có hiển thị sao, phân trang, sắp xếp theo mới nhất. Đã tích hợp vào `ReviewList.jsx` and `ProductDetailPage.jsx` |
| **Đánh giá** | ✅ Tốt |

---

### AL-008

| | |
|---|---|
| **Ngày** | 11/06/2026 |
| **Sinh viên** | HE186165 |
| **Công cụ AI** | Claude Sonnet |
| **Branch** | `docs/HE186165-add-personal-folder` |
| **Nhiệm vụ** | Tích hợp CI/CD tự động, Swagger API docs, Mock Auth, Unit tests và khắc phục lỗi linter trên GitHub Actions |
| **Mục đích** | Triển khai 4 thành phần quan trọng của real product (Automated Testing, CI/CD Pipeline, Logging/Monitoring, Swagger Docs) và sửa lỗi lint trong React Vite |
| **Prompt tham chiếu** | N/A (Hỗ trợ trực tiếp qua mã nguồn dự án) |
| **Kết quả** | Tạo file `ci.yml` chạy trên GitHub Actions, viết tài liệu Swagger API tại endpoint `/api-docs` trong `swagger.ts`, tạo mock auth cho môi trường dev, viết các file unit tests, và sửa lỗi linter liên quan đến biến toàn cục `process` trong `vite.config.js` cùng import dư thừa trong `format.jsx` |
| **Đánh giá** | ✅ Tốt — hoàn thành tất cả mục tiêu tích hợp và sửa lỗi CI thành công |

---

*Thêm log mới vào bên dưới khi sử dụng AI tiếp theo.*

---

## Thống kê

| Công cụ | Số lần dùng | Tỷ lệ dùng được |
|---|---|---|
| Claude Sonnet | 6 | 85% dùng trực tiếp, 15% cần chỉnh |
| GitHub Copilot | 1 | ✅ |
| ChatGPT | 1 | ✅ |

> **Cam kết:** Nhóm có thể giải thích, kiểm chứng và bảo vệ toàn bộ code được hỗ trợ bởi AI.
