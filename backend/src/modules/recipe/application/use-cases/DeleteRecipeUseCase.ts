import { IRecipeRepository } from "../../domain/repositories/IRecipeRepository";
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case xóa công thức món ăn.
 * Kiểm tra quyền hạn: Chỉ tác giả công thức hoặc Admin mới có quyền xóa.
 */
export class DeleteRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  /**
   * Thực thi hành động xóa công thức.
   * @param recipeId ID công thức.
   * @param userId ID người dùng gửi yêu cầu.
   * @param role Vai trò của người dùng gửi yêu cầu.
   */
  async execute(recipeId: string, userId: string, role: string): Promise<void> {
    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) {
      throw new NotFoundError("Không tìm thấy công thức");
    }

    // Kiểm tra quyền sở hữu hoặc quyền Admin trước khi thực hiện xóa
    if (role !== "Admin" && recipe.authorId !== userId) {
      throw new UnauthorizedError("Bạn không có quyền xóa công thức này");
    }

    await this.recipeRepository.delete(recipe);
  }
}
