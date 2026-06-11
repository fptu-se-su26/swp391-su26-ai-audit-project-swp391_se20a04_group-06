// routes/message.routes.ts

import { Router } from "express";
import {
  getMessages,
  sendMessage,
  unreadCount,
  getConversations,
  uploadChatImage,
  recallMessage, // Controller mới
  reactMessage, // Controller mới
  editMessage, // Controller mới
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
);

// Các API xử lý tương tác tin nhắn nâng cao
router.patch("/:id/recall", authenticate, recallMessage);
router.post("/:id/react", authenticate, reactMessage);
router.patch("/:id/edit", authenticate, editMessage);

router.get("/:productId", authenticate, getMessages);
router.post("/", authenticate, sendMessage);

export default router;
