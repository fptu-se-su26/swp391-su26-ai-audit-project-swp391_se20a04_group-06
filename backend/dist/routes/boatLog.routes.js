"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm điều khiển từ BoatLogController của module boat-log để xử lý yêu cầu liên quan đến nhật ký đi biển
const BoatLogController_1 = require("../modules/boat-log/presentation/http/BoatLogController");
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
const auth_1 = require("../middlewares/auth");
// Import middleware kiểm chứng cấu trúc schema dữ liệu đầu vào (validateSchema)
const validate_1 = require("../middlewares/validate");
// Import cấu trúc schema kiểm định dữ liệu tạo mới nhật ký đi biển từ boatLog.validation
const boatLog_validation_1 = require("../validations/boatLog.validation");
// Khởi tạo một đối tượng router từ Express Router
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/boat-logs:
 *   get:
 *     summary: Lấy danh sách các nhật ký đi biển (công khai không cần đăng nhập)
 *     tags: [BoatLogs]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 */
// Định nghĩa tuyến đường GET / lấy danh sách các nhật ký đi biển (công khai không cần đăng nhập)
router.get("/", BoatLogController_1.getBoatLogs);
/**
 * @openapi
 * /api/boat-logs:
 *   post:
 *     summary: Tạo mới một nhật ký đi biển (yêu cầu đăng nhập)
 *     tags: [BoatLogs]
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
 *                 description: Nội dung của nhật ký đi biển
 *                 example: Hôm nay thời tiết đẹp, gió nhẹ, đánh bắt được nhiều cá nục.
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Mảng chứa các đường dẫn hình ảnh đính kèm (URL đã upload lên Cloudinary)
 *     responses:
 *       201:
 *         description: Tạo nhật ký đi biển thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST / tạo mới một nhật ký đi biển (yêu cầu đăng nhập, kiểm định tính hợp lệ của dữ liệu, rồi gọi controller createBoatLog)
router.post("/", auth_1.authenticate, (0, validate_1.validateSchema)(boatLog_validation_1.createBoatLogSchema), BoatLogController_1.createBoatLog);
/**
 * @openapi
 * /api/boat-logs/{id}/like:
 *   post:
 *     summary: Bật/tắt trạng thái thích bài nhật ký cabin theo ID (yêu cầu đăng nhập)
 *     tags: [BoatLogs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bài nhật ký cabin
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái thích thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy bài nhật ký cabin
 */
// Định nghĩa tuyến đường POST /:id/like bật/tắt trạng thái thích bài nhật ký cabin theo ID (yêu cầu đăng nhập)
router.post("/:id/like", auth_1.authenticate, BoatLogController_1.toggleLikeBoatLog);
/**
 * @openapi
 * /api/boat-logs/{id}:
 *   delete:
 *     summary: Xóa bài nhật ký cabin theo ID (yêu cầu đăng nhập)
 *     tags: [BoatLogs]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của bài nhật ký cabin
 *     responses:
 *       200:
 *         description: Xóa bài nhật ký cabin thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền xóa bài của người khác
 *       404:
 *         description: Không tìm thấy bài nhật ký cabin
 */
// Định nghĩa tuyến đường DELETE /:id xóa bài nhật ký cabin theo ID (yêu cầu đăng nhập)
router.delete("/:id", auth_1.authenticate, BoatLogController_1.deleteBoatLog);
// Xuất mặc định router boatLog để sử dụng ở file app.ts
exports.default = router;
