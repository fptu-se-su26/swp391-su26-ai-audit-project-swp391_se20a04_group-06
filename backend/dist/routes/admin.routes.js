"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm điều khiển từ admin.controller để xử lý các yêu cầu của quản trị viên
const admin_controller_1 = require("../controllers/admin.controller");
// Import các middleware xác thực token (authenticate) và kiểm tra quyền admin (adminOnly)
const auth_1 = require("../middlewares/auth");
// Import các hàm điều khiển phát tin nhắn thông báo hàng loạt từ notification.controller
const notification_controller_1 = require("../controllers/notification.controller");
const landingBatch_controller_1 = require("../controllers/landingBatch.controller");
// Khởi tạo một đối tượng router từ Express Router để cấu hình các tuyến đường con
const router = (0, express_1.Router)();
// Áp dụng bộ lọc xác thực token và quyền Admin cho tất cả các route nằm bên dưới dòng này
router.use(auth_1.authenticate, auth_1.adminOnly);
/**
 * @openapi
 * /api/admin/stats:
 *   get:
 *     summary: Lấy thông tin số liệu thống kê hệ thống (Chỉ dành cho Admin)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy số liệu thống kê thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 */
// Tuyến đường GET /stats lấy số liệu thống kê chung của trang web
router.get("/stats", admin_controller_1.getStats);
/**
 * @openapi
 * /api/admin/users:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng trong hệ thống (Chỉ dành cho Admin)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách người dùng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 */
// Tuyến đường GET /users lấy danh sách tất cả người dùng trong hệ thống
router.get("/users", admin_controller_1.listUsers);
/**
 * @openapi
 * /api/admin/users/{id}/toggle:
 *   patch:
 *     summary: Khóa hoặc mở khóa một tài khoản người dùng theo ID (Chỉ dành cho Admin)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần khóa/mở khóa
 *     responses:
 *       200:
 *         description: Khóa/mở khóa tài khoản thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 *       404:
 *         description: Không tìm thấy người dùng
 */
// Tuyến đường PATCH /users/:id/toggle khóa hoặc mở khóa một tài khoản người dùng theo ID
router.patch("/users/:id/toggle", admin_controller_1.toggleUser);
/**
 * @openapi
 * /api/admin/users/{id}/verify:
 *   patch:
 *     summary: Xác minh trạng thái (tích xanh) người dùng theo ID (Chỉ dành cho Admin)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người dùng cần xác minh
 *     responses:
 *       200:
 *         description: Xác minh tài khoản thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 *       404:
 *         description: Không tìm thấy người dùng
 */
// Tuyến đường PATCH /users/:id/verify xác minh trạng thái (tích xanh) người dùng theo ID
router.patch("/users/:id/verify", admin_controller_1.verifyUser);
/**
 * @openapi
 * /api/admin/listings:
 *   get:
 *     summary: Lấy danh sách tất cả sản phẩm của toàn bộ hệ thống (Chỉ dành cho Admin)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách bài đăng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 */
// Tuyến đường GET /listings lấy danh sách tất cả sản phẩm đang được rao bán
router.get("/listings", admin_controller_1.listAllProducts);
router.get("/landing-batches", landingBatch_controller_1.listAdminLandingBatches);
/**
 * @openapi
 * /api/admin/listings/{id}:
 *   delete:
 *     summary: Xóa một bài đăng sản phẩm theo ID từ phía admin (Chỉ dành cho Admin)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bài đăng sản phẩm cần xóa
 *     responses:
 *       200:
 *         description: Xóa bài đăng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 *       404:
 *         description: Không tìm thấy bài đăng sản phẩm
 */
// Tuyến đường DELETE /listings/:id xóa một bài đăng sản phẩm theo ID từ phía admin
router.delete("/listings/:id", admin_controller_1.adminDeleteProduct);
/**
 * @openapi
 * /api/admin/notifications/broadcast:
 *   post:
 *     summary: Gửi thông báo phát sóng diện rộng cho tất cả người dùng (Chỉ dành cho Admin)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
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
 *                 description: Nội dung thông báo hệ thống (tối đa 200 ký tự)
 *                 example: Hệ thống sẽ tiến hành bảo trì định kỳ từ 2h đến 4h sáng mai.
 *               targetRole:
 *                 type: string
 *                 enum: [all, Seller, Buyer]
 *                 default: all
 *                 description: Nhóm vai trò người nhận thông báo
 *                 example: all
 *     responses:
 *       200:
 *         description: Phát thông báo thành công
 *       400:
 *         description: Nội dung trống hoặc quá dài
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 */
// Tuyến đường POST /notifications/broadcast để gửi thông báo phát sóng diện rộng (đã được bảo vệ)
router.post("/notifications/broadcast", notification_controller_1.broadcastNotification);
/**
 * @openapi
 * /api/admin/notifications/broadcasts:
 *   get:
 *     summary: Lấy lịch sử các thông báo phát sóng trước đó (Chỉ dành cho Admin)
 *     tags: [Admin]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 */
// Tuyến đường GET /notifications/broadcasts để lấy lịch sử các thông báo phát sóng trước đó (đã được bảo vệ)
router.get("/notifications/broadcasts", notification_controller_1.getBroadcastHistory);
// Xuất đối tượng router để sử dụng tại file cấu hình ứng dụng chính app.ts
exports.default = router;
