# Nhật ký thay đổi giao diện HảiSản.vn - Antigravity

Dưới đây là các thay đổi và cải tiến đã thực hiện trong dự án HảiSản.vn để tối ưu hóa trải nghiệm người dùng (UI/UX) và đồng bộ hệ thống theme Sáng / Tối:

## 1. Nâng cấp Giao diện Sáng (Light Theme) toàn diện
- **Biến CSS toàn cục:** Thiết lập hệ thống biến màu cho `.theme-light` trong [marketplace-refactor.css](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/styles/marketplace-refactor.css) sử dụng màu nền dịu mát (`#f4fbff`), bề mặt card trắng (`#ffffff`), chữ xanh navy đậm (`#0f172a` / `#1e293b`), và accent xanh cyan đậm rõ nét (`#0891b2`).
- **Thanh Navbar & Nhóm Link:**
  - Định nghĩa màu sắc chân thực, loại bỏ chữ trắng/mờ trên nền nhạt.
  - Active nav item có nền và viền cyan dịu, chữ xanh lục đậm rõ nét và cùng màu với icon.
- **Button (Nút bấm):**
  - Đồng bộ hóa các trạng thái hover/active rõ ràng cho nút Primary, Secondary và Ghost.
  - Sửa màu các nút tương tác chính: *Thích, Chia sẻ, Bình luận, Báo cáo, Sửa, Xóa* để luôn rõ chữ và icon trên nền sáng.
- **Bảng dữ liệu & Thẻ (Card):**
  - Chuyển toàn bộ card bài viết cộng đồng (`.community-post`), card món ăn (`.recipe-card`), card sản phẩm và card vựa cá sang nền trắng sạch sẽ.
  - Việt hóa hoàn toàn các badge độ khó hiển thị trên danh sách.
- **Trình soạn thảo & Input:**
  - Thiết lập nền trắng, chữ tối và viền rõ nét cho các ô input, textarea, select và khung bình luận (`.comment-composer`).
- **Modal & Hộp thoại:**
  - Đồng bộ giao diện sáng cho modal chỉnh sửa, modal báo cáo vi phạm, và các hộp thoại xác nhận (`.confirm-dialog`).
- **Live Preview (Xem trước trực tiếp):**
  - Áp dụng các luật ghi đè màu sắc để khung live-preview và tóm tắt hiển thị rõ chữ, không bị chìm chữ trắng trên nền sáng.

## 2. Các trang và thành phần đã kiểm tra
- **Trang chủ (Home):** Banner hero, danh sách mẻ hàng mới, trạng thái trống.
- **Chợ hải sản (Marketplace):** Bộ lọc, các thanh tab, ô tìm kiếm và danh sách sản phẩm.
- **Cộng đồng (Community):** Bài đăng, bình luận, khung soạn thảo và nút sửa/xóa.
- **Công thức (Recipes & RecipeDetail):** Danh sách công thức nấu ăn, chi tiết từng công thức, thanh nút hành động, bộ đếm thời gian đăng và mức độ khó bằng tiếng Việt.
- **Profile Dropdown:** Bảng lựa chọn theme Tối / Sáng, các thông tin user và role badge.
- **Hệ thống Modal/Báo cáo/Confirm:** Trực quan, sắc nét trên cả hai giao diện.
