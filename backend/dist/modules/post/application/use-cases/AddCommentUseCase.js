"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AddCommentUseCase = void 0;
// Import userRepository để truy vấn thông tin chi tiết của người dùng bình luận
const user_repository_1 = require("../../../../repositories/user.repository");
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy bài đăng hoặc người dùng
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
const notification_service_1 = require("../../../../services/notification.service");
/**
 * Use Case thêm bình luận mới vào bài viết diễn đàn.
 */
class AddCommentUseCase {
    // Hàm khởi tạo nhận vào postRepository theo cơ chế Dependency Injection (DI)
    constructor(postRepository) {
        this.postRepository = postRepository;
    }
    /**
     * Thực thi thêm bình luận.
     * @param postId ID bài viết.
     * @param userId ID người bình luận.
     * @param text Nội dung bình luận.
     * @returns Danh sách bình luận hiện tại sau khi đã thêm mới (kèm ID).
     */
    async execute(postId, userId, text, parentId) {
        // 1. Tìm kiếm bài đăng cần bình luận từ Repository
        const post = await this.postRepository.findById(postId);
        // Nếu không tồn tại bài viết, ném lỗi NotFoundError
        if (!post) {
            throw new DomainException_1.NotFoundError("Không tìm thấy bài đăng");
        }
        // 2. Tìm kiếm thông tin người bình luận để lấy tên & ảnh đại diện
        const user = await user_repository_1.userRepository.findRawById(userId);
        // Nếu không tìm thấy người dùng, ném lỗi NotFoundError
        if (!user) {
            throw new DomainException_1.NotFoundError("Không tìm thấy người dùng");
        }
        // 3. Thực thi nghiệp vụ qua domain entity bằng cách gọi phương thức addComment
        post.addComment(userId, user.name, user.avatar || null, text, parentId);
        // 4. Lưu lại bài viết đã cập nhật danh sách bình luận mới vào cơ sở dữ liệu
        await this.postRepository.save(post);
        const props = post.toProps();
        const postAuthorId = props.userId;
        if (String(userId) !== String(postAuthorId)) {
            (0, notification_service_1.notifyPostComment)({
                postId,
                postTitle: props.title,
                postAuthorId,
                commenterName: user.name,
                commenterId: userId,
                commentText: text,
            }).catch((err) => console.error("Failed to notify post comment:", err));
        }
        if (parentId) {
            const parentComment = props.comments.find(c => String(c.id) === String(parentId));
            if (parentComment) {
                const parentCommentAuthorId = parentComment.userId;
                if (String(userId) !== String(parentCommentAuthorId) &&
                    String(parentCommentAuthorId) !== String(postAuthorId)) {
                    (0, notification_service_1.notifyCommentReply)({
                        postId,
                        parentCommentAuthorId,
                        replierName: user.name,
                        replierId: userId,
                        replyText: text,
                    }).catch((err) => console.error("Failed to notify comment reply:", err));
                }
            }
        }
        // Trả về danh sách tất cả các bình luận của bài viết sau khi đã cập nhật
        return post.comments;
    }
}
exports.AddCommentUseCase = AddCommentUseCase;
