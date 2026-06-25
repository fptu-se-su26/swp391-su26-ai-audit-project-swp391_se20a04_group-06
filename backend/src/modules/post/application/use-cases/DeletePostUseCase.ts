// Import interface IPostRepository để tương tác với dữ liệu bài viết ở tầng Domain
import { IPostRepository } from "../../domain/repositories/IPostRepository";
// Import ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để báo lỗi khi không tìm thấy hoặc không có quyền xóa
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case xóa bài đăng trên diễn đàn.
 * Kiểm tra quyền hạn: Chỉ Admin hoặc chính tác giả của bài đăng mới có quyền xóa.
 */
export class DeletePostUseCase {
  // Hàm khởi tạo nhận vào postRepository theo cơ chế Dependency Injection (DI)
  constructor(private postRepository: IPostRepository) {}

  /**
   * Thực thi việc xóa bài đăng.
   */
  async execute(postId: string, userId: string, role: string): Promise<void> {
    // Tìm kiếm thông tin bài viết cần xóa từ Repository theo ID bài viết
    const post = await this.postRepository.findById(postId);
    // Nếu không tồn tại bài viết, ném lỗi NotFoundError
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài đăng");
    }

    // Kiểm tra quyền hạn: Chỉ tác giả bài đăng hoặc Admin mới có quyền xóa bài đăng này
    if (role !== "Admin" && post.userId !== userId) {
      // Ném lỗi UnauthorizedError báo không có quyền xóa bài đăng này
      throw new UnauthorizedError("Bạn không có quyền xóa bài đăng này");
    }

    // Thực hiện xóa bài viết khỏi cơ sở dữ liệu
    await this.postRepository.delete(post);
  }
}

