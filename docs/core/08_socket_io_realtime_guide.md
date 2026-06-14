# Hướng Dẫn Tích Hợp API Thời Gian Thực (Socket.IO & WebRTC Call)

Tài liệu này cung cấp toàn bộ đặc tả kết nối, các kênh phòng (Rooms) và các sự kiện (Events) của máy chủ Socket.IO thời gian thực, giúp lập trình viên Frontend phát triển tính năng chat và gọi thoại/gọi video trực tiếp trên website.

---

## 🔌 1. Cấu Hình Kết Nối & Xác Thực (Connection & Authentication)

* **URL Kết Nối Cục Bộ (Local)**: `http://localhost:5000`
* **Namespace**: Mặc định (`/`)
* **Cơ Chế Xác Thực (Handshake)**:
  * Máy chủ sẽ tự động trích xuất mã JWT xác thực từ HTTP-Only Cookie có tên là `token` được gửi kèm từ trình duyệt (khi gọi lệnh kết nối với cấu hình `withCredentials: true`).
  * *Trường hợp đặc biệt (như môi trường test không dùng cookie)*: Có thể truyền token trực tiếp qua tham số query của URL kết nối: `http://localhost:5000?token=YOUR_JWT_TOKEN`
* **Yêu cầu kết nối**: Tài khoản người dùng phải tồn tại và đang ở trạng thái hoạt động (`isActive: true`), nếu không kết nối sẽ bị từ chối ngay lập tức.

---

## 🗄️ 2. Hệ Thống Phòng Chat (Rooms)

Để nhận tin nhắn hoặc thông tin thời gian thực đúng đối tượng, Client cần tham gia vào các phòng chỉ định sau:

### 2.1. Phòng cá nhân (`user_${userId}`)
* **Mục đích**: Nhận các thông báo cá nhân toàn hệ thống và tin nhắn chờ từ hộp thư đến.
* **Cách tham gia**: Máy chủ **tự động** đưa kết nối Socket của bạn vào phòng này ngay khi bắt đầu kết nối thành công. Bạn không cần gửi yêu cầu tham gia.

### 2.2. Phòng trò chuyện sản phẩm (`product_${productId}_${buyerId}`)
* **Mục đích**: Nhận và gửi tin nhắn thời gian thực trong phòng chat liên quan đến một mẻ hải sản cụ thể.
* **Quy tắc bảo mật**: Chỉ **người bán** (chủ của sản phẩm đó) và **người mua** (người bắt đầu cuộc hội thoại) mới được phép tham gia phòng này.
* **Cách tham gia/thoát**: Client phải chủ động gửi sự kiện `join_room` hoặc `leave_room`.

---

## 📨 3. Các Sự Kiện Trò Chuyện (Chat Events)

### 3.1. Sự kiện Client GỬI (Emit Events)

#### 1. Sự kiện tham gia phòng chat (`join_room`)
* **Khi nào dùng**: Khi người dùng nhấn vào phòng chat chi tiết của một sản phẩm.
* **Payload (JSON)**:
  ```json
  {
    "productId": "64df56e9c40212f8e1234567",
    "buyerId": "64df56e9c40212f8e1234568"
  }
  ```

#### 2. Sự kiện thoát phòng chat (`leave_room`)
* **Khi nào dùng**: Khi người dùng thoát khỏi khung chat sản phẩm hoặc chuyển trang.
* **Payload (JSON)**:
  ```json
  {
    "productId": "64df56e9c40212f8e1234567",
    "buyerId": "64df56e9c40212f8e1234568"
  }
  ```

#### 3. Sự kiện gửi tin nhắn (`send_message`)
* **Khi nào dùng**: Khi người dùng soạn xong tin nhắn và nhấn gửi trong khung chat.
* **Giới hạn tần suất (Rate Limit)**: Tối đa **5 tin nhắn trong 2 giây** từ một tài khoản, nếu vượt quá sẽ nhận về sự kiện `error` từ server.
* **Payload (JSON)**:
  ```json
  {
    "productId": "64df56e9c40212f8e1234567",
    "receiverId": "64df56e9c40212f8e1234568",
    "content": "Xin chào, mực tươi Phú Quốc hôm nay còn không shop?", 
    "imageUrl": null,
    "location": null
  }
  ```
  * *Lưu ý*: Tin nhắn bắt buộc phải chứa ít nhất `content` (văn bản) hoặc `imageUrl` (ảnh đính kèm) hoặc `location` (tọa độ GPS). Không được gửi tin trống.

---

### 3.2. Sự kiện Client NHẬN (On Events)

#### 1. Sự kiện nhận tin nhắn mới (`new_message`)
* **Mục đích**: Nhận tin nhắn do đối tác trong phòng gửi đến thời gian thực.
* **Payload nhận về**:
  ```json
  {
    "id": "64df56e9c40212f8e1234599",
    "productId": "64df56e9c40212f8e1234567",
    "senderId": "64df56e9c40212f8e1234568",
    "receiverId": "64df56e9c40212f8e1234567",
    "content": "Xin chào, mực tươi Phú Quốc hôm nay còn không shop?",
    "imageUrl": null,
    "location": null,
    "sentAt": "2026-06-14T08:00:00.000Z",
    "isRead": false
  }
  ```

