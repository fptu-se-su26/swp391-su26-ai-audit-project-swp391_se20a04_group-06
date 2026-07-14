# Báo cáo rà soát và Việt hóa giao diện người dùng (Vietnamese UI Audit)

Dự án: **HảiSản.vn**

---

## 1. Các file đã sửa đổi (Modified Files)
1.  **[`client/src/utils/labelMaps.js`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/utils/labelMaps.js)**:
    *   Cập nhật và hoàn thiện các bản đồ dịch nhãn: `categoryLabelMap`, `freshnessLabelMap`, `difficultyLabelMap`, `roleLabelMap`, `statusLabelMap`.
    *   Cung cấp các hàm getter an toàn để chuyển đổi các giá trị tiếng Anh từ cơ sở dữ liệu hoặc API thành nhãn tiếng Việt tương ứng khi hiển thị trên giao diện người dùng.
2.  **[`client/src/config/navigation.js`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/config/navigation.js)**:
    *   Việt hóa toàn bộ nhãn hiển thị trong menu điều hướng (Navigation) của người mua, người bán/ngư dân và quản trị viên (Admin).
3.  **[`client/src/pages/seller/BoatLog.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/seller/BoatLog.jsx)**:
    *   Chuyển đổi tiêu đề chính `"Boat Log"` thành `"Nhật ký biển"`.
    *   Thay đổi dòng eyebrow phụ `"TRACEABLE SEAFOOD"` thành `"NHẬT KÝ TRUY XUẤT"`.
4.  **[`client/src/components/seller/SellerOverview.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/seller/SellerOverview.jsx)**:
    *   Đổi nhãn thẻ chỉ số từ `"Boat Log"` thành `"Nhật ký biển"`.
    *   Đổi chỉ số người theo dõi từ `"Follower"` thành `"Người theo dõi"`.
5.  **[`client/src/components/tour/tourSteps.js`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/tour/tourSteps.js)**:
    *   Đổi các hướng dẫn, phần giới thiệu tour có nhắc đến thuật ngữ tiếng Anh `"Boat Log"` thành `"nhật ký biển"`.
6.  **[`client/src/components/chat/ConversationList.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/chat/ConversationList.jsx)**:
    *   Việt hóa dòng eyebrow phụ từ `"DIRECT MARKETPLACE"` thành `"CHỢ HẢI SẢN TRỰC TIẾP"`.
7.  **[`client/src/pages/SellerProfile.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/SellerProfile.jsx)**:
    *   Việt hóa các thẻ thống kê công khai: `"Follower"` -> `"Người theo dõi"`, `"Cabin logs"` -> `"Nhật ký biển"`.
    *   Việt hóa các dòng eyebrow trang trí: `"ACTIVE LISTINGS"` -> `"SẢN PHẨM ĐANG BÁN"`, `"RECENT LANDINGS"` -> `"VỰA CÁ MỚI"`, `"CABIN LOGS"` -> `"NHẬT KÝ BIỂN"`.
    *   Sửa thông báo empty state `"Chưa có Cabin Log."` -> `"Chưa có nhật ký biển."`.
8.  **[`client/src/pages/Premium.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/Premium.jsx)**:
    *   Đổi dòng eyebrow `"PREMIUM MEMBERSHIP"` thành `"THÀNH VIÊN PREMIUM"`.
9.  **[`client/src/pages/Notifications.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/Notifications.jsx)**:
    *   Đổi dòng eyebrow `"ACTIVITY"` thành `"HOẠT ĐỘNG"`.
10. **[`client/src/pages/admin/AdminDashboard.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/admin/AdminDashboard.jsx)**:
    *   Sử dụng nhãn dịch vai trò người dùng bằng cách gói qua hàm `getRoleLabel(user.role)`.
    *   Sử dụng nhãn dịch trạng thái sản phẩm, trạng thái vựa bằng `getStatusLabel()`.
    *   Ánh xạ giá trị tiếng Anh của các trường loại sản phẩm (`listing.type`) và đối tượng báo cáo (`report.targetType`) sang tiếng Việt khi hiển thị trong bảng dữ liệu.
    *   Việt hóa các dòng eyebrow tiêu đề: `"ADMIN DASHBOARD"` -> `"BẢNG ĐIỀU KHIỂN QUẢN TRỊ"`, `"USER MANAGEMENT"` -> `"QUẢN LÝ NGƯỜI DÙNG"`, `"PRODUCT MODERATION"` -> `"KIỂM DUYỆT SẢN PHẨM"`, `"LANDING BATCH MODERATION"` -> `"KIỂM DUYỆT VỰA CÁ"`, `"SAFETY REPORTS"` -> `"BÁO CÁO VI PHẠM"`.
    *   Việt hóa nhãn badge `"Verified"` thành `"Đã xác minh"`.
11. **[`client/src/pages/admin/AdminPayments.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/admin/AdminPayments.jsx)**:
    *   Việt hóa tiêu đề và dòng eyebrow `"PREMIUM MANAGEMENT"` thành `"QUẢN LÝ PREMIUM"`.
12. **[`client/src/pages/admin/AdminSettings.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/admin/AdminSettings.jsx)**:
    *   Việt hóa dòng eyebrow `"SYSTEM SETTINGS"` thành `"CÀI ĐẶT HỆ THỐNG"` và tiêu đề `"Settings"` thành `"Cài đặt"`.
13. **[`client/src/pages/admin/Broadcast.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/admin/Broadcast.jsx)**:
    *   Việt hóa dòng eyebrow `"SYSTEM ANNOUNCEMENT"` thành `"THÔNG BÁO HỆ THỐNG"` và tiêu đề `"Broadcast Notification"` thành `"Phát thông báo"`.
    *   Dịch nhãn giá trị targetRole hiển thị trong lịch sử phát sóng sang tiếng Việt.
