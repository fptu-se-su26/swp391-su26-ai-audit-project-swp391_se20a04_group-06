"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recipeCommentSchema = exports.updateRecipeSchema = exports.createRecipeSchema = void 0;
// Import thư viện Zod để xây dựng bộ định hình schemas xác thực dữ liệu đầu vào công thức nấu ăn
const zod_1 = require("zod");
// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo mới công thức nấu ăn
exports.createRecipeSchema = zod_1.z.object({
    // Kiểm thực đối tượng body trong Express Request
    body: zod_1.z.object({
        // Tiêu đề: Phải là chuỗi ký tự và không được để trống
        title: zod_1.z.string().min(1, "Tiêu đề không được để trống"),
        // Mô tả: Phải là chuỗi ký tự và không được để trống
        description: zod_1.z.string().min(1, "Mô tả không được để trống"),
        // Nguyên liệu: Có thể là một chuỗi ký tự đơn lẻ hoặc một mảng các chuỗi ký tự (sử dụng z.union)
        ingredients: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]),
        // Hướng dẫn chế biến: Tương tự nguyên liệu, chấp nhận chuỗi đơn hoặc mảng các chuỗi các bước
        instructions: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]),
        // Đường dẫn ảnh món ăn: Tùy chọn và cho phép nhận giá trị null
        imageUrl: zod_1.z.string().optional().nullable(),
        // Độ khó món ăn: Tùy chọn, chỉ chấp nhận một trong các mức "Easy", "Medium", "Hard"
        difficulty: zod_1.z.enum(["Easy", "Medium", "Hard"]).optional(),
        // Thời gian nấu nướng: Tùy chọn, nếu gửi lên phải là số dương lớn hơn 0
        cookingTime: zod_1.z.number().positive().optional(),
        // Số khẩu phần phục vụ: Tùy chọn, nếu gửi lên phải là số dương lớn hơn 0
        servings: zod_1.z.number().positive().optional(),
        // Mảng các nhãn thẻ phân loại tags đi kèm: Tùy chọn
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu cập nhật công thức nấu ăn
exports.updateRecipeSchema = zod_1.z.object({
    // Kiểm thực đối tượng body trong Express Request với tất cả các trường chuyển về tùy chọn (optional)
    body: zod_1.z.object({
        // Tiêu đề món ăn tùy chọn cập nhật
        title: zod_1.z.string().optional(),
        // Mô tả món ăn tùy chọn cập nhật
        description: zod_1.z.string().optional(),
        // Nguyên liệu tùy chọn cập nhật (chấp nhận chuỗi đơn hoặc mảng chuỗi)
        ingredients: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
        // Hướng dẫn chế biến tùy chọn cập nhật (chấp nhận chuỗi đơn hoặc mảng chuỗi)
        instructions: zod_1.z.union([zod_1.z.string(), zod_1.z.array(zod_1.z.string())]).optional(),
        // Đường dẫn ảnh món ăn tùy chọn cập nhật và cho phép truyền giá trị null để xóa ảnh cũ
        imageUrl: zod_1.z.string().optional().nullable(),
        // Cấp độ khó nấu ăn tùy chọn cập nhật
        difficulty: zod_1.z.enum(["Easy", "Medium", "Hard"]).optional(),
        // Thời gian chế biến món ăn tùy chọn cập nhật
        cookingTime: zod_1.z.number().positive().optional(),
        // Số lượng khẩu phần ăn tùy chọn cập nhật
        servings: zod_1.z.number().positive().optional(),
        // Mảng thẻ nhãn tùy chọn cập nhật
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
exports.recipeCommentSchema = zod_1.z.object({
    body: zod_1.z.object({
        text: zod_1.z
            .string()
            .min(1, "Nội dung bình luận không được để trống")
            .max(1000, "Bình luận tối đa 1000 ký tự"),
    }),
});
