PHẦN 1: GIỚI THIỆU CÁC CÔNG NGHỆ SỬ DỤNG & LÝ DO CHỌN LỰA
Hệ thống HảiSản.vn được xây dựng dựa trên kiến trúc phân tách rõ ràng giữa Frontend (React Client) và Backend (Node.js RESTful API + Socket.IO Server), kết hợp với các giải pháp lưu trữ dữ liệu chuyên biệt nhằm tối ưu hóa tính năng tìm kiếm địa lý và tương tác thời gian thực.
1. Công nghệ phía Backend
Node.js & Express (TypeScript)
Tác dụng: Cung cấp môi trường thực thi runtime (Node.js) và bộ khung ứng dụng web (Express) để xử lý các yêu cầu HTTP (API Endpoints) [backend/README.md, app]. TypeScript đóng vai trò là một lớp quản lý kiểu dữ liệu tĩnh mạnh mẽ phủ lên JavaScript [REFLECTION.md].
Lý do lựa chọn:
Cơ chế hướng sự kiện bất đồng bộ (Asynchronous Event-Driven) và I/O không chặn (Non-blocking I/O) của Node.js giúp hệ thống xử lý hàng nghìn kết nối đồng thời với mức tiêu hao tài nguyên phần cứng thấp, đặc biệt phù hợp cho các cổng chat Socket.IO và Webhook nhận diện thanh toán [app, socket].
Sử dụng TypeScript giúp phát hiện các lỗi sai kiểu dữ liệu ngay trong quá trình biên dịch (Compile-time), cải thiện khả năng bảo trì mã nguồn khi quy mô ứng dụng mở rộng [REFLECTION.md].
Socket.IO
Tác dụng: Thiết lập kết nối hai chiều liên tục (Persistent Bidirectional Connection) giữa client và server thông qua giao thức WebSockets [README.md, socket].
Lý do lựa chọn: Socket.IO tự động quản lý các kết nối, hỗ trợ cơ chế fallback (như HTTP Long Polling) khi mạng của người dùng không hỗ trợ WebSocket thuần. Nó cũng cung cấp giải pháp quản lý phòng chat (Rooms) và tích hợp sẵn bộ điều hợp Redis Adapter để dễ dàng mở rộng quy mô hệ thống sang nhiều server vật lý khác nhau [socket].
Node-Cron
Tác dụng: Lập lịch và chạy các tác vụ nền định kỳ trên máy chủ (Cron Jobs) [README.md, cron].
Lý do lựa chọn: Hải sản tươi sống có đặc thù chất lượng giảm nhanh theo thời gian. Hệ thống sử dụng Node-Cron để tự động quét cơ sở dữ liệu mỗi giờ một lần, tự động chuyển đổi trạng thái của các bài đăng hải sản tươi sống quá 24-48 giờ từ "Active" sang "Expired" mà không cần đến sự can thiệp thủ công của quản trị viên [cron].
2. Công nghệ phía Frontend
React 19 & Vite
Tác dụng: React quản lý trạng thái UI và kết xuất giao diện người dùng theo mô hình Single-Page Application (SPA). Vite đóng vai trò là công cụ đóng gói (Bundler) và máy chủ phát triển siêu tốc [package.json, vite.config.js].
Lý do lựa chọn:
React 19 tối ưu hóa hiệu năng render thông qua cơ chế Virtual DOM, cho phép xây dựng giao diện người dùng theo cấu trúc Component tái sử dụng cao (như các loại thẻ sản phẩm ProductCard, khung chat ChatBox) [App.jsx, ProductCard.jsx].
Vite thay thế các công cụ cũ như Webpack bằng cách sử dụng Native ESM, giúp giảm thời gian khởi động môi trường phát triển từ vài phút xuống còn vài giây [vite.config.js].
Leaflet & React-Leaflet
Tác dụng: Hiển thị bản đồ tương tác (OpenStreetMap) và đánh dấu vị trí địa lý của hải sản trên giao diện [MapExplore.jsx].
Lý do lựa chọn: Đây là giải pháp bản đồ mã nguồn mở hoàn toàn miễn phí, nhẹ hơn đáng kể so với Google Maps API [REFLECTION.md]. Nó cho phép hiển thị bản đồ trực quan mà không yêu cầu mã khóa API (API Key) phức tạp hay phát sinh chi phí thương mại khi có lượng truy cập lớn.
3. Công nghệ Lưu trữ & Bộ đệm (Databases & Caching)
MongoDB (Mongoose ODM)
Tác dụng: Cơ sở dữ liệu chính lưu trữ các tài liệu (Document-oriented NoSQL Database) về người dùng, sản phẩm, tin nhắn, đánh giá, thông báo và báo cáo [README.md].
Lý do lựa chọn:
Hải sản có sự khác biệt lớn về thuộc tính: Hải sản tươi sống cần lưu tọa độ GPS, thời gian đánh bắt [Product]; hải sản khô cần lưu xuất xứ và hạn sử dụng [Product]. Schema linh hoạt của MongoDB giải quyết hoàn hảo bài toán này mà không làm phình cấu trúc bảng.
MongoDB hỗ trợ công cụ truy vấn không gian địa lý gốc (Geospatial Queries) dựa trên tọa độ GeoJSON phối hợp với chỉ mục 2dsphere [Product, product.service], cho phép thực hiện các phép toán khoảng cách hình học phức tạp ngay tại tầng cơ sở dữ liệu.
Redis (ioredis)
Tác dụng: Lưu trữ bộ đệm (Caching) dữ liệu danh sách sản phẩm, quản lý giới hạn tần suất yêu cầu (Rate Limiting) [redis, auth.routes.ts, product.service], quản lý mã OTP [otp.service], và kiểm soát xoay vòng Refresh Token (RTR) [auth.controller].
Lý do lựa chọn: Redis hoạt động trực tiếp trên RAM, cung cấp tốc độ đọc/ghi dữ liệu ở mức dưới mili-giây (Sub-millisecond latency). Việc lưu trữ các thông tin có thời hạn (như OTP hay token) vào Redis giúp giải phóng tài nguyên CPU/IO cho MongoDB [otp.service].
4. Dịch vụ & Thư viện bổ trợ chuyên dụng
Cloudinary CDN: Lưu trữ và tự động tối ưu hóa hình ảnh tải lên (tự động nén dung lượng, định dạng lại dưới dạng WebP/AVIF tùy theo thiết bị truy cập) [cloudinary.js].
VietQR & Sepay Webhook: Cung cấp giải pháp thanh toán tự động qua mã QR tĩnh có sẵn thông tin số tiền và nội dung chuyển khoản mã hóa, cập nhật tức thì trạng thái nâng cấp tài khoản của người dùng khi ngân hàng báo số dư [payment.controller.ts].
Nodemailer: Gửi email chứa mã OTP bất đồng bộ tới hòm thư của người dùng khi kích hoạt tính năng khôi phục mật khẩu [otp.service].
Helmet & Express-Rate-Limit: Bảo vệ hệ thống khỏi các lỗ hổng bảo mật cơ bản như tấn công Clickjacking, chèn mã độc vào header, hay tấn công từ chối dịch vụ dạng nhẹ (DDoS/Spam) [app, auth.routes.ts].
PHẦN 2: ĐẶC TẢ CÁC USE CASE NGHIỆP VỤ CỐT LÕI
Hệ thống được thiết kế tập trung xoay quanh 4 nhóm tác nhân (Actors) chính: Khách vãng lai, Người mua, Người bán (Ngư dân) và Quản trị viên (Admin) [schema.sql]. Dưới đây là đặc tả chi tiết của 4 use case phức tạp nhất hệ thống.
code
Code
┌──────────────────────┐
                      │    Khách vãng lai    │
                      └──────────┬───────────┘
                                 │ (Đăng ký/Đăng nhập)
                                 ▼
                      ┌──────────────────────┐
                      │       Người mua      │
                      └──────────┬───────────┘
                                 │ (Tìm kiếm GPS/Chat/Review)
                                 ▼
                      ┌──────────────────────┐
                      │  Người bán (Ngư dân)  │
                      └──────────┬───────────┘
                                 │ (Đăng tin/Đẩy bài/Nâng cấp)
                                 ▼
                      ┌──────────────────────┐
                      │    Quản trị viên     │
                      └──────────────────────┘
