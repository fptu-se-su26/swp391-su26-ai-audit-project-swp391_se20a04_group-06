// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import các hàm điều khiển từ BoatLogController của module boat-log để xử lý yêu cầu liên quan đến nhật ký đi biển
import {
  // Lấy danh sách nhật ký đi biển
  getBoatLogs,
  // Tạo nhật ký đi biển mới
  createBoatLog,
  // Thích hoặc bỏ thích một nhật ký đi biển
  toggleLikeBoatLog,
  // Xóa nhật ký đi biển
  deleteBoatLog,
} from "../modules/boat-log/presentation/http/BoatLogController";
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
import { authenticate } from "../middlewares/auth";
// Import middleware kiểm chứng cấu trúc schema dữ liệu đầu vào (validateSchema)
import { validateSchema } from "../middlewares/validate";
// Import cấu trúc schema kiểm định dữ liệu tạo mới nhật ký đi biển từ boatLog.validation
import { createBoatLogSchema } from "../validations/boatLog.validation";

// Khởi tạo một đối tượng router từ Express Router
const router = Router();

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
router.get("/", getBoatLogs);

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
router.post(
  "/",
  authenticate,
  validateSchema(createBoatLogSchema),
  createBoatLog,
);

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
router.post("/:id/like", authenticate, toggleLikeBoatLog);

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
router.delete("/:id", authenticate, deleteBoatLog);

// Xuất mặc định router boatLog để sử dụng ở file app.ts
export default router;

