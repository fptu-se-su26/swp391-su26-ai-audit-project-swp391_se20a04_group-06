"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToggleLikeRecipeUseCase = void 0;
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy công thức nấu ăn
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
/**
 * Use Case thực hiện việc thích (Like) hoặc bỏ thích (Unlike) một công thức món ăn.
 */
class ToggleLikeRecipeUseCase {
    // Hàm khởi tạo nhận vào recipeRepository theo cơ chế Dependency Injection (DI)
    constructor(recipeRepository) {
        this.recipeRepository = recipeRepository;
    }
    /**
     * Thực hiện toggle like cho một Recipe.
     * @param recipeId ID của công thức.
     * @param userId ID của người dùng thực hiện hành động.
     * @returns Đối tượng trả về trạng thái liked (true/false) và tổng số lượt thích.
     */
    async execute(recipeId, userId) {
        // Tìm kiếm thông tin công thức nấu ăn theo ID từ Repository
        const recipe = await this.recipeRepository.findById(recipeId);
        // Nếu không tồn tại công thức, ném lỗi NotFoundError
        if (!recipe) {
            throw new DomainException_1.NotFoundError("Không tìm thấy công thức");
        }
        // Thực thi nghiệp vụ thay đổi trạng thái thích thông qua phương thức nghiệp vụ của Domain Entity bằng cách gọi toggleLike
        const liked = recipe.toggleLike(userId);
        // Lưu thực thể đã thay đổi trạng thái xuống Database
        await this.recipeRepository.save(recipe);
        // Trả về trạng thái thích (true/false) và tổng số lượt thích hiện tại của công thức nấu ăn
        return {
            liked,
            likeCount: recipe.likes.length,
        };
    }
}
exports.ToggleLikeRecipeUseCase = ToggleLikeRecipeUseCase;
