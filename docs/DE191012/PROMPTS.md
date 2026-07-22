# Prompts — Nguyễn Thành Thuận (DE191012)

> Lưu lại các prompt quan trọng đã sử dụng với AI trong dự án HảiSản.vn.

---

## P-001 — Fix bug route trang Ngư dân (React Router)

**Công cụ:** Claude Sonnet  
**Ngày:** 17/06/2026  
**Tham chiếu:** AL-001

**Prompt đã gửi:**
```
Trang danh sách Ngư dân (route /ngu-dan) của tôi bị lỗi điều hướng, khi click vào
xem chi tiết một ngư dân thì bị redirect sai hoặc không load đúng component con.
Đây là cấu hình route hiện tại (React Router v6, dùng Vite):
[dán đoạn khai báo <Routes>/<Route> liên quan]
Hãy giúp tôi tìm nguyên nhân và cách sửa route lồng nhau (nested route) cho đúng.
```

**Output AI trả về (tóm tắt):** AI chỉ ra route con bị khai báo sai thứ tự khiến React Router match nhầm path, và thiếu `index` route cho path mặc định.

**Đã chỉnh sửa:** Sắp xếp lại thứ tự khai báo route theo mức độ cụ thể tăng dần, thêm `index` route, tự kiểm thử lại toàn bộ luồng điều hướng trang Ngư dân trước khi commit.

---

## P-002 — Tách logic component thành Custom Hooks

**Công cụ:** Claude Sonnet  
**Ngày:** 19/06/2026  
**Tham chiếu:** AL-002

**Prompt đã gửi:**
```
Tôi có nhiều page component trong React (HomePage, ProfilePage, DashboardPage,
ProductListPage, RecipeListPage) đang bị lặp lại logic gọi API, xử lý SEO meta tag,
đếm ngược thời gian, và quản lý thông báo (notifications).
Hãy giúp tôi thiết kế các custom hook (useApiFetch, useSEO, useCountdown,
useNotifications) để tách các logic này ra khỏi component, dùng được ở nhiều nơi.
```

**Output AI trả về (tóm tắt):** AI đề xuất cấu trúc từng hook: `useApiFetch` (loading/error/data state + AbortController), `useSEO` (cập nhật thẻ meta qua `useEffect`), `useCountdown` (setInterval + cleanup), `useNotifications` (subscribe realtime + đánh dấu đã đọc).

**Đã chỉnh sửa:** Điều chỉnh `useApiFetch` để phù hợp với cấu trúc response chuẩn của backend dự án; tích hợp các hook vào các trang tương ứng và chỉnh lại giao diện theo theme mùa hè đang áp dụng cho Web Client.

---

## P-003 — Chuẩn hóa UI/UX trước khi merge nhánh

**Công cụ:** Claude Sonnet  
**Ngày:** 23/06/2026  
**Tham chiếu:** AL-003

**Prompt đã gửi:**
```
Hãy rà soát giúp tôi các class Tailwind CSS trong các trang React sau về khoảng cách
(spacing), bố cục responsive trên mobile, và tính nhất quán màu sắc trước khi tôi
merge nhánh cá nhân vào nhánh chính của dự án.
```

**Output AI trả về (tóm tắt):** AI gợi ý một số điều chỉnh spacing (`gap`, `padding`) và breakpoint Tailwind (`sm:`, `md:`) cho layout mobile, cùng đề xuất thống nhất bảng màu theo theme sáng của dự án.

**Đã chỉnh sửa:** Áp dụng một phần gợi ý, giữ lại các class đã thống nhất trong nhóm để tránh phá vỡ thiết kế chung.

---

## P-004 — Xử lý conflict khi merge nhánh UI/UX

**Công cụ:** Claude Sonnet  
**Ngày:** 23/06/2026  
**Tham chiếu:** AL-004

**Prompt đã gửi:**
```
Tôi đang merge hai nhánh cùng chỉnh sửa UI/UX vào nhánh chính bằng Git và bị conflict
ở nhiều file (component, hook, service). Hãy hướng dẫn tôi cách đọc và xử lý các đoạn
conflict marker (<<<<<<<, =======, >>>>>>>) sao cho không làm mất code của các hook/
service đã thêm trước đó.
```

**Output AI trả về (tóm tắt):** AI giải thích ý nghĩa từng phần trong conflict marker và đề xuất chiến lược resolve theo từng loại file: giữ cả hai thay đổi nếu không loại trừ nhau, ưu tiên bản mới nhất nếu trùng logic.

**Đã chỉnh sửa:** Resolve từng file theo hướng dẫn, chạy lại ứng dụng để kiểm tra không phát sinh lỗi runtime sau merge.

---

*Thêm prompt mới khi có phiên làm việc AI tiếp theo.*
