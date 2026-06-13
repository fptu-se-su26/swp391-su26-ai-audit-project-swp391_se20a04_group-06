import { IPostRepository } from "../../domain/repositories/IPostRepository";
import { CommentProps } from "../../domain/entities/Post";
import { userRepository } from "../../../../repositories/user.repository";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case thêm bình luận mới vào bài viết diễn đàn.
 */
export class AddCommentUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Thực thi thêm bình luận.
   * @param postId ID bài viết.
   * @param userId ID người bình luận.
   * @param text Nội dung bình luận.
   * @returns Danh sách bình luận hiện tại sau khi đã thêm mới (kèm ID).
   */
  async execute(postId: string, userId: string, text: string): Promise<CommentProps[]> {
    // 1. Tìm kiếm bài đăng cần bình luận
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài đăng");
    }

    // 2. Tìm kiếm thông tin người bình luận để lấy tên & ảnh đại diện
    const user = await userRepository.findRawById(userId);
    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng");
    }

    // 3. Thực thi nghiệp vụ qua domain entity
    post.addComment(userId, user.name, user.avatar || null, text);

    // 4. Lưu lại bài viết và lấy về các bình luận có kèm ID của MongoDB
    await this.postRepository.save(post);

    return post.comments;
  }
}
