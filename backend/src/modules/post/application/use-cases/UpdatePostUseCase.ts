import { IPostRepository } from "../../domain/repositories/IPostRepository";
import { Post } from "../../domain/entities/Post";
import { deleteFromCloudinary } from "../../../../middlewares/upload";
import { extractPublicId } from "../../../../utils/cloudinary";
import { logger } from "../../../../utils/logger";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "../../../../shared/domain/exceptions/DomainException";

export interface UpdatePostRequestDTO {
  title?: string;
  content?: string;
  images?: string[];
  tags?: string[];
}

export class UpdatePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  async execute(
    postId: string,
    userId: string,
    role: string,
    dto: UpdatePostRequestDTO,
  ): Promise<Post> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài đăng");
    }

    if (role !== "Admin" && post.userId !== userId) {
      throw new UnauthorizedError("Bạn không có quyền chỉnh sửa bài đăng này");
    }

    if (dto.title !== undefined) {
      if (dto.title.trim().length === 0) {
        throw new ValidationError("Tiêu đề bài viết không được trống.");
      }
      if (dto.title.length > 150) {
        throw new ValidationError("Tiêu đề bài viết không được vượt quá 150 ký tự.");
      }
    }

    if (dto.content !== undefined) {
      if (dto.content.trim().length === 0) {
        throw new ValidationError("Nội dung bài viết không được trống.");
      }
      if (dto.content.length > 10000) {
        throw new ValidationError("Nội dung bài viết không được vượt quá 10000 ký tự.");
      }
    }

    if (dto.images !== undefined) {
      if (dto.images.length > 10) {
        throw new ValidationError("Chỉ được đăng tối đa 10 hình ảnh.");
      }
    }

    if (dto.tags !== undefined) {
      if (dto.tags.length > 10) {
        throw new ValidationError("Số lượng tags tối đa là 10.");
      }
      for (const tag of dto.tags) {
        if (tag.length > 30) {
          throw new ValidationError("Mỗi tag tối đa 30 ký tự.");
        }
      }
    }

    const oldImages = post.images || [];
    const nextImages = dto.images;
    
    post.update(dto.title, dto.content, dto.images, dto.tags);
    await this.postRepository.save(post);

    if (nextImages !== undefined) {
      const removedImages = oldImages.filter((url) => !nextImages.includes(url));
      if (removedImages.length > 0) {
        await Promise.all(
          removedImages.map(async (url) => {
            const publicId = extractPublicId(url);
            if (publicId) {
              await deleteFromCloudinary(publicId).catch((err) => {
                logger.error(`[Cloudinary Clean] Lỗi xóa ảnh cũ bài đăng ${publicId}: ${err.message}`);
              });
            }
          })
        );
      }
    }

    return post;
  }
}
