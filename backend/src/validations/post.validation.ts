// Import thư viện Zod để xây dựng bộ kiểm thực dữ liệu đầu vào cho các API diễn đàn
import { z } from "zod";

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo bài đăng diễn đàn mới
export const createPostSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request
  body: z.object({
    // Tiêu đề title phải là chuỗi ký tự và không được để trống (độ dài tối thiểu 1 ký tự)
    title: z.string().min(1, "Tiêu đề không được để trống"),
    // Nội dung content phải là chuỗi ký tự và không được để trống
    content: z.string().min(1, "Nội dung không được để trống"),
    // Mảng chứa các đường dẫn hình ảnh bài viết là tùy chọn (optional)
    images: z.array(z.string()).optional(),
    // Mảng các nhãn thẻ phân loại tags là tùy chọn (optional)
    tags: z.array(z.string()).optional(),
  }),
});

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu bình luận bài đăng
export const commentSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request
  body: z.object({
    // Nội dung bình luận text phải là chuỗi ký tự, tối thiểu 1 ký tự và tối đa 1000 ký tự kèm thông báo lỗi
    text: z
      .string()
      .min(1, "Nội dung bình luận không được để trống")
      .max(1000, "Bình luận tối đa 1000 ký tự"),
    // ID bình luận cha (nếu có, để hỗ trợ tính năng reply)
    parentId: z.string().optional(),
  }),
});

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu cập nhật bài đăng
export const updatePostSchema = z.object({
  body: z.object({
    title: z.string().min(1, "Tiêu đề không được để trống").optional(),
    content: z.string().min(1, "Nội dung không được để trống").optional(),
    images: z.array(z.string()).optional(),
    tags: z.array(z.string()).optional(),
  }),
});
