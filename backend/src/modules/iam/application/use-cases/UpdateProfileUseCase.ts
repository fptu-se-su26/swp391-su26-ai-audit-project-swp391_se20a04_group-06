// Import giao diện IUserRepository định nghĩa phương thức tương tác DB của thực thể User
import { IUserRepository } from "../../domain/repositories/IUserRepository";
// Import các lỗi nghiệp vụ ConflictError (xung đột) và NotFoundError (không tìm thấy)
import { ConflictError, NotFoundError } from "../../../../shared/domain/exceptions/DomainException";
// Import hàm tiện ích xóa ảnh cũ trên đám mây Cloudinary
import { deleteFromCloudinary } from "../../../../middlewares/upload";
// Import hàm trích xuất public ID ảnh từ URL Cloudinary
import { extractPublicId } from "../../../../utils/cloudinary";
// Import công cụ ghi log lỗi hệ thống
import { logger } from "../../../../utils/logger";
// Import repository của bài viết để phục vụ cập nhật đồng bộ
import { postRepository } from "../../../../repositories/post.repository";
// Import repository của nhật ký đi biển phục vụ cập nhật đồng bộ
import { boatLogRepository } from "../../../../repositories/boatlog.repository";
// Import repository của công thức nấu ăn phục vụ cập nhật đồng bộ
import { recipeRepository } from "../../../../repositories/recipe.repository";

// Định nghĩa giao diện cho bộ tải ảnh lên (Image Uploader Interface) dành cho avatar người dùng
export interface IImageUploader {
  uploadAvatar(buffer: Buffer): Promise<string>;
}

/**
 * USE CASE: CẬP NHẬT THÔNG TIN HỒ SƠ CÁ NHÂN (UPDATE PROFILE)
 */
export class UpdateProfileUseCase {
  // Tiêm (Inject) các dịch vụ phụ thuộc vào hàm khởi tạo
  constructor(
    private userRepository: IUserRepository,
    private imageUploader: IImageUploader
  ) {}

  /**
   * THỰC THI CẬP NHẬT THÔNG TIN HỒ SƠ
   */
  async execute(
    userId: string,
    data: { name: string; email?: string; fileBuffer?: Buffer }
  ) {
    // 1. KIỂM TRA SỰ TỒN TẠI CỦA NGƯỜI DÙNG
    const user = await this.userRepository.findById(userId);
    if (!user) throw new NotFoundError("Không tìm thấy người dùng");

    let newAvatarUrl: string | undefined;

    // 2. XỬ LÝ NẾU CÓ YÊU CẦU THAY ĐỔI EMAIL
    if (data.email !== undefined) {
      const cleanEmail = data.email.toLowerCase().trim();
      // Truy vấn kiểm tra xem email mới đã có tài khoản khác sử dụng chưa
      const existingWithEmail = await this.userRepository.findByEmail(cleanEmail);
      if (existingWithEmail && existingWithEmail.id !== userId) {
        throw new ConflictError("Email đã được người khác đăng ký");
      }
      
      // Gọi phương thức nghiệp vụ cập nhật thông tin tên và email trong thực thể domain
      user.updateProfile(data.name, cleanEmail);

      // Quy tắc nghiệp vụ bảo mật: Nếu người dùng thường (không phải Admin) thay đổi email, bắt buộc thu hồi cờ xác minh uy tín (isVerified) để bắt đầu chu kỳ xét duyệt lại
      if (user.role !== "Admin") {
        user.updateVerification(false);
      }
    } else {
      // Nếu không đổi email, chỉ thực hiện cập nhật tên hiển thị
      user.updateProfile(data.name);
    }

    // 3. XỬ LÝ NẾU CÓ TẢI LÊN ẢNH ĐẠI DIỆN (AVATAR) MỚI
    const oldAvatar = user.avatar;
    if (data.fileBuffer) {
      // Tải lên avatar mới bằng imageUploader và lấy URL trả về
      newAvatarUrl = await this.imageUploader.uploadAvatar(data.fileBuffer);
      // Cập nhật URL avatar mới vào thực thể domain
      user.updateProfile(user.name, user.email, newAvatarUrl);
    }

    // 4. LƯU LẠI THAY ĐỔI VÀO CƠ SỞ DỮ LIỆU
    await this.userRepository.save(user);

    // 4b. XÓA ẢNH ĐẠI DIỆN CŨ TRÊN CLOUDINARY (Chỉ thực hiện sau khi DB đã cập nhật thành công ảnh mới)
    if (data.fileBuffer && oldAvatar) {
      const oldPublicId = extractPublicId(oldAvatar);
      if (oldPublicId) {
        // Xóa ảnh cũ bất đồng bộ (không chặn tiến trình chính bằng catch bắt lỗi)
        deleteFromCloudinary(oldPublicId).catch((err) =>
          logger.error(`Failed to delete old avatar on Cloudinary: ${err.message}`)
        );
      }
    }

    // 5. CẬP NHẬT ĐỒNG BỘ CASCADING (Cập nhật thông tin tên và ảnh đại diện ở các bài đăng, bình luận để hiển thị đồng bộ)
    try {
      const cascadeObj: any = { userName: user.name };
      if (user.avatar !== null) {
        cascadeObj.userAvatar = user.avatar;
      } else {
        cascadeObj.userAvatar = null;
      }

      // Cập nhật thông tin tác giả bài viết trong bảng Posts
      await postRepository.updateMany({ userId } as any, { $set: cascadeObj });

      // Chuẩn bị cập nhật thông tin bình luận trong các bài viết khác
      const commentUpdate: any = {};
      commentUpdate["comments.$[elem].userName"] = user.name;
      commentUpdate["comments.$[elem].userAvatar"] = user.avatar; // Gán giá trị mới (kể cả null) để đồng nhất

      // Sử dụng arrayFilters của Mongoose để chỉ cập nhật các phần tử bình luận có userId khớp với người dùng hiện tại
      await postRepository.updateMany(
        { "comments.userId": userId } as any,
        { $set: commentUpdate },
        { arrayFilters: [{ "elem.userId": userId }] } as any
      );

      // Cập nhật thông tin tác giả trong các nhật ký hành trình đi biển (Boat Logs)
      await boatLogRepository.updateMany({ userId } as any, { $set: cascadeObj });

      // Cập nhật thông tin bình luận trong các công thức nấu ăn (Recipes)
      await recipeRepository.updateMany(
        { "comments.userId": userId } as any,
        { $set: commentUpdate },
        { arrayFilters: [{ "elem.userId": userId }] } as any
      );
    } catch (err: any) {
      // Log lỗi đồng bộ nhưng không quăng ra ngoài để tránh làm hỏng yêu cầu cập nhật hồ sơ chính
      logger.error(`Failed to cascade update profile details for UserId=${userId}: ${err.message}`);
    }

    // Trả về dữ liệu hồ sơ mới cập nhật cho Client
    return {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatar,
    };
  }
}

