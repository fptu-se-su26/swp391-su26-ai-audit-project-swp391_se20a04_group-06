// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import các hàm xử lý từ review.controller để tạo đánh giá mới và lấy danh sách đánh giá của người bán
import {
  // Thêm một đánh giá mới cho sản phẩm/người bán
  addReview,
  // Lấy danh sách các đánh giá dành cho một người bán cụ thể
  getReviewsBySeller,
} from "../controllers/review.controller";
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
import { authenticate } from "../middlewares/auth";
// Import middleware cấu hình tải ảnh đại diện/đính kèm của đánh giá lên (upload)
import { upload } from "../middlewares/upload";
// Import middleware kiểm tra cấu trúc dữ liệu đầu vào (validateSchema)
import { validateSchema } from "../middlewares/validate";
// Import cấu trúc schema kiểm duyệt nội dung đánh giá từ review.validation
import { createReviewSchema } from "../validations/review.validation";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

/**
 * @openapi
 * /api/reviews:
 *   post:
 *     summary: Tạo một đánh giá mới cho người bán (yêu cầu đăng nhập, hỗ trợ tải lên 1 hình ảnh đính kèm)
 *     tags: [Reviews]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [productId, sellerId, rating]
 *             properties:
 *               productId:
 *                 type: string
 *                 description: ID sản phẩm được đánh giá
 *                 example: 64df56e9c40212f8e1234567
 *               sellerId:
 *                 type: string
 *                 description: ID người bán nhận đánh giá
 *                 example: 64df56e9c40212f8e1234568
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Số sao đánh giá từ 1 đến 5
 *                 example: 5
 *               comment:
 *                 type: string
 *                 description: Nội dung nhận xét đánh giá
 *                 example: Sản phẩm rất tươi ngon, giao hàng nhanh chóng!
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Hình ảnh đính kèm đánh giá
 *     responses:
 *       201:
 *         description: Đăng đánh giá thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST / để tạo một đánh giá mới (yêu cầu đăng nhập, cho phép tải lên một ảnh đính kèm, validate schema dữ liệu đánh giá, rồi gọi controller addReview)
router.post(
  "/",
  authenticate,
  upload.single("image"),
  validateSchema(createReviewSchema),
  addReview,
);

/**
 * @openapi
 * /api/reviews/seller/{sellerId}:
 *   get:
 *     summary: Lấy toàn bộ danh sách đánh giá của người bán dựa theo ID người bán (công khai không cần đăng nhập)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: sellerId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của người bán cần lấy đánh giá
 *     responses:
 *       200:
 *         description: Lấy danh sách đánh giá thành công
 */
// Định nghĩa tuyến đường GET /seller/:sellerId để lấy toàn bộ danh sách đánh giá của người bán dựa theo ID người bán (công khai không cần đăng nhập)
router.get("/seller/:sellerId", getReviewsBySeller);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;

