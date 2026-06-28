# Báo cáo review và tái cấu trúc Frontend

Ngày hoàn thành: 28/06/2026  
Phạm vi: `client/` (React + Vite)  
Backend, API contract, database, business logic, authentication và Socket event không bị chỉnh sửa.

## 1. Những gì đã chỉnh

- Chuẩn hóa routing và menu theo ba vai trò Buyer, Seller, Admin.
- Buyer: Trang chủ, Chợ hải sản, Đã lưu, Tin nhắn, Thông báo, Premium, Hồ sơ.
- Seller: Dashboard, Quản lý sản phẩm, Boat Log, Tin nhắn, Premium, Thống kê, Thông báo, Hồ sơ.
- Admin: Dashboard, Quản lý User, Duyệt sản phẩm, Report, Premium, Broadcast Notification, Settings.
- Chuyển cấu hình menu dùng chung sang `src/config/navigation.js`.
- Tách Navbar, notification dropdown và profile dropdown thành component riêng.
- Thiết kế lại Product Card để hiển thị ảnh, tên, giá, khoảng cách, người bán, xác minh, Premium, trạng thái, độ tươi, ngày đánh bắt, nguồn gốc và các nút Nhắn người bán, Giữ chỗ, Lưu.
- Thiết kế lại trang chi tiết sản phẩm, thêm bản đồ React Leaflet + OpenStreetMap và tính khoảng cách từ vị trí người xem.
- Sửa form Seller Product để dùng đúng enum category của API và gửi tọa độ bắt buộc cho sản phẩm tươi.
- Seller Dashboard chỉ hiển thị sản phẩm đang bán, lượt xem sản phẩm, tin nhắn mới, người theo dõi, lượt xem hồ sơ và sản phẩm nổi bật.
- Tạo màn hình Boat Log đọc dữ liệu thật từ API và hiển thị các trường truy xuất nguồn gốc khi backend trả về.
- Sửa Chat theo đúng response shape hiện tại của API conversation/history.
- Chat có emoji, trạng thái đã gửi/đã xem, reply, preview/gửi ảnh, ghim hội thoại, thời gian gửi và tự cuộn tới tin mới.
- Đổi tên và giới hạn giao diện trợ lý thành Seafood AI Assistant.
- Google Client ID chuyển sang `VITE_GOOGLE_CLIENT_ID`.
- Socket kết nối bằng `VITE_API_URL`, không còn dùng `window.location.origin`.
- Chuẩn hóa toàn bộ HTTP call qua một Axios instance, request/response interceptor và `ApiError`.
- Thêm `.env.example` và `.env.development`.
- Chuyển toàn bộ React inline style sang CSS thuần.
- Thêm responsive breakpoint cho desktop, tablet và mobile.
- Route-level lazy loading giúp tách riêng các bundle Home, Marketplace, Chat, Seller, Admin và Leaflet.

## 2. Những gì đã xóa

- Route, menu và page Cart.
- Route, menu và page Buyer Orders.
- Route, menu và page Seller Orders.
- Route, menu và page Seller Revenue.
- Route, menu và page Admin Orders.
- Menu Seller Boost/Bếp biển không thuộc cấu trúc Seller yêu cầu.
- Buyer Reviews khỏi khu vực Buyer.
- Component Chat Heads không được sử dụng.
- CSS legacy hơn 3.000 dòng, inline style và asset scaffold React/Vite không dùng.
- Hardcode Google OAuth Client ID.
- API call tới endpoint `toggle-status` không tồn tại; thay bằng API update product hiện hữu.

## 3. Những gì đã tối ưu

- Không còn file JavaScript/JSX nào vượt 300 dòng.
- Không còn inline style trong `src/`.
- Không còn tham chiếu Cart, Checkout, Order hoặc Revenue trong source đang chạy.
- Không gọi Axios trực tiếp ngoài `services/api.js`.
- Sửa lỗi conversation ID/partner field khiến Chat không đọc đúng dữ liệu backend.
- Sửa vòng lặp effect và dependency trong Chat/Socket.
- Dùng REST fallback khi Socket tạm mất kết nối.
- Chuẩn hóa helper ảnh, tiền tệ, ngày, độ tươi và khoảng cách để tránh duplicate.
- Thay ảnh fallback 2,6 MB bằng SVG nhỏ; asset lớn không còn đi vào production bundle.
- Production build không còn cảnh báo chunk vượt 500 kB.

## 4. Vấn đề còn tồn tại

- Schema/API Boat Log hiện chỉ lưu `content` và `images`; chưa có `productId`, ngày/khu vực đánh bắt, tên tàu, thời gian cập bến và nguồn gốc. Frontend không thể lưu liên kết Product bền vững nếu không đổi backend.
- Backend Socket hiện không có typing event. Frontend không phát minh event mới để tuân thủ yêu cầu giữ nguyên Socket event, nên “Đang nhập...” chỉ sẵn sàng hiển thị khi nguồn dữ liệu hiện hữu cung cấp trạng thái này.
- Read status có trong history API nhưng chưa có event realtime đánh dấu đã đọc.
- Admin Settings, Broadcast và danh sách giao dịch Premium chưa có API dữ liệu/command tương ứng được frontend hiện tại sử dụng; màn hình không giả lập ghi dữ liệu.
- Backend system prompt của chatbot vẫn cho phép một số chủ đề hướng dẫn website. Frontend đã chặn câu hỏi ngoài nhóm hải sản, nhưng không thể thay system prompt do giới hạn không sửa backend.
- Kiểm thử trình duyệt desktop đạt; phiên đổi viewport tự động của công cụ kiểm thử bị ngắt. Responsive mobile/tablet đã được kiểm tra qua CSS breakpoint và production build nhưng vẫn nên regression test thêm trên thiết bị thật.

## 5. Đề xuất cải thiện, chưa tự ý thực hiện

- Mở rộng Boat Log schema/API bằng quan hệ `productId` và các trường truy xuất nguồn gốc.
- Bổ sung Socket event typing/read receipt ở backend rồi kết nối frontend.
- Cung cấp API Admin Settings, Broadcast và Premium transaction.
- Cung cấp API notification history để trang Thông báo không chỉ phụ thuộc vào sự kiện trong phiên hiện tại.
- Bổ sung React Error Boundary và test tự động cho routing, Product Card, Chat normalization và responsive navigation.
- Chuyển các ảnh PNG cũ còn nằm trong source nhưng không được sử dụng sang kho lưu trữ hoặc xóa khỏi repository.

## Kết quả xác minh

- `npm run lint`: đạt, không warning.
- `npm run build`: đạt.
- Inline style: 0.
- File JS/JSX trên 300 dòng: 0.
- Tham chiếu commerce Cart/Checkout/Order/Revenue trong source chạy: 0.
- Backend file bị chỉnh sửa: 0.
