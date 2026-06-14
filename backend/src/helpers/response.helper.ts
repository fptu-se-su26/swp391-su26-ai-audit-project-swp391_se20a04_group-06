// Import kiểu dữ liệu Response từ Express để định nghĩa kiểu phản hồi HTTP
import { Response } from "express";
// Import thư viện mongoose để sử dụng các hàm kiểm tra kiểu dữ liệu ID của MongoDB
import mongoose from "mongoose";
// Import công cụ ghi log hệ thống (logger) từ thư mục utils
import { logger } from "../utils/logger";

/**
 * HÀM GỬI PHẢN HỒI LỖI MÁY CHỦ CHUẨN HÓA (INTERNAL SERVER ERROR - HTTP 500) KÈM GHI LOG CHI TIẾT
 */
export function sendServerError(res: Response, err: unknown): Response {
  // Ghi nhận log lỗi chi tiết lên hệ thống (ưu tiên lấy stack trace của lỗi, nếu không có thì lấy message hoặc convert sang chuỗi)
  logger.error(
    `Internal Server Error: ${err instanceof Error ? err.stack || err.message : String(err)}`,
  );
  // Trả về phản hồi lỗi HTTP status code 500 kèm theo thông điệp tiếng Việt thân thiện với người dùng
  return res.status(500).json({ message: "Lỗi máy chủ" });
}

/**
 * HÀM PHÂN TÍCH VÀ KIỂM TRA TÍNH HỢP LỆ CỦA ID (MÔNGO ID) GỬI LÊN TỪ CLIENT
 * Trả về chuỗi ID nếu hợp lệ, ngược lại trả về undefined
 */
export function parseId(raw: string | undefined): string | undefined {
  // Nếu tham số đầu vào rỗng (không truyền), trả về undefined ngay lập tức
  if (!raw) return undefined;
  // Sử dụng phương thức isValid của Mongoose để kiểm tra xem chuỗi có đúng định dạng ObjectId 24 ký tự hex hay không
  return mongoose.Types.ObjectId.isValid(raw) ? raw : undefined;
}

