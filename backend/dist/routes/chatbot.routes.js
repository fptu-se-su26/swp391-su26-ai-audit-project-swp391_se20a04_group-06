"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để cấu hình định tuyến HTTP
const express_1 = require("express");
// Import thư viện express-rate-limit để giới hạn tần suất gửi yêu cầu từ một IP
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
// Import hàm xử lý gửi câu hỏi cho chatbot từ chatbot.controller
const chatbot_controller_1 = require("../controllers/chatbot.controller");
// Khởi tạo đối tượng router của Express
const router = (0, express_1.Router)();
// Định nghĩa cấu hình chatbotLimiter để hạn chế 1 IP chỉ được hỏi tối đa 30 câu trong vòng 15 phút
const chatbotLimiter = (0, express_rate_limit_1.default)({
    // Thiết lập cửa sổ thời gian là 15 phút (tính bằng mili giây)
    windowMs: 15 * 60 * 1000,
    // Số lượng yêu cầu tối đa cho phép trong cửa sổ thời gian
    max: 30,
    // Thông báo phản hồi trả về khi người dùng vượt quá số câu hỏi quy định
    message: { message: "Bạn đã gửi quá nhiều câu hỏi. Vui lòng đợi một lát trước khi tiếp tục trò chuyện." },
    // Trả về thông tin giới hạn trong standard headers (RateLimit-Limit, RateLimit-Remaining...)
    standardHeaders: true,
    // Vô hiệu hóa headers cũ không chuẩn hóa (X-RateLimit-Limit, X-RateLimit-Remaining...)
    legacyHeaders: false,
});
/**
 * @openapi
 * /api/chatbot:
 *   post:
 *     summary: Gửi câu hỏi đến chatbot AI tư vấn hải sản
 *     tags: [Chatbot]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: Câu hỏi của người dùng
 *                 example: Làm thế nào để bảo quản mực tươi ngon?
 *     responses:
 *       200:
 *         description: Phản hồi của chatbot AI
 *       429:
 *         description: Quá nhiều yêu cầu trong thời gian ngắn
 */
// Định nghĩa tuyến đường POST / để gửi câu hỏi đến chatbot, áp dụng middleware giới hạn tần suất gửi tin và gọi controller askChatbot
router.post("/", chatbotLimiter, chatbot_controller_1.askChatbot);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
