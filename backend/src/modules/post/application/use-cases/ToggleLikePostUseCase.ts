// Import interface IPostRepository để tương tác với dữ liệu bài viết ở tầng Domain
import { IPostRepository } from "../../domain/repositories/IPostRepository";
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy bài đăng
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";
import { notifyPostLike } from "../../../../services/notification.service";
import { userRepository } from "../../../../repositories/user.repository";

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

    if (liked) {
      userRepository.findRawById(userId).then((user) => {
        if (user) {
          const props = post.toProps();
          notifyPostLike({
            postId,
            postTitle: props.title,
            postAuthorId: props.userId,
            likerName: user.name,
            likerId: userId,
          }).catch((err) => console.error("Failed to notify post like:", err));
        }
      }).catch((err) => console.error("Failed to find liker user details:", err));
    }

    // Trả về trạng thái thích (true/false) và tổng số lượng lượt thích hiện tại của bài viết
    return {
      liked,
      likeCount: post.likes.length,
    };
  }
}

