"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createBoatLogSchema = void 0;
// Import thư viện Zod để xây dựng bộ định hình xác thực cấu trúc dữ liệu đầu vào
const zod_1 = require("zod");
// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo nhật ký đi biển
exports.createBoatLogSchema = zod_1.z.object({
    // Kiểm thực thuộc tính body trong Express Request
    body: zod_1.z.object({
        // Nội dung nhật ký content phải là chuỗi ký tự và không được để trống (độ dài tối thiểu 1 ký tự kèm thông điệp báo lỗi)
        content: zod_1.z.string().min(1, "Nội dung nhật ký cabin không được để trống"),
        // Mảng chứa các đường dẫn hình ảnh là tùy chọn, nếu gửi lên phải là mảng các chuỗi ký tự
        images: zod_1.z.array(zod_1.z.string()).optional(),
    }),
});
