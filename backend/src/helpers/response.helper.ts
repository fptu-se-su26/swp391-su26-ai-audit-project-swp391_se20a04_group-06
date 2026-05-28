import { Response } from 'express';
import mongoose from 'mongoose';

/**
 * Ghi log lỗi server và trả về HTTP 500 chuẩn.
 * Dùng thay cho pattern lặp lại:
 *   console.error(err); return res.status(500).json({ message: 'Lỗi máy chủ' });
 */
export function sendServerError(res: Response, err: unknown): Response {
  console.error(err);
  return res.status(500).json({ message: 'Lỗi máy chủ' });
}

/**
 * Parse và validate một tham số ID từ URL params.
 * Trả về chuỗi ObjectId hợp lệ, hoặc undefined nếu không hợp lệ.
 */
export function parseId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return mongoose.Types.ObjectId.isValid(raw) ? raw : undefined;
}
