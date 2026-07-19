"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToggleLikePostUseCase = void 0;
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy bài đăng
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
const notification_service_1 = require("../../../../services/notification.service");
const user_repository_1 = require("../../../../repositories/user.repository");
/**
 * Use Case thích hoặc bỏ thích bài đăng trên diễn đàn.
 */
class ToggleLikePostUseCase {
    // Hàm khởi tạo nhận vào postRepository theo cơ chế Dependency Injection (DI)
    constructor(postRepository) {
        this.postRepository = postRepository;
    }
    /**
     * Thực thi hành động toggle like.
     */
    async execute(postId, userId) {
        // Tìm kiếm thông tin bài viết theo ID từ Repository
        const post = await this.postRepository.findById(postId);
        // Nếu không tồn tại bài viết, ném lỗi NotFoundError
        if (!post) {
            throw new DomainException_1.NotFoundError("Không tìm thấy bài đăng");
        }
        // Nghiệp vụ thay đổi trạng thái thích thông qua domain entity
        const liked = post.toggleLike(userId);
        // Lưu lại thay đổi vào cơ sở dữ liệu
        await this.postRepository.save(post);
        if (liked) {
            user_repository_1.userRepository.findRawById(userId).then((user) => {
                if (user) {
                    const props = post.toProps();
                    (0, notification_service_1.notifyPostLike)({
                        postId,
                        postTitle: props.title,
                        postAuthorId: props.userId,
                        likerName: user.name,
                        likerId: userId,
                    }).catch((err) => console.error("Failed to notify post like:", err));
                }
            }).catch((err) => console.error("Failed to find liker user details:", err));
        }
        // Trả về trạng thái thích (true/false) và tổng số lượng lượt thích hiện tại của bài viết
        return {
            liked,
            likeCount: post.likes.length,
        };
    }
}
exports.ToggleLikePostUseCase = ToggleLikePostUseCase;
