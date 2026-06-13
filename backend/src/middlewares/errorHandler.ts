import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { HttpError } from "../errors/HttpError";
import {
  DomainException,
  ValidationError,
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "../shared/domain/exceptions/DomainException";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // 1. Ghi log lỗi để phục vụ giám sát nội bộ
  logger.error(`Exception on ${req.method} ${req.url}: ${err.message}`, {
    stack: err.stack,
  });

  if (process.env.SENTRY_DSN) {
    logger.info(`[Monitoring] Sentry captured exception: ${err.message}`);
  }

  // 2. Xử lý HttpError (Lớp lỗi tầng HTTP cũ)
  if (err instanceof HttpError) {
    return res.status(err.status).json({ message: err.message });
  }

  // 3. Xử lý các DomainException (Ánh xạ lỗi nghiệp vụ DDD sang HTTP status)
  if (err instanceof DomainException) {
    if (err instanceof ValidationError) {
      return res.status(400).json({ message: err.message });
    }
    if (err instanceof UnauthorizedError) {
      return res.status(401).json({ message: err.message });
    }
    if (err instanceof NotFoundError) {
      return res.status(404).json({ message: err.message });
    }
    if (err instanceof ConflictError) {
      return res.status(409).json({ message: err.message });
    }
    // Lỗi nghiệp vụ mặc định nếu không khớp lớp con nào
    return res.status(400).json({ message: err.message });
  }

  // 4. Xử lý các lỗi hệ thống không xác định khác (500)
  return res
    .status(500)
    .json({ message: "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
}
