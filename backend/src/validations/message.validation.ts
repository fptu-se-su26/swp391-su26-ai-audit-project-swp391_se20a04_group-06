// Import thư viện Zod để xây dựng cấu trúc định hình kiểm thực dữ liệu đầu vào
import { z } from "zod";

// Định nghĩa biểu thức chính quy (Regex) để xác thực định dạng ObjectId hợp lệ của MongoDB (chuỗi 24 ký tự hệ lục phân)
const objectIdRegex = /^[0-9a-fA-F]{24}$/;

// Xuất ra schema định nghĩa quy tắc kiểm thực cấu trúc yêu cầu gửi tin nhắn chat
export const sendMessageSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request
  body: z.object({
    // Thuộc tính productId phải là chuỗi khớp với định dạng Regex ObjectId hợp lệ của MongoDB
    productId: z.string().regex(objectIdRegex, "ID sản phẩm không hợp lệ"),
    // Thuộc tính receiverId phải là chuỗi khớp với định dạng Regex ObjectId hợp lệ của MongoDB
    receiverId: z.string().regex(objectIdRegex, "ID người nhận không hợp lệ"),
    // Nội dung tin nhắn content là tùy chọn và có thể nhận giá trị null
    content: z.string().optional().nullable(),
    // Đường dẫn ảnh đính kèm imageUrl là tùy chọn và có thể nhận giá trị null
    imageUrl: z.string().optional().nullable(),
    // Vị trí chia sẻ location là tùy chọn và có thể nhận giá trị null, nếu gửi lên phải tuân thủ schema con
    location: z
      .object({
        // Vĩ độ GPS phải là kiểu số trong khoảng -90 đến 90
        latitude: z.number().min(-90, "Vĩ độ không hợp lệ (từ -90 đến 90)").max(90, "Vĩ độ không hợp lệ (từ -90 đến 90)"),
        // Kinh độ GPS phải là kiểu số trong khoảng -180 đến 180
        longitude: z.number().min(-180, "Kinh độ không hợp lệ (từ -180 đến 180)").max(180, "Kinh độ không hợp lệ (từ -180 đến 180)"),
        // Địa chỉ hiển thị là tùy chọn
        address: z.string().optional(),
      })
      .optional()
      .nullable(),
  }),
});
