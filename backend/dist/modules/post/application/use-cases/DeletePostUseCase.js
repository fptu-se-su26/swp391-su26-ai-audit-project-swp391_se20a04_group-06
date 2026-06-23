"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeletePostUseCase = void 0;
// Import ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để báo lỗi khi không tìm thấy hoặc không có quyền xóa
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
/**
 * Use Case xóa bài đăng trên diễn đàn.
 * Kiểm tra quyền hạn: Chỉ Admin hoặc chính tác giả của bài đăng mới có quyền xóa.
 */
class DeletePostUseCase {
    // Hàm khởi tạo nhận vào postRepository theo cơ chế Dependency Injection (DI)
    constructor(postRepository) {
        this.postRepository = postRepository;
    }
    /**
     * Thực thi việc xóa bài đăng.
     */
    async execute(postId, userId, role) {
        // Tìm kiếm thông tin bài viết cần xóa từ Repository theo ID bài viết
        const post = await this.postRepository.findById(postId);
        // Nếu không tồn tại bài viết, ném lỗi NotFoundError
        if (!post) {
            throw new DomainException_1.NotFoundError("Không tìm thấy bài đăng");
        }
        // Kiểm tra quyền hạn: Chỉ tác giả bài đăng hoặc Admin mới có quyền xóa bài đăng này
        if (role !== "Admin" && post.userId !== userId) {
            // Ném lỗi UnauthorizedError báo không có quyền xóa bài đăng này
            throw new DomainException_1.UnauthorizedError("Bạn không có quyền xóa bài đăng này");
        }
        // Thực hiện xóa bài viết khỏi cơ sở dữ liệu
        await this.postRepository.delete(post);
    }
}
exports.DeletePostUseCase = DeletePostUseCase;
