"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateRecipeUseCase = void 0;
// Import ngoại lệ nghiệp vụ NotFoundError và UnauthorizedError để báo lỗi khi dữ liệu hoặc quyền hạn không hợp lệ
const DomainException_1 = require("../../../../shared/domain/exceptions/DomainException");
/**
 * Use Case cập nhật công thức nấu ăn.
 * Kiểm tra quyền: Chỉ tác giả hoặc Admin mới được phép chỉnh sửa.
 */
class UpdateRecipeUseCase {
    // Hàm khởi tạo nhận vào recipeRepository theo cơ chế Dependency Injection (DI)
    constructor(recipeRepository) {
        this.recipeRepository = recipeRepository;
    }
    /**
     * Thực thi cập nhật công thức.
     */
    async execute(recipeId, userId, role, dto) {
        // 1. Lấy thông tin công thức nấu ăn cần cập nhật từ Repository theo ID
        const recipe = await this.recipeRepository.findById(recipeId);
        // Nếu không tồn tại công thức, ném lỗi NotFoundError
        if (!recipe) {
            throw new DomainException_1.NotFoundError("Không tìm thấy công thức");
        }
        // 2. Kiểm tra phân quyền: Chỉ tác giả của bài viết hoặc Admin mới được quyền cập nhật
        if (role !== "Admin" && recipe.authorId !== userId) {
            // Ném lỗi UnauthorizedError báo không có quyền chỉnh sửa công thức này
            throw new DomainException_1.UnauthorizedError("Bạn không có quyền chỉnh sửa công thức này");
        }
        // 3. Chuẩn hóa các trường mảng đầu vào nếu có cập nhật
        // Tạo bản sao của DTO để chuẩn hóa
        const updates = { ...dto };
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
exports.UpdateRecipeUseCase = UpdateRecipeUseCase;
