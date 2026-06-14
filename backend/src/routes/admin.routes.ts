// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import các hàm điều khiển từ admin.controller để xử lý các yêu cầu của quản trị viên
import {
  // Hàm lấy danh sách tất cả người dùng
  listUsers,
  // Hàm kích hoạt/khóa tài khoản người dùng
  toggleUser,
  // Hàm xác minh tài khoản người dùng (cấp tích xanh)
  verifyUser,
  // Hàm danh sách tất cả sản phẩm của toàn bộ hệ thống
  listAllProducts,
  // Hàm xóa sản phẩm từ phía quản trị viên
  adminDeleteProduct,
  // Hàm lấy thông tin số liệu thống kê hệ thống
  getStats,
} from "../controllers/admin.controller";
// Import các middleware xác thực token (authenticate) và kiểm tra quyền admin (adminOnly)
import { authenticate, adminOnly } from "../middlewares/auth";
// Import các hàm điều khiển phát tin nhắn thông báo hàng loạt từ notification.controller
import {
  // Hàm gửi thông báo phát sóng diện rộng cho tất cả người dùng
  broadcastNotification,
  // Hàm lấy lịch sử phát sóng thông báo từ trước đến nay
  getBroadcastHistory,
} from "../controllers/notification.controller";

// Khởi tạo một đối tượng router từ Express Router để cấu hình các tuyến đường con
const router = Router();

// Áp dụng bộ lọc xác thực token và quyền Admin cho tất cả các route nằm bên dưới dòng này
router.use(authenticate, adminOnly);

// Tuyến đường GET /stats lấy số liệu thống kê chung của trang web
router.get("/stats", getStats);
// Tuyến đường GET /users lấy danh sách tất cả người dùng trong hệ thống
router.get("/users", listUsers);
// Tuyến đường PATCH /users/:id/toggle khóa hoặc mở khóa một tài khoản người dùng theo ID
router.patch("/users/:id/toggle", toggleUser);
// Tuyến đường PATCH /users/:id/verify xác minh trạng thái (tích xanh) người dùng theo ID
router.patch("/users/:id/verify", verifyUser);
// Tuyến đường GET /listings lấy danh sách tất cả sản phẩm đang được rao bán
router.get("/listings", listAllProducts);
// Tuyến đường DELETE /listings/:id xóa một bài đăng sản phẩm theo ID từ phía admin
router.delete("/listings/:id", adminDeleteProduct);

// Tuyến đường POST /notifications/broadcast để gửi thông báo phát sóng diện rộng (đã được bảo vệ)
router.post("/notifications/broadcast", broadcastNotification);
// Tuyến đường GET /notifications/broadcasts để lấy lịch sử các thông báo phát sóng trước đó (đã được bảo vệ)
router.get("/notifications/broadcasts", getBroadcastHistory);

// Xuất đối tượng router để sử dụng tại file cấu hình ứng dụng chính app.ts
export default router;
