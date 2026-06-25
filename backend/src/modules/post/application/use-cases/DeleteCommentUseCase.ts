// Import interface IPostRepository để tương tác với dữ liệu bài viết ở tầng Domain
import { IPostRepository } from "../../domain/repositories/IPostRepository";
// Import kiểu dữ liệu CommentProps từ thực thể Post để định nghĩa kiểu dữ liệu trả về cho bình luận
import { CommentProps } from "../../domain/entities/Post";
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy bài viết
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case xóa bình luận khỏi bài viết diễn đàn.
 */
export class DeleteCommentUseCase {
  // Hàm khởi tạo nhận vào postRepository theo cơ chế Dependency Injection (DI)
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
    // Tìm kiếm thông tin bài viết theo ID từ Repository
    const post = await this.postRepository.findById(postId);
    // Nếu không tồn tại bài viết, ném lỗi NotFoundError
    if (!post) {
      throw new NotFoundError("Không tìm thấy bài đăng");
    }

    // Nghiệp vụ xóa bình luận (kèm kiểm tra quyền) được xử lý an toàn trong Domain Entity bằng cách gọi removeComment
    post.removeComment(commentId, userId, role);

    // Lưu lại trạng thái bài đăng sau khi đã xóa bình luận vào cơ sở dữ liệu
    await this.postRepository.save(post);

    // Trả về danh sách tất cả các bình luận của bài đăng sau khi đã cập nhật
    return post.comments;
  }
}

