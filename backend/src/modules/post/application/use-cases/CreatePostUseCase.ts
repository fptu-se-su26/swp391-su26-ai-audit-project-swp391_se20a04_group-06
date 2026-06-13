import { IPostRepository } from "../../domain/repositories/IPostRepository";
import { Post } from "../../domain/entities/Post";
import { userRepository } from "../../../../repositories/user.repository";
import { updateUserBadges } from "../../../../services/badge.service";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";
import { logger } from "../../../../utils/logger";

/**
 * Request DTO cho việc tạo bài đăng mới trên diễn đàn.
 */
export interface CreatePostRequestDTO {
  title: string;
  content: string;
  images?: string[];
  tags?: string[];
}

/**
 * Use Case xử lý đăng bài diễn đàn.
 * Sau khi đăng bài thành công, hệ thống tự động kiểm tra và nâng cấp danh hiệu (badges) của người dùng bất đồng bộ.
 */
export class CreatePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Thực thi tạo bài đăng mới.
   */
  async execute(userId: string, dto: CreatePostRequestDTO): Promise<Post> {
    // 1. Tìm thông tin người dùng gửi yêu cầu
    const user = await userRepository.findRawById(userId);
    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng");
    }

    // 2. Tạo thực thể bài đăng và lưu trữ
    const post = new Post({
      userId,
      userName: user.name,
      userAvatar: user.avatar || null,
      title: dto.title,
      content: dto.content,
      images: dto.images || [],
      tags: dto.tags || [],
      likes: [],
      comments: [],
      viewCount: 0,
    });

    await this.postRepository.save(post);

    // 3. Tự động cập nhật danh hiệu người dùng bất đồng bộ (tránh làm chậm thời gian phản hồi API)
    updateUserBadges(userId).catch((err) => {
      logger.error(`[Badge Award Error] Lỗi cập nhật danh hiệu cho UserID=${userId}: ${err.message}`);
    });

    return post;
  }
}
