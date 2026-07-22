// Import thư viện Zod để xây dựng bộ định hình schemas xác thực dữ liệu đầu vào công thức nấu ăn
import { z } from "zod";

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo mới công thức nấu ăn
export const createRecipeSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request
  body: z.object({
    // Tiêu đề: Phải là chuỗi ký tự, tối thiểu 1 ký tự và tối đa 150 ký tự
    title: z.string().min(1, "Tiêu đề không được để trống").max(150, "Tiêu đề không được vượt quá 150 ký tự"),
    // Mô tả: Phải là chuỗi ký tự, tối thiểu 1 ký tự và tối đa 5000 ký tự
    description: z.string().min(1, "Mô tả không được để trống").max(5000, "Mô tả không được vượt quá 5000 ký tự"),
    // Nguyên liệu: Có thể là một chuỗi ký tự đơn lẻ hoặc một mảng các chuỗi ký tự, có giới hạn độ dài và số phần tử
    ingredients: z.union([
      z.string().max(2000, "Nguyên liệu không được vượt quá 2000 ký tự"),
      z.array(z.string().max(200, "Mỗi nguyên liệu không được vượt quá 200 ký tự")).max(100, "Không được nhập quá 100 nguyên liệu")
    ]),
    // Hướng dẫn chế biến: Tương tự nguyên liệu, chấp nhận chuỗi đơn hoặc mảng các chuỗi các bước
    instructions: z.union([
      z.string().max(4000, "Hướng dẫn không được vượt quá 4000 ký tự"),
      z.array(z.string().max(500, "Mỗi bước hướng dẫn không được vượt quá 500 ký tự")).max(100, "Không được nhập quá 100 bước hướng dẫn")
    ]),
    // Đường dẫn ảnh món ăn: Tùy chọn và cho phép nhận giá trị null
    imageUrl: z.string().optional().nullable(),
    // Độ khó món ăn: Tùy chọn, chỉ chấp nhận một trong các mức "Easy", "Medium", "Hard"
    difficulty: z.enum(["Easy", "Medium", "Hard"] as const).optional(),
    // Thời gian nấu nướng: Tùy chọn, nếu gửi lên phải là số dương tối đa 1440 phút (24 giờ)
    cookingTime: z.number().positive("Thời gian nấu phải lớn hơn 0").max(1440, "Thời gian nấu tối đa là 1440 phút (24 giờ)").optional(),
    // Số khẩu phần phục vụ: Tùy chọn, nếu gửi lên phải là số dương tối đa 100
    servings: z.number().positive("Số lượng khẩu phần phải lớn hơn 0").max(100, "Khẩu phần phục vụ tối đa là 100 người").optional(),
    // Mảng các nhãn thẻ phân loại tags đi kèm: Tùy chọn, tối đa 10 tags, mỗi tag tối đa 30 ký tự
    tags: z.array(z.string().max(30, "Mỗi tag tối đa 30 ký tự")).max(10, "Tối đa 10 tags").optional(),
  }),
});

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu cập nhật công thức nấu ăn
export const updateRecipeSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request với tất cả các trường chuyển về tùy chọn (optional)
  body: z.object({
    // Tiêu đề món ăn tùy chọn cập nhật, tối đa 150 ký tự
    title: z.string().max(150, "Tiêu đề không được vượt quá 150 ký tự").optional(),
    // Mô tả món ăn tùy chọn cập nhật, tối đa 5000 ký tự
    description: z.string().max(5000, "Mô tả không được vượt quá 5000 ký tự").optional(),
    // Nguyên liệu tùy chọn cập nhật
    ingredients: z.union([
      z.string().max(2000, "Nguyên liệu không được vượt quá 2000 ký tự"),
      z.array(z.string().max(200, "Mỗi nguyên liệu không được vượt quá 200 ký tự")).max(100, "Không được nhập quá 100 nguyên liệu")
    ]).optional(),
    // Hướng dẫn chế biến tùy chọn cập nhật
    instructions: z.union([
      z.string().max(4000, "Hướng dẫn không được vượt quá 4000 ký tự"),
      z.array(z.string().max(500, "Mỗi bước hướng dẫn không được vượt quá 500 ký tự")).max(100, "Không được nhập quá 100 bước hướng dẫn")
    ]).optional(),
    // Đường dẫn ảnh món ăn tùy chọn cập nhật và cho phép truyền giá trị null để xóa ảnh cũ
    imageUrl: z.string().optional().nullable(),
    // Cấp độ khó nấu ăn tùy chọn cập nhật
    difficulty: z.enum(["Easy", "Medium", "Hard"] as const).optional(),
    // Thời gian chế biến món ăn tùy chọn cập nhật, tối đa 1440 phút
    cookingTime: z.number().positive("Thời gian nấu phải lớn hơn 0").max(1440, "Thời gian nấu tối đa là 1440 phút (24 giờ)").optional(),
    // Số lượng khẩu phần ăn tùy chọn cập nhật, tối đa 100
    servings: z.number().positive("Số lượng khẩu phần phải lớn hơn 0").max(100, "Khẩu phần phục vụ tối đa là 100 người").optional(),
    // Mảng thẻ nhãn tùy chọn cập nhật
    tags: z.array(z.string().max(30, "Mỗi tag tối đa 30 ký tự")).max(10, "Tối đa 10 tags").optional(),
  }),
});

export const recipeCommentSchema = z.object({
  body: z.object({
    text: z
      .string()
      .min(1, "Nội dung bình luận không được để trống")
      .max(1000, "Bình luận tối đa 1000 ký tự"),
  }),
});
