"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncrementRecipeViewsUseCase = void 0;
// Import ngoại lệ nghiệp vụ NotFoundError để báo lỗi khi không tìm thấy công thức nấu ăn
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
/**
 * Use Case tăng số lượt xem của công thức khi người dùng truy cập chi tiết.
 */
class IncrementRecipeViewsUseCase {
    // Hàm khởi tạo nhận vào recipeRepository theo cơ chế Dependency Injection (DI)
    constructor(recipeRepository) {
        this.recipeRepository = recipeRepository;
    }
    /**
     * Tăng lượt xem của công thức món ăn và trả về thông tin chi tiết.
     * @param id ID công thức món ăn.
     * @returns Thực thể Recipe sau khi đã cập nhật viewCount.
     */
    async execute(id) {
        // Tìm kiếm thông tin công thức nấu ăn theo ID từ Repository
        const recipe = await this.recipeRepository.findById(id);
        // Nếu không tìm thấy công thức nấu ăn, ném lỗi NotFoundError
        if (!recipe) {
            throw new DomainException_1.NotFoundError("Không tìm thấy công thức");
        }
        // Tăng lượt xem sử dụng logic thuần túy của Domain Entity bằng cách gọi phương thức incrementViews
        recipe.incrementViews();
        // Lưu lại số lượt xem mới vào Database thông qua repository.save
        await this.recipeRepository.save(recipe);
        // Trả về thực thể công thức nấu ăn sau khi đã tăng lượt xem
        return recipe;
    }
}
exports.IncrementRecipeViewsUseCase = IncrementRecipeViewsUseCase;
