// Import interface IPostRepository để tương tác với dữ liệu bài viết ở tầng Domain
import { IPostRepository } from "../../domain/repositories/IPostRepository";
// Import thực thể Domain Post để khởi tạo đối tượng bài đăng
import { Post } from "../../domain/entities/Post";
// Import userRepository để lấy thông tin chi tiết về người dùng đăng bài
import { userRepository } from "../../../../repositories/user.repository";
// Import hàm updateUserBadges phục vụ việc tính toán nâng cấp danh hiệu người dùng
import { updateUserBadges } from "../../../../services/badge.service";
// Import các ngoại lệ nghiệp vụ NotFoundError và ValidationError để báo lỗi khi không tìm thấy hoặc dữ liệu sai lệch
import { NotFoundError, ValidationError } from "../../../../shared/domain/exceptions/DomainException";
// Import đối tượng logger phục vụ ghi nhật ký lỗi hoạt động của hệ thống
import { logger } from "../../../../utils/logger";

/**
 * Request DTO cho việc tạo bài đăng mới trên diễn đàn.
 */
export interface CreatePostRequestDTO {
  // Tiêu đề của bài đăng
  title: string;
  // Nội dung chi tiết của bài đăng
  content: string;
  // Mảng chứa danh sách link hình ảnh đính kèm (tùy chọn)
  images?: string[];
  // Mảng chứa các thẻ từ khóa phân loại bài đăng (tùy chọn)
  tags?: string[];
}

/**
 * Use Case xử lý đăng bài diễn đàn.
 * Sau khi đăng bài thành công, hệ thống tự động kiểm tra và nâng cấp danh hiệu (badges) của người dùng bất đồng bộ.
 */
export class CreatePostUseCase {
  // Hàm khởi tạo nhận vào postRepository theo cơ chế Dependency Injection (DI)
  constructor(private postRepository: IPostRepository) {}

  /**
   * Thực thi tạo bài đăng mới.
   */
  async execute(userId: string, dto: CreatePostRequestDTO): Promise<Post> {
    // 1. Tìm thông tin người dùng gửi yêu cầu từ cơ sở dữ liệu
    const user = await userRepository.findRawById(userId);
    // Nếu không tìm thấy người dùng, ném lỗi NotFoundError
    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng");
    }

    // Xác thực các ràng buộc về tiêu đề, nội dung, hình ảnh và tags
    if (dto.title.length > 150) {
      throw new ValidationError("Tiêu đề bài viết không được vượt quá 150 ký tự.");
    }
    if (dto.content.length > 10000) {
      throw new ValidationError("Nội dung bài viết không được vượt quá 10000 ký tự.");
    }
    if (dto.images && dto.images.length > 10) {
      throw new ValidationError("Chỉ được đăng tối đa 10 hình ảnh.");
    }
    if (dto.tags) {
      if (dto.tags.length > 10) {
        throw new ValidationError("Số lượng tags tối đa là 10.");
      }
      for (const tag of dto.tags) {
        if (tag.length > 30) {
          throw new ValidationError("Mỗi tag tối đa 30 ký tự.");
        }
      }
    }

    // 2. Tạo thực thể bài đăng mới từ thông tin người dùng và DTO
    const post = new Post({
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
    updateUserBadges(userId).catch((err) => {
      // Ghi nhật ký lỗi nếu tiến trình cập nhật danh hiệu gặp sự cố
      logger.error(`[Badge Award Error] Lỗi cập nhật danh hiệu cho UserID=${userId}: ${err.message}`);
    });

    // Trả về thực thể bài đăng vừa được tạo thành công
    return post;
  }
}

