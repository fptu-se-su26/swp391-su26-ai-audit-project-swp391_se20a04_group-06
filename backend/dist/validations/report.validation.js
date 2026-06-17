"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleReportSchema = exports.createReportSchema = void 0;
// Import thư viện Zod để xây dựng bộ định hình schemas xác thực dữ liệu báo cáo vi phạm
const zod_1 = require("zod");
// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu tạo báo cáo vi phạm
exports.createReportSchema = zod_1.z.object({
    // Kiểm thực đối tượng body trong Express Request
    body: zod_1.z.object({
        // Lý do báo cáo reason phải là chuỗi ký tự và không được để trống (tối thiểu 1 ký tự)
        reason: zod_1.z.string().min(1, "Lý do báo cáo không được để trống"),
    }),
});
// Xuất ra schema định nghĩa quy tắc kiểm thực khi Admin xử lý báo cáo vi phạm
exports.handleReportSchema = zod_1.z.object({
    // Kiểm thực đối tượng body trong Express Request
    body: zod_1.z.object({
        // Hành động xử lý: Chỉ chấp nhận một trong hai lựa chọn cố định là "resolve" hoặc "dismiss"
        action: zod_1.z.enum(["resolve", "dismiss"]),
        // Ghi chú giải trình của quản trị viên: Trường văn bản tùy chọn (optional)
        adminNote: zod_1.z.string().optional(),
    }),
});