#### 2. Sự kiện nhận thông báo đẩy tin nhắn mới ở ngoài phòng (`notification`)
* **Mục đích**: Hiển thị popup hoặc badge số lượng tin nhắn chưa đọc khi người dùng đang ở trang khác.
* **Payload nhận về**:
  ```json
  {
    "type": "new_message",
    "productId": "64df56e9c40212f8e1234567",
    "senderId": "64df56e9c40212f8e1234568",
    "preview": "Xin chào, mực tươi Phú Quốc hôm nay..."
  }
  ```

#### 3. Các sự kiện cập nhật tin nhắn từ REST API (Đồng bộ Realtime)
Khi người dùng gọi các API HTTP (như Thu hồi, Sửa tin, Thả emoji), Server sẽ phát tín hiệu realtime tương ứng tới các phòng chat để cập nhật UI ngay lập tức:

* **Sự kiện tin nhắn bị thu hồi (`message_recalled`)**:
  * *Payload*: `{ "id": "tin_nhan_id" }` -> Frontend cần cập nhật UI của tin nhắn đó thành *"Tin nhắn đã bị thu hồi"*.
* **Sự kiện tin nhắn được chỉnh sửa (`message_edited`)**:
  * *Payload*: `{ "id": "tin_nhan_id", "content": "nội dung mới" }` -> Cập nhật hiển thị nội dung mới của tin nhắn.
* **Sự kiện thả cảm xúc tin nhắn (`message_reacted`)**:
  * *Payload*: `{ "id": "tin_nhan_id", "reaction": "heart" }` -> Hiển thị emoji tương ứng ở góc tin nhắn.

---

## 📞 4. Các Sự Kiện Gọi Thoại/Video WebRTC (WebRTC Calling Events)

Cơ chế này sử dụng máy chủ Socket.IO làm trung gian truyền tín hiệu (Signaling Server) để hai trình duyệt thiết lập kết nối ngang hàng P2P.

### 4.1. Luồng Người Gọi (Caller Flow)
1. **Khởi tạo cuộc gọi**: Gửi sự kiện `call_user`.
   * *Payload*:
     ```json
     {
       "to": "64df56e9c40212f8e1234568", 
       "offer": "SDP_OFFER_OBJECT",
       "callerName": "Ngư dân Bùi Văn A"
     }
     ```
2. **Nhận tín hiệu đồng ý**: Lắng nghe sự kiện `call_accepted` từ người nhận để kết nối WebRTC.
   * *Payload nhận về*: `{ "answer": "SDP_ANSWER_OBJECT" }`
3. **Trao đổi IP/Mạng**: Gửi và nhận liên tục sự kiện `ice_candidate`.
   * *Payload gửi/nhận*: `{ "to": "receiver_id", "candidate": "ICE_CANDIDATE_OBJECT" }` (Client nhận chỉ có `{ "candidate": ... }`).

### 4.2. Luồng Người Nhận (Receiver Flow)
1. **Lắng nghe cuộc gọi đến**: Lắng nghe sự kiện `incoming_call`.
   * *Payload nhận về*:
     ```json
     {
       "from": "64df56e9c40212f8e1234567",
       "offer": "SDP_OFFER_OBJECT",
       "callerName": "Người mua Nguyễn Văn B"
     }
     ```
2. **Chấp nhận cuộc gọi**: Gửi sự kiện `answer_call`.
   * *Payload*:
     ```json
     {
       "to": "64df56e9c40212f8e1234567",
       "answer": "SDP_ANSWER_OBJECT"
     }
     ```

### 4.3. Sự kiện Kết Thúc Cuộc Gọi (Termination Events)
* **Chủ động cúp máy**: Gửi sự kiện `end_call` với payload `{ "to": "id_doi_tac" }`.
* **Đối tác cúp máy**: Lắng nghe sự kiện `call_ended` (không có payload) để dừng luồng camera/micro của local và hiển thị thông báo kết thúc cuộc gọi.
* **Lỗi cuộc gọi**: Lắng nghe sự kiện `error` nhận về `{ "message": "lỗi" }` (ví dụ khi tài khoản đối tác đã offline hoặc bị khóa).

---

## 💻 5. Mã Nguồn Ví Dụ Kết Nối (React Code Snippet)

Dưới đây là gợi ý viết service quản lý socket trong ứng dụng React:

```javascript
import { io } from "socket.io-client";

class SocketService {
  socket = null;

  connect() {
    // Kết nối lên server backend, cấu hình withCredentials: true để gửi cookie xác thực tự động
    this.socket = io("http://localhost:5000", {
      withCredentials: true,
      transports: ["websocket"]
    });

    this.socket.on("connect", () => {
      console.log("⚡ Đã kết nối Socket.IO thành công!");
    });

    // Lắng nghe thông báo tin nhắn mới
    this.socket.on("notification", (data) => {
      console.log("🔔 Thông báo mới nhận:", data);
    });

    // Lắng nghe lỗi từ hệ thống
    this.socket.on("error", (err) => {
      alert("❌ Lỗi Socket: " + err.message);
    });
  }

  joinChatRoom(productId, buyerId) {
    if (this.socket) {
      this.socket.emit("join_room", { productId, buyerId });
    }
  }

  leaveChatRoom(productId, buyerId) {
    if (this.socket) {
      this.socket.emit("leave_room", { productId, buyerId });
    }
  }

  sendChatMessage(productId, receiverId, content) {
    if (this.socket) {
      this.socket.emit("send_message", {
        productId,
        receiverId,
        content
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

export const socketService = new SocketService();
```
