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

// Định nghĩa tuyến đường POST / để tạo một đánh giá mới (yêu cầu đăng nhập, cho phép tải lên một ảnh đính kèm, validate schema dữ liệu đánh giá, rồi gọi controller addReview)
router.post(
  "/",
  authenticate,
  upload.single("image"),
  validateSchema(createReviewSchema),
  addReview,
);

// Định nghĩa tuyến đường GET /seller/:sellerId để lấy toàn bộ danh sách đánh giá của người bán dựa theo ID người bán (công khai không cần đăng nhập)
router.get("/seller/:sellerId", getReviewsBySeller);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
