// Import các kiểu dữ liệu của Express để làm tham số cho các middleware
import { Request, Response, NextFunction } from "express";
// Import thư viện crypto mặc định của Node.js để tạo các chuỗi ký tự ngẫu nhiên an toàn bảo mật
import crypto from "crypto";
// Import hàm so sánh chuỗi an toàn safeCompare để phòng chống Timing Attack
import { safeCompare } from "../utils/security";

// Thiết lập thời gian sống tối đa của cookie CSRF Token là 7 ngày (đổi sang mili giây)
const CSRF_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * MIDDLEWARE TỰ ĐỘNG KHỞI TẠO CSRF TOKEN CHO CÁC PHIÊN LÀM VIỆC MỚI (GENERATE CSRF TOKEN)
 */
export function generateCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Nếu client chưa có cookie 'csrfToken'
  if (!req.cookies.csrfToken) {
    // Sinh ngẫu nhiên một chuỗi bảo mật gồm 32 bytes dưới dạng thập lục phân (hex)
    const token = crypto.randomBytes(32).toString("hex");
    // Thiết lập cookie lưu token bảo mật này
    res.cookie("csrfToken", token, {
      httpOnly: false,             // KHÔNG để httpOnly vì Client JavaScript cần đọc cookie này ra để đưa vào header x-csrf-token
      sameSite: "strict",          // Chỉ gửi cookie trong ngữ cảnh First-party (chống tấn công gửi cookie tự động chéo trang)
      secure: process.env.NODE_ENV === "production", // Chỉ truyền qua HTTPS khi chạy production
      maxAge: CSRF_MAX_AGE_MS,     // Thời gian sống tối đa của cookie
    });
    // Gắn giá trị token vào thuộc tính request để các router/middleware tiếp theo có thể sử dụng
    req.csrfToken = token;
  } else {
    // Nếu client đã có cookie csrfToken trước đó, tiếp tục tái sử dụng token đó và lưu vào request
    req.csrfToken = req.cookies.csrfToken;
  }
  // Cho phép chuyển tiếp sang route tiếp theo
  next();
}

/**
 * MIDDLEWARE XÁC THỰC TOKEN CSRF ĐỂ PHÒNG CHỐNG TẤN CÔNG GIẢ MẠO YÊU CẦU CHÉO TRANG (CSRF VALIDATION)
 */
export function validateCsrf(req: Request, res: Response, next: NextFunction) {
  // Trích xuất mã CSRF được Client đính kèm trong request header 'x-csrf-token'
  const clientToken = req.headers["x-csrf-token"] as string;
  // Lấy mã CSRF từ cookie của người dùng gửi kèm theo request
  const serverToken = req.cookies.csrfToken;

  // Thực hiện so sánh: Token client gửi trong header phải khớp hoàn toàn với token trong cookie
  // Sử dụng safeCompare chống Timing Attack (tấn công phân tích thời gian so sánh chuỗi)
  if (!clientToken || !serverToken || !safeCompare(clientToken, serverToken)) {
    // Trả về lỗi 403 Forbidden nếu không khớp hoặc thiếu token
    return res.status(403).json({ message: "CSRF token không hợp lệ" });
  }
  // Token hợp lệ, cho phép xử lý tiếp yêu cầu nghiệp vụ
  next();
}

/**
 * HÀM XOAY VÒNG CSRF TOKEN (ROTATE CSRF TOKEN)
 * Sử dụng khi đăng nhập/đăng xuất hoặc thay đổi phiên làm việc để phòng chống tấn công cố định phiên (Session Fixation)
 */
export function rotateCsrfToken(res: Response): string {
  // Tạo một chuỗi CSRF token ngẫu nhiên mới hoàn toàn
  const newToken = crypto.randomBytes(32).toString("hex");
  // Lưu ghi đè lên cookie 'csrfToken' cũ bằng mã mới
  res.cookie("csrfToken", newToken, {
    httpOnly: false,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: CSRF_MAX_AGE_MS,
  });
  // Trả về chuỗi token mới để backend có thể gửi trực tiếp cho client trong response body nếu cần
  return newToken;
}

