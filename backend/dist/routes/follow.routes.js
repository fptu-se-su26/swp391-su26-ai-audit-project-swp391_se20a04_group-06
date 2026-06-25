"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm xử lý theo dõi từ follow.controller
const follow_controller_1 = require("../controllers/follow.controller");
// Import middleware xác thực yêu cầu đăng nhập tài khoản (authenticate)
const auth_1 = require("../middlewares/auth");
// Khởi tạo đối tượng router từ Express Router
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/follows/following:
 *   get:
 *     summary: Lấy danh sách những người bán mà người dùng đang theo dõi
 *     tags: [Follows]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET /following để lấy danh sách những người bán đang theo dõi (yêu cầu đăng nhập, đặt trước tuyến tham số động :sellerId)
router.get("/following", auth_1.authenticate, follow_controller_1.getFollowing);
/**
 * @openapi
 * /api/follows/followers:
 *   get:
 *     summary: Lấy danh sách những người đang theo dõi tài khoản hiện tại
 *     tags: [Follows]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET /followers để lấy danh sách những người đang theo dõi tài khoản hiện tại (yêu cầu đăng nhập, đặt trước tuyến tham số động)
router.get("/followers", auth_1.authenticate, follow_controller_1.getFollowers);
/**
 * @openapi
 * /api/follows/{sellerId}/toggle:
 *   post:
 *     summary: Bật hoặc tắt trạng thái theo dõi một người bán theo ID
 *     tags: [Follows]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người bán
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái theo dõi thành công
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST /:sellerId/toggle để bật hoặc tắt trạng thái theo dõi một người bán theo ID (yêu cầu đăng nhập)
router.post("/:sellerId/toggle", auth_1.authenticate, follow_controller_1.toggleFollow);
/**
 * @openapi
 * /api/follows/{sellerId}/check:
 *   get:
 *     summary: Kiểm tra xem tài khoản hiện tại đã theo dõi người bán này chưa
 *     tags: [Follows]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người bán
 *     responses:
 *       200:
 *         description: Trả về trạng thái theo dõi
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường GET /:sellerId/check để kiểm tra xem tài khoản hiện tại đã theo dõi người bán này chưa (yêu cầu đăng nhập)
router.get("/:sellerId/check", auth_1.authenticate, follow_controller_1.checkFollow);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
