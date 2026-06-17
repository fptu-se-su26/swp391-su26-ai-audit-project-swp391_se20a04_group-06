"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendServerError = sendServerError;
exports.parseId = parseId;
// Import thư viện mongoose để sử dụng các hàm kiểm tra kiểu dữ liệu ID của MongoDB
const mongoose_1 = __importDefault(require("mongoose"));
// Import công cụ ghi log hệ thống (logger) từ thư mục utils
const logger_1 = require("../utils/logger");
/**
 * HÀM GỬI PHẢN HỒI LỖI MÁY CHỦ CHUẨN HÓA (INTERNAL SERVER ERROR - HTTP 500) KÈM GHI LOG CHI TIẾT
 */
function sendServerError(res, err) {
    // Ghi nhận log lỗi chi tiết lên hệ thống (ưu tiên lấy stack trace của lỗi, nếu không có thì lấy message hoặc convert sang chuỗi)
    logger_1.logger.error(`Internal Server Error: ${err instanceof Error ? err.stack || err.message : String(err)}`);
    // Trả về phản hồi lỗi HTTP status code 500 kèm theo thông điệp tiếng Việt thân thiện với người dùng
    return res.status(500).json({ message: "Lỗi máy chủ" });
}
/**
 * HÀM PHÂN TÍCH VÀ KIỂM TRA TÍNH HỢP LỆ CỦA ID (MÔNGO ID) GỬI LÊN TỪ CLIENT
 * Trả về chuỗi ID nếu hợp lệ, ngược lại trả về undefined
 */
function parseId(raw) {
    // Nếu tham số đầu vào rỗng (không truyền), trả về undefined ngay lập tức
    if (!raw)
        return undefined;
    // Sử dụng phương thức isValid của Mongoose để kiểm tra xem chuỗi có đúng định dạng ObjectId 24 ký tự hex hay không
    return mongoose_1.default.Types.ObjectId.isValid(raw) ? raw : undefined;
}
