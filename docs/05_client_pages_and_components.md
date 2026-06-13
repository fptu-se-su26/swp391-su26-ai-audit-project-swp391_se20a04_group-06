# Chuyên Đề 05: Bản Đồ Trang & Các Thành Phần Giao Diện React

Chuyên đề này lập bản đồ chú giải vai trò của 100% các file Page và Component phía React Client, đồng thời đi sâu phân tích từng dòng code của các tính năng tương tác phức tạp nhất.

---

## 1. Bản Đồ Tra Cứu Toàn Bộ Component Và Page Client

Dưới đây là bảng tra cứu và giải thích công dụng của **tất cả tệp tin React** trong thư mục `client/src`:

### 1.1 Khung Layout dùng chung (`src/layout`)
* [Navbar.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/layout/Navbar.jsx): Thanh điều hướng trên cùng, hiển thị số tin nhắn chưa đọc, các mục menu và nút đăng nhập/profile.
* [Navbar.module.css](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/layout/Navbar.module.css): Styling cục bộ dạng CSS Module cho thanh điều hướng.
* [Footer.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/layout/Footer.jsx): Chân trang hiển thị thông tin bản quyền và liên kết mạng xã hội.

### 1.2 Các thành phần giao diện nhỏ (`src/components`)
* [PrivateRoute.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/PrivateRoute.jsx): Định nghĩa bộ bọc Router: `PrivateRoute` (yêu cầu đăng nhập), `AdminRoute` (yêu cầu admin), `GuestRoute` (chỉ dành cho khách chưa login).
* [MapExplore.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/MapExplore.jsx): Bản đồ Leaflet khám phá hải sản thời gian thực, vẽ đường nối từ ngư trường về cảng.
* [MapMini.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/MapMini.jsx): Bản đồ nhỏ hiển thị vị trí tĩnh của một sản phẩm trong trang chi tiết.
* [ChatBox.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/ChatBox.jsx): Khung chat nổi trò chuyện realtime, gửi vị trí GPS, upload ảnh sản phẩm.
* [ChatPopover.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/ChatPopover.jsx): Popover nhỏ gắn kèm biểu tượng tin nhắn ở Navbar để xem nhanh danh sách hội thoại.
* [VideoCallOverlay.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/VideoCallOverlay.jsx): Lớp phủ đàm thoại video WebRTC toàn màn hình.
* [AIChatbot.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/AIChatbot.jsx): Chatbot AI thông minh tư vấn nấu ăn và giá cả hải sản (sử dụng Groq API).
* [ProductCard.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/ProductCard.jsx): Thẻ hiển thị nhanh thông tin sản phẩm (ảnh, tên, giá, khoảng cách, badge ngư dân).
* [ProductCard.module.css](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/ProductCard.module.css): CSS Module cho thẻ sản phẩm.
* [FishermanCard.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/FishermanCard.jsx): Thẻ hiển thị thông tin ngư dân tiêu biểu trên bảng tin.
* [FishermanGrid.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/FishermanGrid.jsx): Lưới hiển thị danh sách các ngư dân trên bản đồ chợ.
* [FishermanProfileHeader.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/FishermanProfileHeader.jsx): Header trang cá nhân của ngư dân (nút theo dõi, số sao đánh giá).
* [FollowManagement.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/FollowManagement.jsx): Quản lý danh sách người đang theo dõi và người theo dõi mình.
* [ReviewList.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/ReviewList.jsx): Hiển thị danh sách các đánh giá kèm hình ảnh thực tế từ khách mua.
* [NotificationBell.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/NotificationBell.jsx): Chuông thông báo hiển thị các sự kiện hệ thống.
* [VerifiedBadge.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/VerifiedBadge.jsx): Huy hiệu tích xanh chứng thực uy tín của ngư dân đã qua Admin duyệt hồ sơ.
* [ErrorBoundary.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/ErrorBoundary.jsx): Bộ lọc bắt lỗi giao diện (React Error Boundary) ngăn sập toàn ứng dụng khi 1 component lỗi.
* [ImageSlider.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/ImageSlider.jsx): Trình chiếu slide ảnh sản phẩm trong trang chi tiết.
* [InboxTab.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/InboxTab.jsx): Tab hộp thư đến quản lý các hội thoại.
* [AdminBroadcastTab.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/AdminBroadcastTab.jsx): Công cụ dành riêng cho admin để soạn và phát tin nhắn hệ thống.