Use Case 1: Đăng tin bán Hải sản tươi sống (Yêu cầu GPS)
Tác nhân chính: Người bán (Ngư dân) [PostListingPage.jsx].
Tiền điều kiện: Người dùng đã đăng nhập thành công [auth.routes.ts], tài khoản đang hoạt động (isActive = true) [auth.controller.ts].
Luồng sự kiện chính:
Người bán nhấn vào nút "Đăng bán" trên thanh điều hướng [Navbar.jsx].
Người bán chọn loại hình sản phẩm là "Hải sản tươi sống" [PostListingPage.jsx].
Hệ thống kích hoạt yêu cầu định vị GPS trên trình duyệt thông qua Geolocation API [PostListingPage.jsx].
Người bán cho phép truy cập vị trí. Hệ thống tự động điền tọa độ (Kinh độ, Vĩ độ) và gọi API dịch vụ địa lý (Nominatim OpenStreetMap) để phân tích ra địa chỉ văn bản tương đương điền vào trường "Xuất xứ" [PostListingPage.jsx].
Người bán điền các thông tin bắt buộc: tên sản phẩm, phân loại, đơn giá, khối lượng và thời gian đánh bắt [PostListingPage.jsx].
Người bán chọn tối đa 5 hình ảnh thực tế của mẻ hải sản [PostListingPage.jsx].
Hệ thống thực hiện nén ảnh trực tiếp trên Client để giảm dung lượng mạng, sau đó ký số bảo mật và tải thẳng lên Cloudinary CDN [PostListingPage.jsx].
Người bán nhấn "Đăng mẻ hàng ngay". Hệ thống lưu trữ sản phẩm vào MongoDB, đồng thời gửi thông báo thời gian thực tới tất cả những người dùng đang theo dõi người bán này [product.service.ts, notification.service.ts].
Hậu điều kiện: Bài đăng hải sản hiển thị ngay lập tức trên trang chủ của những người mua nằm trong bán kính 20km [haversine, product.service.ts].
Use Case 2: Tìm kiếm hải sản tươi theo vị trí người dùng (Bán kính 20km)
Tác nhân chính: Người mua [HomePage.jsx].
Tiền điều kiện: Trình duyệt của người mua đã được cấp quyền định vị GPS [HomePage.jsx].
Luồng sự kiện chính:
Người mua truy cập vào trang chủ HảiSản.vn [HomePage.jsx].
Hệ thống tự động đọc tọa độ GPS hiện tại từ thiết bị của người mua [HomePage.jsx].
Hệ thống gửi yêu cầu API kèm tọa độ vĩ độ (lat), kinh độ (lng) của người mua lên Backend [HomePage.jsx].
Backend thực hiện một truy vấn tìm kiếm không gian MongoDB sử dụng bộ lọc toán tử $geoWithin giới hạn trong bán kính 20km [product.service.ts]:
Radian
=
20
 km
