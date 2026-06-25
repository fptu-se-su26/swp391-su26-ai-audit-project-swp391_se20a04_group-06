// Import interface IRecipeRepository quản lý lưu trữ và thao tác dữ liệu công thức ở tầng Domain
import { IRecipeRepository } from "../../domain/repositories/IRecipeRepository";
// Import thực thể Domain Recipe để đại diện cho đối tượng công thức nấu ăn
import { Recipe } from "../../domain/entities/Recipe";
// Import ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để báo lỗi khi dữ liệu hoặc quyền hạn không hợp lệ
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Request DTO cho việc cập nhật công thức.
 */
export interface UpdateRecipeRequestDTO {
  // Tiêu đề công thức nấu ăn (tùy chọn)
  title?: string;
  // Mô tả cách nấu món ăn (tùy chọn)
  description?: string;
  // Nguyên liệu chuẩn bị (tùy chọn)
  ingredients?: string[] | string;
  // Các bước hướng dẫn (tùy chọn)
  instructions?: string[] | string;
  // Đường dẫn hình ảnh thành phẩm (tùy chọn)
  imageUrl?: string | null;
  // Cấp độ khó của món ăn (tùy chọn)
  difficulty?: "Easy" | "Medium" | "Hard";
  // Thời gian chế biến tính bằng phút (tùy chọn)
  cookingTime?: number;
  // Số lượng khẩu phần ăn phục vụ (tùy chọn)
  servings?: number;
  // Mảng từ khóa nhãn dán liên quan (tùy chọn)
  tags?: string[];
}

/**
 * Use Case cập nhật công thức nấu ăn.
 * Kiểm tra quyền: Chỉ tác giả hoặc Admin mới được phép chỉnh sửa.
 */
export class UpdateRecipeUseCase {
  // Hàm khởi tạo nhận vào recipeRepository theo cơ chế Dependency Injection (DI)
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
    // 1. Lấy thông tin công thức nấu ăn cần cập nhật từ Repository theo ID
    const recipe = await this.recipeRepository.findById(recipeId);
    // Nếu không tồn tại công thức, ném lỗi NotFoundError
    if (!recipe) {
      throw new NotFoundError("Không tìm thấy công thức");
    }

    // 2. Kiểm tra phân quyền: Chỉ tác giả của bài viết hoặc Admin mới được quyền cập nhật
    if (role !== "Admin" && recipe.authorId !== userId) {
      // Ném lỗi UnauthorizedError báo không có quyền chỉnh sửa công thức này
      throw new UnauthorizedError("Bạn không có quyền chỉnh sửa công thức này");
    }

    // 3. Chuẩn hóa các trường mảng đầu vào nếu có cập nhật
    // Tạo bản sao của DTO để chuẩn hóa
    const updates: Partial<any> = { ...dto };
    // Nếu client có cập nhật danh sách nguyên liệu
    if (dto.ingredients !== undefined) {
      // Ép kiểu nguyên liệu sang dạng mảng nếu client gửi chuỗi đơn lẻ
      updates.ingredients = Array.isArray(dto.ingredients)
        ? dto.ingredients // Giữ nguyên mảng
        : dto.ingredients ? [dto.ingredients] : []; // Chuyển chuỗi sang mảng, hoặc mặc định mảng rỗng
    }
    // Nếu client có cập nhật danh sách các bước hướng dẫn
    if (dto.instructions !== undefined) {
      // Ép kiểu danh sách các bước sang dạng mảng nếu client gửi chuỗi đơn lẻ
      updates.instructions = Array.isArray(dto.instructions)
        ? dto.instructions // Giữ nguyên mảng
        : dto.instructions ? [dto.instructions] : []; // Chuyển chuỗi sang mảng, hoặc mặc định mảng rỗng
    }
    // Nếu client có cập nhật danh sách nhãn dán tags
    if (dto.tags !== undefined) {
      // Đảm bảo trường tags là mảng, nếu không thì đặt mảng rỗng
      updates.tags = Array.isArray(dto.tags) ? dto.tags : [];
    }

    // 4. Ủy quyền cho Domain Entity thực thi logic cập nhật & kiểm chứng (validation)
    recipe.update(updates);

    // 5. Lưu lại trạng thái mới của thực thể công thức vào cơ sở dữ liệu
    await this.recipeRepository.save(recipe);

    // Trả về thực thể công thức nấu ăn sau khi đã được cập nhật thông tin
    return recipe;
  }
}

