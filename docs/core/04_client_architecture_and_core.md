# Chuyên Đề 04: Phân Tích Mã Nguồn Nền Tảng Client (React)

Chuyên đề này đi sâu phân tích từng dòng code (line-by-line) các thành phần kiến trúc cốt lõi của React Client (cổng `3000`). Đây là nền tảng quản lý State đăng nhập, đồng bộ cuộc gọi WebRTC, xử lý gọi API chống xung đột token và thiết lập Singleton Socket.IO Client.

---

## 1. App.jsx — Điều Phối Routes, Lazy Loading Và Sync Badge Tin Nhắn

Tệp [client/src/App.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/App.jsx) quản lý luồng định tuyến (Routing) của ứng dụng bằng thư viện React Router DOM.

### Phân tích dòng code:

* **Dòng 33-90: Code Splitting & Lazy Loading (Tối ưu hóa thời gian tải trang đầu tiên - FCP)**
  ```javascript
  const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
  const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage").then((m) => ({ default: m.ProductDetailPage })));
  ...
  ```
  - **Mục đích:** Thay vì đóng gói (bundle) toàn bộ các trang giao diện vào một file JS duy nhất gây ra hiện tượng tải trang chậm khi người dùng vừa truy cập, `lazy` kết hợp `Suspense` giúp chia nhỏ (chunking) mã nguồn. Mỗi trang (như HomePage, AdminPage) chỉ được tải về trình duyệt khi người dùng nhấp chuột chuyển trang đó.

* **Dòng 155-177: ProductDetailPageRoute & SellerProfilePageRoute**
  - **Mục đích:** Sử dụng custom hook `useApiFetch` để tự động fetch thông tin chi tiết sản phẩm và profile người bán dựa trên tham số ID động lấy từ URL (`useParams()`).
  - Nếu đang tải, trả về component `PageLoader` hiển thị khung sườn (Skeleton Screen). Nếu tải thất bại hoặc không tìm thấy bản ghi, gọi `<Navigate to="/" replace />` để tự động trả người dùng về trang chủ an toàn.

* **Dòng 215-236: Cơ chế Polling đồng bộ số tin nhắn chưa đọc (Unread Message Count)**
  ```javascript
  useEffect(() => {
    if (!user) {
      Promise.resolve().then(() => setUnread(0));
      return;
    }
    const fetchUnread = () => api("/messages/unread-count").then((d) => setUnread(d.count)).catch(() => {});
    fetchUnread();
    ...
    const id = setInterval(fetchUnread, 60_000);
    return () => clearInterval(id);
  }, [user]);
```
  - **Giải thích:** Khi người dùng đăng nhập (`user` tồn tại), trình duyệt sẽ kích hoạt bộ đếm thời gian `setInterval` gọi API `/messages/unread-count` định kỳ mỗi **60 giây** để kiểm tra và cập nhật số lượng tin nhắn chưa đọc lên góc thanh Navbar.
  - Sử dụng hàm `Promise.resolve().then(() => setUnread(0))` để trì hoãn việc cập nhật state về 0 khi logout ra ngoài vòng render hiện tại, tránh xung đột lỗi vòng lặp React.

* **Dòng 238-270: Sửa lỗi Lag Badge Tin Nhắn Chưa Đọc (Real-time Socket Listener)**
  - Nhằm tránh việc người dùng phải chờ tới 60 giây tiếp theo để biết mình có tin nhắn mới, client lắng nghe sự kiện qua WebSocket.
  - Sử dụng hàm `getSocket()` nhận singleton socket, lắng nghe sự kiện `"notification"`.
  - **Logic so khớp thông minh:** Khi có tin nhắn mới đẩy về, client kiểm tra: Nếu người dùng đang mở sẵn khung chat nổi (`activeChatRef.current`) với chính sản phẩm đó (`data.productId`), hệ thống sẽ **bỏ qua không cộng dồn số tin nhắn chưa đọc** vì tin nhắn đã được hiển thị trực diện. Ngược lại, nếu đang duyệt trang khác, client sẽ tăng số tin nhắn chưa đọc lên 1 đơn vị (`setUnread(prev => prev + 1)`), cập nhật tức thì lên thanh Navbar.

