# Báo cáo xóa tính năng Gọi thoại & Gọi video (Remove Voice/Video Call Feature Report)

Dự án: **HảiSản.vn**

---

## 1. Các file đã sửa đổi (Modified Files)
1.  **[`client/src/pages/Chat.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/pages/Chat.jsx)**:
    *   Loại bỏ import component `VideoCall`.
    *   Xóa phần render component `<VideoCall />` trong danh sách các hành động ở header của cửa sổ chat (`chat-window__actions`).
    *   Căn chỉnh lại bố cục header hiển thị tên, avatar và thông tin sản phẩm ở góc trái và các thông báo realtime ở góc phải sau khi loại bỏ nút gọi.
2.  **[`backend/src/socket.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/socket.ts)**:
    *   Loại bỏ import helper `canSignalProductCall`.
    *   Xóa toàn bộ các bộ lắng nghe sự kiện (event listeners) liên quan đến cuộc gọi WebRTC: `call_user`, `answer_call`, `reject_call`, `ice_candidate`, `end_call`.

---

## 2. Các file đã xóa (Deleted Files)
1.  **[`client/src/components/chat/VideoCall.jsx`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/client/src/components/chat/VideoCall.jsx)**:
    *   Tệp component chứa UI và logic WebRTC Peer Connection kết nối cuộc gọi.
2.  **[`backend/src/utils/callAuthorization.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/utils/callAuthorization.ts)**:
    *   Logic kiểm tra quyền kết nối tín hiệu cuộc gọi dựa trên quan hệ sản phẩm và người dùng.
3.  **[`backend/src/utils/callAuthorization.test.ts`](file:///d:/swp391-su26-ai-audit-project-swp391_se20a04_group-06/backend/src/utils/callAuthorization.test.ts)**:
    *   Tệp kiểm thử đơn vị cho logic kiểm tra quyền cuộc gọi.

---

## 3. Những socket event call đã xóa (Removed Socket Call Events)
Chúng tôi đã xóa hoàn toàn các sự kiện kết nối tín hiệu cuộc gọi sau khỏi Socket.IO Server:
*   `call_user` (Khởi tạo cuộc gọi và chuyển tiếp `incoming_call`)
*   `answer_call` (Đồng ý nhận cuộc gọi và chuyển tiếp `call_accepted`)
*   `reject_call` (Từ chối cuộc gọi và chuyển tiếp `call_rejected`)
*   `ice_candidate` (Trao đổi ứng viên ICE mạng WebRTC)
*   `end_call` (Ngắt cuộc gọi và chuyển tiếp `call_ended`)

---

## 4. Các chức năng chat đã kiểm tra (Audited Chat Functions)
*   **Trạng thái kết nối realtime**: Thông tin realtime qua socket khi gửi/nhận tin nhắn vẫn hoạt động chính xác.
*   **Gửi tin nhắn**: Đã kiểm tra tính năng gửi tin nhắn văn bản, hình ảnh, và chia sẻ vị trí. Tất cả hoạt động bình thường.
*   **Nhận tin nhắn**: Luồng nhận tin nhắn realtime và cập nhật danh sách hội thoại hoạt động ổn định.
*   **Quản lý tin nhắn**: Tính năng thu hồi, chỉnh sửa và bày tỏ cảm xúc tin nhắn hoạt động bình thường.
*   **Liên kết từ Marketplace**: Nút "Nhắn người bán" từ ProductCard vẫn tạo/mở chính xác cuộc trò chuyện tương ứng với sản phẩm.

---

## 5. Kết quả chạy biên dịch (Build Status)
*   **Backend Build**: Biên dịch thành công `100%`:
    ```bash
    seafood-backend@1.0.0 build
    tsc -p tsconfig.build.json
    ```
*   **Client (Frontend) Build**: Biên dịch thành công `100%` bằng Vite. Dung lượng tệp tin bundle trang Chat giảm từ `328.02 kB` xuống còn `320.93 kB` nhờ loại bỏ hoàn toàn mã nguồn WebRTC dư thừa:
    ```bash
    vite v8.1.0 building client environment for production...
    transforming...✓ 307 modules transformed.
    rendering chunks...
    dist/assets/Chat-DWOW4TnL.js                    320.93 kB │ gzip: 79.31 kB
    ✓ built in 462ms
    ```
