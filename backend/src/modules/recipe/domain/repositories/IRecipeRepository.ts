import { Recipe } from "../entities/Recipe";

/**
 * Interface đại diện cho Port của Recipe Bounded Context.
 * Định nghĩa các hợp đồng mà lớp Infrastructure (Adapter) bắt buộc phải tuân theo.
 * Giúp nhóm 4 người dễ dàng mock repository khi viết Unit Test hoặc thay đổi Database mà không ảnh hưởng Domain.
 */
export interface IRecipeRepository {
  /**
   * Tìm kiếm một công thức theo ID duy nhất.
   * @param id ID của công thức cần tìm dưới dạng string.
   * @returns Trả về một thực thể Recipe (Domain Entity) hoặc null nếu không tìm thấy.
   */
  findById(id: string): Promise<Recipe | null>;

  /**
   * Lưu hoặc cập nhật trạng thái của thực thể Recipe xuống Cơ sở dữ liệu.
   * @param recipe Thực thể Recipe cần lưu trữ.
   */
  save(recipe: Recipe): Promise<void>;

  /**
   * Xóa vĩnh viễn một công thức khỏi Cơ sở dữ liệu.
   * @param recipe Thực thể Recipe cần xóa.
   */
  delete(recipe: Recipe): Promise<void>;
}
