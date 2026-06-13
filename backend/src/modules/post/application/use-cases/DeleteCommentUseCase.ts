import { IPostRepository } from "../../domain/repositories/IPostRepository";
import { CommentProps } from "../../domain/entities/Post";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case xóa bình luận khỏi bài viết diễn đàn.
 */
export class DeleteCommentUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Thực thi xóa bình luận.
   * @param postId ID bài viết.
   * @param commentId ID bình luận cần xóa.
   * @param userId ID người dùng yêu cầu xóa.
   * @param role Vai trò người dùng yêu cầu xóa.
   */
  async execute(
    postId: string,
    commentId: string,
    userId: string,
    role: string
  ): Promise<CommentProps[]> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài đăng");
    }

    // Nghiệp vụ xóa bình luận (kèm kiểm tra quyền) được xử lý an toàn trong Domain Entity
    post.removeComment(commentId, userId, role);

    // Lưu lại bài đăng sau khi xóa bình luận
    await this.postRepository.save(post);

    return post.comments;
  }
}
