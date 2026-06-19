"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm xử lý từ report.controller liên quan đến gửi và xử lý báo cáo vi phạm
const report_controller_1 = require("../controllers/report.controller");
// Import các middleware xác thực người dùng đã đăng nhập (authenticate) và kiểm tra quyền quản trị viên (adminOnly)
const auth_1 = require("../middlewares/auth");
// Import middleware kiểm tra cấu trúc dữ liệu đầu vào (validateSchema)
const validate_1 = require("../middlewares/validate");
// Import các cấu trúc schema kiểm duyệt báo cáo và cách xử lý báo cáo từ report.validation
const report_validation_1 = require("../validations/report.validation");
// Khởi tạo đối tượng router từ Express Router
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/reports/{productId}:
 *   post:
 *     summary: Gửi một báo cáo vi phạm liên quan đến sản phẩm (yêu cầu đăng nhập)
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm bị báo cáo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Lý do báo cáo vi phạm
 *                 example: Sản phẩm không đúng mô tả, hình ảnh giả mạo.
 *     responses:
 *       201:
 *         description: Gửi báo cáo vi phạm thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST /:productId để gửi một báo cáo vi phạm liên quan đến sản phẩm (yêu cầu đăng nhập, validate cấu trúc báo cáo, rồi gọi controller createReport)
router.post("/:productId", auth_1.authenticate, (0, validate_1.validateSchema)(report_validation_1.createReportSchema), report_controller_1.createReport);
/**
 * @openapi
 * /api/reports:
 *   get:
 *     summary: Lấy danh sách các báo cáo vi phạm (Chỉ dành cho Admin)
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 */
// Định nghĩa tuyến đường GET / để lấy danh sách các báo cáo vi phạm (yêu cầu đăng nhập, chỉ dành cho Admin, gọi controller getReports)
router.get("/", auth_1.authenticate, auth_1.adminOnly, report_controller_1.getReports);
/**
 * @openapi
 * /api/reports/{id}:
 *   patch:
 *     summary: Xử lý một báo cáo vi phạm theo ID (Chỉ dành cho Admin)
 *     tags: [Reports]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của báo cáo vi phạm cần xử lý
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [action]
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [resolve, dismiss]
 *                 description: Hành động xử lý
 *                 example: resolve
 *               adminNote:
 *                 type: string
 *                 description: Ghi chú giải trình của quản trị viên
 *                 example: Bài đăng chứa hình ảnh phản cảm.
 *     responses:
 *       200:
 *         description: Xử lý báo cáo thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền truy cập (không phải Admin)
 *       404:
 *         description: Không tìm thấy báo cáo vi phạm
 */
// Định nghĩa tuyến đường PATCH /:id để xử lý một báo cáo vi phạm theo ID (yêu cầu đăng nhập, chỉ dành cho Admin, validate cấu trúc xử lý, rồi gọi controller handleReport)
router.patch("/:id", auth_1.authenticate, auth_1.adminOnly, (0, validate_1.validateSchema)(report_validation_1.handleReportSchema), report_controller_1.handleReport);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