---

## 2. AuthProvider.jsx — Quản Lý Phiên Làm Việc Stateful

Tệp [client/src/context/AuthProvider.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/context/AuthProvider.jsx) khởi tạo Context chứa trạng thái đăng nhập toàn cục của người dùng.

### Phân tích dòng code:

* **Dòng 11-35: Silent Restore (Tự động khôi phục phiên khi tải lại trang)**
  - Khi người dùng tải lại (Refresh) trình duyệt F5, toàn bộ state trong bộ nhớ RAM của React bị xóa sạch.
  - Một `useEffect` chạy duy nhất một lần lúc khởi động gọi API `/auth/me`. 
  - **Bảo mật:** Nhờ token JWT được lưu dưới dạng `HttpOnly Cookie`, trình duyệt tự động đính kèm cookie này theo request. Backend giải mã token và trả về thông tin Profile, giúp React phục hồi trạng thái đăng nhập của người dùng (`setUser(u)`) và tắt màn hình chờ (`setLoading(false)`) mà không yêu cầu người dùng phải gõ lại mật khẩu.
  - Sử dụng `AbortController` để hủy request fetch nếu component bị unmount sớm (tránh rò rỉ bộ nhớ - Memory Leak).

---

## 3. VideoCallProvider.jsx — Động Cơ Báo Hiệu (WebRTC Call State Machine)

Tệp [client/src/context/VideoCallProvider.jsx](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/context/VideoCallProvider.jsx) điều phối toàn bộ trạng thái cuộc gọi đàm thoại video WebRTC.

### Phân tích dòng code:

* **Dòng 8-13: iceServers (STUN Configuration)**
  ```javascript
  const rtcConfig = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };
  ```
  - Cấu hình địa chỉ máy chủ STUN miễn phí cung cấp bởi Google. Máy chủ này giúp trình duyệt của người mua/người bán tự dò tìm địa chỉ IP công cộng của chính mình sau bộ định tuyến (NAT) để gửi cho đối phương.

* **Dòng 80-115: Xử lý sự kiện "incoming_call" & "call_accepted"**
  - Lắng nghe khi có cuộc gọi đến: Cập nhật trạng thái `callState` thành `"incoming"`, lưu giữ cấu hình bắt tay SDP nhận được vào `tempOfferRef.current`.
  - Khi đối phương bắt máy (`call_accepted`): Gọi hàm `setRemoteDescription(answer)` để đồng bộ thiết lập codec âm thanh/hình ảnh từ đối phương. Giải phóng hàng đợi ICE candidates (`iceQueueRef.current`) để bắt đầu luồng truyền tải media.

* **Dòng 202-242: startCall (Bắt đầu cuộc gọi)**
  - Kiểm tra xem trình duyệt có hỗ trợ camera/micro qua `getUserMedia` không (yêu cầu chạy trên giao thức bảo mật HTTPS hoặc localhost).
  - Khởi tạo thực thể `RTCPeerConnection` bằng hàm `createPeerConnection`.
  - Đọc luồng dữ liệu camera và gắn vào peer connection: `stream.getTracks().forEach((track) => pc.addTrack(track, stream))`.
  - Tạo cấu hình offer (`pc.createOffer`), lưu làm cấu hình local (`setLocalDescription`) và emit sự kiện `"call_user"` qua Socket.IO để signaling đến tài khoản người nhận.

* **Dòng 244-294: acceptCall (Nhận cuộc gọi)**
  - Khi người nhận nhấn nút Đồng ý: Gọi `getUserMedia` để mở camera của mình.
  - Gắn luồng camera cục bộ vào peer connection.
  - Đồng bộ cấu hình offer của người gọi lưu trong `tempOfferRef.current` vào kết nối (`setRemoteDescription`).
  - Tạo câu trả lời SDP answer (`pc.createAnswer`), set vào cấu hình local (`setLocalDescription`) và gửi phản hồi `"answer_call"` cho đối phương.

---

