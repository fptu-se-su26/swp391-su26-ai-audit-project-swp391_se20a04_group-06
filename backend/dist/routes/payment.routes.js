"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import hàm xử lý webhook thanh toán Sepay từ payment.controller
const payment_controller_1 = require("../controllers/payment.controller");
// Khởi tạo đối tượng router từ Express Router
const router = (0, express_1.Router)();
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
router.post("/webhook", payment_controller_1.sepayWebhook);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
