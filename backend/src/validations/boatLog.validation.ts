// Import thư viện Zod để xây dựng bộ định hình xác thực cấu trúc dữ liệu đầu vào
import { z } from "zod";

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo nhật ký đi biển
export const createBoatLogSchema = z.object({
  // Kiểm thực thuộc tính body trong Express Request
  body: z.object({
    // Nội dung nhật ký content phải là chuỗi ký tự và không được để trống (độ dài tối thiểu 1 ký tự kèm thông điệp báo lỗi)
    content: z.string().min(1, "Nội dung nhật ký cabin không được để trống"),
    // Mảng chứa các đường dẫn hình ảnh là tùy chọn, nếu gửi lên phải là mảng các chuỗi ký tự
    images: z.array(z.string()).optional(),
  }),
});
