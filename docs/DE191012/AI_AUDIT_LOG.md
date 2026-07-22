# AI_AUDIT_LOG.md — Cá nhân DE191012

### AL-001

|                |                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ngày**       | 17/06/2026                                                                                                                                                                          |
| **Sinh viên**  | Nguyễn Thành Thuận - DE191012                                                                                                                                                       |
| **Công cụ AI** | Claude Sonnet                                                                                                                                                                       |
| **Commit**     | `01b8cdef`                                                                                                                                                                          |
| **Nhiệm vụ**   | Cập nhật giao diện Frontend và fix bug route trang Ngư dân                                                                                                                          |
| **Mục đích**   | Nhờ AI rà soát cấu hình React Router để tìm nguyên nhân route `/ngu-dan` bị lỗi điều hướng (redirect sai / route con không khớp)                                                    |
| **Kết quả**    | AI chỉ ra lỗi khai báo route lồng nhau (nested route) và thứ tự khai báo path chưa đúng gây trùng path. Đã áp dụng sửa lại cấu trúc route và kiểm thử lại điều hướng trên giao diện |
| **Đánh giá**   | ✅ Tốt — xác định đúng nguyên nhân, áp dụng trực tiếp                                                                                                                               |

---

### AL-002

|                |                                                                                                                                                                                                                                                                                       |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ngày**       | 19/06/2026                                                                                                                                                                                                                                                                            |
| **Sinh viên**  | Nguyễn Thành Thuận - DE191012                                                                                                                                                                                                                                                         |
| **Công cụ AI** | Claude Sonnet                                                                                                                                                                                                                                                                         |
| **Commit**     | `a015429e`                                                                                                                                                                                                                                                                            |
| **Nhiệm vụ**   | Cập nhật giao diện theo mùa cho Web Client và bổ sung các custom hooks                                                                                                                                                                                                                |
| **Mục đích**   | Nhờ AI gợi ý cấu trúc các custom hook (`useSEO`, `useNotifications`, `useCountdown`, `useApiFetch`, `useVideoCall`) để tách logic ra khỏi component, tránh lặp code giữa các trang                                                                                                    |
| **Kết quả**    | AI đề xuất pattern custom hook chuẩn của React (tách state, effect, cleanup) và cách gọi API tập trung qua `useApiFetch`. Đã tích hợp vào các trang `HomePage`, `ProfilePage`, `DashboardPage`, `ProductListPage`, `RecipeListPage` và điều chỉnh lại theo giao diện mùa hè của dự án |
| **Đánh giá**   | ✅ Tốt — giảm trùng lặp code, dễ bảo trì hơn                                                                                                                                                                                                                                          |

---

### AL-003

|                |                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ngày**       | 23/06/2026                                                                                                                                                 |
| **Sinh viên**  | Nguyễn Thành Thuận - DE191012                                                                                                                              |
| **Công cụ AI** | Claude Sonnet                                                                                                                                              |
| **Commit**     | `10334fca`                                                                                                                                                 |
| **Nhiệm vụ**   | Cập nhật UI/UX tổng thể trước khi đồng bộ nhánh                                                                                                            |
| **Mục đích**   | Nhờ AI rà soát và gợi ý chuẩn hóa spacing, màu sắc, responsive layout trên các trang trước khi merge vào nhánh chính                                       |
| **Kết quả**    | AI đề xuất một số điều chỉnh Tailwind class cho khoảng cách và bố cục trên mobile. Đã áp dụng một phần và tự điều chỉnh lại theo thiết kế thực tế của nhóm |
| **Đánh giá**   | ✅ Tốt — hỗ trợ tinh chỉnh giao diện nhanh hơn                                                                                                             |

---

### AL-004

|                |                                                                                                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ngày**       | 23/06/2026                                                                                                                                                            |
| **Sinh viên**  | Nguyễn Thành Thuận - DE191012                                                                                                                                         |
| **Công cụ AI** | Gemini Sonnet                                                                                                                                                         |
| **Commit**     | `4dd83426`                                                                                                                                                            |
| **Nhiệm vụ**   | Merge và đồng bộ nhánh cá nhân (cập nhật UI/UX) vào codebase chung                                                                                                    |
| **Mục đích**   | Nhờ AI hỗ trợ xác định và xử lý các conflict phát sinh khi merge hai nhánh cập nhật UI/UX cùng lúc, đảm bảo không mất code của các thành phần đã thêm trước đó        |
| **Kết quả**    | AI hướng dẫn cách resolve conflict theo từng file (giữ lại phần thay đổi mới nhất, không ghi đè các hook/service đã tạo). Merge hoàn tất, không phát sinh lỗi runtime |
| **Đánh giá**   | ✅ Tốt — merge an toàn, không mất dữ liệu code                                                                                                                        |

---

## Thống kê

| Công cụ       | Số lần dùng | Tỷ lệ dùng được |
| ------------- | ----------- | --------------- |
| Claude Sonnet | 3           | 100%            |
| Gemini        | 1           | 100%            |
