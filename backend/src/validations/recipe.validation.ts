// Import thư viện Zod để xây dựng bộ định hình schemas xác thực dữ liệu đầu vào công thức nấu ăn
import { z } from "zod";

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo mới công thức nấu ăn
export const createRecipeSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request
  body: z.object({
    // Tiêu đề: Phải là chuỗi ký tự và không được để trống
    title: z.string().min(1, "Tiêu đề không được để trống"),
    // Mô tả: Phải là chuỗi ký tự và không được để trống
    description: z.string().min(1, "Mô tả không được để trống"),
    // Nguyên liệu: Có thể là một chuỗi ký tự đơn lẻ hoặc một mảng các chuỗi ký tự (sử dụng z.union)
    ingredients: z.union([z.string(), z.array(z.string())]),
    // Hướng dẫn chế biến: Tương tự nguyên liệu, chấp nhận chuỗi đơn hoặc mảng các chuỗi các bước
    instructions: z.union([z.string(), z.array(z.string())]),
    // Đường dẫn ảnh món ăn: Tùy chọn và cho phép nhận giá trị null
    imageUrl: z.string().optional().nullable(),
    // Độ khó món ăn: Tùy chọn, chỉ chấp nhận một trong các mức "Easy", "Medium", "Hard"
    difficulty: z.enum(["Easy", "Medium", "Hard"] as const).optional(),
    // Thời gian nấu nướng: Tùy chọn, nếu gửi lên phải là số dương lớn hơn 0
    cookingTime: z.number().positive().optional(),
    // Số khẩu phần phục vụ: Tùy chọn, nếu gửi lên phải là số dương lớn hơn 0
    servings: z.number().positive().optional(),
    // Mảng các nhãn thẻ phân loại tags đi kèm: Tùy chọn
    tags: z.array(z.string()).optional(),
  }),
});

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu cập nhật công thức nấu ăn
export const updateRecipeSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request với tất cả các trường chuyển về tùy chọn (optional)
  body: z.object({
    // Tiêu đề món ăn tùy chọn cập nhật
    title: z.string().optional(),
    // Mô tả món ăn tùy chọn cập nhật
    description: z.string().optional(),
    // Nguyên liệu tùy chọn cập nhật (chấp nhận chuỗi đơn hoặc mảng chuỗi)
    ingredients: z.union([z.string(), z.array(z.string())]).optional(),
    // Hướng dẫn chế biến tùy chọn cập nhật (chấp nhận chuỗi đơn hoặc mảng chuỗi)
    instructions: z.union([z.string(), z.array(z.string())]).optional(),
    // Đường dẫn ảnh món ăn tùy chọn cập nhật và cho phép truyền giá trị null để xóa ảnh cũ
    imageUrl: z.string().optional().nullable(),
    // Cấp độ khó nấu ăn tùy chọn cập nhật
    difficulty: z.enum(["Easy", "Medium", "Hard"] as const).optional(),
    // Thời gian chế biến món ăn tùy chọn cập nhật
    cookingTime: z.number().positive().optional(),
    // Số lượng khẩu phần ăn tùy chọn cập nhật
    servings: z.number().positive().optional(),
    // Mảng thẻ nhãn tùy chọn cập nhật
    tags: z.array(z.string()).optional(),
  }),
});
