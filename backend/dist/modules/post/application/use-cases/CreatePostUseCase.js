"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreatePostUseCase = void 0;
// Import thực thể Domain Post để khởi tạo đối tượng bài đăng
const Post_1 = require("../../domain/entities/Post");
// Import userRepository để lấy thông tin chi tiết về người dùng đăng bài
const user_repository_1 = require("../../../../repositories/user.repository");
// Import hàm updateUserBadges phục vụ việc tính toán nâng cấp danh hiệu người dùng
const badge_service_1 = require("../../../../services/badge.service");
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy người dùng
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Import đối tượng logger phục vụ ghi nhật ký lỗi hoạt động của hệ thống
const logger_1 = require("../../../../utils/logger");
/**
 * Use Case xử lý đăng bài diễn đàn.
 * Sau khi đăng bài thành công, hệ thống tự động kiểm tra và nâng cấp danh hiệu (badges) của người dùng bất đồng bộ.
 */
class CreatePostUseCase {
    // Hàm khởi tạo nhận vào postRepository theo cơ chế Dependency Injection (DI)
    constructor(postRepository) {
        this.postRepository = postRepository;
    }
    /**
     * Thực thi tạo bài đăng mới.
     */
    async execute(userId, dto) {
        // 1. Tìm thông tin người dùng gửi yêu cầu từ cơ sở dữ liệu
        const user = await user_repository_1.userRepository.findRawById(userId);
        // Nếu không tìm thấy người dùng, ném lỗi NotFoundError
        if (!user) {
            throw new DomainException_1.NotFoundError("Không tìm thấy người dùng");
        }
        // 2. Tạo thực thể bài đăng mới từ thông tin người dùng và DTO
        const post = new Post_1.Post({
            // Gán mã người dùng viết bài
            userId,
            // Gán tên của người dùng viết bài
            userName: user.name,
            // Gán ảnh đại diện của người dùng hoặc null nếu không có
            userAvatar: user.avatar || null,
            // Gán tiêu đề bài đăng
            title: dto.title,
            // Gán nội dung bài đăng
            content: dto.content,
            // Gán mảng ảnh đính kèm (mặc định mảng rỗng nếu thiếu)
            images: dto.images || [],
            // Gán mảng thẻ từ khóa (mặc định mảng rỗng nếu thiếu)
            tags: dto.tags || [],
            // Thiết lập danh sách người thích ban đầu là mảng rỗng
            likes: [],
            // Thiết lập danh sách bình luận ban đầu là mảng rỗng
            comments: [],
            // Thiết lập lượt xem ban đầu là 0
            viewCount: 0,
        });
        // Thực hiện lưu trữ thông tin thực thể bài đăng mới vào cơ sở dữ liệu
        await this.postRepository.save(post);
        // 3. Tự động cập nhật danh hiệu người dùng bất đồng bộ (tránh làm chậm thời gian phản hồi API)
        (0, badge_service_1.updateUserBadges)(userId).catch((err) => {
            // Ghi nhật ký lỗi nếu tiến trình cập nhật danh hiệu gặp sự cố
            logger_1.logger.error(`[Badge Award Error] Lỗi cập nhật danh hiệu cho UserID=${userId}: ${err.message}`);
        });
        // Trả về thực thể bài đăng vừa được tạo thành công
        return post;
    }
}
exports.CreatePostUseCase = CreatePostUseCase;
