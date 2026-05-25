import { Response } from 'express';

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
 * Trả về số nguyên dương hợp lệ, hoặc undefined nếu không hợp lệ.
 */
export function parseId(raw: string | undefined): number | undefined {
  if (!raw) return undefined;
  const id = parseInt(raw, 10);
  return isNaN(id) || id <= 0 ? undefined : id;
}
