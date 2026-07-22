# Reflection — Trần Minh Đức (DE190058)

> Phản ánh quá trình học tập, quyết định kỹ thuật và kinh nghiệm rút ra trong dự án HảiSản.vn.

---

## 1. Vai trò & Quyết định kỹ thuật cá nhân

**Vai trò:** Core Developer & Performance/Security Specialist (DE190058 - Trần Minh Đức)

### 1.1 Bảo mật & Validation Backend
- Tăng cường kiểm tra `ObjectId.isValid()` trên toàn bộ các route backend để tránh lỗi crash server khi nhận ID không hợp lệ.
- Thực hiện sanitization dữ liệu đầu vào để chống lỗ hổng NoSQL Injection khi khách hàng tìm kiếm hải sản theo vị trí GPS hoặc danh mục.

### 1.2 Quản lý Redis Cache & Performance
- Áp dụng Redis Quota nhằm tối ưu hóa hiệu năng truy vấn, giảm tải cho MongoDB khi truy xuất dữ liệu sản phẩm phổ biến.

### 1.3 Kiểm thử tự động (Unit Tests)
- Xây dựng các ca kiểm thử bằng Jest cho các hàm nghiệp vụ quan trọng, đảm bảo hệ thống vận hành ổn định sau mỗi lần refactor.

---

## 2. Bài học rút ra khi dùng AI
- AI rất mạnh trong việc gợi ý các pattern bảo mật và viết boilerplate test case.
- Tuy nhiên, luôn cần phải tự rà soát thủ công các logic nghiệp vụ đặc thù của dự án trước khi đưa vào sản xuất.
