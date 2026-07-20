import { Response } from "express";
import mongoose from "mongoose";
import { logger } from "../utils/logger";

// Phản hồi lỗi hệ thống HTTP 500 kèm ghi log chi tiết
export function sendServerError(res: Response, err: unknown): Response {
  logger.error(
    `Internal Server Error: ${err instanceof Error ? err.stack || err.message : String(err)}`,
  );
  return res.status(500).json({ message: "Lỗi máy chủ" });
}

// Kiểm tra và trả về chuỗi ID nếu đúng định dạng MongoDB ObjectId
export function parseId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return mongoose.Types.ObjectId.isValid(raw) ? raw : undefined;
}
