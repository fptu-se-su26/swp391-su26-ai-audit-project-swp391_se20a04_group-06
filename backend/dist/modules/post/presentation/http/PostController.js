"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPosts = getPosts;
exports.getPostById = getPostById;
exports.createPost = createPost;
exports.toggleLikePost = toggleLikePost;
exports.addComment = addComment;
exports.deletePost = deletePost;
exports.deleteComment = deleteComment;
// Import hàm parseId từ helper để định dạng và xác thực mã định danh truyền lên
const response_helper_1 = require("../../../../helpers/response.helper");
// Import đối tượng postService quản lý các tác vụ truy vấn đọc dữ liệu bài viết
const post_service_1 = require("../../../../services/post.service");
// DDD Components
// Import lớp MongoosePostRepository để tương tác trực tiếp với cơ sở dữ liệu MongoDB
const MongoosePostRepository_1 = require("../../infrastructure/persistence/mongoose/MongoosePostRepository");
// Import lớp CreatePostUseCase để thực hiện nghiệp vụ tạo mới bài đăng
const CreatePostUseCase_1 = require("../../application/use-cases/CreatePostUseCase");
// Import lớp DeletePostUseCase để thực hiện nghiệp vụ xóa bài đăng
const DeletePostUseCase_1 = require("../../application/use-cases/DeletePostUseCase");
// Import lớp ToggleLikePostUseCase để thực hiện nghiệp vụ thích hoặc bỏ thích bài đăng
const ToggleLikePostUseCase_1 = require("../../application/use-cases/ToggleLikePostUseCase");
// Import lớp AddCommentUseCase để thực hiện nghiệp vụ thêm bình luận
const AddCommentUseCase_1 = require("../../application/use-cases/AddCommentUseCase");
// Import lớp DeleteCommentUseCase để thực hiện nghiệp vụ xóa bình luận
const DeleteCommentUseCase_1 = require("../../application/use-cases/DeleteCommentUseCase");
// Khởi tạo đối tượng Repository dùng chung cho các Use Cases
const postRepository = new MongoosePostRepository_1.MongoosePostRepository();
// Khởi tạo Use Case tạo mới bài viết, tiêm Repository vào qua Constructor
const createPostUseCase = new CreatePostUseCase_1.CreatePostUseCase(postRepository);
// Khởi tạo Use Case xóa bài viết, tiêm Repository vào qua Constructor
const deletePostUseCase = new DeletePostUseCase_1.DeletePostUseCase(postRepository);
// Khởi tạo Use Case thích/bỏ thích bài viết, tiêm Repository vào qua Constructor
const toggleLikePostUseCase = new ToggleLikePostUseCase_1.ToggleLikePostUseCase(postRepository);
// Khởi tạo Use Case thêm bình luận, tiêm Repository vào qua Constructor
const addCommentUseCase = new AddCommentUseCase_1.AddCommentUseCase(postRepository);
// Khởi tạo Use Case xóa bình luận, tiêm Repository vào qua Constructor
const deleteCommentUseCase = new DeleteCommentUseCase_1.DeleteCommentUseCase(postRepository);
// ── QUERIES (Read-Side CQRS) ──────────────────────────────────────────────
/**
 * Lấy danh sách các bài đăng (hỗ trợ phân trang, tìm kiếm, lọc theo userId).
 */
async function getPosts(req, res, next) {
    try {
        // Gọi postService thực hiện tìm kiếm và lọc danh sách bài viết theo query string
        const result = await post_service_1.postService.list(req.query);
        // Trả về kết quả JSON cho Client
        return res.json(result);
    }
    catch (err) {
        // Chuyển tiếp lỗi phát sinh
        next(err);
    }
}
/**
 * Lấy chi tiết một bài đăng theo ID (và tự động tăng view count).
 */
async function getPostById(req, res, next) {
    // Trích xuất và định dạng ID bài viết từ URL params
    const id = (0, response_helper_1.parseId)(req.params.id);
    // Nếu ID bài đăng không hợp lệ, trả về mã trạng thái 400 kèm thông điệp báo lỗi
    if (!id)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        // Gọi postService lấy thông tin chi tiết bài đăng và tự động tăng lượt xem
        const post = await post_service_1.postService.getById(id);
        // Trả về dữ liệu bài viết dạng JSON
        return res.json(post);
    }
    catch (err) {
        // Chuyển tiếp lỗi phát sinh
        next(err);
    }
}
// ── COMMANDS (Write-Side CQRS) ────────────────────────────────────────────
/**
 * Đăng bài viết mới trên diễn đàn.
 */
