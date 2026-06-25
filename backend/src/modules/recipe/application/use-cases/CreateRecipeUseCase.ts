// Import interface IRecipeRepository quản lý lưu trữ và thao tác dữ liệu công thức ở tầng Domain
import { IRecipeRepository } from "../../domain/repositories/IRecipeRepository";
// Import thực thể Domain Recipe để khởi tạo đối tượng công thức nấu ăn
import { Recipe } from "../../domain/entities/Recipe";
// Import userRepository để lấy thông tin chi tiết về người dùng tạo công thức
import { userRepository } from "../../../../repositories/user.repository";
// Import ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để báo lỗi khi dữ liệu hoặc trạng thái không hợp lý
import { NotFoundError, UnauthorizedError } from "../../../../shared/domain/exceptions/DomainException";

/**
 * Request DTO (Data Transfer Object) cho Use Case tạo mới công thức.
 * Giúp định nghĩa rõ ràng cấu trúc dữ liệu đầu vào cho nhóm phát triển.
 */
export interface CreateRecipeRequestDTO {
  // Tiêu đề công thức nấu ăn
  title: string;
  // Mô tả chi tiết cách chế biến món ăn
  description: string;
  // Nguyên liệu (có thể là mảng chuỗi hoặc một chuỗi đơn lẻ)
  ingredients: string[] | string;
  // Các bước hướng dẫn (có thể là mảng chuỗi hoặc một chuỗi đơn lẻ)
  instructions: string[] | string;
  // Đường dẫn ảnh thành phẩm món ăn (tùy chọn)
  imageUrl?: string | null;
  // Cấp độ khó chế biến (tùy chọn)
  difficulty?: "Easy" | "Medium" | "Hard";
  // Thời gian chế biến tính theo phút (tùy chọn)
  cookingTime?: number;
  // Số lượng khẩu phần ăn (tùy chọn)
  servings?: number;
  // Các từ khóa nhãn dán liên quan (tùy chọn)
  tags?: string[];
}

/**
 * Use Case xử lý nghiệp vụ tạo mới Công thức món ăn.
 * Tuân thủ quy tắc DDD: chỉ Admin hoặc Ngư dân đã xác minh danh tính mới được phép tạo công thức.
 */
export class CreateRecipeUseCase {
  // Hàm khởi tạo nhận vào recipeRepository theo cơ chế Dependency Injection (DI)
  constructor(private recipeRepository: IRecipeRepository) {}

  /**
   * Thực thi Use Case tạo mới công thức.
   * @param userId ID của người dùng yêu cầu tạo.
   * @param role Vai trò hiện tại của người dùng.
   * @param dto Dữ liệu tạo mới công thức.
   * @returns Trả về thông tin Recipe Entity sau khi lưu.
   */
  async execute(userId: string, role: string, dto: CreateRecipeRequestDTO): Promise<Recipe> {
    // 1. Tìm kiếm thông tin người dùng gửi yêu cầu từ cơ sở dữ liệu
    const user = await userRepository.findRawById(userId);
    // Nếu không tìm thấy người dùng đăng công thức, ném lỗi NotFoundError
    if (!user) {
      throw new NotFoundError("Không tìm thấy người dùng");
    }

    // 2. Kiểm tra điều kiện nghiệp vụ: Chỉ Admin hoặc ngư dân đã xác minh (isVerified) mới được viết công thức
    if (role !== "Admin" && !user.isVerified) {
      // Ném lỗi UnauthorizedError báo không có quyền thực hiện
      throw new UnauthorizedError(
        "Chỉ Admin hoặc ngư dân đã xác minh mới được viết công thức nấu ăn"
      );
    }

    // 3. Chuẩn hóa dữ liệu đầu vào: Chuyển nguyên liệu sang dạng mảng nếu client gửi chuỗi đơn lẻ
    const ingredients = Array.isArray(dto.ingredients)
      ? dto.ingredients // Nếu đã là mảng thì giữ nguyên
      : dto.ingredients ? [dto.ingredients] : []; // Nếu là chuỗi thì cho vào mảng, ngược lại để mảng rỗng
      
    // Chuẩn hóa dữ liệu đầu vào: Chuyển các bước thực hiện sang dạng mảng nếu client gửi chuỗi đơn lẻ
    const instructions = Array.isArray(dto.instructions)
      ? dto.instructions // Nếu đã là mảng thì giữ nguyên
      : dto.instructions ? [dto.instructions] : []; // Nếu là chuỗi thì cho vào mảng, ngược lại để mảng rỗng

    // 4. Khởi tạo một thực thể Domain Recipe mới
    const recipe = new Recipe({
      title: dto.title,                         // Gán tiêu đề công thức
      description: dto.description,             // Gán mô tả công thức
      ingredients,                              // Gán danh sách nguyên liệu
      instructions,                             // Gán danh sách các bước hướng dẫn
      imageUrl: dto.imageUrl || null,           // Gán ảnh thành phẩm (mặc định null nếu thiếu)
      authorId: userId,                         // Gán mã người tạo công thức
      difficulty: dto.difficulty || "Medium",   // Gán cấp độ khó (mặc định Medium nếu thiếu)
      cookingTime: dto.cookingTime || 30,       // Gán thời gian nấu (mặc định 30 phút nếu thiếu)
      servings: dto.servings || 2,              // Gán số khẩu phần ăn (mặc định cho 2 người nếu thiếu)
      tags: dto.tags || [],                     // Gán mảng từ khóa liên quan (mặc định mảng rỗng nếu thiếu)
      likes: [],                                // Thiết lập mảng người thích ban đầu là mảng rỗng
      viewCount: 0,                             // Thiết lập lượt xem ban đầu là 0
    });

    // 5. Gọi Repository Adapter để lưu thực thể Recipe mới xuống Database
    await this.recipeRepository.save(recipe);

    // Trả về thực thể công thức nấu ăn vừa được tạo thành công
    return recipe;
  }
}
