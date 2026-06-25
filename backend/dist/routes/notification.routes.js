"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm xử lý thông báo từ notification.controller
const notification_controller_1 = require("../controllers/notification.controller");
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
const auth_1 = require("../middlewares/auth");
// Khởi tạo đối tượng router từ Express Router
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/notifications:
 *   get:
 *     summary: Lấy danh sách thông báo của người dùng hiện tại (yêu cầu đăng nhập)
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thông báo thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET / để lấy danh sách thông báo của người dùng hiện tại (yêu cầu đăng nhập)
router.get("/", auth_1.authenticate, notification_controller_1.getNotifications);
/**
 * @openapi
 * /api/notifications/read:
 *   put:
 *     summary: Đánh dấu tất cả thông báo của người dùng hiện tại là đã đọc (yêu cầu đăng nhập)
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Đã đánh dấu đọc tất cả thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường PUT /read để cập nhật trạng thái đã đọc cho tất cả thông báo (yêu cầu đăng nhập)
router.put("/read", auth_1.authenticate, notification_controller_1.markAllAsRead);
/**
 * @openapi
 * /api/notifications/{id}:
 *   patch:
 *     summary: Đánh dấu một thông báo cụ thể theo ID là đã đọc (yêu cầu đăng nhập)
 *     tags: [Notifications]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của thông báo
 *     responses:
 *       200:
 *         description: Đã đánh dấu đọc thông báo thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy thông báo
 */
// Định nghĩa tuyến đường PATCH /:id để cập nhật trạng thái đã đọc cho một thông báo cụ thể theo ID (yêu cầu đăng nhập)
router.patch("/:id", auth_1.authenticate, notification_controller_1.markSingleAsRead);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
