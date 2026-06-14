// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import các hàm xử lý thông báo từ notification.controller
import {
  // Lấy danh sách thông báo của người dùng hiện tại
  getNotifications,
  // Đánh dấu tất cả thông báo của người dùng hiện tại là đã đọc
  markAllAsRead,
  // Đánh dấu một thông báo cụ thể theo ID là đã đọc
  markSingleAsRead,
} from "../controllers/notification.controller";
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
import { authenticate } from "../middlewares/auth";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

// Định nghĩa tuyến đường GET / để lấy danh sách thông báo của người dùng hiện tại (yêu cầu đăng nhập)
router.get("/", authenticate, getNotifications);

// Định nghĩa tuyến đường PUT /read để cập nhật trạng thái đã đọc cho tất cả thông báo (yêu cầu đăng nhập)
router.put("/read", authenticate, markAllAsRead);

// Định nghĩa tuyến đường PATCH /:id để cập nhật trạng thái đã đọc cho một thông báo cụ thể theo ID (yêu cầu đăng nhập)
router.patch("/:id", authenticate, markSingleAsRead);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
