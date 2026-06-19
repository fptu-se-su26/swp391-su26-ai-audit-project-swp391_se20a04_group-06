"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReviewSchema = void 0;
// Import thư viện Zod để xây dựng bộ định hình schemas xác thực dữ liệu nhận xét đánh giá
const zod_1 = require("zod");
// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu gửi đánh giá cho người bán
exports.createReviewSchema = zod_1.z.object({
    // Kiểm thực đối tượng body trong Express Request
    body: zod_1.z.object({
        // ID sản phẩm được đánh giá: Phải là chuỗi ký tự và không được để trống (tối thiểu 1 ký tự)
        productId: zod_1.z.string().min(1, "ID sản phẩm không được để trống"),
        // ID người bán nhận đánh giá: Phải là chuỗi ký tự và không được để trống (tối thiểu 1 ký tự)
        sellerId: zod_1.z.string().min(1, "ID người bán không được để trống"),
        // Số sao đánh giá: Tiền xử lý chuyển đổi sang dạng số và phải nằm trong khoảng từ 1 đến 5 sao kèm thông báo lỗi cụ thể
        rating: zod_1.z.preprocess((val) => Number(val), zod_1.z
            .number()
            .min(1, "Đánh giá tối thiểu 1 sao")
            .max(5, "Đánh giá tối đa 5 sao")),
        // Nội dung nhận xét: Trường văn bản tùy chọn và cho phép nhận giá trị null
        comment: zod_1.z.string().optional().nullable(),
        // Đường dẫn hình ảnh đính kèm: Trường văn bản tùy chọn và cho phép nhận giá trị null
        imageUrl: zod_1.z.string().optional().nullable(),
    }),
});