6378.1
 km
≈
0.003135
Radian= 
6378.1 km
20 km
​
 ≈0.003135
Hệ thống chỉ lọc ra các sản phẩm đang có trạng thái hoạt động (status: "Active") và loại hình "Fresh" [product.service.ts].
Kết quả được sắp xếp ưu tiên theo thời gian đẩy tin (bumpedAt) giảm dần và trả về cho Client hiển thị dưới dạng danh sách Lưới hoặc ghim trực tiếp lên Bản đồ tương tác [HomePage.jsx].
Hậu điều kiện: Người mua nhìn thấy chính xác những mẻ cá tươi sống gần mình nhất kèm khoảng cách chi tiết [MapExplore.jsx].
Use Case 3: Đàm thoại Chat và thiết lập cuộc gọi Video thời gian thực
Tác nhân chính: Người mua và Người bán [ChatBox.jsx].
Tiền điều kiện: Cả hai bên đều đã đăng nhập vào hệ thống, người mua truy cập từ trang chi tiết của sản phẩm cụ thể [ChatBox.jsx].
Luồng sự kiện chính (Gửi tin nhắn):
Người mua nhấn nút "Nhắn tin với ngư dân" trên trang chi tiết sản phẩm [ProductDetailPage.jsx].
Hệ thống tải lịch sử chat cũ (nếu có) và kết nối Client vào phòng Socket.IO riêng biệt có mã phòng dạng product_<productId> [ChatBox.jsx, socket.ts].
Người mua nhập văn bản hoặc chọn ảnh thực tế từ thiết bị [ChatBox.jsx].
Khi gửi đi, tin nhắn được đẩy qua kết nối Socket.IO [ChatBox.jsx, socket.ts].
Backend lưu tin nhắn vào MongoDB, đồng thời phát tín hiệu (broadcast) tin nhắn này tới phòng chat chung và gửi một thông báo đẩy nổi lên cho người bán (nếu họ đang trực tuyến ở trang khác) [socket.ts].
Luồng sự kiện phụ (Giao thức gọi Video):
Một trong hai bên nhấn nút "📞" trên thanh tiêu đề của khung chat [ChatBox.jsx].
Hệ thống kích hoạt quyền truy cập Camera và Microphone trên thiết bị [VideoCallContext.jsx].
Client khởi tạo kết nối WebRTC (Peer Connection) và tạo một yêu cầu kết nối gọi đi (SDP Offer) gửi lên Server [VideoCallContext.jsx].
Server chuyển tiếp (relay) tín hiệu này tới tài khoản của đối phương qua Socket event call_user [socket.ts].
Đối phương nhận được màn hình thông báo cuộc gọi đến kèm chuông báo [VideoCallOverlay.jsx]. Khi đối phương nhấn "Chấp nhận", một SDP Answer được tạo và gửi ngược lại để thiết lập luồng truyền tải video trực tiếp P2P (Peer-to-Peer) giữa hai thiết bị mà không cần đi qua băng thông của Server chính [VideoCallContext.jsx].
Use Case 4: Nâng cấp tài khoản Premium tự động
Tác nhân chính: Người bán (Ngư dân) [ProfilePage.jsx].
Tiền điều kiện: Người dùng đã đăng nhập, truy cập vào trang quản lý hồ sơ cá nhân [ProfilePage.jsx].
Luồng sự kiện chính:
Người bán chọn mục "Nâng cấp Premium" trên giao diện [ProfilePage.jsx].
Hệ thống hiển thị mã VietQR động được tạo sẵn chứa thông tin số tiền (2.000đ) và nội dung bắt buộc có cấu trúc định dạng: SF <UserID> [ProfilePage.jsx].
Người bán mở ứng dụng Ngân hàng quét mã và thực hiện chuyển khoản [ProfilePage.jsx].
Ngay khi giao dịch hoàn tất, Cổng ngân hàng đẩy thông tin biến động số dư về hệ thống Sepay [payment.controller.ts].
Sepay lập tức gọi API Webhook POST /api/payment/webhook của hệ thống kèm chữ ký bảo mật xác thực [payment.controller.ts, app.ts].
Backend kiểm tra tính hợp lệ của chữ ký API, sử dụng Regex lọc ra ID người dùng có trong nội dung giao dịch, truy cập DB và chuyển trạng thái của người bán thành isPremium = true [payment.controller.ts].
Phía Frontend của người bán (đang chạy ngầm bộ thăm dò Polling 5s/lần) nhận được trạng thái mới, lập tức đổi giao diện sang "Premium" và hiển thị thông báo nâng cấp thành công [ProfilePage.jsx].
Hậu điều kiện: Người bán được mở khóa quyền hạn đăng tin không giới hạn số lượng trong ngày [product.service.ts].
PHẦN 3: ĐẶC TẢ CHI TIẾT CƠ SỞ DỮ LIỆU (MONGOOSE SCHEMAS)
MongoDB lưu trữ dữ liệu dưới dạng các collection của tài liệu JSON (BSON). Dưới đây là đặc tả chi tiết của 6 collection chính được ánh xạ thông qua các Mongoose Models trong mã nguồn.
1. Collection users
Lưu trữ thông tin chi tiết về tài khoản người dùng, vai trò quản trị, và danh sách liên kết theo dõi [User.ts].
Schema Definition:
| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| _id | ObjectId | Khóa chính (Tự động tạo) | Định danh duy nhất của người dùng |
| name | String | Required, Trim | Họ tên đầy đủ |
| email | String | Required, Unique, Lowercase | Email đăng nhập (hoặc Email liên kết Google) |
| passwordHash| String | Required | Chuỗi mật khẩu đã được hash bằng bcrypt |
| role | String | Enum: ['User', 'Admin'], Default: 'User' | Phân quyền truy cập hệ thống |
| isActive | Boolean | Default: true | Trạng thái hoạt động (Admin có quyền khóa) |
| isVerified | Boolean | Default: false | Huy hiệu tích xanh danh tính người bán uy tín |
| isPremium | Boolean | Default: false | Quyền hạn đăng tin không giới hạn |
| avatar | String | Default: null | Đường dẫn ảnh đại diện trên Cloudinary |
| favorites | Array [ObjectId]| Ref: 'Product' | Danh sách ID các bài đăng đã lưu yêu thích |
| following | Array [ObjectId]| Ref: 'User' | Danh sách ID các người bán đang theo dõi |
| createdAt | Date | Tự động tạo | Thời điểm đăng ký tài khoản |
| updatedAt | Date | Tự động tạo | Thời điểm cập nhật hồ sơ gần nhất |
Chỉ mục (Indexes):
email_1 (Unique): Tăng tốc độ truy vấn đăng nhập và chống đăng ký trùng lặp email.
2. Collection products
Lưu trữ thông tin chi tiết về các mẻ hải sản rao bán, tích hợp tọa độ không gian địa lý GeoJSON để hỗ trợ tìm kiếm khoảng cách [Product.ts].
Schema Definition:
| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| _id | ObjectId | Khóa chính (Tự động tạo) | Định danh duy nhất của sản phẩm |
| sellerId | ObjectId | Required, Ref: 'User' | ID người bán sản phẩm này |
| type | String | Required, Enum: ['Fresh', 'Dried'] | Phân loại hải sản tươi hoặc khô |
| category | String | Required, Enum: ['Fish', 'Shrimp', 'Squid', 'Crab', 'Shellfish', 'Others'] | Phân loại chi tiết chủng loại hải sản |
| name | String | Required, Trim | Tên mẻ hàng hiển thị |
| description | String | Default: null | Nội dung mô tả chi tiết của mẻ hàng |
| price | Number | Required | Đơn giá bán (VNĐ / kg) |
| salesType | String | Enum: ['Retail', 'Wholesale'], Default: 'Retail' | Loại hình bán lẻ hoặc bán buôn sỉ |
| totalWeight | Number | Required | Tổng khối lượng ban đầu khi đăng bán (kg) |
| remainingWeight| Number | Required | Khối lượng thực tế còn lại trong kho hiện tại (kg) |
| status | String | Enum: ['Active', 'Expired', 'Deleted'], Default: 'Active' | Trạng thái hiển thị bài đăng |
| location | Object | Tùy chọn (Bắt buộc nếu type === 'Fresh') | Đối tượng vị trí GeoJSON chính xác của mẻ hàng |
| location.type| String | Enum: ['Point'] | Định dạng hình học không gian GeoJSON |
| location.coordinates | Array [Number] | Mảng chứa hai phần tử: [Kinh độ, Vĩ độ] | Tọa độ GPS phục vụ khoanh vùng bán kính |
| catchTime | Date | Tùy chọn | (Hàng tươi) Thời điểm đánh bắt / cập cảng |
| origin | String | Tùy chọn | (Hàng khô) Địa danh xuất xứ |
| expiryDate | Date | Tùy chọn | (Hàng khô) Hạn sử dụng |
| images | Array [String]| Tùy chọn | Danh sách mảng các đường dẫn ảnh trên Cloudinary |
| priceHistory| Array [Object] | Khai báo nhúng (Embedded) | Mảng lưu trữ lịch sử biến động thay đổi giá bán |
| priceHistory.oldPrice | Number | Required | Giá cũ trước khi đổi |
| priceHistory.newPrice | Number | Required | Giá mới sau khi đổi |
| priceHistory.changedAt| Date | Default: Date.now | Thời điểm thực hiện thay đổi giá |
| viewCount | Number | Default: 0 | Tổng số lượt người dùng click xem sản phẩm |
| bumpedAt | Date | Default: Date.now | Thời điểm gần nhất ngư dân thực hiện đẩy bài |
Chỉ mục (Indexes):
location: "2dsphere": Chỉ mục không gian địa lý quan trọng hỗ trợ tính toán bán kính GPS 20km.
status_1_type_1_bumpedAt_-1_createdAt_-1: Chỉ mục tổng hợp hỗ trợ bộ lọc tải trang chủ mặc định đạt tốc độ cao nhất.
name: "text", description: "text": Chỉ mục hỗ trợ tính năng tìm kiếm văn bản toàn diện (Full-Text Search).
3. Collection messages
Lưu trữ nội dung trao đổi đàm thoại, hỗ trợ hình ảnh gửi kèm trong phòng chat [Message.ts].
Schema Definition:
| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| _id | ObjectId | Khóa chính (Tự động tạo) | Định danh tin nhắn |
| productId | ObjectId | Required, Ref: 'Product' | ID mẻ hải sản làm ngữ cảnh cho cuộc trò chuyện |
| senderId | ObjectId | Required, Ref: 'User' | ID tài khoản người gửi tin nhắn |
| receiverId | ObjectId | Required, Ref: 'User' | ID tài khoản người nhận tin nhắn |
| content | String | Default: null | Nội dung văn bản gửi đi |
| imageUrl | String | Default: null | Đường dẫn ảnh gửi kèm trong chat (nếu có) |
| isRead | Boolean | Default: false | Trạng thái đối phương đã xem tin nhắn chưa |
| createdAt | Date | Tự động tạo | Thời điểm gửi tin nhắn |
Chỉ mục (Indexes):
productId_1_senderId_1_receiverId_1: Đẩy nhanh tốc độ kết nối và đồng bộ tin nhắn khi người dùng truy cập phòng chat.
senderId_1_createdAt_-1 và receiverId_1_createdAt_-1: Chỉ mục kép tối ưu hóa hiệu năng tổng hợp (Aggregation Pipeline) để kết xuất danh sách hội thoại Inbox.
4. Collection reviews
Lưu trữ đánh giá chất lượng người bán từ người mua sau khi đã có lịch sử trò chuyện tương tác [Review.ts].
Schema Definition:
| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| _id | ObjectId | Khóa chính (Tự động tạo) | Định danh đánh giá |
| productId | ObjectId | Required, Ref: 'Product' | ID sản phẩm được mua |
| reviewerId | ObjectId | Required, Ref: 'User' | ID người mua viết đánh giá |
| sellerId | ObjectId | Required, Ref: 'User' | ID người bán được nhận đánh giá |
| rating | Number | Required, Min: 1, Max: 5 | Điểm xếp hạng số sao |
| comment | String | Default: null | Nội dung bình luận chi tiết |
| imageUrl | String | Default: null | Ảnh thực tế đi kèm đánh giá |
| createdAt | Date | Tự động tạo | Thời điểm viết đánh giá |
Chỉ mục (Indexes):
reviewerId_1_productId_1 (Unique): Ràng buộc duy nhất đảm bảo mỗi người mua chỉ được đánh giá một mẻ hàng duy nhất một lần.
sellerId_1: Tốc độ hóa việc tính toán điểm trung bình xếp hạng hiển thị trên profile người bán.
5. Collection notifications
Quản lý các thông báo thời gian thực được đẩy trực tiếp tới tài khoản cá nhân của từng người dùng [Notification.ts].
Schema Definition:
| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| _id | ObjectId | Khóa chính (Tự động tạo) | Định danh thông báo |
| userId | ObjectId | Required, Ref: 'User' | ID tài khoản nhận thông báo |
| type | String | Required | Phân loại: 'new_product', 'new_review', v.v. |
| content | String | Required | Nội dung thông báo hiển thị |
| isRead | Boolean | Default: false | Trạng thái người dùng đã xem thông báo chưa |
| productId | ObjectId | Ref: 'Product' | ID sản phẩm liên quan (để click chuyển trang) |
| reviewId | ObjectId | Ref: 'Review' | ID đánh giá liên quan (để click chuyển hướng) |
| createdAt | Date | Tự động tạo | Thời điểm phát sinh thông báo |
Chỉ mục (Indexes):
userId_1_createdAt_-1: Sắp xếp và lấy nhanh danh sách thông báo mới nhất khi người dùng click vào chuông thông báo.
6. Collection reports
Quản lý các báo cáo vi phạm sản phẩm do người mua gửi lên để Ban quản trị Admin phê duyệt [Report.ts].
Schema Definition:
| Tên trường | Kiểu dữ liệu | Ràng buộc | Mô tả |
|---|---|---|---|
| _id | ObjectId | Khóa chính (Tự động tạo) | Định danh báo cáo |
| reporterId | ObjectId | Required, Ref: 'User' | ID người gửi báo cáo |
| productId | ObjectId | Required, Ref: 'Product' | ID sản phẩm bị báo cáo |
| reason | String | Required | Nội dung, lý do báo cáo vi phạm |
| status | String | Enum: ['Pending', 'Resolved', 'Dismissed'] | Trạng thái xử lý của Admin |
| adminNote | String | Default: null | Ghi chú phản hồi từ Admin |
| createdAt | Date | Tự động tạo | Thời điểm tạo báo cáo |
Chỉ mục (Indexes):
status_1: Hỗ trợ Admin lọc nhanh danh sách các báo cáo đang chờ duyệt (Pending) để xử lý kịp thời.
