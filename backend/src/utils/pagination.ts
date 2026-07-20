export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

// Parse và validate tham số phân trang từ request query
export function parsePagination(
  rawPage?: string,
  rawLimit?: string,
  maxLimit = 100,
): PaginationParams {
  const parsedPage = parseInt(rawPage || '1', 10);
  const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);

  const parsedLimit = parseInt(rawLimit || '20', 10);
  const limit = isNaN(parsedLimit) ? 20 : Math.min(maxLimit, Math.max(1, parsedLimit));

  return { page, limit, offset: (page - 1) * limit };
}

// Định dạng phản hồi phân trang chuẩn cho API client
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
