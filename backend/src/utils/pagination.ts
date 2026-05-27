/**
 * Pagination helpers — tránh lặp lại logic phân trang ở mọi controller.
 * Pattern: Utility / DRY
 *
 * BEFORE: cùng đoạn code parse page/limit/offset lặp lại ở:
 *   - admin.controller (listUsers, listAllProducts)
 *   - review.controller (getReviewsBySeller)
 * AFTER: import parsePagination + paginatedResponse từ đây.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Parse và validate tham số phân trang từ query string.
 * @param rawPage  - giá trị string từ req.query.page
 * @param rawLimit - giá trị string từ req.query.limit
 * @param maxLimit - giới hạn tối đa cho limit (mặc định 100)
 */
export function parsePagination(
  rawPage?: string,
  rawLimit?: string,
  maxLimit = 100,
): PaginationParams {
  const page = Math.max(1, parseInt(rawPage || '1', 10));
  const limit = Math.min(maxLimit, Math.max(1, parseInt(rawLimit || '20', 10)));
  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Build response object chuẩn cho danh sách phân trang.
 */
export function paginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    data,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
