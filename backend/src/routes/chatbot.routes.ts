import { Router } from "express";
import rateLimit from "express-rate-limit";
import { askChatbot } from "../controllers/chatbot.controller";

const router = Router();

// Hạn chế 1 IP chỉ được hỏi tối đa 30 câu trong vòng 15 phút
const chatbotLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    message: { message: "Bạn đã gửi quá nhiều câu hỏi. Vui lòng đợi một lát trước khi tiếp tục trò chuyện." },
    standardHeaders: true,
    legacyHeaders: false,
});

// Sử dụng "/" để định tuyến gộp chuẩn xác
router.post("/", chatbotLimiter, askChatbot);

export default router;