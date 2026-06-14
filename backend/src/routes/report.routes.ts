// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import các hàm xử lý từ report.controller liên quan đến gửi và xử lý báo cáo vi phạm
import {
  // Gửi báo cáo vi phạm sản phẩm
  createReport,
  // Lấy danh sách các báo cáo vi phạm
  getReports,
  // Xử lý báo cáo vi phạm (Duyệt/Bác bỏ) từ phía Admin
  handleReport,
} from "../controllers/report.controller";
// Import các middleware xác thực người dùng đã đăng nhập (authenticate) và kiểm tra quyền quản trị viên (adminOnly)
import { authenticate, adminOnly } from "../middlewares/auth";
// Import middleware kiểm tra cấu trúc dữ liệu đầu vào (validateSchema)
import { validateSchema } from "../middlewares/validate";
// Import các cấu trúc schema kiểm duyệt báo cáo và cách xử lý báo cáo từ report.validation
import {
  createReportSchema,
  handleReportSchema,
} from "../validations/report.validation";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

// Định nghĩa tuyến đường POST /:productId để gửi một báo cáo vi phạm liên quan đến sản phẩm (yêu cầu đăng nhập, validate cấu trúc báo cáo, rồi gọi controller createReport)
router.post(
  "/:productId",
  authenticate,
  validateSchema(createReportSchema),
  createReport,
);

// Định nghĩa tuyến đường GET / để lấy danh sách các báo cáo vi phạm (yêu cầu đăng nhập, chỉ dành cho Admin, gọi controller getReports)
router.get("/", authenticate, adminOnly, getReports);

// Định nghĩa tuyến đường PATCH /:id để xử lý một báo cáo vi phạm theo ID (yêu cầu đăng nhập, chỉ dành cho Admin, validate cấu trúc xử lý, rồi gọi controller handleReport)
router.patch(
  "/:id",
  authenticate,
  adminOnly,
  validateSchema(handleReportSchema),
  handleReport,
);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
