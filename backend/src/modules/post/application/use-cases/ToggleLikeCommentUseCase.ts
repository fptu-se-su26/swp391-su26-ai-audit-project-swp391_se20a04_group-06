import { IPostRepository } from "../../domain/repositories/IPostRepository";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";
import { CommentProps } from "../../domain/entities/Post";

/**
 * Use Case thích hoặc bỏ thích bình luận trên bài đăng diễn đàn.
 */
export class ToggleLikeCommentUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Thực thi toggle like bình luận.
   */
  async execute(postId: string, commentId: string, userId: string): Promise<CommentProps[]> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài đăng");
    }

    post.toggleCommentLike(commentId, userId);

    await this.postRepository.save(post);

    return post.comments;
  }
}
