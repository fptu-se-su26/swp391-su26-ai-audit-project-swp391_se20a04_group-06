# AI Audit Log — Trần Minh Đức (DE190058)

> Tài liệu này ghi lại tất cả các lần sử dụng AI có ý nghĩa trong quá trình phát triển dự án của sinh viên Trần Minh Đức (MSSV: DE190058).

---

## Log

### AL-001

| | |
|---|---|
| **Ngày** | 14/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | Claude Sonnet |
| **Commit** | `df5712b8`, `dd414018` |
| **Nhiệm vụ** | Bổ sung thuộc tính Seafood Size & Tối ưu giao diện Light Mode |
| **Mục đích** | Gợi ý cấu trúc enum dữ liệu kích thước hải sản và quy chuẩn nhãn hiển thị |
| **Kết quả** | AI đề xuất bảng phân loại size hải sản tiêu chuẩn. Đã tích hợp vào Product Schema và bổ sung hiển thị nổi bật Tên hải sản trên UI |
| **Đánh giá** | ✅ Tốt — áp dụng trực tiếp, tự chỉnh sửa CSS hiển thị |

---

### AL-002

| | |
|---|---|
| **Ngày** | 17/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | GitHub Copilot |
| **Commit** | `5bc3912f` |
| **Nhiệm vụ** | Viết Unit Test cho hệ thống Backend |
| **Mục đích** | Gợi ý test-case và mock data cho Jest runner |
| **Kết quả** | Copilot sinh ra các test suite kiểm tra validation và response format. Đã chỉnh sửa lại mock Redis và MongoDB database connection |
| **Đánh giá** | ✅ Tốt — tiết kiệm 50% thời gian viết test |

---

### AL-003

| | |
|---|---|
| **Ngày** | 19/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | Claude Sonnet |
| **Commit** | `9ec22f73` |
| **Nhiệm vụ** | Audit bảo mật backend, rà soát lỗ hổng dữ liệu |
| **Mục đích** | Rà soát các điểm có nguy cơ NoSQL Injection và rò rỉ dữ liệu khi filter sản phẩm |
| **Kết quả** | AI chỉ ra điểm thiếu `ObjectId.isValid()` trong controller và các query tham số địa lý chưa sanitization. Đã vá triệt để |
| **Đánh giá** | ✅ Tốt — phát hiện đúng điểm yếu bảo mật |

---

### AL-004

| | |
|---|---|
| **Ngày** | 19/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | ChatGPT / Claude |
| **Commit** | `330f5922` |
| **Nhiệm vụ** | Tối ưu hóa Redis Quota và xử lý validation ObjectId |
| **Mục đích** | Xây dựng middleware kiểm tra quota Redis và cơ chế tự động giải phóng cache stale |
| **Kết quả** | Đề xuất pattern Redis TTL đếm số lượt gọi API và middleware validate `ObjectId`. Đã áp dụng vào toàn bộ routes |
| **Đánh giá** | ✅ Tốt |

---

### AL-005

| | |
|---|---|
| **Ngày** | 20/07/2026 |
| **Sinh viên** | Trần Minh Đức - DE190058 |
| **Công cụ AI** | Claude Sonnet |
| **Commit** | `9bbec4a4` |
| **Nhiệm vụ** | Đồng bộ hóa lô sản phẩm (Batch products) và củng cố Auth Messaging Integrity |
| **Mục đích** | Thiết kế logic xử lý đồng bộ giao dịch theo lô trong MongoDB (session transaction) |
| **Kết quả** | AI cung cấp pattern Mongoose `withTransaction` đảm bảo tính toàn vẹn dữ liệu khi đồng bộ hàng loạt sản phẩm |
| **Đánh giá** | ✅ Tốt — giúp mã nguồn chạy ổn định và an toàn |

---

## Thống kê

| Công cụ | Số lần dùng | Tỷ lệ dùng được |
|---|---|---|
| Claude Sonnet | 4 | 90% |
| GitHub Copilot | 1 | ✅ |
