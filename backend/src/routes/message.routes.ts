// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import các hàm xử lý chat từ message.controller để xử lý tin nhắn và hội thoại
import {
  // Lấy danh sách các tin nhắn trong một sản phẩm cụ thể
  getMessages,
  // Gửi tin nhắn mới
  sendMessage,
  // Lấy tổng số lượng tin nhắn chưa đọc
  unreadCount,
  // Lấy danh sách tất cả các cuộc hội thoại chat
  getConversations,
  // Tải lên hình ảnh trong phòng chat
  uploadChatImage,
  // Thu hồi một tin nhắn đã gửi
  recallMessage,
  // Thả cảm xúc (like, haha, tim...) vào tin nhắn
  reactMessage,
  // Chỉnh sửa nội dung tin nhắn đã gửi
  editMessage,
} from "../controllers/message.controller";
// Import middleware xác thực yêu cầu đăng nhập (authenticate)
import { authenticate } from "../middlewares/auth";
// Import middleware cấu hình tải file lên (upload)
import { upload } from "../middlewares/upload";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

// Định nghĩa tuyến đường GET /unread-count để lấy số lượng tin nhắn chưa đọc của người dùng hiện tại (yêu cầu đăng nhập)
router.get("/unread-count", authenticate, unreadCount);

// Định nghĩa tuyến đường GET /conversations để lấy danh sách các hội thoại chat gần đây (yêu cầu đăng nhập)
router.get("/conversations", authenticate, getConversations);

// Định nghĩa tuyến đường POST /upload-image để gửi 1 ảnh đơn lẻ trong tin nhắn (yêu cầu đăng nhập, upload.single)
router.post(
  "/upload-image",
  authenticate,
  upload.single("image"),
  uploadChatImage,
);

// Định nghĩa tuyến đường PATCH /:id/recall dùng để thu hồi một tin nhắn đã gửi theo ID tin nhắn (yêu cầu đăng nhập)
router.patch("/:id/recall", authenticate, recallMessage);

// Định nghĩa tuyến đường POST /:id/react dùng để thả cảm xúc vào một tin nhắn theo ID tin nhắn (yêu cầu đăng nhập)
router.post("/:id/react", authenticate, reactMessage);

// Định nghĩa tuyến đường PATCH /:id/edit dùng để chỉnh sửa nội dung văn bản của tin nhắn theo ID tin nhắn (yêu cầu đăng nhập)
router.patch("/:id/edit", authenticate, editMessage);

// Định nghĩa tuyến đường GET /:productId để lấy lịch sử tin nhắn chat liên quan đến một sản phẩm cụ thể (yêu cầu đăng nhập)
router.get("/:productId", authenticate, getMessages);

// Định nghĩa tuyến đường POST / để gửi một tin nhắn chat văn bản/hình ảnh mới (yêu cầu đăng nhập)
router.post("/", authenticate, sendMessage);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
