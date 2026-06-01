import { Router } from "express";
import {
  getMessages,
  sendMessage,
  unreadCount,
  getConversations,
  uploadChatImage, // ← Import
} from "../controllers/message.controller";
import { authenticate } from "../middlewares/auth";
import { upload } from "../middlewares/upload";
import rateLimit from "express-rate-limit";

const router = Router();
const messageSendLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 giây
  max: 10,
  message: { message: "Bạn đang gửi tin nhắn quá nhanh. Vui lòng làm chậm lại." },
  standardHeaders: true,
  legacyHeaders: false,
});


router.get("/unread-count", authenticate, unreadCount);
router.get("/conversations", authenticate, getConversations);
router.post(
  "/upload-image",
  authenticate,
  upload.single("image"),
  uploadChatImage,
); // 🌟 Route tải ảnh trong chat
router.get("/:productId", authenticate, getMessages);
router.post("/", authenticate, sendMessage);
router.post("/", authenticate, messageSendLimiter, sendMessage);

export default router;
