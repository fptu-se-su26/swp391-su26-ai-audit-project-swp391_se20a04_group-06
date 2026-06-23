"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteCommentUseCase = void 0;
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy bài viết
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
/**
 * Use Case xóa bình luận khỏi bài viết diễn đàn.
 */
class DeleteCommentUseCase {
    // Hàm khởi tạo nhận vào postRepository theo cơ chế Dependency Injection (DI)
    constructor(postRepository) {
        this.postRepository = postRepository;
    }
    /**
     * Thực thi xóa bình luận.
     * @param postId ID bài viết.
     * @param commentId ID bình luận cần xóa.
     * @param userId ID người dùng yêu cầu xóa.
     * @param role Vai trò người dùng yêu cầu xóa.
     */
    async execute(postId, commentId, userId, role) {
        // Tìm kiếm thông tin bài viết theo ID từ Repository
        const post = await this.postRepository.findById(postId);
        // Nếu không tồn tại bài viết, ném lỗi NotFoundError
        if (!post) {
            throw new DomainException_1.NotFoundError("Không tìm thấy bài đăng");
        }
        // Nghiệp vụ xóa bình luận (kèm kiểm tra quyền) được xử lý an toàn trong Domain Entity bằng cách gọi removeComment
        post.removeComment(commentId, userId, role);
        // Lưu lại trạng thái bài đăng sau khi đã xóa bình luận vào cơ sở dữ liệu
        await this.postRepository.save(post);
        // Trả về danh sách tất cả các bình luận của bài đăng sau khi đã cập nhật
        return post.comments;
    }
}
exports.DeleteCommentUseCase = DeleteCommentUseCase;