### 1.3 Các trang chức năng chính (`src/pages`)
* [HomePage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/HomePage.jsx): Trang chủ chính, tích hợp định vị, tìm kiếm bán kính GPS, bản đồ lớn Leaflet.
* [HomePage.module.css](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/HomePage.module.css): Styling cho trang chủ.
* [ProductDetailPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/ProductDetailPage.jsx): Xem chi tiết sản phẩm, lịch sử giá, nhấn chat/gọi video.
* [ProductDetailPage.module.css](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/ProductDetailPage.module.css): Styling trang chi tiết.
* [ProductListPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/ProductListPage.jsx): Danh sách sản phẩm dạng lưới kèm thanh tìm kiếm và bộ lọc danh mục.
* [AuthPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/AuthPage.jsx): Trang đăng ký / đăng nhập tích hợp OTP Email và Google Sign-In.
* [ProfilePage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/ProfilePage.jsx): Quản lý hồ sơ cá nhân, cập nhật ảnh đại diện, đổi mật khẩu, đăng ký gói Omakase, xóa tài khoản GDPR.
* [DashboardPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/DashboardPage.jsx): Bảng quản lý tin đăng của ngư dân (thêm, sửa, xóa, bump mẻ hàng).
* [PostListingPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/PostListingPage.jsx): Trang đăng bán sản phẩm mới, upload ảnh trực tiếp lên Cloudinary.
* [FishermanListPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/FishermanListPage.jsx): Danh sách các ngư dân uy tín trên nền tảng.
* [SellerProfilePage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/SellerProfilePage.jsx): Trang cá nhân công khai của một ngư dân (chứa thông tin tàu, đánh giá, và 3 tabs nội dung).
* [ForgotPasswordPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/ForgotPasswordPage.jsx): Phục hồi mật khẩu bằng mã OTP Email khôi phục tài khoản.
* [CommunityPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/CommunityPage.jsx): Diễn đàn cộng đồng trao đổi kinh nghiệm đánh bắt, chia sẻ bài đăng.
* [RecipeListPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/RecipeListPage.jsx): Danh sách các công thức hướng dẫn chế biến hải sản.
* [RecipeDetailPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/RecipeDetailPage.jsx): Chi tiết nguyên liệu và các bước thực hiện món ăn.
* [AdminPage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/AdminPage.jsx): Trang dashboard quản trị của Admin (duyệt báo cáo vi phạm, cấp tích xanh, xem biểu đồ doanh thu).
* [GuidePage.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/GuidePage.jsx): Quy trình đánh giá sản phẩm và hướng dẫn sử dụng hệ thống.

#### 1.4 Các tabs nội dung con (`src/pages/tabs`)
* [FishermanPostsTab.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/tabs/FishermanPostsTab.jsx): Tab hiển thị các bài đăng cộng đồng của ngư dân này.
* [FishermanRecipesTab.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/tabs/FishermanRecipesTab.jsx): Tab hiển thị các công thức nấu ăn của ngư dân.
* [FishermanBoatLogsTab.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/tabs/FishermanBoatLogsTab.jsx): Tab hiển thị nhật ký hành trình đi biển thực tế.

---

## 2. Phân Tích Mã Nguồn Chức Năng Giao Diện Quan Trọng (Line-by-Line)

### 2.1 Vẽ Bản Đồ Leaflet & Ngư Trường Đánh Bắt (`MapExplore.jsx`)

Component `MapExplore` tích hợp thư viện bản đồ nguồn mở Leaflet kết hợp cùng React Leaflet.

