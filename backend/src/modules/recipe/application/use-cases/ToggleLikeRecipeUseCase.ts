import { IRecipeRepository } from "../../domain/repositories/IRecipeRepository";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case thực hiện việc thích (Like) hoặc bỏ thích (Unlike) một công thức món ăn.
 */
export class ToggleLikeRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  /**
   * Thực hiện toggle like cho một Recipe.
   * @param recipeId ID của công thức.
   * @param userId ID của người dùng thực hiện hành động.
   * @returns Đối tượng trả về trạng thái liked (true/false) và tổng số lượt thích.
   */
  async execute(recipeId: string, userId: string): Promise<{ liked: boolean; likeCount: number }> {
    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) {
      throw new NotFoundError("Không tìm thấy công thức");
    }

    // Thực thi nghiệp vụ thay đổi trạng thái thích thông qua phương thức nghiệp vụ của Domain Entity
    const liked = recipe.toggleLike(userId);

    // Lưu thực thể đã thay đổi trạng thái xuống Database
    await this.recipeRepository.save(recipe);

    return {
      liked,
      likeCount: recipe.likes.length,
    };
  }
}
