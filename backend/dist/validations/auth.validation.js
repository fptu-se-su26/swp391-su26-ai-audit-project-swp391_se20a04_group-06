"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
// Import thư viện kiểm thực dữ liệu Zod để xây dựng cấu trúc schemas validate
const zod_1 = require("zod");
// Xuất ra schema định nghĩa quy tắc kiểm thực cấu trúc yêu cầu cập nhật hồ sơ người dùng
exports.updateProfileSchema = zod_1.z.object({
    // Kiểm thực đối tượng body trong Express Request
    body: zod_1.z.object({
        // Thuộc tính name phải là một chuỗi ký tự, có độ dài tối thiểu là 2 với thông báo lỗi tùy chỉnh, và tối đa 100 ký tự
        name: zod_1.z.string().min(2, "Tên phải từ 2 đến 100 ký tự").max(100),
        // Thuộc tính email phải đúng cấu trúc hòm thư điện tử, cho phép tùy chọn (optional) không bắt buộc gửi lên
        email: zod_1.z.string().email("Email không hợp lệ").optional(),
    }),
});
