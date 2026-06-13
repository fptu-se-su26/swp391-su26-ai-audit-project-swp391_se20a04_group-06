import { IRecipeRepository } from "../../domain/repositories/IRecipeRepository";
import { Recipe } from "../../domain/entities/Recipe";
import { userRepository } from "../../../../repositories/user.repository";
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Request DTO (Data Transfer Object) cho Use Case tạo mới công thức.
 * Giúp định nghĩa rõ ràng cấu trúc dữ liệu đầu vào cho nhóm phát triển.
 */
export interface CreateRecipeRequestDTO {
  title: string;
  description: string;
  ingredients: string[] | string;
  instructions: string[] | string;
  imageUrl?: string | null;
  difficulty?: "Easy" | "Medium" | "Hard";
  cookingTime?: number;
  servings?: number;
  tags?: string[];
}

/**
 * Use Case xử lý nghiệp vụ tạo mới Công thức món ăn.
 * Tuân thủ quy tắc DDD: chỉ Admin hoặc Ngư dân đã xác minh danh tính mới được phép tạo công thức.
 */
export class CreateRecipeUseCase {
  constructor(private recipeRepository: IRecipeRepository) {}

  /**
   * Thực thi Use Case tạo mới công thức.
   * @param userId ID của người dùng yêu cầu tạo.
   * @param role Vai trò hiện tại của người dùng.
   * @param dto Dữ liệu tạo mới công thức.
   * @returns Trả về thông tin Recipe Entity sau khi lưu.
   */
  async execute(userId: string, role: string, dto: CreateRecipeRequestDTO): Promise<Recipe> {
    // 1. Tìm thông tin người dùng từ cơ sở dữ liệu
    const user = await userRepository.findRawById(userId);
    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng");
    }

    // 2. Kiểm tra điều kiện nghiệp vụ: Chỉ Admin hoặc ngư dân đã xác minh mới được viết công thức
    if (role !== "Admin" && !user.isVerified) {
      throw new UnauthorizedError(
        "Chỉ Admin hoặc ngư dân đã xác minh mới được viết công thức nấu ăn"
      );
    }

    // 3. Chuẩn hóa dữ liệu đầu vào (ví dụ: chuyển đổi string sang mảng nếu cần)
    const ingredients = Array.isArray(dto.ingredients)
      ? dto.ingredients
      : dto.ingredients ? [dto.ingredients] : [];
      
    const instructions = Array.isArray(dto.instructions)
      ? dto.instructions
      : dto.instructions ? [dto.instructions] : [];

    // 4. Khởi tạo một thực thể Domain Recipe mới
    const recipe = new Recipe({
      title: dto.title,
      description: dto.description,
      ingredients,
      instructions,
      imageUrl: dto.imageUrl || null,
      authorId: userId,
      difficulty: dto.difficulty || "Medium",
      cookingTime: dto.cookingTime || 30,
      servings: dto.servings || 2,
      tags: dto.tags || [],
      likes: [],
      viewCount: 0,
    });

    // 5. Gọi Repository Adapter để lưu xuống Database
    await this.recipeRepository.save(recipe);

    return recipe;
  }
}
