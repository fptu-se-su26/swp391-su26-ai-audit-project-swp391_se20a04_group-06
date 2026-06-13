import { IPostRepository } from "../../domain/repositories/IPostRepository";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case thích hoặc bỏ thích bài đăng trên diễn đàn.
 */
export class ToggleLikePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Thực thi hành động toggle like.
   */
  async execute(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài đăng");
    }

    // Nghiệp vụ thay đổi trạng thái thích thông qua domain entity
    const liked = post.toggleLike(userId);

    // Lưu lại thay đổi
    await this.postRepository.save(post);

    return {
      liked,
      likeCount: post.likes.length,
    };
  }
}