* **Dòng 8-14: Vá lỗi đường dẫn mặc định của Leaflet (Asset Patch)**
  ```javascript
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  });
  ```
  - **Mục đích:** Khi biên dịch React bằng Vite, các asset hình ảnh marker mặc định của thư viện Leaflet thường bị sai lệch đường dẫn tương đối làm hiển thị marker lỗi (broken image). Đoạn code này ghi đè các url marker trỏ trực tiếp lên CDN chính thức của Leaflet để hiển thị bình thường.

* **Dòng 23-27: ChangeView Component**
  ```javascript
  function ChangeView({ center }) {
    const map = useMap();
    map.setView(center, map.getZoom());
    return null;
  }
  ```
  - **Mục đích:** Do component `<MapContainer>` của Leaflet không tự động cập nhật lại góc nhìn bản đồ (center/pan) khi các props tọa độ truyền vào component cha thay đổi. `ChangeView` là một component con sử dụng hook `useMap` lấy thực thể bản đồ và gọi trực tiếp phương thức `map.setView` để dịch chuyển mượt mà góc nhìn bản đồ theo vị trí GPS mới của người dùng.

* **Dòng 45-80: Render Vị trí mẻ hàng, Ngư trường và Lộ trình di chuyển (Polyline)**
  - Quét qua mảng `products` truyền vào.
  - Vẽ `<Marker>` tại tọa độ của mảng `[p.lat, p.lng]` biểu diễn vị trí Cảng cá nơi đang lưu trữ sản phẩm để bán.
  - **⚓ Tải vị trí đánh bắt (Catch Location):**
    - Nếu sản phẩm có dữ liệu ngư trường `p.catchLat` và `p.catchLng`:
      - Đóng một Marker với icon hình chiếc tàu 🚢 (`boatIcon`) tại tọa độ đánh bắt thực tế ngoài khơi xa.
      - Sử dụng `<Polyline>` vẽ một đường kẻ nối liền hai điểm: từ Ngư trường đánh bắt `[p.catchLat, p.catchLng]` về tới Cảng cá `[p.lat, p.lng]`.
      - Thuộc tính `pathOptions={{ color: '#0b4f6c', dashArray: '6, 8', weight: 3 }}` tạo ra một đường nét đứt màu xanh thẫm dày 3px, trực quan hóa hải trình vận chuyển mẻ cá của ngư dân, tạo cảm giác chuyên nghiệp và chứng thực độ tươi sống.

---

### 2.2 Luồng Render Trò Chuyện Real-time (`ChatBox.jsx`)

Tệp [client/src/components/ChatBox.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/ChatBox.jsx) quản lý giao diện hội thoại realtime, gửi tin nhắn văn bản, chia sẻ tọa độ định vị hiện thời hoặc tải lên hình ảnh đính kèm.

* **Bắt tay phòng chat (Room handshake):**
  - Khi mở hộp chat, component gọi hàm `socket.emit("join_room", { productId, buyerId })`.
  - Khi đóng component hoặc chuyển cuộc trò chuyện khác, gọi `socket.emit("leave_room", { productId, buyerId })` để hủy đăng ký kênh, ngăn ngừa việc nhận chéo thông báo chat của người dùng khác.

* **Lắng nghe tin nhắn mới (`new_message`):**
  - Đăng ký bộ lắng nghe `socket.on("new_message", (msg) => { setMessages(prev => [...prev, msg]) })`.
  - Cuộn mượt màn hình xuống đáy để hiển thị tin nhắn mới nhất bằng Ref của thẻ div cuối danh sách: `messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })`.

* **Tải ảnh đính kèm trong chat:**
  - Người dùng chọn ảnh hải sản thực tế qua thẻ `<input type="file">`.
  - Đọc file dưới dạng Buffer/FormData và gọi API `/images/upload` đẩy thẳng lên Cloudinary.
  - Lấy URL ảnh phản hồi và emit sự kiện `send_message` kèm tham số `imageUrl` gửi sang cho đối phương qua WebSocket tức thì.
