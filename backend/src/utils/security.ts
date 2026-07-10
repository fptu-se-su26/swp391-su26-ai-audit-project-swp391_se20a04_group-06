// Import thư viện mã hóa crypto có sẵn của Node.js để tính toán giá trị băm (hash)
import crypto from "crypto";

/**
 * So sánh an toàn hai chuỗi ký tự để chống tấn công Timing Attack.
 * Đầu tiên băm SHA-256 để đảm bảo hai mảng buffer có độ dài bằng nhau trước khi so sánh.
 */
// Định nghĩa hàm safeCompare so sánh an toàn hai chuỗi ký tự đầu vào a và b
export function safeCompare(a: string, b: string): boolean {
  // Tạo đối tượng băm sha256 cho chuỗi a, cập nhật dữ liệu và kết xuất ra Buffer nhị phân hashA
  const hashA = crypto.createHash("sha256").update(a).digest();
  // Tạo đối tượng băm sha256 cho chuỗi b, cập nhật dữ liệu và kết xuất ra Buffer nhị phân hashB
  const hashB = crypto.createHash("sha256").update(b).digest();
  // Sử dụng hàm timingSafeEqual để so sánh hai Buffer hashA và hashB với thời gian xử lý đồng đều
  return crypto.timingSafeEqual(hashA, hashB);
}

export function sanitizeText(value: string, maxLength = 5000): string {
  return value
    .replace(/\u0000/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeDeep<T>(value: T): T {
  if (typeof value === "string") {
    return sanitizeText(value) as T;
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeDeep(item)) as T;
  }
  if (value && typeof value === "object" && !Buffer.isBuffer(value)) {
    const sanitized = Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        sanitizeDeep(item),
      ]),
    );
    return sanitized as T;
  }
  return value;
}
