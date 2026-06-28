"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePostSchema = exports.commentSchema = exports.createPostSchema = void 0;
// Import thư viện Zod để xây dựng bộ kiểm thực dữ liệu đầu vào cho các API diễn đàn
const zod_1 = require("zod");
// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo bài đăng diễn đàn mới
exports.createPostSchema = zod_1.z.object({
    // Kiểm thực đối tượng body trong Express Request
    body: zod_1.z.object({
        // Tiêu đề title phải là chuỗi ký tự và không được để trống (độ dài tối thiểu 1 ký tự)
        title: zod_1.z.string().min(1, "Tiêu đề không được để trống"),
        // Nội dung content phải là chuỗi ký tự và không được để trống
        content: zod_1.z.string().min(1, "Nội dung không được để trống"),
        // Mảng chứa các đường dẫn hình ảnh bài viết là tùy chọn (optional)
        images: zod_1.z.array(zod_1.z.string()).optional(),
        // Mảng các nhãn thẻ phân loại tags là tùy chọn (optional)
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu bình luận bài đăng
exports.commentSchema = zod_1.z.object({
    // Kiểm thực đối tượng body trong Express Request
    body: zod_1.z.object({
        // Nội dung bình luận text phải là chuỗi ký tự, tối thiểu 1 ký tự và tối đa 1000 ký tự kèm thông báo lỗi
        text: zod_1.z
            .string()
            .min(1, "Nội dung bình luận không được để trống")
            .max(1000, "Bình luận tối đa 1000 ký tự"),
    }),
});
// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu cập nhật bài đăng
exports.updatePostSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(1, "Tiêu đề không được để trống").optional(),
        content: zod_1.z.string().min(1, "Nội dung không được để trống").optional(),
        images: zod_1.z.array(zod_1.z.string()).optional(),
        tags: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
