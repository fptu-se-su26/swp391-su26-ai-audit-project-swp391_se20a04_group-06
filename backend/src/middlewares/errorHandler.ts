// Import các kiểu dữ liệu của Express
import { Request, Response, NextFunction } from "express";
// Import công cụ ghi log hệ thống
import { logger } from "../utils/logger";
// Import lớp lỗi HttpError cũ
import { HttpError } from "../errors/HttpError";
// Import lớp cha ngoại lệ nghiệp vụ DomainException và các lớp con đặc tả lỗi trong DDD
import {
  DomainException,
  ValidationError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../shared/domain/exceptions/DomainException";

/**
 * MIDDLEWARE XỬ LÝ LỖI PHÁT SINH TẬP TRUNG CHO TOÀN BỘ BACKEND (GLOBAL ERROR HANDLER)
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1. Ghi nhận log lỗi chi tiết kèm stack trace nhằm phục vụ giám sát và gỡ lỗi nội bộ
  logger.error(`Exception on ${req.method} ${req.url}: ${err.message}`, {
    stack: err.stack,
  });

  // Ghi log bổ sung mô phỏng Sentry nếu biến môi trường giám sát Sentry được thiết lập
  if (process.env.SENTRY_DSN) {
    logger.info(`[Monitoring] Sentry captured exception: ${err.message}`);
  }

  // 2. Xử lý HttpError (Các lỗi ngoại lệ cũ kế thừa từ HttpError)
  if (err instanceof HttpError) {
    // Trả về trực tiếp mã trạng thái lỗi được thiết lập từ trước trong đối tượng lỗi
    return res.status(err.status).json({ message: err.message });
  }

  // 3. Xử lý các DomainException (Cơ chế quan trọng: ánh xạ các lỗi nghiệp vụ từ Domain Layer sang mã trạng thái HTTP chuẩn RESTful)
  if (err instanceof DomainException) {
    // Lỗi dữ liệu đầu vào không vượt qua validation (ví dụ: thiếu thông tin bắt buộc) -> Trả về HTTP 400 Bad Request
    if (err instanceof ValidationError) {
      return res.status(400).json({ message: err.message });
    }
    // Lỗi không có quyền xác thực hành động -> Trả về HTTP 401 Unauthorized
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ message: err.message });
    }
    // Lỗi không tìm thấy thực thể/tài nguyên yêu cầu -> Trả về HTTP 404 Not Found
    if (err instanceof NotFoundError) {
      return res.status(404).json({ message: err.message });
    }
    // Lỗi xung đột dữ liệu (ví dụ: tạo tài khoản đã trùng lặp email...) -> Trả về HTTP 409 Conflict
    if (err instanceof ConflictError) {
      return res.status(409).json({ message: err.message });
    }
    // Lỗi nghiệp vụ miền mặc định khác nếu không khớp với lớp con cụ thể nào bên trên -> Trả về HTTP 400 Bad Request
    return res.status(400).json({ message: err.message });
  }

  // 3.5. Xử lý lỗi Mongoose CastError (khi ObjectId không hợp lệ)
  if (err.name === "CastError" || err.message.includes("Cast to ObjectId failed")) {
    return res.status(400).json({ message: "Định dạng ID không hợp lệ" });
  }
  
  // 4. Xử lý các lỗi hệ thống không xác định khác (Lỗi runtime bất ngờ ví dụ lỗi kết nối DB, null pointer...)
  // Trả về lỗi mập mờ HTTP 500 để ẩn thông tin nhạy cảm của hệ thống đối với người dùng
  return res
    .status(500)
    .json({ message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
}