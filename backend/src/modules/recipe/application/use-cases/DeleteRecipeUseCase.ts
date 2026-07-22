// Import interface IRecipeRepository quản lý thao tác dữ liệu công thức ở tầng Domain
import { IRecipeRepository } from "../../domain/repositories/IRecipeRepository";
// Import ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để báo lỗi khi dữ liệu hoặc quyền hạn không hợp lệ
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";
import { deleteFromCloudinary } from "../../../../middlewares/upload";
import { extractPublicId } from "../../../../utils/cloudinary";
import { logger } from "../../../../utils/logger";

/**
 * Use Case xóa công thức món ăn.
 * Kiểm tra quyền hạn: Chỉ tác giả công thức hoặc Admin mới có quyền xóa.
 */
export class DeleteRecipeUseCase {
  // Hàm khởi tạo nhận vào recipeRepository theo cơ chế Dependency Injection (DI)
  constructor(private recipeRepository: IRecipeRepository) {}

  /**
   * Thực thi hành động xóa công thức.
   * @param recipeId ID công thức.
   * @param userId ID người dùng gửi yêu cầu.
   * @param role Vai trò của người dùng gửi yêu cầu.
   */
  async execute(recipeId: string, userId: string, role: string): Promise<void> {
    // Tìm kiếm thông tin công thức nấu ăn cần xóa theo ID từ Repository
    const recipe = await this.recipeRepository.findById(recipeId);
    // Nếu không tồn tại công thức, ném lỗi NotFoundError
    if (!recipe) {
      throw new NotFoundError("Không tìm thấy công thức");
    }

    // Kiểm tra quyền sở hữu hoặc quyền Admin trước khi thực hiện xóa
    if (role !== "Admin" && recipe.authorId !== userId) {
      // Ném lỗi UnauthorizedError báo không có quyền xóa công thức này
      throw new UnauthorizedError("Bạn không có quyền xóa công thức này");
    }

    const imageUrl = recipe.imageUrl;

    // Thực hiện xóa công thức nấu ăn khỏi cơ sở dữ liệu
    await this.recipeRepository.delete(recipe);

    // Xóa hình ảnh tương ứng trên Cloudinary để tránh rác tài nguyên
    if (imageUrl) {
      const publicId = extractPublicId(imageUrl);
      if (publicId) {
        await deleteFromCloudinary(publicId).catch((error) => {
          logger.error(`Không thể xóa ảnh Recipe ${publicId}: ${error.message}`);
        });
      }
    }
  }
}

