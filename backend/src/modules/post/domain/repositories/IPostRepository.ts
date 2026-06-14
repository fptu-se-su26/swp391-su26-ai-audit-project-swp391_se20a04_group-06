// Import thực thể Post ở tầng Domain để định nghĩa kiểu dữ liệu trong Repository
import { Post } from "../entities/Post";

/**
 * Interface Port đại diện cho các hành vi thao tác dữ liệu của Bounded Context Community Forum (Post).
 * Giúp nhóm 4 người dễ bảo trì và mở rộng hệ thống.
 */
export interface IPostRepository {
  /**
   * Tìm kiếm bài đăng bằng ID.
   * @param id ID của bài đăng.
   */
  // Định nghĩa phương thức tìm kiếm bài viết theo ID duy nhất, trả về một Promise chứa Post hoặc null
  findById(id: string): Promise<Post | null>;

  /**
   * Lưu hoặc cập nhật trạng thái bài đăng.
   * @param post Thực thể bài đăng.
   */
  // Định nghĩa phương thức lưu trữ thông tin bài viết (tạo mới hoặc cập nhật trạng thái) vào DB
  save(post: Post): Promise<void>;

  /**
   * Xóa bài đăng khỏi cơ sở dữ liệu.
   * @param post Thực thể bài đăng cần xóa.
   */
  // Định nghĩa phương thức xóa bài viết khỏi cơ sở dữ liệu
  delete(post: Post): Promise<void>;
}

