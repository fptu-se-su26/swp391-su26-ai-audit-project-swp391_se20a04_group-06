// Import thư viện Zod để xây dựng bộ kiểm thực dữ liệu đầu vào cho các API diễn đàn
import { z } from "zod";

// Export ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo bài đăng diễn đàn mới
export const createPostSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request
  body: z.object({
    // Tiêu đề title phải là chuỗi ký tự, tối thiểu 1 ký tự và tối đa 150 ký tự
    title: z.string().min(1, "Tiêu đề không được để trống").max(150, "Tiêu đề không được vượt quá 150 ký tự"),
    // Nội dung content phải là chuỗi ký tự, tối thiểu 1 và tối đa 10000 ký tự
    content: z.string().min(1, "Nội dung không được để trống").max(10000, "Nội dung bài viết không được vượt quá 10000 ký tự"),
    // Mảng chứa các đường dẫn hình ảnh bài viết là tùy chọn (optional), tối đa 10 ảnh
    images: z.array(z.string()).max(10, "Chỉ được đăng tối đa 10 hình ảnh").optional(),
    // Mảng các nhãn thẻ phân loại tags là tùy chọn (optional), tối đa 10 tags, mỗi tag tối đa 30 ký tự
    tags: z.array(z.string().max(30, "Mỗi tag tối đa 30 ký tự")).max(10, "Tối đa 10 tags").optional(),
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
    title: z.string().min(1, "Tiêu đề không được để trống").max(150, "Tiêu đề không được vượt quá 150 ký tự").optional(),
    content: z.string().min(1, "Nội dung không được để trống").max(10000, "Nội dung bài viết không được vượt quá 10000 ký tự").optional(),
    images: z.array(z.string()).max(10, "Chỉ được đăng tối đa 10 hình ảnh").optional(),
    tags: z.array(z.string().max(30, "Mỗi tag tối đa 30 ký tự")).max(10, "Tối đa 10 tags").optional(),
  }),
});
