// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import hàm xử lý webhook thanh toán Sepay từ payment.controller
import {
  getPremiumIntent,
  getPremiumStatus,
  sepayWebhook,
} from "../controllers/payment.controller";
import { authenticate } from "../middlewares/auth";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

/**
 * @openapi
 * /api/payment/webhook:
 *   post:
 *     summary: Nhận dữ liệu thông báo giao dịch chuyển khoản ngân hàng qua Sepay Webhook (bypass CSRF & authentication)
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *                 description: ID giao dịch của Sepay
 *               gateway:
 *                 type: string
 *                 description: Cổng thanh toán sử dụng
 *               transactionDate:
 *                 type: string
 *                 description: Thời gian giao dịch
 *               amount:
 *                 type: integer
 *                 description: Số tiền giao dịch
 *               code:
 *                 type: string
 *                 description: Mã chuyển khoản
 *               content:
 *                 type: string
 *                 description: Nội dung chuyển khoản đầy đủ
 *     responses:
 *       200:
 *         description: Xử lý webhook thành công
 *       400:
 *         description: Dữ liệu webhook không hợp lệ
 */
// Endpoint webhook nhận dữ liệu thông báo giao dịch từ Sepay chuyển đến (tuyến này bypass bảo vệ CSRF trong app.ts)
router.post("/webhook", sepayWebhook);
router.get("/premium-intent", authenticate, getPremiumIntent);
router.get("/status", authenticate, getPremiumStatus);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
