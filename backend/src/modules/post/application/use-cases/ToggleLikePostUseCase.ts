// Import interface IPostRepository để tương tác với dữ liệu bài viết ở tầng Domain
import { IPostRepository } from "../../domain/repositories/IPostRepository";
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy bài đăng
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case thích hoặc bỏ thích bài đăng trên diễn đàn.
 */
export class ToggleLikePostUseCase {
  // Hàm khởi tạo nhận vào postRepository theo cơ chế Dependency Injection (DI)
  constructor(private postRepository: IPostRepository) {}

  /**
   * Thực thi hành động toggle like.
   */
  async execute(postId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    // Tìm kiếm thông tin bài viết theo ID từ Repository
    const post = await this.postRepository.findById(postId);
    // Nếu không tồn tại bài viết, ném lỗi NotFoundError
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài đăng");
    }

    // Nghiệp vụ thay đổi trạng thái thích thông qua domain entity
    const liked = post.toggleLike(userId);

    // Lưu lại thay đổi vào cơ sở dữ liệu
    await this.postRepository.save(post);

    // Trả về trạng thái thích (true/false) và tổng số lượng lượt thích hiện tại của bài viết
    return {
      liked,
      likeCount: post.likes.length,
    };
  }
}

