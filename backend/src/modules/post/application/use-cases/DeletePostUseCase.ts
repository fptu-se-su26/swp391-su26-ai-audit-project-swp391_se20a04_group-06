import { IPostRepository } from "../../domain/repositories/IPostRepository";
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case xóa bài đăng trên diễn đàn.
 * Kiểm tra quyền hạn: Chỉ Admin hoặc chính tác giả của bài đăng mới có quyền xóa.
 */
export class DeletePostUseCase {
  constructor(private postRepository: IPostRepository) {}

  /**
   * Thực thi việc xóa bài đăng.
   */
  async execute(postId: string, userId: string, role: string): Promise<void> {
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài đăng");
    }

    // Kiểm tra quyền hạn: Chỉ tác giả bài đăng hoặc Admin mới có quyền xóa bài đăng này
    if (role !== "Admin" && post.userId !== userId) {
      throw new UnauthorizedError("Bạn không có quyền xóa bài đăng này");
    }

    await this.postRepository.delete(post);
  }
}
