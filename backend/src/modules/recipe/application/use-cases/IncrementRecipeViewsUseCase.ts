import { IRecipeRepository } from "../../domain/repositories/IRecipeRepository";
import { Recipe } from "../../domain/entities/Recipe";
import { NotFoundError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Use Case tăng số lượt xem của công thức khi người dùng truy cập chi tiết.
 */
export class IncrementRecipeViewsUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  /**
   * Tăng lượt xem của công thức món ăn và trả về thông tin chi tiết.
   * @param id ID công thức món ăn.
   * @returns Thực thể Recipe sau khi đã cập nhật viewCount.
   */
  async execute(id: string): Promise<Recipe> {
    const recipe = await this.recipeRepository.findById(id);
    if (!recipe) {
      throw new NotFoundError("Không tìm thấy công thức");
    }

    // Tăng lượt xem sử dụng logic thuần túy của Domain Entity
    recipe.incrementViews();

    // Lưu lại số lượt xem mới vào Database
    await this.recipeRepository.save(recipe);

    return recipe;
  }
}
