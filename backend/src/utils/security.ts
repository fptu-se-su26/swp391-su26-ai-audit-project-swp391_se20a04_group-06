import crypto from "crypto";

/**
 * So sánh an toàn hai chuỗi ký tự để chống tấn công Timing Attack.
 * Đầu tiên băm SHA-256 để đảm bảo hai mảng buffer có độ dài bằng nhau trước khi so sánh.
 */
export function safeCompare(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a).digest();
  const hashB = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}