## 4. api.js — Trình Gọi API Nâng Cao (Silent Refresh & Concurrency Lock)

Tệp [client/src/services/api.js](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/services/api.js) là công cụ bọc (wrapper) hàm gọi API mặc định `fetch` của JavaScript, bổ sung cơ chế CSRF và Silent Token Refresh.

### Phân tích dòng code:

* **Dòng 23-42: Tự động đính kèm CSRF Token**
  - Trước khi gửi bất kỳ request nào, hàm kiểm tra và đọc cookie `csrfToken`.
  - Nếu tồn tại và request không phải là upload file (`FormData`), nó sẽ tự động chèn header bảo mật `"x-csrf-token"` vào cấu hình truyền tải.
  - Cấu hình bắt buộc `credentials: "include"` đảm bảo các cookie chứa JWT Access/Refresh token luôn được gửi kèm theo request lên Backend.

* **Dòng 46-83: Cơ chế Tự Động Làm Mới Token (Silent Refresh)**
  - Khi Access Token hết hạn, Backend phản hồi mã lỗi `HTTP 401 Unauthorized`.
  - **Queue Locking chống nghẽn:** Nếu người dùng tải trang lần đầu có 5 API chạy song song, cả 5 API đều nhận về lỗi 401. Nếu không khóa, client sẽ đồng thời gửi 5 request `/auth/refresh` lên server. Điều này gây xung đột và vi phạm chính sách **Refresh Token Rotation (RTR)** (vốn chỉ chấp nhận token refresh được dùng 1 lần duy nhất).
  - Giải pháp: Khởi tạo biến cờ `isRefreshing`. Request 401 đầu tiên sẽ đặt `isRefreshing = true` và một mình thực thi gửi POST `/auth/refresh`.

* **Dòng 85-104: Hàng đợi Request (Subscribers Queue)**
  - 4 request song song còn lại sẽ đi vào khối mã lệnh chặn và trả về một `Promise`. Chúng được đẩy vào mảng hàng đợi `refreshSubscribers` thông qua hàm `subscribeTokenRefresh`.
  - Khi request refresh token đầu tiên hoàn tất:
    - Nếu thành công: Gọi hàm `onRefreshed(null)`. Hàng đợi sẽ được giải phóng, tất cả các request đang chờ sẽ được tự động kích hoạt gọi lại API lần thứ hai (`_isRetry: true`) với Access Token mới đã được ghi đè vào Cookie trình duyệt.
    - Nếu thất bại (Refresh Token đã hết hạn 7 ngày): Gọi `onRefreshed(error)`, ném lỗi và đẩy trạng thái đăng xuất cưỡng chế cho trình duyệt.

---

## 5. socket.js — Singleton Socket Client

Tệp [client/src/services/socket.js](file:///c:/Users/PC/OneDrive/Desktop/sea_shop/sea_shop/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/services/socket.js) đảm bảo kết nối WebSocket hoạt động dưới dạng mẫu thiết kế **Singleton (Một thực thể duy nhất)**.

### Phân tích dòng code:

* **Dòng 7-24: loadSocketIO (Lazy load SDK)**
  - Nhằm tránh làm nặng file bundle JavaScript ban đầu của ứng dụng React, client không import trực tiếp thư viện Socket.IO.
  - Khi cần sử dụng kết nối chat lần đầu tiên, client sẽ tạo động một thẻ `<script>` trong DOM để tải thư viện socket từ máy chủ CDN. Khi tải thành công, lưu SDK vào biến cục bộ `_socketLib`.

* **Dòng 26-39: getSocket**
  - Kiểm tra xem kết nối socket đã tồn tại và đang mở hay chưa (`_socket?.connected`).
  - Nếu đã kết nối, trả về ngay lập tức thực thể cũ.
  - Nếu chưa, khởi tạo kết nối mới tới `SOCKET_URL`. Cấu hình `withCredentials: true` gửi kèm cookie xác thực JWT Handshake lên server backend. Điều này ngăn chặn việc tạo dư thừa nhiều kết nối WebSocket chạy song song làm hao tốn tài nguyên cổng mạng của Server.
