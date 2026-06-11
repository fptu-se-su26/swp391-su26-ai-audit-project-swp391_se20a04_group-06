import { Response } from "express";
import mongoose from "mongoose";
import { logger } from "../utils/logger";

/**
 * Ghi log lỗi server qua Winston logger và trả về HTTP 500 chuẩn.
 */
export function sendServerError(res: Response, err: unknown): Response {
  logger.error(
    `Internal Server Error: ${err instanceof Error ? err.stack || err.message : String(err)}`,
  );
  return res.status(500).json({ message: "Lỗi máy chủ" });
}

/**
 * Parse và validate một tham số ID từ URL params.
 * Trả về chuỗi ObjectId hợp lệ, hoặc undefined nếu không hợp lệ.
 */
export function parseId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return mongoose.Types.ObjectId.isValid(raw) ? raw : undefined;
}
