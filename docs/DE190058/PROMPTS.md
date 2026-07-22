# Prompts — Trần Minh Đức (DE190058)

> Lưu lại các prompt quan trọng đã sử dụng với AI trong dự án HảiSản.vn.

---

## P-001 — Thiết kế thuộc tính Seafood Size & Validation

**Công cụ:** Claude Sonnet  
**Ngày:** 14/07/2026  
**Tham chiếu:** AL-001

**Prompt đã gửi:**
```
Thiết kế enum và validation cho thuộc tính kích thước hải sản (Seafood Size) trong Mongoose Schema (Node.js + TypeScript).
Yêu cầu: Hỗ trợ phân loại size tiêu chuẩn (ví dụ: Size S, M, L, XL hoặc theo con/kg), đảm bảo lọc sản phẩm nhanh và hiển thị rõ ràng trên React Client.
```

**Output AI trả về (tóm tắt):** Bảng enum chi tiết và middleware validate cho Mongoose Schema.

**Đã chỉnh sửa:** Tích hợp trực tiếp vào Product Schema và hiển thị badge trên UI client.

---

## P-002 — Vá lỗ hổng NoSQL Injection & ObjectId Validation

**Công cụ:** Claude Sonnet  
**Ngày:** 19/07/2026  
**Tham chiếu:** AL-003

**Prompt đã gửi:**
```
Hãy rà soát đoạn code Express controller lọc sản phẩm theo ID và vị trí địa lý GeoJSON.
Làm thế nào để phòng chống NoSQL Injection khi nhận req.params và req.query? Viết middleware validate ObjectId chuẩn bằng Mongoose.
```

**Output AI trả về (tóm tắt):** Đề xuất dùng `mongoose.Types.ObjectId.isValid()` và hàm sanitize input.

**Đã chỉnh sửa:** Áp dụng vào toàn bộ route handler trong backend.

---

## P-003 — Quản lý Redis Quota & Rate Limit Cache

**Công cụ:** ChatGPT / Claude  
**Ngày:** 19/07/2026  
**Tham chiếu:** AL-004

**Prompt đã gửi:**
```
Hướng dẫn cách cài đặt Redis quota limiter trong Express TypeScript để giới hạn tần suất request và tự động xóa key quá hạn (TTL expiration).
```

**Output AI trả về (tóm tắt):** Cấu hình Redis client với `EXPIRE` và hàm tăng đếm request.

**Đã chỉnh sửa:** Tích hợp vào Redis helper module của dự án.
