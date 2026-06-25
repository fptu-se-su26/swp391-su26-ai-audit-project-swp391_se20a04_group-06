"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm xử lý chat từ message.controller để xử lý tin nhắn và hội thoại
const message_controller_1 = require("../controllers/message.controller");
// Import middleware xác thực yêu cầu đăng nhập (authenticate)
const auth_1 = require("../middlewares/auth");
// Import middleware cấu hình tải file lên (upload)
const upload_1 = require("../middlewares/upload");
// Khởi tạo đối tượng router từ Express Router
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/messages/unread-count:
 *   get:
 *     summary: Lấy tổng số lượng tin nhắn chưa đọc của người dùng hiện tại (yêu cầu đăng nhập)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Đếm tin nhắn chưa đọc thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   example: 5
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET /unread-count để lấy số lượng tin nhắn chưa đọc của người dùng hiện tại (yêu cầu đăng nhập)
router.get("/unread-count", auth_1.authenticate, message_controller_1.unreadCount);
/**
 * @openapi
 * /api/messages/conversations:
 *   get:
 *     summary: Lấy danh sách các cuộc hội thoại chat gần đây (inbox) của người dùng hiện tại (yêu cầu đăng nhập)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang lấy dữ liệu
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Số cuộc hội thoại trên một trang
 *     responses:
 *       200:
 *         description: Lấy danh sách hội thoại thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET /conversations để lấy danh sách các hội thoại chat gần đây (yêu cầu đăng nhập)
router.get("/conversations", auth_1.authenticate, message_controller_1.getConversations);
/**
 * @openapi
 * /api/messages/upload-image:
 *   post:
 *     summary: Tải lên hình ảnh tạm thời phục vụ gửi tin nhắn chứa ảnh trong phòng chat (yêu cầu đăng nhập)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: File hình ảnh trong chat
 *     responses:
 *       200:
 *         description: Upload ảnh thành công và trả về URL ảnh
 *       400:
 *         description: Chưa chọn file ảnh
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST /upload-image để gửi 1 ảnh đơn lẻ trong tin nhắn (yêu cầu đăng nhập, upload.single)
router.post("/upload-image", auth_1.authenticate, upload_1.upload.single("image"), message_controller_1.uploadChatImage);
/**
 * @openapi
 * /api/messages/{id}/recall:
 *   patch:
 *     summary: Thu hồi một tin nhắn đã gửi theo ID tin nhắn (yêu cầu đăng nhập)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của tin nhắn cần thu hồi
 *     responses:
 *       200:
 *         description: Thu hồi thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền thu hồi tin nhắn của người khác
 *       404:
 *         description: Không tìm thấy tin nhắn
 */
// Định nghĩa tuyến đường PATCH /:id/recall dùng để thu hồi một tin nhắn đã gửi theo ID tin nhắn (yêu cầu đăng nhập)
router.patch("/:id/recall", auth_1.authenticate, message_controller_1.recallMessage);
/**
 * @openapi
 * /api/messages/{id}/react:
 *   post:
 *     summary: Thả biểu tượng cảm xúc vào một tin nhắn theo ID tin nhắn (yêu cầu đăng nhập)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của tin nhắn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reaction:
 *                 type: string
 *                 description: "Biểu tượng cảm xúc (ví dụ: like, haha, heart, angry... hoặc để trống để xóa)"
 *                 example: heart
 *     responses:
 *       200:
 *         description: Thả cảm xúc thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy tin nhắn
 */
// Định nghĩa tuyến đường POST /:id/react dùng để thả cảm xúc vào một tin nhắn theo ID tin nhắn (yêu cầu đăng nhập)
router.post("/:id/react", auth_1.authenticate, message_controller_1.reactMessage);
/**
 * @openapi
 * /api/messages/{id}/edit:
 *   patch:
 *     summary: Chỉnh sửa nội dung văn bản của tin nhắn đã gửi (yêu cầu đăng nhập)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của tin nhắn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 description: Nội dung mới của tin nhắn
 *                 example: Tin nhắn này đã được sửa.
 *     responses:
 *       200:
 *         description: Sửa tin nhắn thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền chỉnh sửa tin nhắn của người khác
 *       404:
 *         description: Không tìm thấy tin nhắn
 */
// Định nghĩa tuyến đường PATCH /:id/edit dùng để chỉnh sửa nội dung văn bản của tin nhắn theo ID tin nhắn (yêu cầu đăng nhập)
router.patch("/:id/edit", auth_1.authenticate, message_controller_1.editMessage);
/**
 * @openapi
 * /api/messages/{productId}:
 *   get:
 *     summary: Lấy lịch sử tin nhắn chat liên quan đến một sản phẩm cụ thể (yêu cầu đăng nhập)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm liên kết phòng chat
 *       - in: query
 *         name: buyerId
 *         schema:
 *           type: string
 *         description: ID người mua (Bắt buộc nếu người xem là Người bán xem chat với người mua tương ứng)
 *     responses:
 *       200:
 *         description: Lấy lịch sử chat thành công
 *       400:
 *         description: Thiếu thông tin người mua (buyerId) hoặc ID không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET /:productId để lấy lịch sử tin nhắn chat liên quan đến một sản phẩm cụ thể (yêu cầu đăng nhập)
router.get("/:productId", auth_1.authenticate, message_controller_1.getMessages);
/**
 * @openapi
 * /api/messages:
 *   post:
 *     summary: Gửi một tin nhắn chat văn bản/hình ảnh/vị trí mới (yêu cầu đăng nhập)
 *     tags: [Messages]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, receiverId]
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID sản phẩm liên kết phòng chat
 *                 example: 64df56e9c40212f8e1234567
 *               receiverId:
 *                 type: string
 *                 description: ID của người nhận tin nhắn
 *                 example: 64df56e9c40212f8e1234568
 *               content:
 *                 type: string
 *                 description: Nội dung tin nhắn chữ (nếu có)
 *                 example: Xin chào, sản phẩm cua biển Cà Mau còn hàng không bạn?
 *               imageUrl:
 *                 type: string
 *                 description: URL ảnh đính kèm đã upload lên Cloudinary (nếu có)
 *                 example: https://res.cloudinary.com/demo/image/upload/v1234/seafood.jpg
 *               location:
 *                 type: object
 *                 properties:
 *                   type:
 *                     type: string
 *                     enum: [Point]
 *                     example: Point
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [106.660172, 10.762622]
 *                     description: Tọa độ chia sẻ vị trí [lng, lat]
 *               replyTo:
 *                 type: string
 *                 description: ID tin nhắn được trả lời (nếu có)
 *                 example: 64df56e9c40212f8e1234599
 *     responses:
 *       201:
 *         description: Gửi tin nhắn thành công
 *       400:
 *         description: Dữ liệu không hợp lệ hoặc tin nhắn rỗng
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST / để gửi một tin nhắn chat văn bản/hình ảnh mới (yêu cầu đăng nhập)
router.post("/", auth_1.authenticate, message_controller_1.sendMessage);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
