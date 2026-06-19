"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProfileUseCase = void 0;
// Import các lỗi nghiệp vụ ConflictError (xung đột) và NotFoundError (không tìm thấy)
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
// Import hàm tiện ích xóa ảnh cũ trên đám mây Cloudinary
const upload_1 = require("../../../../middlewares/upload");
// Import hàm trích xuất public ID ảnh từ URL Cloudinary
const cloudinary_1 = require("../../../../utils/cloudinary");
// Import công cụ ghi log lỗi hệ thống
const logger_1 = require("../../../../utils/logger");
// Import repository của bài viết để phục vụ cập nhật đồng bộ
const post_repository_1 = require("../../../../repositories/post.repository");
// Import repository của nhật ký đi biển phục vụ cập nhật đồng bộ
const boatlog_repository_1 = require("../../../../repositories/boatlog.repository");
/**
 * USE CASE: CẬP NHẬT THÔNG TIN HỒ SƠ CÁ NHÂN (UPDATE PROFILE)
 */
class UpdateProfileUseCase {
    // Tiêm (Inject) các dịch vụ phụ thuộc vào hàm khởi tạo
    constructor(userRepository, imageUploader) {
        this.userRepository = userRepository;
        this.imageUploader = imageUploader;
    }
    /**
     * THỰC THI CẬP NHẬT THÔNG TIN HỒ SƠ
     */
    async execute(userId, data) {
        // 1. KIỂM TRA SỰ TỒN TẠI CỦA NGƯỜI DÙNG
        const user = await this.userRepository.findById(userId);
        if (!user)
            throw new DomainException_1.NotFoundError("Không tìm thấy người dùng");
        let newAvatarUrl;
        // 2. XỬ LÝ NẾU CÓ YÊU CẦU THAY ĐỔI EMAIL
        if (data.email !== undefined) {
            const cleanEmail = data.email.toLowerCase().trim();
            // Truy vấn kiểm tra xem email mới đã có tài khoản khác sử dụng chưa
            const existingWithEmail = await this.userRepository.findByEmail(cleanEmail);
            if (existingWithEmail && existingWithEmail.id !== userId) {
                throw new DomainException_1.ConflictError("Email đã được người khác đăng ký");
            }
            // Gọi phương thức nghiệp vụ cập nhật thông tin tên và email trong thực thể domain
            user.updateProfile(data.name, cleanEmail);
            // Quy tắc nghiệp vụ bảo mật: Nếu người dùng thường (không phải Admin) thay đổi email, bắt buộc thu hồi cờ xác minh uy tín (isVerified) để bắt đầu chu kỳ xét duyệt lại
            if (user.role !== "Admin") {
                user.updateVerification(false);
            }
        }
        else {
            // Nếu không đổi email, chỉ thực hiện cập nhật tên hiển thị
            user.updateProfile(data.name);
        }
        // 3. XỬ LÝ NẾU CÓ TẢI LÊN ẢNH ĐẠI DIỆN (AVATAR) MỚI
        if (data.fileBuffer) {
            // Nếu người dùng đã có avatar cũ từ trước
            if (user.avatar) {
                // Trích xuất publicId của ảnh cũ trên Cloudinary để xóa, giảm thiểu rác tài nguyên đám mây
                const oldPublicId = (0, cloudinary_1.extractPublicId)(user.avatar);
                if (oldPublicId) {
                    // Xóa ảnh cũ bất đồng bộ (không chặn tiến trình chính bằng catch bắt lỗi)
                    (0, upload_1.deleteFromCloudinary)(oldPublicId).catch((err) => logger_1.logger.error(`Failed to delete old avatar on Cloudinary: ${err.message}`));
                }
            }
            // Tải lên avatar mới bằng imageUploader và lấy URL trả về
            newAvatarUrl = await this.imageUploader.uploadAvatar(data.fileBuffer);
            // Cập nhật URL avatar mới vào thực thể domain
            user.updateProfile(user.name, user.email, newAvatarUrl);
        }
        // 4. LƯU LẠI THAY ĐỔI VÀO CƠ SỞ DỮ LIỆU
        await this.userRepository.save(user);
        // 5. CẬP NHẬT ĐỒNG BỘ CASCADING (Cập nhật thông tin tên và ảnh đại diện ở các bài đăng, bình luận để hiển thị đồng bộ)
        try {
            const cascadeObj = { userName: user.name };
            if (user.avatar !== null)
                cascadeObj.userAvatar = user.avatar;
            // Cập nhật thông tin tác giả bài viết trong bảng Posts
            await post_repository_1.postRepository.updateMany({ userId }, { $set: cascadeObj });
            // Chuẩn bị cập nhật thông tin bình luận trong các bài viết khác
            const commentUpdate = {};
            commentUpdate["comments.$[elem].userName"] = user.name;
            if (user.avatar !== null)
                commentUpdate["comments.$[elem].userAvatar"] = user.avatar;
            // Sử dụng arrayFilters của Mongoose để chỉ cập nhật các phần tử bình luận có userId khớp với người dùng hiện tại
            await post_repository_1.postRepository.updateMany({ "comments.userId": userId }, { $set: commentUpdate }, { arrayFilters: [{ "elem.userId": userId }] });
            // Cập nhật thông tin tác giả trong các nhật ký hành trình đi biển (Boat Logs)
            await boatlog_repository_1.boatLogRepository.updateMany({ userId }, { $set: cascadeObj });
        }
        catch (err) {
            // Log lỗi đồng bộ nhưng không quăng ra ngoài để tránh làm hỏng yêu cầu cập nhật hồ sơ chính
            logger_1.logger.error(`Failed to cascade update profile details for UserId=${userId}: ${err.message}`);
        }
        // Trả về dữ liệu hồ sơ mới cập nhật cho Client
        return {
            name: user.name,
            email: user.email,
            avatarUrl: user.avatar,
        };
    }
}
exports.UpdateProfileUseCase = UpdateProfileUseCase;
