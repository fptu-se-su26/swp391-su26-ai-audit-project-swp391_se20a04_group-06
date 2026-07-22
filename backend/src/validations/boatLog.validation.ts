// Import thư viện Zod để xây dựng bộ định hình xác thực cấu trúc dữ liệu đầu vào
import { z } from "zod";

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo nhật ký đi biển
export const createBoatLogSchema = z.object({
  // Kiểm thực thuộc tính body trong Express Request
  body: z.object({
    // Nội dung nhật ký content phải là chuỗi ký tự và không được để trống (độ dài tối thiểu 1 ký tự và tối đa 5000 ký tự)
    content: z.string().min(1, "Nội dung nhật ký cabin không được để trống").max(5000, "Nội dung nhật ký cabin không được vượt quá 5000 ký tự"),
    // Mảng chứa các đường dẫn hình ảnh là tùy chọn, nếu gửi lên phải là mảng các chuỗi ký tự tối đa 10 ảnh
    images: z.array(z.string()).max(10, "Chỉ được đăng tối đa 10 hình ảnh").optional(),
    boatName: z.string().trim().max(120).optional(),
    catchArea: z.string().trim().max(200).optional(),
    landingTime: z.string().datetime().optional().nullable(),
    origin: z.string().trim().max(200).optional(),
  }),
});

export const updateBoatLogSchema = createBoatLogSchema;
