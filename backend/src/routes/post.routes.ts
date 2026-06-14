// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
import { Router } from "express";
// Import các hàm xử lý bài viết diễn đàn từ PostController thuộc module post
import {
  // Lấy danh sách các bài viết
  getPosts,
  // Lấy chi tiết bài viết theo ID
  getPostById,
  // Tạo bài viết mới
  createPost,
  // Bật/tắt lượt thích cho bài viết
  toggleLikePost,
  // Thêm bình luận mới vào bài viết
  addComment,
  // Xóa bài viết
  deletePost,
  // Xóa bình luận
  deleteComment,
} from "../modules/post/presentation/http/PostController";
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
import { authenticate } from "../middlewares/auth";
// Import middleware kiểm tra tính hợp lệ của dữ liệu theo schema (validateSchema)
import { validateSchema } from "../middlewares/validate";
// Import các cấu trúc schema kiểm duyệt bài viết và bình luận từ post.validation
import {
  createPostSchema,
  commentSchema,
} from "../validations/post.validation";

// Khởi tạo đối tượng router từ Express Router
const router = Router();

// Định nghĩa tuyến đường GET / để lấy danh sách bài đăng diễn đàn (công khai không cần đăng nhập)
router.get("/", getPosts);

// Định nghĩa tuyến đường GET /:id để lấy thông tin chi tiết một bài đăng theo ID (công khai không cần đăng nhập)
router.get("/:id", getPostById);

// Định nghĩa tuyến đường POST / để đăng bài viết mới (yêu cầu đăng nhập, validate cấu trúc bài đăng, rồi gọi controller createPost)
router.post("/", authenticate, validateSchema(createPostSchema), createPost);

// Định nghĩa tuyến đường POST /:id/like để bật/tắt trạng thái thích bài đăng theo ID (yêu cầu đăng nhập)
router.post("/:id/like", authenticate, toggleLikePost);

// Định nghĩa tuyến đường POST /:id/comments để đăng bình luận mới dưới bài viết theo ID (yêu cầu đăng nhập, validate nội dung comment, rồi gọi controller addComment)
router.post(
  "/:id/comments",
  authenticate,
  validateSchema(commentSchema),
  addComment,
);

// Định nghĩa tuyến đường DELETE /:id để xóa bài đăng của chính mình theo ID bài viết (yêu cầu đăng nhập)
router.delete("/:id", authenticate, deletePost);

// Định nghĩa tuyến đường DELETE /:postId/comments/:commentId để xóa một bình luận cụ thể theo ID bài viết và ID bình luận (yêu cầu đăng nhập)
router.delete("/:postId/comments/:commentId", authenticate, deleteComment);

// Xuất mặc định router để cấu hình vào app chính app.ts
export default router;
