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

// Định nghĩa tuyến đường GET / lấy danh sách các nhật ký đi biển (công khai không cần đăng nhập)
router.get("/", getBoatLogs);

// Định nghĩa tuyến đường POST / tạo mới một nhật ký đi biển (yêu cầu đăng nhập, kiểm định tính hợp lệ của dữ liệu, rồi gọi controller createBoatLog)
router.post(
  "/",
  authenticate,
  validateSchema(createBoatLogSchema),
  createBoatLog,
);

// Định nghĩa tuyến đường POST /:id/like bật/tắt trạng thái thích bài nhật ký cabin theo ID (yêu cầu đăng nhập)
router.post("/:id/like", authenticate, toggleLikeBoatLog);

// Định nghĩa tuyến đường DELETE /:id xóa bài nhật ký cabin theo ID (yêu cầu đăng nhập)
router.delete("/:id", authenticate, deleteBoatLog);

// Xuất mặc định router boatLog để sử dụng ở file app.ts
export default router;
