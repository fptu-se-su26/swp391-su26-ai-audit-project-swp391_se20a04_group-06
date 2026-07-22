# Reflection — Nguyễn Thành Thuận (DE191012)

> Phản ánh quá trình học tập, quyết định kỹ thuật và kinh nghiệm rút ra trong dự án HảiSản.vn.

---

## 1. Vai trò & Quyết định kỹ thuật cá nhân

**Vai trò:** Frontend Developer (DE191012 - Nguyễn Thành Thuận)

### 1.1 Điều hướng & Routing
- Rà soát và chuẩn hóa lại cấu trúc route trong React Router cho các trang liên quan đến Ngư dân, đảm bảo route lồng nhau hoạt động đúng và không bị redirect sai.

### 1.2 Tối ưu cấu trúc Component bằng Custom Hooks
- Tách các logic dùng chung (gọi API, cập nhật SEO, đếm ngược, quản lý thông báo) ra thành các custom hook riêng (`useApiFetch`, `useSEO`, `useCountdown`, `useNotifications`) để tái sử dụng trên nhiều trang, giảm trùng lặp code giữa `HomePage`, `ProfilePage`, `DashboardPage`, `ProductListPage`, `RecipeListPage`.

### 1.3 Chuẩn hóa giao diện & quản lý nhánh Git
- Rà soát, chuẩn hóa spacing và responsive layout bằng Tailwind CSS trước khi tích hợp vào nhánh chính.
- Trực tiếp xử lý conflict khi merge nhánh cá nhân với các thay đổi UI/UX khác, đảm bảo không mất code của các hook/service đã có.

---

## 2. Bài học rút ra khi dùng AI
- AI hỗ trợ rất tốt trong việc phát hiện lỗi cấu hình route và gợi ý pattern chuẩn cho custom hook, giúp tiết kiệm thời gian tái cấu trúc code.
- Khi xử lý conflict lúc merge, AI có thể giải thích rõ ý nghĩa của conflict marker và chiến lược resolve, nhưng quyết định cuối cùng (giữ code nào, bỏ code nào) vẫn cần hiểu rõ ngữ cảnh nghiệp vụ của từng thay đổi để không làm mất tính năng đã hoàn thiện trước đó.
- Việc chuẩn hóa UI/UX theo gợi ý của AI cần đối chiếu lại với thiết kế chung của nhóm, không áp dụng máy móc toàn bộ đề xuất.