14. **[`client/src/pages/seller/SellerLandingBatches.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/seller/SellerLandingBatches.jsx)**:
    *   Việt hóa dòng eyebrow `"LANDING BATCH MANAGEMENT"` thành `"QUẢN LÝ VỰA CÁ"`.

---

## 2. Các text tiếng Anh đã đổi (Translated English Texts)
*   **Boat Log** -> **Nhật ký biển**
*   **Cabin logs** -> **Nhật ký biển**
*   **TRACEABLE SEAFOOD** -> **NHẬT KÝ TRUY XUẤT**
*   **DIRECT MARKETPLACE** -> **CHỢ HẢI SẢN TRỰC TIẾP**
*   **ACTIVE LISTINGS** -> **SẢN PHẨM ĐANG BÁN**
*   **RECENT LANDINGS** -> **VỰA CÁ MỚI**
*   **CABIN LOGS** -> **NHẬT KÝ BIỂN**
*   **PREMIUM MEMBERSHIP** -> **THÀNH VIÊN PREMIUM**
*   **ACTIVITY** -> **HOẠT ĐỘNG**
*   **ADMIN DASHBOARD** -> **BẢNG ĐIỀU KHIỂN QUẢN TRỊ**
*   **USER MANAGEMENT** -> **QUẢN LÝ NGƯỜI DÙNG**
*   **PRODUCT MODERATION** -> **KIỂM DUYỆT SẢN PHẨM**
*   **LANDING BATCH MODERATION** -> **KIỂM DUYỆT VỰA CÁ**
*   **SAFETY REPORTS** -> **BÁO CÁO VI PHẠM**
*   **SYSTEM ANNOUNCEMENT** -> **THÔNG BÁO HỆ THỐNG**
*   **Broadcast Notification** -> **Phát thông báo**
*   **SYSTEM SETTINGS** -> **CÀI ĐẶT HỆ THỐNG**
*   **Settings** -> **Cài đặt**
*   **PREMIUM MANAGEMENT** -> **QUẢN LÝ PREMIUM**
*   **LANDING BATCH MANAGEMENT** -> **QUẢN LÝ VỰA CÁ**
*   **Verified** (badge) -> **Đã xác minh**
*   Các vai trò tài khoản (`buyer`, `seller`, `admin`) -> **Người mua**, **Người bán**, **Quản trị viên**
*   Các trạng thái (`active`, `locked`, `pending`...) -> **Đang hoạt động**, **Đã khóa**, **Đang chờ**...

---

## 3. Các text tiếng Anh còn giữ lại và lý do (Preserved Technical Terms)
*   **Tên file, tên component, và tên biến**: Ví dụ `BoatLog.jsx`, `SellerDashboard.jsx`, `landingBatches`, `user.role`... Giữ lại để đảm bảo tính toàn vẹn của mã nguồn, tránh gây lỗi import hoặc tham chiếu chéo.
*   **Địa chỉ URL và Route điều hướng**: Ví dụ `/boat-log`, `/seller`, `/admin`... Giữ lại để không làm đứt gãy các đường dẫn liên kết của toàn bộ hệ thống.
*   **Từ khóa trong mã CSS (className, selectors)**: Ví dụ `.boat-log-page`, `.premium-page`, `.admin-overview`... Giữ lại để đảm bảo các tệp CSS liên kết trang hoạt động chính xác.
*   **Enum, Giá trị trường lưu trữ trong Database hoặc Payload gửi API**: Ví dụ `"FISH"`, `"SHRIMP"`, `"Fresh"`, `"Active"`... Giữ lại để hệ thống cơ sở dữ liệu lưu trữ nhất quán và không làm đứt gãy logic nghiệp vụ của backend.

---

## 4. Các route đã kiểm tra (Audited Routes)
*   `/` (Trang chủ người dùng/Khách vãng lai)
*   `/marketplace` (Chợ hải sản)
*   `/community` (Diễn đàn cộng đồng)
*   `/recipes` (Cẩm nang công thức & Chia sẻ)
*   `/recipes/:id` (Chi tiết công thức nấu ăn)
*   `/boat-log` (Nhật ký biển công khai của người mua)
*   `/premium` (Nâng cấp tài khoản & Hộp hải sản Omakase)
*   `/notifications` (Thông báo hoạt động)
*   `/seller` (Tổng quan người bán)
*   `/seller/products` (Quản lý sản phẩm của người bán)
*   `/seller/landing-batches` (Quản lý vựa cá của người bán)
*   `/seller/boat-log` (Nhật ký đi biển của người bán)
*   `/admin` (Tổng quan quản trị)
*   `/admin/users` (Quản lý người dùng)
*   `/admin/listings` (Quản lý sản phẩm vi phạm)
*   `/admin/landing-batches` (Quản lý vựa cá vi phạm)
*   `/admin/reports` (Xử lý báo cáo vi phạm)
*   `/admin/payments` (Quản lý gói premium)
*   `/admin/broadcast` (Phát thông báo hệ thống)
*   `/admin/settings` (Cài đặt hệ thống)

---

## 5. Kết quả chạy biên dịch (npm run build)
*   **Vite Build**: Biên dịch thành công 100% không gặp lỗi, tạo chính xác các tệp tin bundle cho môi trường chạy thử nghiệm và sản xuất:
    ```bash
    vite v8.1.0 building client environment for production...
    transforming...✓ 313 modules transformed.
    rendering chunks...
    computing gzip size...
    dist/assets/index-B6n9Sp34.js                   299.41 kB │ gzip: 94.60 kB
    dist/assets/Chat-BhNWJEII.js                    328.02 kB │ gzip: 81.44 kB
    ✓ built in 309ms
    ```
