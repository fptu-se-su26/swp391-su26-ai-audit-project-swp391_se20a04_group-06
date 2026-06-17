"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = void 0;
// Import thư viện Zod để xây dựng cấu trúc định hình kiểm thực dữ liệu đầu vào
const zod_1 = require("zod");
// Định nghĩa biểu thức chính quy (Regex) để xác thực định dạng ObjectId hợp lệ của MongoDB (chuỗi 24 ký tự hệ lục phân)
const objectIdRegex = /^[0-9a-fA-F]{24}$/;
// Xuất ra schema định nghĩa quy tắc kiểm thực cấu trúc yêu cầu gửi tin nhắn chat
exports.sendMessageSchema = zod_1.z.object({
    // Kiểm thực đối tượng body trong Express Request
    body: zod_1.z.object({
        // Thuộc tính productId phải là chuỗi khớp với định dạng Regex ObjectId hợp lệ của MongoDB
        productId: zod_1.z.string().regex(objectIdRegex, "ID sản phẩm không hợp lệ"),
        // Thuộc tính receiverId phải là chuỗi khớp với định dạng Regex ObjectId hợp lệ của MongoDB
        receiverId: zod_1.z.string().regex(objectIdRegex, "ID người nhận không hợp lệ"),
        // Nội dung tin nhắn content là tùy chọn và có thể nhận giá trị null
        content: zod_1.z.string().optional().nullable(),
        // Đường dẫn ảnh đính kèm imageUrl là tùy chọn và có thể nhận giá trị null
        imageUrl: zod_1.z.string().optional().nullable(),
        // Vị trí chia sẻ location là tùy chọn và có thể nhận giá trị null, nếu gửi lên phải tuân thủ schema con
        location: zod_1.z
            .object({
            // Vĩ độ GPS phải là kiểu số
            latitude: zod_1.z.number(),
            // Kinh độ GPS phải là kiểu số
            longitude: zod_1.z.number(),
            // Địa chỉ hiển thị là tùy chọn
            address: zod_1.z.string().optional(),
        })
            .optional()
            .nullable(),
    }),
});
