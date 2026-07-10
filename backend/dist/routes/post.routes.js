"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Import đối tượng Router từ thư viện express để định nghĩa các tuyến đường HTTP
const express_1 = require("express");
// Import các hàm xử lý bài viết diễn đàn từ PostController thuộc module post
const PostController_1 = require("../modules/post/presentation/http/PostController");
// Import middleware xác thực người dùng đã đăng nhập (authenticate)
const auth_1 = require("../middlewares/auth");
// Import middleware kiểm tra tính hợp lệ của dữ liệu theo schema (validateSchema)
const validate_1 = require("../middlewares/validate");
// Import các cấu trúc schema kiểm duyệt bài viết và bình luận từ post.validation
const post_validation_1 = require("../validations/post.validation");
// Khởi tạo đối tượng router từ Express Router
const router = (0, express_1.Router)();
/**
 * @openapi
 * /api/posts:
 *   get:
 *     summary: Lấy danh sách bài đăng diễn đàn (công khai không cần đăng nhập)
 *     tags: [Posts]
 *     responses:
 *       200:
 *         description: Lấy danh sách bài đăng thành công
 */
// Định nghĩa tuyến đường GET / để lấy danh sách bài đăng diễn đàn (công khai không cần đăng nhập)
router.get("/", PostController_1.getPosts);
/**
 * @openapi
 * /api/posts/{id}:
 *   get:
 *     summary: Lấy thông tin chi tiết một bài đăng theo ID (công khai không cần đăng nhập)
 *     tags: [Posts]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài đăng diễn đàn
 *     responses:
 *       200:
 *         description: Lấy chi tiết bài đăng thành công
 *       404:
 *         description: Không tìm thấy bài đăng
 */
// Định nghĩa tuyến đường GET /:id để lấy thông tin chi tiết một bài đăng theo ID (công khai không cần đăng nhập)
router.get("/:id", PostController_1.getPostById);
/**
 * @openapi
 * /api/posts:
 *   post:
 *     summary: Đăng bài viết mới lên diễn đàn (yêu cầu đăng nhập)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *                 description: Tiêu đề bài đăng
 *                 example: Chia sẻ kinh nghiệm câu mực đêm Phú Quốc
 *               content:
 *                 type: string
 *                 description: Nội dung chi tiết của bài đăng
 *                 example: Mùa này biển lặng, câu mực rất thích hợp...
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Mảng chứa các URL hình ảnh bài viết
 *                 example: ["https://res.cloudinary.com/demo/image/upload/v1/pic1.jpg"]
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Mảng các nhãn thẻ phân loại bài viết
 *                 example: ["Câu mực", "Phú Quốc", "Kinh nghiệm"]
 *     responses:
 *       201:
 *         description: Đăng bài viết thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 */
// Định nghĩa tuyến đường POST / để đăng bài viết mới (yêu cầu đăng nhập, validate cấu trúc bài đăng, rồi gọi controller createPost)
router.post("/", auth_1.authenticate, (0, validate_1.validateSchema)(post_validation_1.createPostSchema), PostController_1.createPost);
/**
 * @openapi
 * /api/posts/{id}/like:
 *   post:
 *     summary: Bật/tắt trạng thái thích bài đăng theo ID (yêu cầu đăng nhập)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài đăng diễn đàn
 *     responses:
 *       200:
 *         description: Thay đổi trạng thái thích bài viết thành công
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy bài đăng
 */
// Định nghĩa tuyến đường POST /:id/like để bật/tắt trạng thái thích bài đăng theo ID (yêu cầu đăng nhập)
router.post("/:id/like", auth_1.authenticate, PostController_1.toggleLikePost);
/**
 * @openapi
 * /api/posts/{id}/comments:
 *   post:
 *     summary: Đăng bình luận mới dưới bài viết theo ID (yêu cầu đăng nhập)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài đăng diễn đàn
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [text]
 *             properties:
 *               text:
 *                 type: string
 *                 description: Nội dung bình luận (tối đa 1000 ký tự)
 *                 example: Bài viết rất hữu ích, cảm ơn bạn đã chia sẻ!
 *     responses:
 *       201:
 *         description: Đăng bình luận thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa đăng nhập
 *       404:
 *         description: Không tìm thấy bài đăng
 */
// Định nghĩa tuyến đường POST /:id/comments để đăng bình luận mới dưới bài viết theo ID (yêu cầu đăng nhập, validate nội dung comment, rồi gọi controller addComment)
router.post("/:id/comments", auth_1.authenticate, (0, validate_1.validateSchema)(post_validation_1.commentSchema), PostController_1.addComment);
/**
 * @openapi
 * /api/posts/{id}:
 *   delete:
 *     summary: Xóa bài đăng của chính mình theo ID bài viết (yêu cầu đăng nhập)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài viết cần xóa
 *     responses:
 *       200:
 *         description: Xóa bài đăng thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền xóa bài đăng của người khác
 *       404:
 *         description: Không tìm thấy bài đăng
 */
// Định nghĩa tuyến đường PUT /:id để chỉnh sửa bài viết của chính mình theo ID bài viết (yêu cầu đăng nhập, validate dữ liệu cập nhật, rồi gọi controller updatePost)
router.put("/:id", auth_1.authenticate, (0, validate_1.validateSchema)(post_validation_1.updatePostSchema), PostController_1.updatePost);
// Định nghĩa tuyến đường DELETE /:id để xóa bài đăng của chính mình theo ID bài viết (yêu cầu đăng nhập)
router.delete("/:id", auth_1.authenticate, PostController_1.deletePost);
/**
 * @openapi
 * /api/posts/{postId}/comments/{commentId}:
 *   delete:
 *     summary: Xóa một bình luận cụ thể theo ID bài viết và ID bình luận (yêu cầu đăng nhập)
 *     tags: [Posts]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bài đăng diễn đàn chứa bình luận
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID bình luận cần xóa
 *     responses:
 *       200:
 *         description: Xóa bình luận thành công
 *       401:
 *         description: Chưa đăng nhập
 *       403:
 *         description: Không có quyền xóa bình luận của người khác
 *       404:
 *         description: Không tìm thấy bài đăng hoặc bình luận
 */
// Định nghĩa tuyến đường DELETE /:postId/comments/:commentId để xóa một bình luận cụ thể theo ID bài viết và ID bình luận (yêu cầu đăng nhập)
router.delete("/:postId/comments/:commentId", auth_1.authenticate, PostController_1.deleteComment);
// Định nghĩa tuyến đường POST /:id/comments/:commentId/like để thích hoặc bỏ thích một bình luận cụ thể (yêu cầu đăng nhập)
router.post("/:id/comments/:commentId/like", auth_1.authenticate, PostController_1.toggleLikeComment);
// Xuất mặc định router để cấu hình vào app chính app.ts
exports.default = router;
