// Import thư viện Zod để xây dựng bộ định hình schemas xác thực dữ liệu nhận xét đánh giá
import { z } from "zod";

// Xuất ra schema định nghĩa quy tắc kiểm thực yêu cầu gửi đánh giá cho người bán
export const createReviewSchema = z.object({
  // Kiểm thực đối tượng body trong Express Request
  body: z.object({
    // ID sản phẩm được đánh giá: Phải là chuỗi ký tự và không được để trống (tối thiểu 1 ký tự)
    productId: z.string().min(1, "ID sản phẩm không được để trống"),
    // ID người bán nhận đánh giá: Phải là chuỗi ký tự và không được để trống (tối thiểu 1 ký tự)
    sellerId: z.string().min(1, "ID người bán không được để trống"),
    // Số sao đánh giá: Tiền xử lý chuyển đổi sang dạng số và phải nằm trong khoảng từ 1 đến 5 sao kèm thông báo lỗi cụ thể
    rating: z.preprocess(
      (val) => Number(val),
      z
        .number()
        .min(1, "Đánh giá tối thiểu 1 sao")
        .max(5, "Đánh giá tối đa 5 sao"),
    ),
    // Nội dung nhận xét: Trường văn bản tùy chọn và cho phép nhận giá trị null
    comment: z.string().optional().nullable(),
    // Đường dẫn hình ảnh đính kèm: Trường văn bản tùy chọn và cho phép nhận giá trị null
    imageUrl: z.string().optional().nullable(),
  }),
});
