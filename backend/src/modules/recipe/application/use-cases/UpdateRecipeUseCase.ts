import { IRecipeRepository } from "../../domain/repositories/IRecipeRepository";
import { Recipe } from "../../domain/entities/Recipe";
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Request DTO cho việc cập nhật công thức.
 */
export interface UpdateRecipeRequestDTO {
  title?: string;
  description?: string;
  ingredients?: string[] | string;
  instructions?: string[] | string;
  imageUrl?: string | null;
  difficulty?: "Easy" | "Medium" | "Hard";
  cookingTime?: number;
  servings?: number;
  tags?: string[];
}

/**
 * Use Case cập nhật công thức nấu ăn.
 * Kiểm tra quyền: Chỉ tác giả hoặc Admin mới được phép chỉnh sửa.
 */
export class UpdateRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  /**
   * Thực thi cập nhật công thức.
   */
  async execute(
    recipeId: string,
    userId: string,
    role: string,
    dto: UpdateRecipeRequestDTO
  ): Promise<Recipe> {
    // 1. Lấy thông tin công thức hiện tại
    const recipe = await this.recipeRepository.findById(recipeId);
    if (!recipe) {
      throw new NotFoundError("Không tìm thấy công thức");
    }

    // 2. Kiểm tra phân quyền: Chỉ tác giả của bài viết hoặc Admin mới được quyền cập nhật
    if (role !== "Admin" && recipe.authorId !== userId) {
      throw new UnauthorizedError("Bạn không có quyền chỉnh sửa công thức này");
    }

    // 3. Chuẩn hóa các trường mảng đầu vào nếu có cập nhật
    const updates: Partial<any> = { ...dto };
    if (dto.ingredients !== undefined) {
      updates.ingredients = Array.isArray(dto.ingredients)
        ? dto.ingredients
        : dto.ingredients ? [dto.ingredients] : [];
    }
    if (dto.instructions !== undefined) {
      updates.instructions = Array.isArray(dto.instructions)
        ? dto.instructions
        : dto.instructions ? [dto.instructions] : [];
    }
    if (dto.tags !== undefined) {
      updates.tags = Array.isArray(dto.tags) ? dto.tags : [];
    }

    // 4. Ủy quyền cho Domain Entity thực thi logic cập nhật & kiểm chứng (validation)
    recipe.update(updates);

    // 5. Lưu lại trạng thái mới xuống Database
    await this.recipeRepository.save(recipe);

    return recipe;
  }
}
