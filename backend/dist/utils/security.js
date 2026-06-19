"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.safeCompare = safeCompare;
// Import thư viện mã hóa crypto có sẵn của Node.js để tính toán giá trị băm (hash)
const crypto_1 = __importDefault(require("crypto"));
/**
 * So sánh an toàn hai chuỗi ký tự để chống tấn công Timing Attack.
 * Đầu tiên băm SHA-256 để đảm bảo hai mảng buffer có độ dài bằng nhau trước khi so sánh.
 */
// Định nghĩa hàm safeCompare so sánh an toàn hai chuỗi ký tự đầu vào a và b
function safeCompare(a, b) {
    // Tạo đối tượng băm sha256 cho chuỗi a, cập nhật dữ liệu và kết xuất ra Buffer nhị phân hashA
    const hashA = crypto_1.default.createHash("sha256").update(a).digest();
    // Tạo đối tượng băm sha256 cho chuỗi b, cập nhật dữ liệu và kết xuất ra Buffer nhị phân hashB
    const hashB = crypto_1.default.createHash("sha256").update(b).digest();
    // Sử dụng hàm timingSafeEqual để so sánh hai Buffer hashA và hashB với thời gian xử lý đồng đều
    return crypto_1.default.timingSafeEqual(hashA, hashB);
}
