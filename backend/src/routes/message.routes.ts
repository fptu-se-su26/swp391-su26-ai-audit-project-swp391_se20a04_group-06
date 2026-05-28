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

const router = Router();

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

export default router;