async function createPost(req, res, next) {
    // Trích xuất mã ID người dùng đăng bài từ token đã xác thực
    const { userId } = req.user;
    try {
        // Thực thi Use Case tạo bài đăng mới với ID người đăng và dữ liệu gửi lên
        const post = await createPostUseCase.execute(userId, req.body);
        // Phản hồi mã trạng thái 201 (Created) kèm thông báo thành công và thuộc tính bài viết dạng thuần
        return res.status(201).json({
            message: "Đăng bài thành công",
            post: post.toProps(),
        });
    }
    catch (err) {
        // Chuyển tiếp lỗi phát sinh
        next(err);
    }
}
/**
 * Thích hoặc bỏ thích một bài đăng.
 */
async function toggleLikePost(req, res, next) {
    // Trích xuất và định dạng ID bài đăng từ URL params
    const id = (0, response_helper_1.parseId)(req.params.id);
    // Trích xuất ID người dùng thích bài viết từ token
    const { userId } = req.user;
    // Nếu ID bài đăng không hợp lệ, phản hồi lỗi 400
    if (!id)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        // Thực thi Use Case thích/bỏ thích bài viết
        const result = await toggleLikePostUseCase.execute(id, userId);
        // Trả về kết quả JSON (trạng thái liked và số lượt thích hiện tại)
        return res.json(result);
    }
    catch (err) {
        // Chuyển tiếp lỗi phát sinh
        next(err);
    }
}
/**
 * Thêm bình luận vào bài viết.
 */
async function addComment(req, res, next) {
    // Trích xuất và định dạng ID bài đăng từ URL params
    const id = (0, response_helper_1.parseId)(req.params.id);
    // Trích xuất ID người bình luận từ token
    const { userId } = req.user;
    // Lấy nội dung bình luận từ body của request
    const { text } = req.body;
    // Nếu ID bài đăng không hợp lệ, phản hồi lỗi 400
    if (!id)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        // Thực thi Use Case thêm bình luận
        const comments = await addCommentUseCase.execute(id, userId, text);
        // Trả về thông báo thành công kèm danh sách bình luận mới cập nhật
        return res.json({
            message: "Bình luận thành công",
            comments,
        });
    }
    catch (err) {
        // Chuyển tiếp lỗi phát sinh
        next(err);
    }
}
/**
 * Xóa một bài đăng.
 */
async function deletePost(req, res, next) {
    // Trích xuất và định dạng ID bài viết cần xóa từ URL params
    const id = (0, response_helper_1.parseId)(req.params.id);
    // Trích xuất ID người dùng và vai trò yêu cầu xóa từ token
    const { userId, role } = req.user;
    // Nếu ID không hợp lệ, phản hồi lỗi 400
    if (!id)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        // Thực thi Use Case xóa bài viết
        await deletePostUseCase.execute(id, userId, role);
        // Trả về thông điệp phản hồi xóa thành công
        return res.json({ message: "Xóa bài đăng thành công" });
    }
    catch (err) {
        // Chuyển tiếp lỗi phát sinh
        next(err);
    }
}
/**
 * Xóa bình luận khỏi bài viết.
 */
async function deleteComment(req, res, next) {
    // Trích xuất mã ID bài viết và ID bình luận cần xóa từ tham số truyền trên URL
    const { postId, commentId } = req.params;
    // Trích xuất ID người dùng và vai trò yêu cầu xóa từ token
    const { userId, role } = req.user;
    // Định dạng lại ID bài viết
    const parsedPostId = (0, response_helper_1.parseId)(postId);
    // Nếu ID bài viết không hợp lệ, trả về lỗi 400
    if (!parsedPostId)
        return res.status(400).json({ message: "ID bài đăng không hợp lệ" });
    try {
        // Thực thi Use Case xóa bình luận tương ứng
        const comments = await deleteCommentUseCase.execute(parsedPostId, commentId, userId, role);
        // Trả về phản hồi thành công kèm danh sách bình luận đã cập nhật mới
        return res.json({
            message: "Xóa bình luận thành công",
            comments,
        });
    }
    catch (err) {
        // Chuyển tiếp lỗi phát sinh
        next(err);
    }
}
