"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DeleteRecipeUseCase = void 0;
// Import ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để báo lỗi khi dữ liệu hoặc quyền hạn không hợp lệ
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
/**
 * Use Case xóa công thức món ăn.
 * Kiểm tra quyền hạn: Chỉ tác giả công thức hoặc Admin mới có quyền xóa.
 */
class DeleteRecipeUseCase {
    // Hàm khởi tạo nhận vào recipeRepository theo cơ chế Dependency Injection (DI)
    constructor(recipeRepository) {
        this.recipeRepository = recipeRepository;
    }
    /**
     * Thực thi hành động xóa công thức.
     * @param recipeId ID công thức.
     * @param userId ID người dùng gửi yêu cầu.
     * @param role Vai trò của người dùng gửi yêu cầu.
     */
    async execute(recipeId, userId, role) {
        // Tìm kiếm thông tin công thức nấu ăn cần xóa theo ID từ Repository
        const recipe = await this.recipeRepository.findById(recipeId);
        // Nếu không tồn tại công thức, ném lỗi NotFoundError
        if (!recipe) {
            throw new DomainException_1.NotFoundError("Không tìm thấy công thức");
        }
        // Kiểm tra quyền sở hữu hoặc quyền Admin trước khi thực hiện xóa
        if (role !== "Admin" && recipe.authorId !== userId) {
            // Ném lỗi UnauthorizedError báo không có quyền xóa công thức này
            throw new DomainException_1.UnauthorizedError("Bạn không có quyền xóa công thức này");
        }
        // Thực hiện xóa công thức nấu ăn khỏi cơ sở dữ liệu
        await this.recipeRepository.delete(recipe);
    }
}
exports.DeleteRecipeUseCase = DeleteRecipeUseCase;
