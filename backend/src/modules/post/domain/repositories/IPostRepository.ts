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
  findById(id: string): Promise<Post | null>;

  /**
   * Lưu hoặc cập nhật trạng thái bài đăng.
   * @param post Thực thể bài đăng.
   */
  save(post: Post): Promise<void>;

  /**
   * Xóa bài đăng khỏi cơ sở dữ liệu.
   * @param post Thực thể bài đăng cần xóa.
   */
  delete(post: Post): Promise<void>;
}
