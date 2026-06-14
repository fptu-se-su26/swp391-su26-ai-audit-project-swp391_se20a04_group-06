// Import các kiểu dữ liệu của Express để thiết lập kiểu tham số
import { Request, Response, NextFunction } from "express";
// Import các kiểu định nghĩa lỗi và Schema từ thư viện kiểm duyệt Zod
import { ZodType, ZodError } from "zod";

/**
 * MIDDLEWARE XỬ LÝ KIỂM DUYỆT CẤU TRÚC DỮ LIỆU ĐẦU VÀO TẬP TRUNG (VALIDATE SCHEMA MIDDLEWARE)
 * Nhận vào một Zod Schema và kiểm duyệt đồng thời body, query, và params của Express Request
 */
export const validateSchema = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Thực hiện kiểm duyệt bất đồng bộ dữ liệu đầu vào.
      // Dữ liệu truyền vào Zod bao gồm cả request body, query string và path parameters.
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body?: any; query?: any; params?: any };

      // Cập nhật lại dữ liệu Request bằng dữ liệu đã được Zod kiểm duyệt và ép kiểu (sanitize/cast) thành công
      // Ví dụ: Zod tự động đổi chuỗi "123" thành số 123, chuỗi ngày thành thực thể Date...
      if (parsed.body !== undefined) req.body = parsed.body;
      if (parsed.query !== undefined) req.query = parsed.query;
      if (parsed.params !== undefined) req.params = parsed.params;

      // Hợp lệ, chuyển tiếp yêu cầu xử lý
      next();
    } catch (error) {
      // Nếu lỗi sinh ra do dữ liệu không thỏa mãn cấu trúc Zod Schema định nghĩa
      if (error instanceof ZodError) {
        // Trả về lỗi HTTP 400 Bad Request kèm thông điệp tiếng Việt và danh sách chi tiết các trường bị lỗi
        return res.status(400).json({
          message: "Dữ liệu đầu vào không hợp lệ",
          // Bản đồ hóa các lỗi từ Zod sang DTO gọn nhẹ gửi về Client
          errors: error.issues.map((e) => ({
            field: e.path.join("."),        // Đường dẫn trường bị lỗi (ví dụ: body.email)
            message: e.message,             // Nội dung mô tả chi tiết lỗi cụ thể
          })),
        });
      }
      // Chuyển tiếp các lỗi hệ thống không xác định khác sang middleware xử lý lỗi global
      next(error);
    }
  };
};

