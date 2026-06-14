// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import hàm xử lý webhook thanh toán Sepay từ payment.controller
import { sepayWebhook } from "../controllers/payment.controller";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

// Endpoint webhook nhận dữ liệu thông báo giao dịch từ Sepay chuyển đến (tuyến này bypass bảo vệ CSRF trong app.ts)
router.post("/webhook", sepayWebhook);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
