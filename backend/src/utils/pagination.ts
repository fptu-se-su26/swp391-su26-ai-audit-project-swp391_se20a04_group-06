/**
 * Pagination helpers — tránh lặp lại logic phân trang ở mọi controller.
 * Pattern: Utility / DRY
 *
 * BEFORE: cùng đoạn code parse page/limit/offset lặp lại ở:
 *   - admin.controller (listUsers, listAllProducts)
 *   - review.controller (getReviewsBySeller)
 * AFTER: import parsePagination + paginatedResponse từ đây.
 */

// Định nghĩa giao diện kết quả phân trang PaginationParams
export interface PaginationParams {
  // Trang hiện tại
  page: number;
  // Giới hạn số phần tử trên trang
  limit: number;
  // Vị trí bắt đầu bỏ qua bản ghi trong DB
  offset: number;
}

/**
 * Parse và validate tham số phân trang từ query string.
 * @param rawPage  - giá trị string từ req.query.page
 * @param rawLimit - giá trị string từ req.query.limit
 * @param maxLimit - giới hạn tối đa cho limit (mặc định 100)
 */
// Định nghĩa hàm parsePagination chuyển đổi và chuẩn hóa các tham số phân trang
export function parsePagination(
  // Trang hiện tại dạng chuỗi chưa chuẩn hóa
  rawPage?: string,
  // Số dòng giới hạn dạng chuỗi chưa chuẩn hóa
  rawLimit?: string,
  // Giới hạn tối đa cho phép để tránh truy vấn quá nhiều dữ liệu (mặc định 100)
  maxLimit = 100,
): PaginationParams {
  // Chuyển đổi chuỗi rawPage sang số nguyên cơ số 10, mặc định là 1 nếu rỗng
  const parsedPage = parseInt(rawPage || '1', 10);
  // Nếu parsedPage không phải là số hợp lệ, lấy 1, ngược lại lấy giá trị lớn nhất giữa 1 và parsedPage để tránh trang âm
  const page = isNaN(parsedPage) ? 1 : Math.max(1, parsedPage);

  // Chuyển đổi chuỗi rawLimit sang số nguyên cơ số 10, mặc định là 20 nếu rỗng
  const parsedLimit = parseInt(rawLimit || '20', 10);
  // Đảm bảo limit nằm trong khoảng từ 1 đến maxLimit
  const limit = isNaN(parsedLimit) ? 20 : Math.min(maxLimit, Math.max(1, parsedLimit));

  // Trả về đối tượng chứa page, limit và offset tính toán
  return { page, limit, offset: (page - 1) * limit };
}

/**
 * Build response object chuẩn cho danh sách phân trang.
 */
// Định nghĩa hàm generic paginatedResponse để xuất dữ liệu định dạng phân trang chuẩn cho API
export function paginatedResponse<T>(
  // Danh sách mảng dữ liệu trả về
  data: T[],
  // Tổng số lượng bản ghi có trong DB
  total: number,
  // Trang hiện tại
  page: number,
  // Giới hạn số lượng bản ghi trên một trang
  limit: number,
) {
  // Trả về cấu trúc JSON phân trang chuẩn hóa
  return {
    // Mảng dữ liệu
    data,
    // Trang hiện tại
    page,
    // Số giới hạn
    limit,
    // Tổng số dòng
    total,
    // Tính toán tổng số trang và làm tròn lên
    totalPages: Math.ceil(total / limit),
  };
}
